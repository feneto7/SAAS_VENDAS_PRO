import { masterDb } from "./master.js";
import { tenants }  from "./schema/index.js";
import { Pool }     from "pg";
import { readFileSync, readdirSync } from "fs";
import { join }     from "path";

/**
 * Returns all SQL migration files in order (sorted by filename).
 */
function getMigrationFiles(migrationsDir: string): string[] {
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => join(migrationsDir, f));
}

/**
 * Runs all pending SQL migration files against a given database.
 */
export async function runMigrations(dbUrl: string): Promise<void> {
  const migrationsDir = join(process.cwd(), "drizzle", "tenant");
  const files = getMigrationFiles(migrationsDir);

  const pool   = new Pool({ connectionString: dbUrl });
  const client = await pool.connect();

  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    for (const file of files) {
      const sql = readFileSync(file, "utf-8");
      console.log(`  📄 Running migration: ${file.split(/[\\/]/).pop()}`);
      await client.query(sql);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Creates a new database for a tenant and initializes the schema.
 */
export async function provisionTenant(
  name: string,
  ownerClerkId: string,
  addressData: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  },
  contact?: string
) {
  const slug   = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const dbName = `vendas_${slug}`;

  const masterUrl = process.env.DATABASE_URL!;
  if (!masterUrl || !masterUrl.startsWith("postgres")) {
    throw new Error("DATABASE_URL inválida — verifique o server/.env");
  }

  // Connect to system postgres DB to CREATE DATABASE
  const parsedUrl    = new URL(masterUrl);
  parsedUrl.pathname = "/postgres";
  const adminPool    = new Pool({ connectionString: parsedUrl.toString() });
  const client       = await adminPool.connect();

  try {
    console.log(`🛠️  Creating database: "${dbName}"`);
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Database "${dbName}" created.`);

    // Register in master
    await masterDb.insert(tenants).values({
      name, slug, dbName, ownerClerkId,
      ...addressData, contact,
      status: "active",
    });

    // Build tenant connection string
    const tenantUrl = masterUrl.replace(/\/([^/]+)$/, `/${dbName}`);

    // Run ALL migration files in order
    console.log(`🗃️  Applying migrations to "${dbName}"...`);
    await runMigrations(tenantUrl);
    console.log(`✅ Schema ready for "${dbName}".`);

    return { slug, dbName };
  } catch (error: any) {
    if (error.code === "42P04") {
      throw new Error("Já existe uma empresa com este nome. Escolha outro.");
    }
    console.error("Provisioning error:", error);
    throw error;
  } finally {
    client.release();
    await adminPool.end();
  }
}
