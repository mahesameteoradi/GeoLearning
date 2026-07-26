const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  await client.connect();
  const sql = fs.readFileSync('prisma/migrations/fix_forum_rls.sql', 'utf8');
  await client.query(sql);
  console.log("Forum SQL Executed Successfully!");
  await client.end();
}
run().catch(console.error);
