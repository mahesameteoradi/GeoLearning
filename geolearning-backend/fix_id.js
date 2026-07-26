const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL");
  
  const queries = [
    `ALTER TABLE quizzes ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
    `ALTER TABLE questions ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
    `ALTER TABLE quiz_attempts ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
    `NOTIFY pgrst, 'reload schema';`
  ];

  for (const q of queries) {
    await client.query(q);
    console.log(`Executed: ${q}`);
  }

  await client.end();
}

run().catch(err => {
  console.error(err);
  client.end();
});
