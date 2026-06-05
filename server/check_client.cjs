const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:FelipeSantiago10@localhost:5432/vendas_redconfeccoes' });
client.connect().then(() => {
  return client.query(`SELECT client_id FROM fichas WHERE id = '2b22f733-c043-45b0-b42a-7ac841eaea30'`);
}).then(res => {
  console.log(res.rows);
  return client.end();
}).catch(console.error);
