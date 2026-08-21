/**
 * reset_gamification_supabase.js
 * Reset XP, level, streak, badge, xp_logs, user_badges,
 * quiz_attempts, quiz_attempt_answers, material_completions
 * menggunakan Supabase REST API (service role key).
 */

const SUPABASE_URL = 'https://ubemaknuwaxxcdkycqks.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZW1ha251d2F4eGNka3ljcWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQxMDU3OCwiZXhwIjoyMDk4OTg2NTc4fQ.Cqo6iW0Frd12IAwb3N1jK1yxJcpPosL4bpEZvHZtrxM'

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer': 'return=representation',
}

async function deleteAll(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=neq.00000000-0000-0000-0000-000000000000`
  const res = await fetch(url, { method: 'DELETE', headers })
  const text = await res.text()
  if (!res.ok) throw new Error(`DELETE ${table} gagal: ${res.status} — ${text}`)
  // Count via header
  const count = res.headers.get('content-range')
  return count ?? '?'
}

async function resetUsers() {
  const url = `${SUPABASE_URL}/rest/v1/users?role=eq.STUDENT`
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      xp: 0,
      level: 1,
      current_streak: 0,
      longest_streak: 0,
      equipped_badge_id: null,
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`PATCH users gagal: ${res.status} — ${text}`)
}

async function main() {
  console.log('\n🔄 Memulai reset data gamifikasi via Supabase...\n')

  try {
    // Urutan penting: hapus child tables dulu sebelum parent
    console.log('⏳ Menghapus quiz_attempt_answers...')
    await deleteAll('quiz_attempt_answers')
    console.log('✅ quiz_attempt_answers — selesai')

    console.log('⏳ Menghapus quiz_attempts...')
    await deleteAll('quiz_attempts')
    console.log('✅ quiz_attempts — selesai')

    console.log('⏳ Menghapus material_completions...')
    await deleteAll('material_completions')
    console.log('✅ material_completions — selesai')

    console.log('⏳ Menghapus xp_logs...')
    await deleteAll('xp_logs')
    console.log('✅ xp_logs — selesai')

    console.log('⏳ Menghapus user_badges...')
    await deleteAll('user_badges')
    console.log('✅ user_badges — selesai')

    console.log('⏳ Reset XP / Level / Streak semua STUDENT...')
    await resetUsers()
    console.log('✅ users (STUDENT) — XP=0, level=1, streak=0, badge=null')

    console.log('\n════════════════════════════════════════════')
    console.log('🎉 SELESAI! Semua data gamifikasi telah direset.')
    console.log('   • XP semua siswa → 0')
    console.log('   • Level semua siswa → 1')
    console.log('   • Streak (current & longest) → 0')
    console.log('   • Badge dipakai → dihapus')
    console.log('   • Semua user_badges → dihapus')
    console.log('   • Semua xp_logs → dihapus')
    console.log('   • Semua quiz_attempts & jawaban → dihapus')
    console.log('   • Semua material_completions → dihapus')
    console.log('════════════════════════════════════════════\n')

  } catch (err) {
    console.error('\n❌ ERROR:', err.message)
    process.exit(1)
  }
}

main()
