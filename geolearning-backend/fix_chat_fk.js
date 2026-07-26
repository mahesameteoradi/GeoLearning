const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  await client.connect();

  // 1. Rename FK constraint to match Supabase convention (table_column_fkey)
  await client.query(`
    ALTER TABLE chat_messages
      DROP CONSTRAINT IF EXISTS fk_user,
      ADD CONSTRAINT chat_messages_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  `);
  console.log("FK renamed to chat_messages_user_id_fkey");

  // 2. Trigger PostgREST schema cache reload
  await client.query("NOTIFY pgrst, 'reload schema';");
  console.log("Schema cache reload triggered!");

  await client.end();
}
run().catch(console.error);
