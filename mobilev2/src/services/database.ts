import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'vendas_pro.db';

export const db = SQLite.openDatabaseSync(DATABASE_NAME);

export const setupDatabase = async () => {
  try {
    // Tabela de Tenants (Empresas)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        logo_url TEXT
      );
    `);

    // Tabela de Usuários/Vendedores (Auth)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS auth (
        id INTEGER PRIMARY KEY DEFAULT 1,
        user_id TEXT,
        name TEXT,
        seller_code TEXT,
        token TEXT,
        tenant_id TEXT,
        logged_in INTEGER DEFAULT 0
      );
    `);

    // Fila de Sincronização (Estilo Google Drive)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        table_name TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Rotas
    db.execSync(`
      CREATE TABLE IF NOT EXISTS routes (
        id TEXT PRIMARY KEY,
        code TEXT,
        name TEXT NOT NULL,
        active INTEGER DEFAULT 1
      );
    `);

    // Garantir que a coluna code existe em routes (Migração)
    try {
      const info = db.getAllSync<{name: string, type: string}>(`PRAGMA table_info(routes);`);
      const hasCode = info.some(c => c.name === 'code');
      if (!hasCode) {
        db.execSync(`ALTER TABLE routes ADD COLUMN code TEXT;`);
      }
    } catch (e) {
      console.log('Routes table migration check:', e);
    }

    // Cobranças (Charges)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS charges (
        id TEXT PRIMARY KEY,
        route_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        value REAL NOT NULL,
        status TEXT NOT NULL,
        due_date TEXT,
        FOREIGN KEY(route_id) REFERENCES routes(id)
      );
    `);

    // Clientes (Customers)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        code TEXT,
        name TEXT NOT NULL,
        cpf TEXT,
        phone TEXT,
        street TEXT,
        number TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        route_id TEXT,
        active INTEGER DEFAULT 1,
        FOREIGN KEY(route_id) REFERENCES routes(id)
      );
    `);

    // Cards (inclui Pedidos via status 'pedido')
    // Nota: Mudamos code para TEXT para preservar zeros à esquerda.
    db.execSync(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        code TEXT, 
        status TEXT NOT NULL,
        total REAL DEFAULT 0,
        sale_date TEXT,
        client_id TEXT,
        seller_id TEXT,
        route_id TEXT,
        charge_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(client_id) REFERENCES clients(id)
      );
    `);

    // Itens do Card (Produtos)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS card_items (
        id TEXT PRIMARY KEY,
        card_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        price REAL DEFAULT 0,
        type TEXT NOT NULL, -- com_comissao, sem_comissao, brinde
        subtotal REAL DEFAULT 0,
        FOREIGN KEY(card_id) REFERENCES cards(id)
      );
    `);

    // Produtos (Cache local para preços padrão)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT,
        name TEXT NOT NULL,
        price_cc REAL DEFAULT 0,
        price_sc REAL DEFAULT 0,
        active INTEGER DEFAULT 1
      );
    `);

    // Estoque do Vendedor (Local)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS seller_inventory (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        stock INTEGER DEFAULT 0,
        UNIQUE(seller_id, product_id)
      );
    `);

    // Garantir que a coluna code é TEXT (Fallback para instalações existentes)
    try {
      const info = db.getAllSync<{name: string, type: string}>(`PRAGMA table_info(cards);`);
      const codeType = info.find(c => c.name === 'code')?.type.toUpperCase();
      if (codeType === 'INTEGER') {
        db.execSync(`DROP TABLE IF EXISTS cards;`); // Limpeza agressiva em dev para corrigir schema
        db.execSync(`
          CREATE TABLE cards (
            id TEXT PRIMARY KEY,
            code TEXT,
            status TEXT NOT NULL,
            total REAL DEFAULT 0,
            sale_date TEXT,
            client_id TEXT,
            seller_id TEXT,
            route_id TEXT,
            charge_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(client_id) REFERENCES clients(id)
          );
        `);
      }
    } catch (e) {
      console.log('Cards table setup check:', e);
    }

    // Índices de performance
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_clients_route_name ON clients (route_id, name);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_cards_client_status ON cards (client_id, status);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_card_items_card_id ON card_items (card_id);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_seller_inventory_ids ON seller_inventory (seller_id, product_id);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_sync_queue_status_date ON sync_queue (status, created_at);`);

    console.log('Database tables initialized successfully');
    
    // Migração de IDs Legados (Não-UUID -> UUID)
    await fixLegacyIds();

  } catch (error) {
    console.error('Error setting up database:', error);
  }
};

/**
 * Converte IDs antigos (Date.now()) para UUIDs válidos para o Postgres
 */
async function fixLegacyIds() {
  const { randomUUID } = await import('expo-crypto');
  
  try {
    // Buscar cards com IDs curtos (os antigos tinham ~20 caracteres, UUID tem 36)
    const legacyCards = db.getAllSync<{id: string}>(
      "SELECT id FROM cards WHERE length(id) < 30 AND id NOT LIKE '%-%-%-%-%'"
    );

    if (legacyCards.length === 0) return;

    console.log(`[MIGRATION] Found ${legacyCards.length} legacy cards to fix`);

    for (const card of legacyCards) {
      const oldId = card.id;
      const newId = randomUUID();

      await db.withTransactionAsync(async () => {
        // 1. Atualizar Itens
        await db.runAsync('UPDATE card_items SET card_id = ? WHERE card_id = ?', [newId, oldId]);

        // 2. Atualizar Fila de Sincronismo (O mais importante!)
        const syncItems = await db.getAllAsync<{id: string, table_name: string, data: string}>(
          "SELECT id, table_name, data FROM sync_queue WHERE data LIKE ?",
          [`%${oldId}%`]
        );

        for (const item of syncItems) {
          try {
            let itemData = JSON.parse(item.data);
            let changed = false;

            if (item.table_name === 'cards' && itemData.id === oldId) {
              itemData.id = newId;
              changed = true;
            }
            if (itemData.card_id === oldId) {
              itemData.card_id = newId;
              changed = true;
            }

            if (changed) {
              await db.runAsync('UPDATE sync_queue SET data = ? WHERE id = ?', [JSON.stringify(itemData), item.id]);
            }
          } catch (e) {
            console.error('[MIGRATION] Failed to update sync item data:', e);
          }
        }

        // 3. Atualizar o Card em si
        await db.runAsync('UPDATE cards SET id = ? WHERE id = ?', [newId, oldId]);
      });

      console.log(`[MIGRATION] Card ${oldId} migrated to ${newId}`);
    }
  } catch (err) {
    console.error('[MIGRATION] Error fixing legacy IDs:', err);
  }
}
