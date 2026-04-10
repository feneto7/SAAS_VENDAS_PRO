import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";
import "dotenv/config";

async function testSqlExecution() {
  const masterUrl = "postgresql://postgres:2011ThaylaLunaMel2013@localhost:5432/vendas_master";
  const pool = new Pool({ connectionString: masterUrl });
  const client = await pool.connect();

  try {
    const migrationPath = join(process.cwd(), "drizzle", "tenant", "0000_ambitious_longshot.sql");
    const sql = readFileSync(migrationPath, "utf-8");
    
    console.log("Attempting to execute SQL with breakpoints...");
    // We'll create a temporary test table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_sql (id uuid PRIMARY KEY);
      --> statement-breakpoint
      ALTER TABLE test_sql ADD COLUMN name text;
    `);
    console.log("✅ Success? (Unlikely)");
  } catch (err: any) {
    console.error("❌ Failed as expected:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testSqlExecution();
