-- ============================================================
-- QUIZ FEATURE: RLS + Schema Fix
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── 1. Make module_id nullable on quizzes (allow standalone quizzes) ────────
ALTER TABLE quizzes ALTER COLUMN module_id DROP NOT NULL;

-- Add class_id column to quizzes for standalone quizzes
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS class_id TEXT REFERENCES classes(id) ON DELETE CASCADE;

-- Add updated_at default
ALTER TABLE quizzes ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE questions ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE quiz_attempts ALTER COLUMN started_at SET DEFAULT now();

-- ─── 2. RLS on quizzes ────────────────────────────────────────────────────────
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated can insert quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated can update quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated can delete quizzes" ON quizzes;

CREATE POLICY "Authenticated can view quizzes"
  ON quizzes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert quizzes"
  ON quizzes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update quizzes"
  ON quizzes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete quizzes"
  ON quizzes FOR DELETE TO authenticated USING (true);

-- ─── 3. RLS on questions ─────────────────────────────────────────────────────
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can manage questions" ON questions;

CREATE POLICY "Authenticated can manage questions"
  ON questions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─── 4. RLS on quiz_attempts ─────────────────────────────────────────────────
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can insert own attempt" ON quiz_attempts;
DROP POLICY IF EXISTS "Students can update own attempt" ON quiz_attempts;
DROP POLICY IF EXISTS "Students can view attempts" ON quiz_attempts;

CREATE POLICY "Students can insert own attempt"
  ON quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Students can update own attempt"
  ON quiz_attempts FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Students can view attempts"
  ON quiz_attempts FOR SELECT TO authenticated
  USING (true);

-- ─── 5. Verify ───────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('quizzes', 'questions', 'quiz_attempts')
ORDER BY tablename, policyname;
