import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";
import "dotenv/config";

async function debugProvisioning() {
  const masterUrl = "postgresql://postgres:2011ThaylaLunaMel2013@localhost:5432/vendas_master";
  const name = "Empresa Teste " + Date.now();
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  const dbName = `vendas_${slug}`;
  const ownerClerkId = "user_test_123";

  console.log(`🚀 Starting debug provisioning for: ${name}`);
  console.log(`  Slug: ${slug}`);
  console.log(`  DB Name: ${dbName}`);

  // 1. Create DB
  const parsedUrl = new URL(masterUrl);
  parsedUrl.pathname = "/postgres";
  const adminUrl = parsedUrl.toString();
  
  const adminPool = new Pool({ connectionString: adminUrl });
  console.log("📡 Connecting to system 'postgres' DB...");
  const client = await adminPool.connect();

  try {
    console.log(`  Step 1: Creating database "${dbName}"...`);
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log("  ✅ DB created.");

    // 2. Register in Master
    console.log("  Step 2: Registering in master DB...");
    const masterPool = new Pool({ connectionString: masterUrl });
    const masterClient = await masterPool.connect();
    try {
      await masterClient.query(
        `INSERT INTO tenants (name, slug, db_name, owner_clerk_id) VALUES ($1, $2, $3, $4)`,
        [name, slug, dbName, ownerClerkId]
      );
      console.log("  ✅ Registered in master.");
    } finally {
      masterClient.release();
      await masterPool.end();
    }

    // 3. Initialize Tenant Schema
    console.log("  Step 3: Initializing schema...");
    const tenantDbUrl = masterUrl.replace(/\/[^/]+$/, `/${dbName}`);
    const tenantPool = new Pool({ connectionString: tenantDbUrl });
    const tenantClient = await tenantPool.connect();
    try {
      const migrationPath = join(process.cwd(), "drizzle", "tenant", "0000_ambitious_longshot.sql");
      const sql = readFileSync(migrationPath, "utf-8");
      
      console.log("    Creating pgcrypto extension...");
      await tenantClient.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
      
      console.log("    Executing migration SQL...");
      await tenantClient.query(sql);
      console.log("  ✅ Schema initialized.");
    } finally {
      tenantClient.release();
      await tenantPool.end();
    }

    console.log("✨ Provisioning test completed successfully!");
    
    // Cleanup
    console.log("🧹 Cleaning up test database...");
    await client.query(`DROP DATABASE "${dbName}"`);
    console.log("✅ Cleanup done.");

  } catch (err: any) {
    console.error("❌ Provisioning failed at step:");
    console.error(err);
  } finally {
    client.release();
    await adminPool.end();
  }
}

debugProvisioning();
