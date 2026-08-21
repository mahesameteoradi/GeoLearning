const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to DB. Adding users to supabase_realtime...');
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE users;`);
    console.log('Successfully added users to realtime');
  } catch (e) {
    if (e.message && e.message.includes('already in publication')) {
        console.log('Users table is already in publication.');
    } else {
        console.log('Error adding users:', e.message);
    }
  } finally {
    await client.end();
  }
}

main();
