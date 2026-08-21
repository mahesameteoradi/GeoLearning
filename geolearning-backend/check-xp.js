const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected. Removing XP bonus (POSITIVE interventions) and recalculating user XP...');

  // 1. Find all XP logs that came from POSITIVE interventions (source = 'TEACHER_BOOST' or similar)
  const { rows: boostLogs } = await client.query(
    "SELECT * FROM xp_logs WHERE source IN ('TEACHER_BOOST', 'BOOST', 'POSITIVE', 'INTERVENTION_POSITIVE') ORDER BY created_at DESC"
  );
  console.log('Boost XP logs found:', boostLogs.length, boostLogs);

  // 2. Also check what sources exist
  const { rows: sources } = await client.query(
    "SELECT DISTINCT source, COUNT(*) as count FROM xp_logs GROUP BY source"
  );
  console.log('All XP log sources:', sources);

  await client.end();
}
main();
