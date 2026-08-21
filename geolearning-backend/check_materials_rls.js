const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.ubemaknuwaxxcdkycqks:Meteor2026%21%40%23@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
client.connect()
  .then(() => client.query("SELECT tablename, policyname, roles, cmd, qual FROM pg_policies WHERE tablename = 'materials'"))
  .then(r => console.log('policies:', r.rows))
  .finally(() => client.end());
