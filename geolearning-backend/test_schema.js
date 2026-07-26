const { Client } = require('pg');
require('dotenv').config();

const client = new Client(process.env.DIRECT_URL);
client.connect().then(async () => {
  try {
    const res = await client.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'class_students'");
    console.log("class_students schema:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.end();
  }
});
