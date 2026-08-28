require('dotenv').config({ path: '../geolearning-frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function main() {
  const teacherId = '969dd1e2-b883-4a0b-8d00-dfbbbd377ef4'; // Need a valid teacher ID, maybe just fetch one
  const { data: user } = await supabase.from('users').select('id').eq('role', 'TEACHER').limit(1).single();
  if (!user) return console.log('No teacher found');

  const { data, error } = await supabase
    .from('users')
    .select(`
      id, name, 
      class_students!inner(
        class_id, 
        classes!inner(id, name, teacher_id)
      )
    `)
    .eq('role', 'STUDENT')
    .eq('class_students.classes.teacher_id', user.id);

  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

main();
