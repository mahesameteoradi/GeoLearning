const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  await client.connect();
  const res = await client.query(
    "SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'class_students'"
  );
  console.log("RLS Policies on class_students:");
  if (res.rows.length === 0) {
    console.log(" (none — RLS may be disabled or no policies set)");
  }
  res.rows.forEach(r => console.log(r));
  await client.end();
}
run().catch(console.error);
