import { db } from './database';
import axios from 'axios';

export const SyncEngine = {
  // Adiciona uma ação à fila
  enqueue: (action: string, tableName: string, data: any) => {
    const id = Date.now().toString(); // Simples ID por enquanto
    db.runSync(
      'INSERT INTO sync_queue (id, action, table_name, data, status) VALUES (?, ?, ?, ?, ?)',
      [id, action, tableName, JSON.stringify(data), 'pending']
    );
    console.log(`Action ${action} enqueued for ${tableName}`);
  },

  // Processa a fila de sincronização
  processQueue: async (apiBaseUrl: string, token: string) => {
    const pendingItems = db.getAllSync(
      "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC"
    ) as any[];

    if (pendingItems.length === 0) return;

    console.log(`Processing ${pendingItems.length} pending items...`);

    for (const item of pendingItems) {
      try {
        const data = JSON.parse(item.data);
        // Exemplo de roteamento de ação
        await axios.post(`${apiBaseUrl}/sync/${item.table_name}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Marcar como concluído
        db.runSync('UPDATE sync_queue SET status = ? WHERE id = ?', ['completed', item.id]);
        console.log(`Item ${item.id} synced successfully`);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        // Poderia implementar retry limit ou backoff aqui
        break; // Para o processamento se falhar (preservar ordem)
      }
    }
  },

  // Limpa itens antigos concluídos
  cleanup: () => {
    db.runSync("DELETE FROM sync_queue WHERE status = 'completed'");
  }
};
