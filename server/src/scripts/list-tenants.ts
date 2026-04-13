import { Pool } from "pg";
import dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env"), override: true });

async function list() {
  const MASTER_URL = process.env.DATABASE_URL!;
  const masterPool = new Pool({ connectionString: MASTER_URL });
  try {
    const { rows } = await masterPool.query("SELECT name, slug, db_name FROM tenants");
    console.log("TENANTS IN MASTER:");
    console.table(rows);
  } finally {
    await masterPool.end();
  }
}

list();
