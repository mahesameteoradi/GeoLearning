const { Client } = require('pg');
require('dotenv').config();

const client = new Client(process.env.DIRECT_URL);
client.connect().then(async () => {
  try {
    const res = await client.query("ALTER TABLE class_students ALTER COLUMN id SET DEFAULT gen_random_uuid()");
    console.log("Success setting default:", res);
    const notifyRes = await client.query("NOTIFY pgrst, 'reload schema'");
    console.log("Reloaded schema:", notifyRes);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.end();
  }
});
