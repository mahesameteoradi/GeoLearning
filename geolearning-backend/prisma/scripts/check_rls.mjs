import pg from 'pg'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env', 'utf-8')
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim().replace(/^"|"$/g, '')] })
)

const client = new pg.Client({ connectionString: envVars.DIRECT_URL, ssl: { rejectUnauthorized: false } })
await client.connect()

const res = await client.query(`
  SELECT column_name, column_default, is_nullable
  FROM information_schema.columns 
  WHERE table_name='classes'
  ORDER BY ordinal_position
`)
console.log('\n=== classes columns AFTER FIX ===')
console.table(res.rows)

// Also verify class_students exists
const cs = await client.query(`SELECT COUNT(*) FROM information_schema.tables WHERE table_name='class_students'`)
console.log('\nclass_students exists:', cs.rows[0].count > 0 ? '✅ YES' : '❌ NO')

await client.end()
