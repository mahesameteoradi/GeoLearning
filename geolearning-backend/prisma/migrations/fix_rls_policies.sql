-- ============================================================
-- Fix RLS Policies: forum_posts & forum_replies
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Lihat semua policy yang ada dulu:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename IN ('forum_posts', 'forum_replies', 'class_students');

-- ============================================================
-- FORUM_POSTS: Pastikan teacher bisa INSERT
-- ============================================================

-- Cek apakah RLS aktif di forum_posts
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada (ignore error jika tidak ada)
DROP POLICY IF EXISTS "Allow authenticated insert forum_posts" ON forum_posts;
DROP POLICY IF EXISTS "Allow select forum_posts" ON forum_posts;
DROP POLICY IF EXISTS "Allow update own forum_posts" ON forum_posts;
DROP POLICY IF EXISTS "Allow delete own forum_posts" ON forum_posts;

-- Semua user authenticated bisa baca post
CREATE POLICY "Allow select forum_posts"
  ON forum_posts FOR SELECT
  TO authenticated
  USING (true);

-- User authenticated bisa insert post milik sendiri
CREATE POLICY "Allow authenticated insert forum_posts"
  ON forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User bisa update/delete post sendiri
CREATE POLICY "Allow update own forum_posts"
  ON forum_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow delete own forum_posts"
  ON forum_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- FORUM_REPLIES: Pastikan semua user bisa INSERT balasan
-- ============================================================

ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated insert forum_replies" ON forum_replies;
DROP POLICY IF EXISTS "Allow select forum_replies" ON forum_replies;
DROP POLICY IF EXISTS "Allow delete own forum_replies" ON forum_replies;

CREATE POLICY "Allow select forum_replies"
  ON forum_replies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert forum_replies"
  ON forum_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow delete own forum_replies"
  ON forum_replies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- CLASS_STUDENTS: Enrollment policies
-- ============================================================

CREATE TABLE IF NOT EXISTS class_students (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own enrollments" ON class_students;
DROP POLICY IF EXISTS "Teachers can view class enrollments" ON class_students;
DROP POLICY IF EXISTS "Students can enroll themselves" ON class_students;
DROP POLICY IF EXISTS "Students can leave classes" ON class_students;

-- Semua authenticated bisa baca (untuk count siswa)
CREATE POLICY "Authenticated can view enrollments"
  ON class_students FOR SELECT
  TO authenticated
  USING (true);

-- Siswa bisa enroll diri sendiri
CREATE POLICY "Students can enroll themselves"
  ON class_students FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Siswa bisa keluar dari kelas sendiri
CREATE POLICY "Students can leave classes"
  ON class_students FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);
