const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  });

  try {
    await client.connect();
    
    // Add users to supabase_realtime
    const resUsers = await client.query(`SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users';`);
    if (resUsers.rows.length === 0) {
      console.log("Adding users to supabase_realtime...");
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE users;`);
      console.log("users table added!");
    } else {
      console.log("users table is already in supabase_realtime.");
    }

    // Add quiz_attempts to supabase_realtime
    const resQuiz = await client.query(`SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'quiz_attempts';`);
    if (resQuiz.rows.length === 0) {
      console.log("Adding quiz_attempts to supabase_realtime...");
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE quiz_attempts;`);
      console.log("quiz_attempts table added!");
    } else {
      console.log("quiz_attempts table is already in supabase_realtime.");
    }

    // Retroactive fix for levels (Level = Floor(XP / 100))
    console.log("Fixing level inconsistencies in database...");
    await client.query(`UPDATE users SET level = FLOOR(xp / 100) WHERE xp >= 0;`);
    console.log("All users level synced with their XP!");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

main();
