# GeoLearning 🌍

GeoLearning adalah platform Media Pembelajaran Geografi Interaktif berbasis Web yang mengintegrasikan sistem **Gamifikasi** (XP, Level, Lencana/Badge, dan Papan Peringkat) untuk meningkatkan motivasi belajar siswa.

---

## 📚 Panduan Penggunaan (User Manual)

Platform ini memiliki dua peran utama: **Guru (Teacher)** dan **Siswa (Student)**. 

### 1. Akses & Autentikasi
*   **Login:** Buka halaman utama aplikasi. Masukkan alamat email dan kata sandi yang telah didaftarkan.
*   **Lupa Sandi:** Jika Anda lupa kata sandi, klik tautan "Lupa kata sandi?" di halaman Login. Tautan pemulihan akan dikirimkan ke email Anda.
*   **Pengaturan Profil:** Setelah login, Anda dapat mengubah foto profil, menyesuaikan biodata, dan mengganti kata sandi di menu **Profil**.

---

### 2. Panduan Untuk Guru 👨‍🏫

Guru memiliki akses penuh untuk merancang pengalaman belajar dan mengawasi progres siswa.

*   **Dasbor Utama:** Menampilkan ringkasan statistik (total siswa, kelas aktif, dan kuis) serta pintasan cepat.
*   **Manajemen Kelas:** 
    *   Masuk ke menu **Kelas** untuk membuat kelas baru. Setiap kelas memiliki kode unik (Join Code) yang dapat dibagikan ke siswa.
    *   Di dalam kelas, Anda dapat membuat **Modul** yang berisikan materi pembelajaran (Teks, Video, PDF, dll).
*   **Kuis & Evaluasi:** 
    *   Buat kuis pilihan ganda atau peta interaktif melalui menu **Kuis**.
    *   Anda dapat melihat detail pengerjaan, nilai, serta XP yang didapat siswa.
    *   Klik **Ekspor CSV** untuk mengunduh laporan nilai seluruh siswa dalam format Excel/CSV.
*   **Penugasan Proyek:** 
    *   Buat tugas/proyek individu maupun kelompok.
    *   Ketika Anda memberikan nilai pada tugas yang dikumpulkan, siswa akan **otomatis mendapatkan notifikasi dan tambahan XP**. Fitur **Ekspor CSV** juga tersedia di sini.
*   **Analitik & Intervensi:**
    *   Pantau keaktifan siswa di menu **Analitik**.
    *   Anda dapat memberikan catatan evaluasi atau intervensi langsung kepada siswa tertentu.

---

### 3. Panduan Untuk Siswa 🎓

Siswa akan diajak belajar selayaknya bermain *game*.

*   **Bergabung ke Kelas:** Masuk ke menu **Kelas Saya** dan masukkan *Join Code* yang diberikan oleh guru.
*   **Belajar & Eksplorasi:** Baca materi dan tonton video yang telah diunggah guru. Penyelesaian materi akan mencatat progres Anda.
*   **Mengerjakan Kuis & Proyek:** 
    *   Kerjakan kuis tepat waktu untuk mendapatkan **Poin dan XP**.
    *   Kumpulkan tugas proyek tepat waktu. Saat guru menilai tugas Anda, sebuah pop-up notifikasi akan muncul secara *real-time* di layar Anda.
*   **Gamifikasi & Penghargaan:**
    *   **XP & Level:** Kumpulkan XP dari setiap aktivitas untuk naik level!
    *   **Lencana (Badges):** Selesaikan tantangan (misalnya: skor sempurna, belajar berturut-turut) untuk membuka *Badge* unik yang bisa dipamerkan di profil Anda.
    *   **Papan Peringkat (Leaderboard):** Bersainglah secara sehat dengan teman-teman sekelas untuk meraih posisi puncak di *Leaderboard*!

---

## 🛠️ Stack Teknologi
*   **Frontend:** Next.js (React), TailwindCSS, Framer Motion
*   **Backend & Database:** NestJS, Supabase (PostgreSQL), Prisma ORM
*   **Fitur Real-time:** Supabase WebSockets (Postgres Changes)

---

## 🚀 Instalasi Lokal (Developer)

Jika Anda ingin menjalankan proyek ini secara lokal:

1. Clone repositori ini.
2. Jalankan `npm install` pada folder *frontend* dan *backend*.
3. Pastikan Anda memiliki kredensial `.env` yang terhubung ke proyek Supabase Anda.
4. Jalankan backend: `npm run start:dev` (di folder backend)
5. Jalankan frontend: `npm run dev` (di folder frontend)
6. Buka `http://localhost:3000` di peramban Anda.
