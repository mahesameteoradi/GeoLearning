const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: logs } = await supabase.from('xp_logs').select('*').order('created_at', { ascending: false }).limit(10);
  console.log("XP LOGS:", logs);
  const { data: users } = await supabase.from('users').select('id, xp').limit(10);
  console.log("USERS:", users);
  const { data: mats } = await supabase.from('materials').select('id, xp_reward').limit(10);
  console.log("MATERIALS:", mats);
}
check();
