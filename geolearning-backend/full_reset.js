const { Client } = require('pg');
require('dotenv').config();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing in .env');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to DB. Performing full reset of gamification AND progress...');

    // 1. Reset XP, level, and streaks for all students
    await client.query(`
      UPDATE users 
      SET xp = 0, level = 1, current_streak = 0, longest_streak = 0
      WHERE role = 'STUDENT' OR role IS NULL;
    `);
    console.log('✅ Reset XP, level, and streaks for all students.');

    // 2. Clear all xp_logs and user_badges
    await client.query(`DELETE FROM xp_logs;`);
    await client.query(`DELETE FROM user_badges;`);
    console.log('✅ Cleared all XP logs and badges.');

    // 3. Clear all progress (quiz attempts, material completions, project submissions)
    await client.query(`DELETE FROM quiz_attempts;`);
    await client.query(`DELETE FROM material_completions;`);
    await client.query(`DELETE FROM project_submissions;`);
    console.log('✅ Cleared all quiz attempts, material completions, and project submissions.');

    console.log('Full reset complete!');
  } catch (e) {
    console.log('Error resetting:', e.message);
  } finally {
    await client.end();
  }
}

main();
