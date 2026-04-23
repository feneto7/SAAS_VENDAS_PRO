import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Database connection will likely fail.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
