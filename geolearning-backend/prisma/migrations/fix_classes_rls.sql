-- ============================================================
-- Fix Classes Table: RLS Policies + join_code Auto-Generate
-- ============================================================

-- 1. Pastikan RLS aktif di tabel classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 2. Hapus policy lama jika ada
DROP POLICY IF EXISTS "Teachers can manage own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can insert classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can delete own classes" ON classes;
DROP POLICY IF EXISTS "Authenticated can view classes" ON classes;

-- 3. Semua user authenticated bisa READ kelas (untuk join via kode)
CREATE POLICY "Authenticated can view classes"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

-- 4. Guru bisa INSERT kelas (teacher_id harus = user yang login)
--    Cast auth.uid() ke text karena kolom teacher_id bertipe text
CREATE POLICY "Teachers can insert classes"
  ON classes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = teacher_id);

-- 5. Guru hanya bisa UPDATE kelas miliknya sendiri
CREATE POLICY "Teachers can update own classes"
  ON classes FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = teacher_id)
  WITH CHECK (auth.uid()::text = teacher_id);

-- 6. Guru hanya bisa DELETE kelas miliknya sendiri
CREATE POLICY "Teachers can delete own classes"
  ON classes FOR DELETE
  TO authenticated
  USING (auth.uid()::text = teacher_id);

-- ============================================================
-- Fix join_code: default generate otomatis di database level
-- ============================================================
ALTER TABLE classes
  ALTER COLUMN join_code SET DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 8));
