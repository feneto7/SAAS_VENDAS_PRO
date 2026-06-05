const { Client } = require('pg');

async function run() {
  const master = new Client({ connectionString: 'postgresql://postgres:FelipeSantiago10@localhost:5432/vendas_master' });
  await master.connect();
  const res = await master.query('SELECT slug FROM tenants');
  
  for (const row of res.rows) {
    const tenantDbName = 'vendas_' + row.slug.replace(/-/g, '_');
    console.log('Checking', tenantDbName);
    const t = new Client({ connectionString: 'postgresql://postgres:FelipeSantiago10@localhost:5432/' + tenantDbName });
    await t.connect();
    const cols = await t.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'collections'");
    console.log(cols.rows.map(r => r.column_name));
    await t.end();
  }
  
  await master.end();
}

run().catch(console.error);
