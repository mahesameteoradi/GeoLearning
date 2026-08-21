const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://ubemaknuwaxxcdkycqks.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZW1ha251d2F4eGNka3ljcWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQxMDU3OCwiZXhwIjoyMDk4OTg2NTc4fQ.Cqo6iW0Frd12IAwb3N1jK1yxJcpPosL4bpEZvHZtrxM"
);

function calculateLevel(xp) {
  if (xp <= 0) return 0;
  return Math.min(Math.floor(xp / 100), 100);
}

async function main() {
  const { data: users, error: userErr } = await supabase.from('users').select('id, xp, level');
  if (userErr) {
    console.error("Failed to fetch users", userErr);
    return;
  }
  
  let fixedCount = 0;

  for (const user of users) {
    const correctLevel = calculateLevel(user.xp);
    if (user.level !== correctLevel) {
      console.log(`Fixing level for ${user.id}: ${user.level} -> ${correctLevel}`);
      await supabase.from('users').update({ level: correctLevel }).eq('id', user.id);
      fixedCount++;
    }
  }

  console.log(`Finished! Fixed ${fixedCount} users' levels.`);
}

main();
