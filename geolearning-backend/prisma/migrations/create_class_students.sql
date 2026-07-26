-- Migration: Create class_students enrollment table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS class_students (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- Enable RLS
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- Students can see their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON class_students FOR SELECT
  USING (auth.uid() = student_id);

-- Teachers can see enrollments for their classes
CREATE POLICY "Teachers can view class enrollments"
  ON class_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_students.class_id
        AND classes.teacher_id = auth.uid()
    )
  );

-- Students can enroll themselves
CREATE POLICY "Students can enroll themselves"
  ON class_students FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can leave (delete) their own enrollment
CREATE POLICY "Students can leave classes"
  ON class_students FOR DELETE
  USING (auth.uid() = student_id);

-- Also fix forum_posts RLS to allow teachers to insert
-- (If RLS is blocking, run this)
-- Check existing policies first:
-- SELECT * FROM pg_policies WHERE tablename = 'forum_posts';
