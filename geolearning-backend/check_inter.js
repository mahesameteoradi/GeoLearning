const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN ('NotificationType', 'notification_type', 'NotificationTypeEnum', 'InterventionType')
  `);
  console.log("ENUMS:");
  console.log(res.rows);
  await client.end();
}
run().catch(console.error);
