require('dotenv').config({ path: '../geolearning-frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testInsert() {
  console.log('Testing insert into material_completions...');
  
  // Need a token to test RLS, but for now let's use service key to bypass RLS, or maybe the problem is trigger, not RLS.
  // Actually, we use anon key and login? No, let's just use service_role key to bypass RLS and test the trigger.
  const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); // Note: we need service_role key, if it's missing in frontend .env, we can't easily do it. Let's just check if it fails.
  
  const { data: user } = await adminSupabase.from('users').select('id').limit(1).single();
  const { data: material } = await adminSupabase.from('materials').select('id').limit(1).single();
  
  if (!user || !material) {
    console.log('No user or material found');
    return;
  }
  console.log('User:', user.id, 'Material:', material.id);

  const { data, error } = await adminSupabase.from('material_completions').insert({
    user_id: user.id,
    material_id: material.id
  }).select();

  console.log('Error:', error);
  console.log('Data:', data);
}

testInsert();
