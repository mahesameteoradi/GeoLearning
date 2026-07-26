const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  await client.connect();
  const sql = fs.readFileSync('create_chat_messages.sql', 'utf8');
  await client.query(sql);
  console.log("chat_messages table created successfully!");
  await client.end();
}
run().catch(console.error);
