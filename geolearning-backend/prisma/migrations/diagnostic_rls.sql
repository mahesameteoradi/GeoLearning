-- ============================================================
-- DIAGNOSTIC: Cek semua policy yang ada di tabel classes & users
-- Jalankan di Supabase SQL Editor untuk melihat state RLS
-- ============================================================

-- 1. Cek semua policy aktif di tabel classes
SELECT 
  policyname, 
  cmd, 
  permissive,
  qual AS using_expr,
  with_check
FROM pg_policies 
WHERE tablename = 'classes'
ORDER BY cmd;

-- 2. Cek apakah kolom join_code punya DEFAULT di database level
SELECT 
  column_name, 
  column_default, 
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'classes' 
ORDER BY ordinal_position;

-- 3. Cek semua policy di tabel users
SELECT 
  policyname, 
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd;

-- 4. Test manual: insert kelas dengan service role (bypass RLS)
-- Uncomment baris di bawah untuk test (akan berhasil jika masalah adalah RLS):
-- INSERT INTO classes (name, description, teacher_id, join_code)
-- VALUES ('TEST', null, 'your-teacher-uuid-here', 'TESTCODE')
-- RETURNING *;
