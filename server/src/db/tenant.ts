import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index.js";

// Cache of pools per database name
const pools: Map<string, Pool> = new Map();

/**
 * Gets or creates a connection pool for a specific tenant database.
 */
export function getTenantDb(dbName: string) {
  let pool = pools.get(dbName);

  if (!pool) {
    const masterUrl = process.env.DATABASE_URL!;
    // Build the connection string for the specific tenant database
    // We assume the URL ends with /default_db
    const urlParts = masterUrl.split("/");
    urlParts[urlParts.length - 1] = dbName;
    const tenantUrl = urlParts.join("/");

    pool = new Pool({
      connectionString: tenantUrl,
      max: 10, // Limit connections per tenant
      idleTimeoutMillis: 30000,
    });

    pools.set(dbName, pool);
  }

  return drizzle(pool, { schema });
}
