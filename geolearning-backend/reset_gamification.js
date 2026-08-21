/**
 * reset_gamification.js
 * 
 * Reset semua XP, Level, Streak, dan Badge seluruh user (STUDENT dan TEACHER)
 * Juga hapus: xp_logs, user_badges, quiz_attempts, material_completions
 * 
 * Jalankan dengan:
 *   node reset_gamification.js
 * 
 * Dari folder: geolearning-backend/
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetAll() {
  console.log('\n🔄 Memulai reset data gamifikasi...\n')

  try {
    // ── 1. Hapus semua jawaban detail attempt ──
    const deletedAnswers = await prisma.quizAttemptAnswer.deleteMany({})
    console.log(`✅ quiz_attempt_answers dihapus: ${deletedAnswers.count} baris`)

    // ── 2. Hapus semua quiz attempts ──
    const deletedAttempts = await prisma.quizAttempt.deleteMany({})
    console.log(`✅ quiz_attempts dihapus: ${deletedAttempts.count} baris`)

    // ── 3. Hapus semua material completions ──
    const deletedCompletions = await prisma.materialCompletion.deleteMany({})
    console.log(`✅ material_completions dihapus: ${deletedCompletions.count} baris`)

    // ── 4. Hapus semua XP logs ──
    const deletedXpLogs = await prisma.xpLog.deleteMany({})
    console.log(`✅ xp_logs dihapus: ${deletedXpLogs.count} baris`)

    // ── 5. Hapus semua user badges ──
    const deletedBadges = await prisma.userBadge.deleteMany({})
    console.log(`✅ user_badges dihapus: ${deletedBadges.count} baris`)

    // ── 6. Reset kolom di tabel users ──
    const resetUsers = await prisma.user.updateMany({
      data: {
        xp: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0,
        equipped_badge_id: null,
      }
    })
    console.log(`✅ users di-reset: ${resetUsers.count} akun`)

    // ── Ringkasan ──
    console.log('\n════════════════════════════════════')
    console.log('✅ Reset selesai! Semua data gamifikasi telah dihapus.')
    console.log('   • XP semua user → 0')
    console.log('   • Level semua user → 1')
    console.log('   • Streak (current & longest) → 0')
    console.log('   • Badge yang dipakai → null')
    console.log('   • Semua user_badges dihapus')
    console.log('   • Semua xp_logs dihapus')
    console.log('   • Semua quiz_attempts & jawaban dihapus')
    console.log('   • Semua material_completions dihapus')
    console.log('════════════════════════════════════\n')

  } catch (error) {
    console.error('\n❌ ERROR saat reset:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Konfirmasi sebelum reset
const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

rl.question(
  '⚠️  PERHATIAN: Ini akan menghapus SEMUA progress belajar siswa (XP, level, streak, badge, riwayat kuis, materi selesai).\n' +
  '   Ketik "RESET" untuk melanjutkan: ',
  (answer) => {
    rl.close()
    if (answer.trim() === 'RESET') {
      resetAll().catch(() => process.exit(1))
    } else {
      console.log('\n❌ Reset dibatalkan. Tidak ada yang berubah.\n')
      process.exit(0)
    }
  }
)
