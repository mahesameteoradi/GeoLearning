const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  await client.connect();
  const f = await client.query(`
    SELECT cs.student_id, u.id as user_id, u.name 
    FROM class_students cs 
    LEFT JOIN users u ON cs.student_id = u.id
  `);
  console.log('Joined students:', f.rows);
  console.log("Done");
  await client.end();
}
run().catch(console.error);
