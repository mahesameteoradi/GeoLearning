import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log("Supabase schema cache reloaded successfully!");
  } catch (error) {
    console.error("Error reloading schema:", error);
  } finally {
    await client.end();
  }
}

main();
