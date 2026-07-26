const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  await client.connect();

  // Check constraints on chat_messages
  const res = await client.query(`
    SELECT conname, contype, pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conrelid = 'chat_messages'::regclass
    ORDER BY contype;
  `);
  console.log("Constraints on chat_messages:");
  res.rows.forEach(r => console.log(` - ${r.conname}: ${r.pg_get_constraintdef}`));

  await client.end();
}
run().catch(console.error);
