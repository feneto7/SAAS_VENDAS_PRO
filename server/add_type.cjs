const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:FelipeSantiago10@localhost:5432/vendas_redconfeccoes' });
client.connect().then(() => {
  return client.query(`ALTER TABLE fichas ADD COLUMN type INTEGER DEFAULT 1 NOT NULL;`);
}).then(res => {
  console.log("Success");
  return client.end();
}).catch(console.error);
