import { Step } from 'react-joyride'

export const dashboardStudentSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Selamat datang di GeoLearning! Mari ikuti tur singkat untuk mengenal fitur-fitur di Dashboard kamu.',
  },
  {
    target: '#tour-student-hero',
    content: 'Di sini kamu bisa melihat profil utamamu, total XP yang telah dikumpulkan, dan levelmu saat ini. Jaga terus semangat belajarmu!',
  },
  {
    target: '#tour-student-stats',
    content: 'Ini adalah ringkasan prestasimu. Kamu bisa melihat jumlah kuis yang diselesaikan dan rekor beruntun (streak) belajarmu.',
  },
  {
    target: '#tour-student-flashcard',
    content: 'Gunakan fitur Flashcard ini untuk melatih ingatanmu tentang materi geografi secara cepat dan menyenangkan.',
  },
  {
    target: '#tour-student-badges',
    content: 'Kumpulkan lencana (badges) dari setiap pencapaian. Lencana yang paling keren bisa kamu lengkapi agar terlihat oleh teman-teman!',
  },
  {
    target: '#tour-student-activity',
    content: 'Aktivitas terbarumu (kuis, tugas, atau materi yang kamu baca) akan tercatat di sini.',
  },
  {
    target: '#tour-student-leaderboard',
    content: 'Bersainglah secara sehat dengan teman-teman sekelasmu di Papan Peringkat (Leaderboard) ini!',
  },
  {
    target: '#tour-student-interventions',
    content: 'Jika guru memberikan catatan khusus atau apresiasi kepadamu, pesannya akan muncul di bagian ini.',
  },
  {
    target: '#tour-nav-dashboard',
    content: 'Gunakan menu navigasi ini untuk berpindah halaman.',
  }
]

export const dashboardTeacherSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Selamat datang di Dashboard Guru! Mari ikuti tur singkat untuk mengenal fitur-fitur yang bisa Anda gunakan.',
  },
  {
    target: '#tour-teacher-stats',
    content: 'Ini adalah ringkasan keseluruhan kelas, jumlah siswa Anda, dan rata-rata perolehan XP.',
  },
  {
    target: '#tour-teacher-classes',
    content: 'Di sini Anda dapat melihat dan mengelola daftar kelas yang Anda ampu.',
  },
  {
    target: '#tour-teacher-progress',
    content: 'Pantau progres siswa secara individu, termasuk nilai kuis dan aktivitas terakhir mereka.',
  },
  {
    target: '#tour-nav-dashboard',
    content: 'Gunakan navigasi utama ini untuk mengelola kuis, melihat daftar semua siswa, atau mengubah profil Anda.',
  }
]

export const quizzesStudentSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Kuis & Ujian! Di sini kamu bisa mengerjakan kuis dari gurumu untuk mendapatkan nilai dan tambahan XP.',
  },
  {
    target: '#tour-student-pending-quizzes',
    content: 'Daftar kuis yang belum kamu kerjakan akan muncul di sini. Cukup klik kuisnya untuk mulai mengerjakan.',
  },
  {
    target: '#tour-student-done-quizzes',
    content: 'Setelah selesai, kuis beserta nilaimu akan dipindahkan ke bagian ini.',
  }
]

export const classesStudentSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Di halaman Ruang Kelasku ini, kamu bisa melihat daftar kelas yang kamu ikuti.',
  },
  {
    target: '#tour-student-class-cards',
    content: 'Pilih salah satu kelas dengan mengkliknya untuk mulai membaca materi yang telah dipersiapkan oleh gurumu.',
  }
]
