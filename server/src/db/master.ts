import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import { join } from "path";
import * as schema from "./schema/index.js";

// Force load env to avoid system user fallback
dotenv.config({ path: join(process.cwd(), ".env"), override: true });


const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Points to the Master DB
});

export const masterDb = drizzle(pool, { schema });
