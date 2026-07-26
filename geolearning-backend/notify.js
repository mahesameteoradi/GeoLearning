const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL");
  await client.query(`NOTIFY pgrst, 'reload schema';`);
  console.log("Sent NOTIFY pgrst, 'reload schema';");
  await client.end();
}

run().catch(err => {
  console.error(err);
  client.end();
});
