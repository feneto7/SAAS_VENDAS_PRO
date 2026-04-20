import * as SQLite from 'expo-sqlite';
import { SCHEMA } from './schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await SQLite.openDatabaseAsync('vendas_pro.db');
  
  // Initialize Schema
  try {
    await dbInstance.execAsync(SCHEMA);
    
    // Manual Migrations
    try {
      await dbInstance.execAsync('ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;');
      console.log('✅ Migrated: Added stock column to products');
    } catch (e) {
      // Column might already exist, ignore
    }

    console.log('📦 Local database schema initialized');
  } catch (err) {
    console.error('❌ Failed to initialize database schema:', err);
  }
  
  console.log('📦 Local database initialized');
  return dbInstance;
}

/**
 * Execute a query and return results as an array of objects
 */
export async function queryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  return await db.getAllAsync(sql, params) as T[];
}

/**
 * Execute a query and return the first result
 */
export async function queryFirst<T>(sql: string, params: any[] = []): Promise<T | null> {
  const db = await getDb();
  return await db.getFirstAsync(sql, params) as T | null;
}

/**
 * Execute an INSERT/UPDATE/DELETE statement
 */
export async function execute(sql: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
  const db = await getDb();
  return await db.runAsync(sql, params);
}
