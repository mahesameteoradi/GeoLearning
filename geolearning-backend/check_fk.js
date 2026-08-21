const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.ubemaknuwaxxcdkycqks:Meteor2026%21%40%23@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});
async function run() {
  await client.connect();
  const r = await client.query(`
    SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='material_completions';
  `);
  console.log(r.rows);
  await client.end();
}
run().catch(console.error);
