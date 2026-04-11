import { Pool } from "pg";
import dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env"), override: true });

const MASTER_URL = process.env.DATABASE_URL!;

async function fixTenant(dbName: string, dbUrl: string) {
  const pool = new Pool({ connectionString: dbUrl });
  const client = await pool.connect();
  try {
    console.log(`🛠️  Fixing ${dbName}...`);
    
    // 1. Fix products table (active column)
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='active') THEN
          ALTER TABLE "products" ADD COLUMN "active" boolean DEFAULT true NOT NULL;
        END IF;
      END $$;
    `);

    // 2. Fix users table (code column with identity)
    // We use SERIAL temporarily to populate existing rows, then we can let Drizzle handle it
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='code') THEN
          ALTER TABLE "users" ADD COLUMN "code" SERIAL;
        END IF;
      END $$;
    `);

    // 3. Ensure other critical tables from migration 0009 exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "inventory_movements" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "type" text NOT NULL,
        "description" text,
        "seller_id" uuid,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "inventory_movement_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "movement_id" uuid REFERENCES inventory_movements(id),
        "product_id" uuid,
        "quantity_before" integer NOT NULL,
        "quantity_after" integer NOT NULL,
        "quantity_change" integer NOT NULL
      );
    `);

    console.log(`  ✅ ${dbName} is now healthy.`);
  } catch (err) {
    console.error(`  ❌ Error fixing ${dbName}:`, err);
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  const masterPool = new Pool({ connectionString: MASTER_URL });
  const res = await masterPool.query("SELECT db_name FROM tenants");
  const tenants = res.rows;
  await masterPool.end();

  for (const { db_name } of tenants) {
    const tenantUrl = MASTER_URL.replace(/\/([^/]+)$/, `/${db_name}`);
    try {
      await fixTenant(db_name, tenantUrl);
    } catch (e) {
      console.log(`  ⚠️ Skipping ${db_name} (likely not created yet)`);
    }
  }
  console.log("\n🚀 All tenants are synchronized.");
}

main().catch(console.error);
