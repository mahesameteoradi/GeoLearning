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
    console.log('Connected to DB. Resetting gamification data...');

    // 1. Reset XP, level, and streaks for all students (role = STUDENT)
    await client.query(`
      UPDATE users 
      SET xp = 0, level = 1, current_streak = 0, longest_streak = 0
      WHERE role = 'STUDENT' OR role IS NULL;
    `);
    console.log('✅ Reset XP, level, and streaks for all students.');

    // 2. Clear all xp_logs
    await client.query(`DELETE FROM xp_logs;`);
    console.log('✅ Cleared all XP logs.');

    // 3. Clear all user_badges
    await client.query(`DELETE FROM user_badges;`);
    console.log('✅ Cleared all user badges.');

    // 4. (Optional) Clear all material completions and quiz attempts to truly reset progress?
    // We will just clear gamification data as requested ("reset xp").
    
    console.log('Gamification reset complete!');
  } catch (e) {
    console.log('Error resetting gamification:', e.message);
  } finally {
    await client.end();
  }
}

main();
