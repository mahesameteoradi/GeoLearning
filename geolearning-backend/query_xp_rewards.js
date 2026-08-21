const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.ubemaknuwaxxcdkycqks:Meteor2026%21%40%23@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
client.connect()
  .then(() => client.query("SELECT m.xp_reward FROM material_completions mc JOIN materials m ON mc.material_id = m.id WHERE mc.user_id = 'ac3bb111-3b0d-4eaa-922f-bfb3805cdd75'"))
  .then(r => console.log('xp rewards:', r.rows))
  .finally(() => client.end());
