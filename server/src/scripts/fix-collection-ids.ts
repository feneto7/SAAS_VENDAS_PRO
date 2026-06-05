/**
 * fix-collection-ids.ts
 *
 * Scans all floating cards and payments and links them to the appropriate collection
 * based on routeId, sellerId, and the creation timestamp falling between the collection's
 * start_date and end_date (or currently open).
 */
import { Pool } from "pg";
import dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env"), override: true });

const MASTER_URL = process.env.DATABASE_URL!;

async function main() {
  console.log("🔍 Fetching tenant list from master DB...\n");

  const masterPool = new Pool({ connectionString: MASTER_URL });
  const masterClient = await masterPool.connect();

  let tenants: { db_name: string }[] = [];
  try {
    const res = await masterClient.query("SELECT db_name FROM tenants");
    tenants = res.rows;
  } finally {
    masterClient.release();
    await masterPool.end();
  }

  for (const { db_name } of tenants) {
    console.log(`\n🗃️  Fixing data for tenant: ${db_name}`);
    const tenantUrl = MASTER_URL.replace(/\/[^/]+$/, `/${db_name}`);
    const pool = new Pool({ connectionString: tenantUrl });
    const client = await pool.connect();

    try {
      // 1. Fix Cards (Fichas)
      const unlinkedCards = await client.query(`
        SELECT id, route_id, seller_id, created_at 
        FROM cards 
        WHERE collection_id IS NULL
      `);
      
      let cardsFixed = 0;
      for (const card of unlinkedCards.rows) {
        // Find the collection that was active at the time the card was created
        // Or if the collection is still open, it just has to have start_date <= created_at
        const colRes = await client.query(`
          SELECT id FROM collections 
          WHERE route_id = $1 AND seller_id = $2 
          AND start_date <= $3
          AND (end_date IS NULL OR end_date >= $3)
          ORDER BY start_date DESC LIMIT 1
        `, [card.route_id, card.seller_id, card.created_at]);

        if (colRes.rows.length > 0) {
          await client.query(`UPDATE cards SET collection_id = $1 WHERE id = $2`, [colRes.rows[0].id, card.id]);
          cardsFixed++;
        }
      }
      console.log(`  ✅ Linked ${cardsFixed} / ${unlinkedCards.rows.length} cards to their respective collections.`);

      // 2. Fix Payments
      const unlinkedPayments = await client.query(`
        SELECT p.id, p.created_at, c.route_id, c.seller_id
        FROM payments p
        JOIN cards c ON p.card_id = c.id
        WHERE p.collection_id IS NULL
      `);

      let paymentsFixed = 0;
      for (const payment of unlinkedPayments.rows) {
        const colRes = await client.query(`
          SELECT id FROM collections 
          WHERE route_id = $1 AND seller_id = $2 
          AND start_date <= $3
          AND (end_date IS NULL OR end_date >= $3)
          ORDER BY start_date DESC LIMIT 1
        `, [payment.route_id, payment.seller_id, payment.created_at]);

        if (colRes.rows.length > 0) {
          await client.query(`UPDATE payments SET collection_id = $1 WHERE id = $2`, [colRes.rows[0].id, payment.id]);
          paymentsFixed++;
        }
      }
      console.log(`  ✅ Linked ${paymentsFixed} / ${unlinkedPayments.rows.length} payments to their respective collections.`);

    } catch (err) {
      console.error(`  ❌ Failed for ${db_name}:`, err);
    } finally {
      client.release();
      await pool.end();
    }
  }

  console.log("\n✅ All tenants processed.");
}

main().catch(console.error);
