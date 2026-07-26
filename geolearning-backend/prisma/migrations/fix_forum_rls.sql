-- ============================================================
-- Forum System Fix: 
--   1. Make class_id nullable on forum_posts (global posts)
--   2. Add DB-level defaults (id, updated_at)
--   3. Enable RLS for forum_posts & forum_replies
--   4. Add proper policies
-- ============================================================

-- ─── 1. Make class_id NULLABLE ───────────────────────────────────────────────
-- Drop existing FK constraint first, re-add as nullable
ALTER TABLE forum_posts ALTER COLUMN class_id DROP NOT NULL;

-- ─── 2. DB-level defaults ─────────────────────────────────────────────────────
ALTER TABLE forum_posts ALTER COLUMN id         SET DEFAULT gen_random_uuid()::text;
ALTER TABLE forum_posts ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE forum_replies ALTER COLUMN id         SET DEFAULT gen_random_uuid()::text;
ALTER TABLE forum_replies ALTER COLUMN updated_at SET DEFAULT now();

-- ─── 3. RLS: forum_posts ──────────────────────────────────────────────────────
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Teachers can create forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON forum_posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON forum_posts;

-- All authenticated users can view posts for classes they belong to or global posts
CREATE POLICY "Authenticated can view forum posts"
  ON forum_posts FOR SELECT TO authenticated
  USING (
    class_id IS NULL  -- global post → visible to all
    OR EXISTS (
      SELECT 1 FROM class_students
      WHERE class_id = forum_posts.class_id
        AND student_id = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM classes
      WHERE id = forum_posts.class_id
        AND teacher_id = auth.uid()::text
    )
  );

-- Teachers can create posts (for their own classes or global)
CREATE POLICY "Teachers can create forum posts"
  ON forum_posts FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()::text
    AND (
      class_id IS NULL  -- global
      OR EXISTS (
        SELECT 1 FROM classes
        WHERE id = class_id AND teacher_id = auth.uid()::text
      )
    )
  );

-- Authors (teacher who created) can delete their own posts
CREATE POLICY "Authors can delete own posts"
  ON forum_posts FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- Authors can update (pin/unpin) their own posts
CREATE POLICY "Authors can update own posts"
  ON forum_posts FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text);

-- ─── 4. RLS: forum_replies ───────────────────────────────────────────────────
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view replies" ON forum_replies;
DROP POLICY IF EXISTS "Enrolled users can reply" ON forum_replies;
DROP POLICY IF EXISTS "Authors can delete own replies" ON forum_replies;

-- Anyone who can see the post can see its replies
CREATE POLICY "Authenticated can view replies"
  ON forum_replies FOR SELECT TO authenticated
  USING (true);

-- Enrolled students and teachers can reply
CREATE POLICY "Enrolled users can reply"
  ON forum_replies FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM forum_posts fp
      WHERE fp.id = post_id
        AND (
          fp.class_id IS NULL   -- global post: anyone can reply
          OR EXISTS (
            SELECT 1 FROM class_students
            WHERE class_id = fp.class_id AND student_id = auth.uid()::text
          )
          OR EXISTS (
            SELECT 1 FROM classes
            WHERE id = fp.class_id AND teacher_id = auth.uid()::text
          )
        )
    )
  );

-- Authors can delete own replies
CREATE POLICY "Authors can delete own replies"
  ON forum_replies FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);
