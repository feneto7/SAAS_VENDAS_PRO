
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq, sql } = require('drizzle-orm');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const connectionString = process.env.DATABASE_URL.replace('?sslmode=require', '');
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    const recentFichas = await db.execute(sql`SELECT id, code, status FROM fichas ORDER BY created_at DESC LIMIT 5`);
    console.log('Recent Fichas:', recentFichas);

    for (const f of recentFichas) {
      const itemsCount = await db.execute(sql`SELECT count(*) FROM ficha_items WHERE ficha_id = ${f.id}`);
      console.log(`Ficha ${f.code} (${f.id}): ${itemsCount[0].count} items`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
