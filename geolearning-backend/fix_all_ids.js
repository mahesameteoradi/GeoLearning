const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL");
  
  const tables = [
    'classes',
    'class_students',
    'modules',
    'materials',
    'forum_posts',
    'forum_replies',
    'interventions',
    'notifications',
    'user_badges'
  ];

  for (const table of tables) {
    try {
      const q = `ALTER TABLE ${table} ALTER COLUMN id SET DEFAULT gen_random_uuid();`;
      await client.query(q);
      console.log(`Executed: ${q}`);
    } catch (err) {
      console.log(`Failed for ${table}: ${err.message}`);
    }
  }

  await client.query(`NOTIFY pgrst, 'reload schema';`);
  console.log("Sent NOTIFY pgrst, 'reload schema';");
  
  await client.end();
}

run().catch(err => {
  console.error(err);
  client.end();
});
