const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DIRECT_URL });
async function run() {
  await client.connect();
  await client.query('ALTER TABLE project_assignments ADD COLUMN IF NOT EXISTS instruction_file_url TEXT;');
  console.log("Column added successfully!");
  await client.end();
}
run().catch(console.error);
