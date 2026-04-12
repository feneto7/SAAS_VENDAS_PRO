import { Pool } from "pg";
import dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env"), override: true });

async function check() {
  const MASTER_URL = process.env.DATABASE_URL!;
  const masterPool = new Pool({ connectionString: MASTER_URL });
  
  try {
    const res = await masterPool.query("SELECT db_name FROM tenants");
    const tenants = res.rows;
    
    for (const { db_name } of tenants) {
      const tenantUrl = MASTER_URL.replace(/\/([^/]+)$/, `/${db_name}`);
      const tenantPool = new Pool({ connectionString: tenantUrl });
      try {
        const { rows: colRows } = await tenantPool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'cobrancas'
          ORDER BY ordinal_position
        `);
        console.log(`\nDB: ${db_name}`);
        console.log(`Status: ${colRows.length > 0 ? 'Table Found' : 'TABLE MISSING'}`);
        if (colRows.length > 0) {
          colRows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
        }
      } catch (err: any) {
        console.log(`DB: ${db_name} | ERROR: ${err.message}`);
      } finally {
        await tenantPool.end();
      }
    }
  } finally {
    await masterPool.end();
  }
}

check();
