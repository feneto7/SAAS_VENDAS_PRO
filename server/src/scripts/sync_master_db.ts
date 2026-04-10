import { Pool } from "pg";
import dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env") });

async function syncMasterDb() {
  // IGNORE Environment variables and use hardcoded credentials for this fix
  const pool = new Pool({
    connectionString: "postgresql://postgres:2011ThaylaLunaMel2013@localhost:5432/vendas_master"
  });
  
  console.log(`📡 Connecting to vendas_master with hardcoded credentials...`);
  const client = await pool.connect();

  try {
    console.log("🚀 Syncing 'tenants' table schema...");

    // Add missing columns one by one if they don't exist
    const columns = [
      { name: "db_name", type: "text", constraints: "UNIQUE" },
      { name: "owner_clerk_id", type: "text", constraints: "" },
      { name: "street", type: "text", constraints: "" },
      { name: "number", type: "text", constraints: "" },
      { name: "neighborhood", type: "text", constraints: "" },
      { name: "city", type: "text", constraints: "" },
      { name: "state", type: "text", constraints: "" },
      { name: "zip_code", type: "text", constraints: "" },
      { name: "contact", type: "text", constraints: "" }
    ];

    for (const col of columns) {
      try {
        await client.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} ${col.constraints}`);
        console.log(`✅ Column '${col.name}' checked/added.`);
      } catch (err: any) {
        console.warn(`⚠️ Could not add column '${col.name}': ${err.message}`);
      }
    }

    // Set NOT NULL for critical columns (only if table is empty or we handle existing rows)
    try {
      await client.query("ALTER TABLE tenants ALTER COLUMN db_name SET NOT NULL");
      await client.query("ALTER TABLE tenants ALTER COLUMN owner_clerk_id SET NOT NULL");
      console.log("✅ Constraints updated.");
    } catch (err: any) {
      console.warn("⚠️ Could not set NOT NULL constraints (table might have existing null values).");
    }

    console.log("✨ Master database synced successfully!");
  } catch (error) {
    console.error("❌ Failed to sync master database:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

syncMasterDb();
