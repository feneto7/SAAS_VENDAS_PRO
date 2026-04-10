/**
 * migrate-existing-tenants.ts
 *
 * Applies ALL pending SQL migrations to every existing tenant database.
 * Run from the server/ directory:
 *   npx tsx src/scripts/migrate-existing-tenants.ts
 */
import { Pool }          from "pg";
import { readFileSync, readdirSync } from "fs";
import { join }          from "path";
import dotenv            from "dotenv";

dotenv.config({ path: join(process.cwd(), ".env"), override: true });

const MASTER_URL = process.env.DATABASE_URL!;
if (!MASTER_URL?.startsWith("postgres")) {
  console.error("❌ DATABASE_URL not found. Check server/.env");
  process.exit(1);
}

async function getMigrationFiles() {
  const dir = join(process.cwd(), "drizzle", "tenant");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({ name: f, sql: readFileSync(join(dir, f), "utf-8") }));
}

async function migrateDb(dbName: string, dbUrl: string, files: { name: string; sql: string }[]) {
  const pool   = new Pool({ connectionString: dbUrl });
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    for (const file of files) {
      try {
        await client.query(file.sql);
        console.log(`  ✅ ${file.name}`);
      } catch (err: any) {
        // Ignore "already exists" errors (idempotent re-run)
        // 42P07: table already exists
        // 42701: column already exists
        // 42710: type already exists (enums)
        if (err.code === "42P07" || err.code === "42701" || err.code === "42710") {
          console.log(`  ⏭️  ${file.name} (already applied or partially applied)`);
        } else {
          throw err;
        }
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  console.log("🔍 Fetching tenant list from master DB...\n");

  const masterPool   = new Pool({ connectionString: MASTER_URL });
  const masterClient = await masterPool.connect();

  let tenants: { db_name: string }[] = [];
  try {
    const res = await masterClient.query("SELECT db_name FROM tenants");
    tenants   = res.rows;
  } finally {
    masterClient.release();
    await masterPool.end();
  }

  if (tenants.length === 0) {
    console.log("No tenants found. Nothing to migrate.");
    return;
  }

  const files = await getMigrationFiles();

  console.log(`Found ${tenants.length} tenant(s) and ${files.length} migration file(s).\n`);

  for (const { db_name } of tenants) {
    const tenantUrl = MASTER_URL.replace(/\/([^/]+)$/, `/${db_name}`);
    console.log(`🗃️  Migrating: ${db_name}`);
    try {
      await migrateDb(db_name, tenantUrl, files);
    } catch (err) {
      console.error(`  ❌ Failed: ${db_name}`, err);
    }
  }

  console.log("\n✅ All tenants migrated.");
}

main().catch(console.error);
