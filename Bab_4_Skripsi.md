### 4.1.2 Hasil Tahap Perancangan (*Design Phase Results*)

**A. Perancangan Arsitektur Aplikasi (*Application Architecture Design*)**
Pengembangan sistem *e-learning* berbasis gamifikasi ini menggunakan arsitektur *client-server* modern yang memisahkan antara bagian antarmuka (*frontend*) dan bagian logika server (*backend*). 
1. **Frontend (Antarmuka Pengguna):** Dibangun menggunakan kerangka kerja **Next.js** (berbasis React) yang mendukung *Server-Side Rendering* (SSR) untuk performa yang optimal. Antarmuka penunjang pengalaman pengguna dikembangkan dengan pustaka **Tailwind CSS** untuk *styling*, **Framer Motion** untuk animasi mikro yang interaktif, dan **Leaflet** untuk fitur pemetaan interaktif.
2. **Backend (Logika Server):** Menggunakan **NestJS**, sebuah kerangka kerja Node.js yang berarsitektur *modular*, untuk menangani *Application Programming Interface* (API) yang kuat dan terukur.
3. **Database dan Autentikasi:** Menggunakan **PostgreSQL** sebagai basis data relasional utama yang dikelola melalui **Prisma ORM** (*Object-Relational Mapping*). Sistem autentikasi pengguna dan manajemen sesi diintegrasikan dengan **Supabase**, yang memberikan tingkat keamanan standar industri.
4. **Gamification Engine:** Logika gamifikasi (seperti perhitungan *Experience Points* (XP), kenaikan *Level*, *Badge*, dan perhitungan *Streak*) dikelola secara dinamis di sisi *backend* yang dihubungkan langsung ke *dashboard* siswa di *frontend*.

**B. Perancangan Basis Data (*Database Design*)**
Meskipun arsitektur pada awalnya mempertimbangkan berbagai jenis basis data, sistem ini pada akhirnya mengimplementasikan **PostgreSQL** (melalui Supabase) karena kebutuhan relasi data yang kompleks antara pengguna, kelas, dan elemen gamifikasi. Berikut adalah rancangan tabel utama (skema) dalam basis data:

| Nama Tabel | Deskripsi dan Fungsi Utama |
| :--- | :--- |
| `users` | Menyimpan entitas pengguna (Siswa, Guru, Admin) beserta data autentikasi. Tabel ini juga menyimpan atribut gamifikasi individu seperti total `xp`, `level`, `current_streak`, dan `equipped_badge_id`. |
| `classes` & `class_students` | Mengelola data kelas yang dibuat oleh guru (`classes`) dan relasi *many-to-many* siswa yang terdaftar di kelas tersebut (`class_students`). |
| `modules` & `materials` | Menyimpan hierarki materi pembelajaran. `modules` merepresentasikan bab/topik materi, sedangkan `materials` berisi konten spesifik (Teks, PDF, Video, Peta Interaktif). |
| `quizzes`, `questions`, & `quiz_attempts`| Struktur tabel untuk sistem evaluasi. Menyimpan data kuis, butir soal beserta pilihan jawaban, dan rekaman percobaan kuis siswa (`quiz_attempts`) yang menghasilkan XP berdasarkan nilai (*score*). |
| `badges` & `user_badges` | `badges` menyimpan master data lencana prestasi, sementara `user_badges` adalah tabel relasi untuk mencatat lencana apa saja yang telah berhasil diraih oleh seorang siswa beserta waktu pencapaiannya. |
| `xp_logs` | Tabel riwayat transaksi yang mencatat setiap penambahan XP siswa beserta sumber penambahannya (contoh: penyelesaian kuis, penyerahan proyek, atau pencapaian *badge*). |
| `interventions` | Menyimpan catatan intervensi atau bimbingan khusus dari guru kepada siswa tertentu berdasarkan performa atau perilaku akademik mereka. |

**C. Hasil Perancangan Antarmuka dan Pengalaman Pengguna (*UI/UX Design Results*)**
Rancangan antarmuka pengguna difokuskan pada kemudahan penggunaan (*usability*) dan peningkatan motivasi belajar melalui visualisasi elemen gamifikasi. Berikut adalah tabel hasil perancangan halaman utama aplikasi:

| Nama Halaman | Mockup/Tampilan Layar | Deskripsi Halaman |
| :--- | :--- | :--- |
| **Landing Page** | *[Masukkan Gambar Mockup Landing Page di sini]* | Halaman utama publik yang berisi informasi umum aplikasi, fitur unggulan, dan tombol navigasi menuju halaman registrasi/login. |
| **Halaman Autentikasi** | *[Masukkan Gambar Mockup Login/Register di sini]* | Layar untuk masuk (*Login*) dan mendaftar (*Register*) yang diintegrasikan dengan sistem autentikasi Supabase. |
| **Student Dashboard** | *[Masukkan Gambar Mockup Dashboard Siswa di sini]* | Dasbor interaktif khusus siswa. Menampilkan ringkasan progres belajar, progres *level* (XP *Bar*), daftar *badge* yang dimiliki, status *streak* harian, serta daftar kelas yang diikuti. |
| **Class & Module Page** | *[Masukkan Gambar Mockup Halaman Kelas di sini]* | Menampilkan daftar modul, materi belajar (PDF, Video, Peta Interaktif), penugasan proyek, dan kuis yang harus diselesaikan oleh siswa di dalam suatu kelas. |
| **Quiz & Evaluation** | *[Masukkan Gambar Mockup Halaman Kuis di sini]* | Antarmuka interaktif bagi siswa untuk menjawab soal pilihan ganda atau pemetaan (*map pinpoint*). Halaman ini dirancang bebas gangguan (*distraction-free*) dengan pengatur waktu (*timer*). |
| **Teacher Dashboard** | *[Masukkan Gambar Mockup Dashboard Guru di sini]* | Dasbor manajemen untuk guru. Digunakan untuk membuat kelas baru, memantau *leaderboard* siswa, mengelola modul materi, serta mencatat intervensi akademik bagi siswa yang membutuhkan bantuan. |
| **Admin Dashboard** | *[Masukkan Gambar Mockup Dashboard Admin di sini]* | Halaman khusus bagi administrator untuk mengelola *invitation codes* bagi pendaftaran guru, serta melakukan manajemen pengguna secara menyeluruh. |

