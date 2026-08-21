const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query("SELECT id, title, xp_reward FROM materials ORDER BY created_at DESC LIMIT 10");
  console.log("Materials with XP:", rows);
  await client.end();
}
main();
