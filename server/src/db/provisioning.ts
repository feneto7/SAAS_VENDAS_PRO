import { masterDb } from "./master.js";
import { tenants, masterUsers }  from "./schema/index.js";
import { eq }      from "drizzle-orm";
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
 * Seeds default payment methods for a tenant.
 */
async function seedPaymentMethods(client: any): Promise<void> {
  const defaults = [
    "Dinheiro", 
    "PIX", 
    "Cartão de Crédito", 
    "Cartão de Débito", 
    "Transferência", 
    "Outro"
  ];
  try {
    for (const name of defaults) {
      await client.query(
        `INSERT INTO payment_methods (name, active, updated_at) VALUES ($1, true, NOW()) 
         ON CONFLICT DO NOTHING`, 
        [name]
      );
    }
    console.log("  🌱 Default payment methods seeded.");
  } catch (err) {
    console.error("  ❌ Error seeding payment methods:", err);
  }
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
      const sqlContent = readFileSync(file, "utf-8");
      console.log(`  📄 Running migration: ${file.split(/[\\/]/).pop()}`);
      
      const statements = sqlContent.split("--> statement-breakpoint");
      for (const stmt of statements) {
        const query = stmt.trim();
        if (query) {
           await client.query(query);
        }
      }
    }
    
    // Run Seed
    await seedPaymentMethods(client);

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
  ownerId: string,
  ownerEmail: string,
  ownerHash: string,
  addressData: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  },
  contact?: string,
  ownerName?: string,
  ownerCpf?: string
) {
  const slug   = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const dbName = `vendas_${slug}`;
  
  // ─── Pre-check: One tenant per user ─────────────────────────────────────
  const [existingTenant] = await masterDb
    .select()
    .from(tenants)
    .where(eq(tenants.ownerId, ownerId))
    .limit(1);

  if (existingTenant) {
     throw new Error("Você já possui uma empresa cadastrada. Cada conta só pode gerenciar uma empresa.");
  }

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

    // Build tenant connection string
    const tenantUrl = masterUrl.replace(/\/([^/]+)$/, `/${dbName}`);

    // Run ALL migration files in order
    console.log(`🗃️  Applying migrations to "${dbName}"...`);
    await runMigrations(tenantUrl);
    console.log(`✅ Schema ready for "${dbName}".`);

    // ─── Create First Seller (Contractor) ──────────────────────────────────
    console.log(`👤 Creating first seller: ${ownerName || name} (${ownerEmail})`);
    const tenantDb = new Pool({ connectionString: tenantUrl });
    try {
      // 7. Insert the first user (The owner)
      // They are the first "seller/staff" in the tenant database
      console.log("  👤 Creating administrator user...");
      await tenantDb.query(
        `INSERT INTO users (name, role, active, created_at, email, password_hash, web_access) 
         VALUES ($1, $2, true, NOW(), $3, $4, true)`,
        [ownerName || name, 'admin', ownerEmail, ownerHash]
      );
      console.log(`✅ First seller created.`);
    } catch (err) {
      console.error("  ❌ Error creating first seller:", err);
      throw new Error("Falha ao criar usuário administrador no banco da empresa.");
    } finally {
      await tenantDb.end();
    }

    // ─── Register in master ─────────────────────────────────────────────────
    console.log(`📝 Registering tenant in master database...`);
    const insertedTenants = (await masterDb.insert(tenants).values({
      name, slug, dbName, ownerId,
      ownerName, ownerCpf,
      ...addressData, contact,
      status: "active",
    }).returning()) as any[];
    const newTenant = insertedTenants[0];

    // Link user to tenant in master database for login discovery
    await masterDb.update(masterUsers)
      .set({ tenantId: newTenant.id })
      .where(eq(masterUsers.id, ownerId));

    console.log(`✅ Tenant registered and linked in master.`);

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
