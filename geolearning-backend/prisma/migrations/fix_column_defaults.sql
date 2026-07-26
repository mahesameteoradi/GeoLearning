-- ============================================================
-- CRITICAL FIX: Add DB-level defaults for ALL tables
-- Prisma's @default(uuid()) and @updatedAt only work via ORM
-- Direct Supabase client inserts need these defaults at DB level
-- ============================================================

-- ─── classes ──────────────────────────────────────────────────────────────────
ALTER TABLE classes ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE classes ALTER COLUMN updated_at SET DEFAULT now();

-- ─── users ────────────────────────────────────────────────────────────────────
-- (users.id may already have uuid default from Supabase auth, but set explicitly)
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT now();

-- ─── modules ──────────────────────────────────────────────────────────────────
ALTER TABLE modules ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE modules ALTER COLUMN updated_at SET DEFAULT now();

-- ─── forum_posts ──────────────────────────────────────────────────────────────
ALTER TABLE forum_posts ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE forum_posts ALTER COLUMN updated_at SET DEFAULT now();

-- ─── forum_replies ────────────────────────────────────────────────────────────
ALTER TABLE forum_replies ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE forum_replies ALTER COLUMN updated_at SET DEFAULT now();

-- ─── quiz_attempts ────────────────────────────────────────────────────────────
ALTER TABLE quiz_attempts ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- ─── Create class_students table if missing ───────────────────────────────────
CREATE TABLE IF NOT EXISTS class_students (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  class_id   TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view enrollments" ON class_students;
DROP POLICY IF EXISTS "Students can enroll themselves" ON class_students;
DROP POLICY IF EXISTS "Students can leave classes" ON class_students;

CREATE POLICY "Authenticated can view enrollments"
  ON class_students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can enroll themselves"
  ON class_students FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = student_id);

CREATE POLICY "Students can leave classes"
  ON class_students FOR DELETE
  TO authenticated
  USING (auth.uid()::text = student_id);