**D. Validasi Tahap Perancangan (*Design Phase Validation*)**
Seluruh hasil rancangan arsitektur, basis data, dan desain antarmuka pengguna (UI/UX) pada tahap ini telah divalidasi dan disetujui oleh dosen pembimbing serta pakar rekayasa perangkat lunak sebelum proses implementasi (pengodean) dimulai. Validasi ini memastikan bahwa rancangan telah memenuhi seluruh spesifikasi kebutuhan fungsional dan non-fungsional dari sistem *e-learning* yang dikembangkan.

---

### 4.1.3 Hasil Tahap Pengembangan (*Development Phase Results*)

**A. Implementasi Tumpukan Teknologi (*Technology Stack Implementation*)**
Pada tahap ini, desain yang telah divalidasi diimplementasikan menggunakan serangkaian perangkat lunak dan teknologi ( *technology stack*) modern. Rincian teknologi yang digunakan diuraikan pada tabel berikut:

| Kategori | Nama Perangkat Lunak / Teknologi | Fungsi dalam Sistem |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (React.js) & TypeScript | Kerangka kerja utama untuk membangun antarmuka web yang interaktif, *routing* halaman, dan performa tinggi. |
| **CSS & Styling** | Tailwind CSS | Pustaka CSS berbasis utilitas untuk mempercepat penyusunan desain antarmuka yang responsif. |
| **Backend Framework** | NestJS & TypeScript | Membangun *RESTful API*, mengelola logika *server*, keamanan rute, dan layanan arsitektur *backend*. |
| **Database Management**| PostgreSQL (via Supabase) | Sistem manajemen basis data relasional (RDBMS) utama untuk menyimpan seluruh data aplikasi. |
| **ORM & Database Tool**| Prisma ORM | Memetakan objek kode ke dalam struktur tabel basis data serta melakukan migrasi skema secara aman. |
| **Authentication** | Supabase Auth | Menangani keamanan sesi pengguna (JWT), proses login, register, dan proteksi akses halaman (Otorisasi). |
| **Interactive Assets** | Framer Motion & Leaflet | Menyediakan fitur *micro-animations* yang halus (Framer Motion) dan visualisasi peta interaktif (Leaflet) untuk materi geografi. |

**B. Aset Visual (*Assets*)**
Pengembangan aset visual dalam aplikasi ini berfokus pada penciptaan elemen yang mendukung unsur gamifikasi untuk menarik perhatian siswa. Aset yang dibuat meliputi ikon lencana prestasi (*badges*) yang melambangkan pencapaian tertentu, elemen *confetti* untuk merayakan keberhasilan (seperti saat naik level atau menyelesaikan kuis dengan nilai sempurna), serta ikonografi navigasi yang menggunakan pustaka *Lucide React*. Desain antarmuka secara keseluruhan mengadopsi gaya *glassmorphism* dan *clean design* untuk menghindari beban kognitif yang berlebih pada siswa saat belajar.

**C. Logo Aplikasi dan Palet Warna (*Application Logo and Color Palette*)**
Antarmuka aplikasi dirancang menggunakan sistem token warna *(design tokens)* bernuansa "Educational Light Theme" yang cerah namun tetap ramah di mata. Pemilihan palet warna dirancang secara psikologis untuk mendukung lingkungan belajar yang positif dan modern:
*   **Warna Latar Utama (Slate-100 / `#F1F5F9`) dan Permukaan (White / `#FFFFFF`):** Digunakan untuk memberikan kesan bersih, luas, dan menonjolkan konten pembelajaran.
*   **Warna Primer (Royal Blue / `#2563EB`):** Digunakan pada elemen interaktif utama seperti tombol aksi dan tautan aktif. Warna biru dipilih karena melambangkan kecerdasan, ketenangan, dan profesionalisme.
*   **Warna Sekunder (Teal / `#0EA5E9`):** Digunakan untuk elemen pendukung dan *gradient text*.
*   **Warna Aksen (Amber / `#F59E0B`):** Digunakan secara khusus untuk menyoroti elemen gamifikasi seperti *Experience Points* (XP), *streak*, dan peringatan penting, guna menarik perhatian pengguna secara instan.
*   **Warna Kesuksesan (Green / `#10B981`):** Digunakan pada *XP bar fill* dan indikator keberhasilan lainnya untuk memberikan validasi positif kepada siswa atas progres mereka.
