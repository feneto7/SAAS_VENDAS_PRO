import dotenv from 'dotenv';
import { join } from 'path';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

dotenv.config({ path: join(process.cwd(), '.env'), override: true });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function migrate() {
  console.log('🚀 Starting manual migration...');
  
  try {
    // 1. Create master_users table
    console.log('Creating master_users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "master_users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "password_hash" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // 2. Update tenants table
    console.log('Updating tenants table...');
    // Add owner_id
    await pool.query(`
      ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "owner_id" uuid REFERENCES "master_users"("id");
    `);
    
    // Note: We leave owner_clerk_id for now to avoid data loss until we are ready to drop it.
    
    console.log('✅ Master Migration complete!');
    
    // 3. User Table Migration
    console.log('Updating users table in main DB (if exists)...');
     await pool.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
    `);

     console.log('✅ Main DB Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
