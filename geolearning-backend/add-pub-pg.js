const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  });

  try {
    await client.connect();
    
    // Check if notifications table is in publication
    const res = await client.query(`SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';`);
    if (res.rows.length === 0) {
      console.log("Adding notifications to supabase_realtime...");
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE notifications;`);
      console.log("Success!");
    } else {
      console.log("notifications is already in supabase_realtime.");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

main();
