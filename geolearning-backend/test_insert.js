const { Client } = require('pg');
require('dotenv').config();

const client = new Client(process.env.DIRECT_URL);
client.connect().then(async () => {
  try {
    const res = await client.query("INSERT INTO class_students (class_id, student_id) VALUES ('31f137eb-bd00-478f-a2e6-eddb148fb00d', '54edee51-2470-4f52-b13f-bd8f16182875') RETURNING *");
    console.log("Success:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.end();
  }
});
