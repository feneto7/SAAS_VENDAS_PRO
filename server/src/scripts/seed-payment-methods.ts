/**
 * seed-payment-methods.ts
 *
 * Seeds default payment methods for all existing tenants.
 * Run from the server/ directory:
 *   npx tsx src/scripts/seed-payment-methods.ts
 */
import { Pool }          from "pg";
import { join }          from "path";
import dotenv            from "dotenv";

dotenv.config({ path: join(process.cwd(), ".env"), override: true });

const MASTER_URL = process.env.DATABASE_URL!;
if (!MASTER_URL?.startsWith("postgres")) {
  console.error("❌ DATABASE_URL not found. Check server/.env");
  process.exit(1);
}

const DEFAULTS = [
  "Dinheiro", 
  "PIX", 
  "Cartão de Crédito", 
  "Cartão de Débito", 
  "Transferência", 
  "Outro"
];

async function seedDb(dbName: string, dbUrl: string) {
  const pool   = new Pool({ connectionString: dbUrl });
  const client = await pool.connect();
  try {
    console.log(`  🌱 Seeding: ${dbName}...`);
    for (const name of DEFAULTS) {
      await client.query(
        `INSERT INTO payment_methods (name, active, updated_at) VALUES ($1, true, NOW()) 
         ON CONFLICT DO NOTHING`, 
        [name]
      );
    }
    console.log(`  ✅ Done: ${dbName}`);
  } catch (err) {
    console.error(`  ❌ Error in ${dbName}:`, err);
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
    console.log("No tenants found. Nothing to seed.");
    return;
  }

  console.log(`Found ${tenants.length} tenant(s). Starting seed...\n`);

  for (const { db_name } of tenants) {
    const tenantUrl = MASTER_URL.replace(/\/([^/]+)$/, `/${db_name}`);
    await seedDb(db_name, tenantUrl);
  }

  console.log("\n✅ All tenants seeded.");
}

main().catch(console.error);
