const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.ubemaknuwaxxcdkycqks:Meteor2026%21%40%23@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});
async function reload() {
  await client.connect();
  await client.query("NOTIFY pgrst, 'reload schema'");
  console.log('Schema reloaded');
  await client.end();
}
reload().catch(console.error);
