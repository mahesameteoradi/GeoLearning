const { Client } = require('pg');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Recalculate and fix XP for all students with XP > 0
  const { rows: students } = await client.query(
    "SELECT id, name, xp FROM users WHERE role = 'STUDENT' AND xp > 0"
  );

  for (const s of students) {
    // Quiz XP: best attempt per quiz
    const { rows: quizAttempts } = await client.query(
      "SELECT quiz_id, MAX(xp_earned) as best_xp FROM quiz_attempts WHERE user_id = $1 AND completed_at IS NOT NULL GROUP BY quiz_id",
      [s.id]
    );
    const quizXp = quizAttempts.reduce((sum, r) => sum + Number(r.best_xp || 0), 0);

    // Material XP
    const { rows: matLogs } = await client.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM xp_logs WHERE user_id = $1 AND source = 'MATERIAL_READ'",
      [s.id]
    );
    const matXp = Number(matLogs[0].total || 0);

    // Project XP
    const { rows: projSubs } = await client.query(
      "SELECT COALESCE(SUM(xp_earned), 0) as total FROM project_submissions WHERE user_id = $1",
      [s.id]
    );
    const projXp = Number(projSubs[0].total || 0);

    const legitXp = quizXp + matXp + projXp;

    if (legitXp !== s.xp) {
      // Calculate level: XP thresholds: 1=0, 2=100, 3=250, 4=500, 5=1000, 6=2000...
      function calculateLevel(xp) {
        const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000];
        let level = 1;
        for (let i = 1; i < thresholds.length; i++) {
          if (xp >= thresholds[i]) level = i + 1;
          else break;
        }
        return level;
      }
      const newLevel = calculateLevel(legitXp);

      await client.query(
        "UPDATE users SET xp = $1, level = $2 WHERE id = $3",
        [legitXp, newLevel, s.id]
      );
      console.log(`✅ Fixed [${s.name}]: ${s.xp} XP → ${legitXp} XP (Level ${newLevel})`);
    } else {
      console.log(`✓ [${s.name}] XP already correct: ${s.xp}`);
    }
  }

  await client.end();
  console.log('Done!');
}
main();
