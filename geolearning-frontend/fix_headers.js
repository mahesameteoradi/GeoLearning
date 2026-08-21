const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'app/teacher/classes/page.tsx',
  'app/teacher/projects/page.tsx',
  'app/teacher/projects/[id]/page.tsx',
  'app/teacher/analytics/student/[id]/page.tsx',
  'app/student/projects/page.tsx',
  'app/student/quizzes/page.tsx',
  'app/student/classes/[classId]/page.tsx',
  'app/student/dashboard/DashboardClient.tsx'
];

filesToUpdate.forEach(file => {
  const fullPath = path.join('d:/SEMESTER 8/geo_LearningMedia/geolearning-frontend', file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Regex to match the complex header structure
  const headerRegex = /<div( id="[^"]+")? className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-900\/20">\s*<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse"><\/div>\s*<div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500 blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}><\/div>\s*<div className="absolute inset-0 bg-\[url\('https:\/\/www\.transparenttextures\.com\/patterns\/cubes\.png'\)\] opacity-10 mix-blend-overlay"><\/div>/g;

  content = content.replace(headerRegex, '<div$1 className="mb-8 relative overflow-hidden rounded-3xl bg-[#0B1120] p-8 shadow-md border border-slate-800">');

  // Also replace some specific subtexts
  // Teacher Classes
  content = content.replace(
    'Kelola ruang belajar Anda, atur modul, dan distribusikan kode akses (*join code*) kepada siswa dengan mudah.',
    'Pantau dan kelola seluruh kelas serta peserta didik Anda dari satu tempat.'
  );

  // Teacher Projects
  content = content.replace(
    'Kelola tugas proyek, bentuk kelompok, dan berikan evaluasi terstruktur kepada siswa.',
    'Berikan tugas proyek, bentuk kelompok, dan evaluasi hasil kerja siswa secara efisien.'
  );

  // Teacher Project Detail
  content = content.replace(
    'Pantau dan nilai hasil pengerjaan proyek dari seluruh siswa atau kelompok.',
    'Pantau progres pengumpulan tugas dan berikan penilaian akhir kepada siswa.'
  );

  // Student Projects
  content = content.replace(
    'Selesaikan tugas proyek yang diberikan, baik individu maupun berkelompok.',
    'Kumpulkan tugas proyek tepat waktu dan tingkatkan kemampuan praktikal Anda.'
  );

  // Student Quizzes
  content = content.replace(
    'Uji pengetahuan Anda dan kumpulkan XP! Jangan lupa, ada timer untuk beberapa kuis.',
    'Uji pemahaman Anda melalui kuis interaktif dan raih skor tertinggi.'
  );
  
  // Dashboard Hero
  content = content.replace(
    'Lanjutkan perjalanan belajarmu, selesaikan misi, dan jadilah yang terbaik di GeoLearning!',
    'Lanjutkan eksplorasi materi dan capai target belajar Anda hari ini.'
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Updated ' + file);
});
