import { Pool } from "pg";
import dotenv from "dotenv";
import { join } from "path";
import { readFileSync } from "fs";

dotenv.config({ path: join(process.cwd(), ".env") });

async function run() {
  const masterUrl = process.env.DATABASE_URL!;
  const masterPool = new Pool({ connectionString: masterUrl });
  const masterClient = await masterPool.connect();

  try {
    const { rows: tenants } = await masterClient.query("SELECT db_name FROM tenants");
    console.log(`Found ${tenants.length} tenants.`);

    const migrationSql = readFileSync(join(process.cwd(), "drizzle", "tenant", "0011_prevent_negative_stock.sql"), "utf-8");

    for (const tenant of tenants) {
      console.log(`🚀 Applying to ${tenant.db_name}...`);
      const tenantUrl = masterUrl.replace(/\/([^/]+)$/, `/${tenant.db_name}`);
      const tenantPool = new Pool({ connectionString: tenantUrl });
      const tenantClient = await tenantPool.connect();

      try {
        await tenantClient.query(migrationSql);
        console.log(`✅ ${tenant.db_name} updated.`);
      } catch (err: any) {
        console.error(`❌ Failed for ${tenant.db_name}:`, err.message);
      } finally {
        tenantClient.release();
        await tenantPool.end();
      }
    }
  } finally {
    masterClient.release();
    await masterPool.end();
  }
}

run();
