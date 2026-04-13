
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing');
    return;
  }
  const connectionString = process.env.DATABASE_URL.replace('?sslmode=require', '');
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    const recentFichas = await db.execute(sql`SELECT id, code, status FROM fichas ORDER BY created_at DESC LIMIT 5`);
    console.log('Recent Fichas:', recentFichas);

    for (const f of recentFichas) {
      const items = await db.execute(sql`SELECT * FROM ficha_items WHERE ficha_id = ${f.id}`);
      console.log(`Ficha ${f.code} (${f.id}): ${items.length} items`);
      if (items.length > 0) {
        console.log(`  Sample item PID: ${items[0].product_id}`);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
