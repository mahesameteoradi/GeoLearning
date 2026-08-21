const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.ubemaknuwaxxcdkycqks:Meteor2026%21%40%23@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
client.connect()
  .then(() => client.query("SELECT amount, source, reference_id, created_at FROM xp_logs WHERE source = 'MATERIAL_READ' ORDER BY created_at DESC LIMIT 5"))
  .then(r => console.log('xp_logs:', r.rows))
  .finally(() => client.end());
