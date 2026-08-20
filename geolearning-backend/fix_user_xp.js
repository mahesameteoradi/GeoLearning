const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../geolearning-frontend/.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: users } = await supabase.from('users').select('id, xp, name');
  
  for (const user of users) {
    // Get all quiz attempts
    const { data: quizzes } = await supabase.from('quiz_attempts').select('quiz_id, xp_earned').eq('user_id', user.id).not('completed_at', 'is', null);
    const bestQuizXp = new Map();
    (quizzes || []).forEach(q => {
      const current = bestQuizXp.get(q.quiz_id) || 0;
      if (q.xp_earned > current) bestQuizXp.set(q.quiz_id, q.xp_earned);
    });
    const quizXp = Array.from(bestQuizXp.values()).reduce((a, b) => a + b, 0);

    // Get all materials
    const { data: materials } = await supabase.from('material_completions').select('id').eq('user_id', user.id);
    const materialXp = (materials || []).length * 15;

    // Get all projects
    const { data: projects } = await supabase.from('project_submissions').select('xp_earned').eq('user_id', user.id);
    const projectXp = (projects || []).reduce((sum, p) => sum + (p.xp_earned || 0), 0);
    
    // Get all Map Pins
    const { data: pins } = await supabase.from('xp_logs').select('amount').eq('user_id', user.id).eq('source', 'MAP_PIN_DISCOVERY');
    const pinXp = (pins || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    const calculatedXp = quizXp + materialXp + projectXp + pinXp;
    
    console.log(`User ${user.name} (${user.id}): Current XP=${user.xp}, Calculated=${calculatedXp}`);
    
    if (user.xp !== calculatedXp) {
      console.log(`  -> Fixing XP to ${calculatedXp} and Level to ${Math.floor(calculatedXp/100)}`);
      await supabase.from('users').update({ 
        xp: calculatedXp,
        level: Math.floor(calculatedXp / 100)
      }).eq('id', user.id);
    }
  }
}
main();
