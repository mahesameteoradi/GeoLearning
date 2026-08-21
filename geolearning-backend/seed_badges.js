const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://ubemaknuwaxxcdkycqks.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZW1ha251d2F4eGNka3ljcWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQxMDU3OCwiZXhwIjoyMDk4OTg2NTc4fQ.Cqo6iW0Frd12IAwb3N1jK1yxJcpPosL4bpEZvHZtrxM"
);

const BADGE_RULES = [
  { id: 'first_quiz', name: 'Langkah Pertama', description: 'Menyelesaikan kuis pertama kamu', icon: '🎯' },
  { id: 'perfect_score', name: 'Si Paling Sempurna', description: 'Mendapat nilai 100 di kuis (tanpa remedial)', icon: '💯' },
  { id: 'weekend_warrior', name: 'Pejuang Mingguan', description: 'Mengerjakan kuis di akhir pekan (Sabtu/Minggu)', icon: '⚡' },
  { id: 'night_owl', name: 'Makin Lancar', description: 'Menyelesaikan 5 kuis dengan nilai di atas passing score', icon: '🔥' },
  { id: 'streak_3', name: 'Mulai Berkembang', description: 'Mempertahankan 3 hari streak berturut-turut', icon: '⭐' },
  { id: 'streak_7', name: 'Bintang Baru', description: 'Mempertahankan 7 hari streak berturut-turut', icon: '🌟' },
  { id: 'level_5', name: 'Pelajar', description: 'Mencapai Level 5', icon: '🛡️' },
  { id: 'level_10', name: 'Sarjana', description: 'Mencapai Level 10', icon: '📚' },
  { id: 'level_20', name: 'Master', description: 'Mencapai Level 20', icon: '👑' },
  { id: 'speed_demon', name: 'Mesin XP', description: 'Mendapatkan 500 XP dalam satu hari', icon: '⚙️' },
  { id: 'unstoppable', name: 'Tak Terhentikan', description: 'Mempertahankan 14 hari streak berturut-turut', icon: '🚀' },
  { id: 'veteran', name: 'Veteran', description: 'Mencapai Level 50', icon: '🌐' },
  { id: 'elite', name: 'Elit', description: 'Berada di Top 10 Leaderboard', icon: '🔮' },
  { id: 'expert', name: 'Ahli', description: 'Mencapai skor kuis rata-rata 90+ dari 10 kuis', icon: '🏆' }
];

async function main() {
  // Check existing badges
  const { data: existing, error: getErr } = await supabase.from('badges').select('*');
  if (getErr) {
    console.error("Error fetching:", getErr);
    return;
  }
  
  console.log("Existing badges:", existing.length);
  
  if (existing.length === 0) {
    const { error: insertErr } = await supabase.from('badges').insert(
      BADGE_RULES.map(b => ({
        id: b.id,
        display_name: b.name,
        description: b.description,
        icon: b.icon
      }))
    );
    
    if (insertErr) {
      console.error("Error inserting:", insertErr);
    } else {
      console.log("Successfully seeded badges!");
    }
  } else {
    // Upsert
    const { error: upsertErr } = await supabase.from('badges').upsert(
      BADGE_RULES.map(b => ({
        id: b.id,
        display_name: b.name,
        description: b.description,
        icon: b.icon
      }))
    );
    if (upsertErr) {
      console.error("Error upserting:", upsertErr);
    } else {
      console.log("Successfully upserted badges!");
    }
  }
}

main();
