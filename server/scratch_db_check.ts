import { Pool } from "pg";
import "dotenv/config";

async function checkTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants'
    `);
    console.log("Columns in 'tenants' table:");
    res.rows.forEach(row => console.log(`- ${row.column_name}`));
  } catch (err) {
    console.error("Error checking table:", err);
  } finally {
    await pool.end();
  }
}

checkTable();
