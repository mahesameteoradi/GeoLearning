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
    target: '#tour-student-badges',
    content: 'Kumpulkan lencana (badges) dari setiap pencapaian. Lencana yang paling keren bisa kamu lengkapi agar terlihat oleh teman-teman!',
  },
  {
    target: '#tour-student-xp-breakdown',
    content: 'Lihat Distribusi XP kamu di sini! Kamu bisa memantau darimana saja sumber poin XP yang telah kamu kumpulkan.',
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
    target: '#tour-nav-classes',
    content: 'Untuk mulai belajar dan membaca materi, klik menu "Kelas Saya" ini.',
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

// --- New Student Tours ---

export const classDetailStudentSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Selamat datang di Ruang Kelas! Di sini kamu bisa mengakses materi belajar dan berpartisipasi dalam kelas.',
  },
  {
    target: '#tour-student-class-modules',
    content: 'Ini adalah Peta Ekspedisi! Ikuti jalurnya untuk membaca materi atau mengerjakan kuis secara berurutan.',
  },
  {
    target: '#tour-student-class-leaderboard',
    content: 'Papan peringkat khusus kelas ini akan menunjukkan posisi XP-mu dibandingkan teman sekelas.',
  }
]

export const projectsStudentSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Ini adalah halaman Tugas Proyek. Guru akan memberikan tugas besar atau proyek di sini.',
  },
  {
    target: '#tour-student-project-list',
    content: 'Daftar semua tugas proyek yang diberikan kepadamu (baik yang belum maupun sudah dikerjakan) akan muncul di sini.',
  }
]

export const profileStudentSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Di halaman Profil Saya, kamu bisa mengatur akun dan melihat seluruh pencapaianmu.',
  },
  {
    target: '#tour-student-profile-gamification',
    content: 'Di sini kamu bisa memantau Status Gamifikasi, seperti Level, total XP, dan rekor belajarmu.',
  },
  {
    target: '#tour-student-profile-badges',
    content: 'Semua lencana (badges) yang telah kamu raih akan dipamerkan di rak ini. Terus berprestasi untuk mengumpulkan semuanya!',
  },
  {
    target: '#tour-student-profile-edit',
    content: 'Gunakan formulir ini untuk mengubah nama, email, atau foto profilmu.',
  },
  {
    target: '#tour-student-profile-password',
    content: 'Di bagian ini, kamu bisa memperbarui kata sandi untuk menjaga keamanan akunmu.',
  }
]

export const notificationsStudentSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Notifikasi. Semua pemberitahuan penting seperti tugas baru atau kuis baru akan muncul di sini.',
  }
]

// --- New Teacher Tours ---

export const classesTeacherSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Manajemen Kelas. Di sini Anda bisa mengontrol semua kelas dan materi di dalamnya.',
  },
  {
    target: '#tour-teacher-create-class',
    content: 'Klik tombol ini untuk membuat kelas baru dan mengundang siswa menggunakan kode unik.',
  },
  {
    target: '#tour-teacher-class-list',
    content: 'Ini adalah daftar kelas yang telah Anda buat. Anda bisa mengedit, menghapus, atau melihat modul di dalamnya.',
  }
]

export const quizzesTeacherSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Manajemen Kuis. Semua kuis yang Anda buat di berbagai kelas akan terkumpul di sini.',
  },
  {
    target: '#tour-teacher-quiz-list',
    content: 'Daftar kuis Anda ada di sini. Anda bisa mempublikasikan, mengedit, atau memantau hasil kuis siswa secara real-time. (Catatan: Kuis baru dibuat melalui menu Detail Kelas).',
  }
]

export const projectsTeacherSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Tugas Proyek. Berikan tugas pengumpulan berkas (file) atau link kepada siswa.',
  },
  {
    target: '#tour-teacher-create-project',
    content: 'Gunakan ini untuk membuat tugas proyek baru.',
  },
  {
    target: '#tour-teacher-project-list',
    content: 'Daftar proyek Anda akan muncul di bawah ini, lengkap dengan status pengumpulan siswa.',
  }
]

export const studentsTeacherSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Daftar Siswa. Anda bisa melihat semua siswa yang terdaftar di kelas-kelas Anda secara keseluruhan.',
  },
  {
    target: '#tour-teacher-student-table',
    content: 'Tabel ini menampilkan detail level, XP, dan status masing-masing siswa.',
  }
]

export const analyticsTeacherSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Analitik & Asesmen. Di sini Anda bisa memantau statistik dan laporan lengkap dari setiap kelas.',
  },
  {
    target: '#tour-teacher-analytics-select',
    content: 'Pilih kelas yang ingin Anda analisis dari menu tarik-turun (dropdown) ini.',
  },
  {
    target: '#tour-teacher-analytics-charts',
    content: 'Laporan visual grafik akan muncul di sini untuk membantu Anda mengidentifikasi siswa yang butuh bantuan.',
  }
]

export const studentAnalyticsTeacherSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Detail Analitik Siswa. Di sini Anda bisa melihat profil kompetensi siswa secara mendalam.',
  },
  {
    target: '#tour-teacher-student-spider',
    content: 'Grafik Radar (Spider Chart) ini menunjukkan 4 dimensi kompetensi siswa: Engagements, Mastery, Progress, dan Projects.',
  },
  {
    target: '#tour-teacher-student-interventions',
    content: 'Gunakan fitur Intervensi Guru ini untuk mencatat teguran, apresiasi, atau rekomendasi langsung untuk siswa ini.',
  }
]

export const profileTeacherSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Profil Guru. Anda dapat memperbarui informasi pribadi dan mengubah foto profil di sini.',
  },
  {
    target: '#tour-teacher-profile-stats',
    content: 'Di sini Anda dapat melihat ringkasan statistik mengajar secara real-time, seperti kelas aktif dan total siswa.',
  },
  {
    target: '#tour-teacher-profile-edit',
    content: 'Isi atau perbarui nama, NIP, dan mata pelajaran yang Anda ampu.',
  },
  {
    target: '#tour-teacher-profile-password',
    content: 'Ubah kata sandi Anda di sini secara berkala untuk menjaga keamanan akun.',
  }
]

// --- Public Pages Tours ---

export const landingPageSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Selamat datang di GeoLearning! Platform pembelajaran geografi interaktif. Mari kita lihat sekilas apa yang bisa kamu lakukan di sini.',
  },
  {
    target: '#tour-landing-fitur',
    content: 'GeoLearning dilengkapi dengan kuis gamifikasi, sistem level, lencana, dan papan peringkat yang membuat belajarmu semakin seru!',
  },
  {
    target: '#tour-landing-login',
    content: 'Sudah tidak sabar? Klik tombol Masuk ini untuk login atau mendaftar dan mulai petualangan belajarmu.',
  }
]

export const loginPageSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: 'Halaman Masuk. Di sini kamu bisa login ke akun GeoLearning-mu.',
  },
  {
    target: '#tour-login-form',
    content: 'Masukkan Email dan Kata Sandi yang telah didaftarkan, lalu klik Masuk. (Hubungi guru jika kamu belum memiliki akun).',
  }
]
