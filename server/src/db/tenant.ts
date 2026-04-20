import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index.js";

// Cache of pools and drizzle instances per database name
const pools: Map<string, Pool> = new Map();
const drizzleInstances: Map<string, any> = new Map();

/**
 * Gets or creates a connection pool for a specific tenant database.
 */
export function getTenantDb(dbName: string) {
  let pool = pools.get(dbName);
  let db = drizzleInstances.get(dbName);

  if (db) return db;

  if (!pool) {
    const masterUrl = process.env.DATABASE_URL!;
    const urlParts = masterUrl.split("/");
    urlParts[urlParts.length - 1] = dbName;
    const tenantUrl = urlParts.join("/");

    pool = new Pool({
      connectionString: tenantUrl,
      max: 10,
      idleTimeoutMillis: 30000,
    });

    pools.set(dbName, pool);
  }

  db = drizzle(pool, { schema });
  drizzleInstances.set(dbName, db);
  return db;
}
