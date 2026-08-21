const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://ubemaknuwaxxcdkycqks.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZW1ha251d2F4eGNka3ljcWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQxMDU3OCwiZXhwIjoyMDk4OTg2NTc4fQ.Cqo6iW0Frd12IAwb3N1jK1yxJcpPosL4bpEZvHZtrxM"
);

// We define the rules directly here to avoid requiring the TS file
const BADGE_RULES = [
  { id: 'first_quiz', name: 'Langkah Pertama', description: 'Menyelesaikan kuis pertama kamu', icon: '🎯', evaluate: (ctx) => ctx.isFirstQuiz === true },
  { id: 'perfect_score', name: 'Si Paling Sempurna', description: 'Mendapat nilai 100 di kuis', icon: '💯', evaluate: (ctx) => ctx.quizScore === 100 },
  { id: 'xp_100', name: 'Mulai Berkembang', description: 'Mendapatkan total 100 XP', icon: '⭐', evaluate: (ctx) => ctx.xp >= 100 },
  { id: 'xp_500', name: 'Bintang Baru', description: 'Mendapatkan total 500 XP', icon: '🌟', evaluate: (ctx) => ctx.xp >= 500 },
  { id: 'xp_1000', name: 'Mesin XP', description: 'Mendapatkan total 1.000 XP', icon: '💫', evaluate: (ctx) => ctx.xp >= 1000 },
  { id: 'xp_5000', name: 'Veteran', description: 'Mendapatkan total 5.000 XP', icon: '🔮', evaluate: (ctx) => ctx.xp >= 5000 },
  { id: 'level_5', name: 'Pelajar', description: 'Mencapai Level 5', icon: '🔥', evaluate: (ctx) => ctx.level >= 5 },
  { id: 'level_10', name: 'Sarjana', description: 'Mencapai Level 10', icon: '📚', evaluate: (ctx) => ctx.level >= 10 },
  { id: 'level_20', name: 'Ahli', description: 'Mencapai Level 20', icon: '🏆', evaluate: (ctx) => ctx.level >= 20 },
  { id: 'level_50', name: 'Master', description: 'Mencapai Level 50', icon: '👑', evaluate: (ctx) => ctx.level >= 50 },
  { id: 'streak_3', name: 'Makin Lancar', description: 'Belajar 3 hari berturut-turut', icon: '🔥', evaluate: (ctx) => ctx.currentStreak >= 3 },
  { id: 'streak_7', name: 'Pejuang Mingguan', description: 'Belajar 7 hari berturut-turut', icon: '⚡', evaluate: (ctx) => ctx.currentStreak >= 7 },
  { id: 'streak_30', name: 'Tak Terhentikan', description: 'Belajar 30 hari berturut-turut', icon: '🌈', evaluate: (ctx) => ctx.currentStreak >= 30 },
  { id: 'top_10', name: 'Elit', description: 'Berada di Top 10 Leaderboard XP', icon: '✨', evaluate: (ctx) => ctx.isTopTen === true },
];

async function main() {
  console.log("Fetching users...");
  const { data: users, error: userErr } = await supabase.from('users').select('id, xp, level, current_streak');
  if (userErr) {
    console.error("Failed to fetch users", userErr);
    return;
  }
  
  console.log(`Found ${users.length} users. Retroactively awarding badges...`);
  
  let totalAwarded = 0;

  for (const user of users) {
    // 1. Fetch user existing badges
    const { data: userBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', user.id);
    const existingBadgeIds = (userBadges || []).map(ub => ub.badge_id);

    // 2. Count higher XP for top 10
    const { count: higherXpCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('xp', user.xp);
    const isTopTen = (higherXpCount || 0) < 10;

    const ctx = {
      xp: user.xp,
      level: user.level,
      currentStreak: user.current_streak,
      quizScore: 0,
      isFirstQuiz: false,
      isTopTen,
    };

    const newlyQualified = BADGE_RULES.filter(rule => !existingBadgeIds.includes(rule.id) && rule.evaluate(ctx));
    
    if (newlyQualified.length > 0) {
      const { error: insertErr } = await supabase.from('user_badges').insert(
        newlyQualified.map(rule => ({
          user_id: user.id,
          badge_id: rule.id
        }))
      );
      if (insertErr) {
        console.error(`Error inserting badges for ${user.id}:`, insertErr);
      } else {
        totalAwarded += newlyQualified.length;
        console.log(`Awarded ${newlyQualified.length} badges to ${user.id} (${newlyQualified.map(r => r.id).join(', ')})`);
      }
    }
  }

  console.log(`\nFinished! Awarded ${totalAwarded} new badges retroactively.`);
}

main();
