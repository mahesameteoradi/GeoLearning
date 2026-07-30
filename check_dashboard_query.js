const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './geolearning-backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: classes, error } = await supabase
    .from('classes')
    .select(`
      id, name, description, join_code,
      modules(id),
      class_students(
        student:users!class_students_student_id_fkey(id, name, email, xp, current_streak, avatar_url)
      )
    `)
    .limit(1);

  if (error) {
    console.error("Error classes:", error);
  } else {
    console.log("Success classes");
  }

  const { data: interventions, error: err2 } = await supabase
    .from('interventions')
    .select(`
      id, note, type, resolved, created_at,
      student:users!interventions_student_id_fkey(id, name)
    `)
    .limit(1);

  if (err2) {
    console.error("Error interventions:", err2);
  } else {
    console.log("Success interventions");
  }
}

main();
