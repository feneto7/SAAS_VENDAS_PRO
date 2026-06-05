const { Client } = require('pg');
async function run() {
  const t = new Client({ connectionString: 'postgresql://postgres:FelipeSantiago10@localhost:5432/vendas_feneto7' });
  await t.connect();
  const cols = await t.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'collections'");
  console.log(cols.rows.map(r => r.column_name));
  await t.end();
}
run().catch(console.error);
