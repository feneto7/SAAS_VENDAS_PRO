
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

async function migrateAll() {
  const masterUrl = process.env.DATABASE_URL;
  if (!masterUrl) {
    console.error('DATABASE_URL is missing');
    return;
  }

  const masterPool = new Pool({ connectionString: masterUrl });

  try {
    const res = await masterPool.query('SELECT db_name FROM tenants');
    const tenants = res.rows;
    console.log(`Found ${tenants.length} tenants.`);

    for (const tenant of tenants) {
      const dbName = tenant.db_name;
      console.log(`Migrating tenant: ${dbName}...`);
      
      const urlParts = masterUrl.split("/");
      urlParts[urlParts.length - 1] = dbName;
      const tenantUrl = urlParts.join("/");

      const tenantPool = new Pool({ connectionString: tenantUrl });
      
      try {
        await tenantPool.query(`ALTER TABLE fichas ADD COLUMN IF NOT EXISTS discount integer DEFAULT 0 NOT NULL`);
        await tenantPool.query(`ALTER TABLE fichas ADD COLUMN IF NOT EXISTS commission_percent integer DEFAULT 0 NOT NULL`);
        await tenantPool.query(`ALTER TABLE ficha_items ADD COLUMN IF NOT EXISTS quantity_sold integer DEFAULT 0 NOT NULL`);
        await tenantPool.query(`ALTER TABLE ficha_items ADD COLUMN IF NOT EXISTS quantity_returned integer DEFAULT 0 NOT NULL`);
        console.log(`   ✅ ${dbName} migrated.`);
      } catch (err) {
        console.error(`   ❌ Failed to migrate ${dbName}:`, err.message);
      } finally {
        await tenantPool.end();
      }
    }
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await masterPool.end();
  }
}

migrateAll();
