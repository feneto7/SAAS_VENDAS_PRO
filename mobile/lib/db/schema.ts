export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    code INTEGER,
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
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    brand TEXT,
    stock INTEGER DEFAULT 0, -- Stock available for the current seller
    cost_price INTEGER DEFAULT 0,
    price_cc INTEGER DEFAULT 0,
    price_sc INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS fichas (
    id TEXT PRIMARY KEY,
    code TEXT,
    status TEXT NOT NULL,
    total INTEGER DEFAULT 0,
    notes TEXT,
    sale_date TEXT,
    client_id TEXT NOT NULL,
    seller_id TEXT,
    route_id TEXT,
    cobranca_id TEXT,
    discount INTEGER DEFAULT 0,
    commission_percent INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT,
    is_local INTEGER DEFAULT 0, -- 1 if created offline and not yet confirmed by server
    sync_status TEXT DEFAULT 'synced' -- 'pending', 'syncing', 'synced', 'error'
  );

  CREATE TABLE IF NOT EXISTS ficha_items (
    id TEXT PRIMARY KEY,
    ficha_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    quantity_sold INTEGER DEFAULT 0,
    quantity_returned INTEGER DEFAULT 0,
    unit_price INTEGER DEFAULT 0,
    subtotal INTEGER DEFAULT 0,
    commission_type TEXT DEFAULT 'CC',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    ficha_id TEXT NOT NULL,
    method_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    payment_date TEXT,
    cancelled INTEGER DEFAULT 0,
    created_at TEXT,
    sync_status TEXT DEFAULT 'synced'
  );

  CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT NOT NULL, -- 'CREATE_FICHA', 'ADD_ITEM', 'REMOVE_ITEM', 'SETTLE_FICHA', 'ADD_PAYMENT', 'CANCEL_PAYMENT'
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    payload TEXT NOT NULL, -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    last_error TEXT
  );

  CREATE TABLE IF NOT EXISTS local_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    code INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    periodicity TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS cobrancas (
    id TEXT PRIMARY KEY,
    code INTEGER,
    route_id TEXT NOT NULL,
    seller_id TEXT,
    status TEXT DEFAULT 'aberta',
    start_date TEXT,
    end_date TEXT,
    created_at TEXT,
    updated_at TEXT
  );
`;
