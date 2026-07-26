const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  await client.connect();

  const res = await client.query(`
    SELECT conname, contype, pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conrelid = 'class_students'::regclass
    ORDER BY contype;
  `);
  console.log("Constraints on class_students:");
  res.rows.forEach(r => console.log(` - ${r.conname}: ${r.pg_get_constraintdef}`));

  await client.end();
}
run().catch(console.error);
