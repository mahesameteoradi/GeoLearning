const { Client } = require('pg');
require('dotenv').config();

const client = new Client(process.env.DIRECT_URL);
client.connect().then(async () => {
  try {
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log("Users columns:");
    res.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    const bucketRes = await client.query("SELECT id, name, public FROM storage.buckets");
    console.log("\nStorage Buckets:");
    bucketRes.rows.forEach(r => console.log(`  ${r.id} (public: ${r.public})`));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.end();
  }
});
