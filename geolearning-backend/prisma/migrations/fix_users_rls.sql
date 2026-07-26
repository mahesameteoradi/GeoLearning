-- ============================================================
-- Verify & ensure classes table has no blocking constraints
-- Run in Supabase SQL Editor if insert still fails
-- ============================================================

-- Check current default on join_code
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'classes' AND column_name = 'join_code';

-- Check active RLS policies on classes
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'classes';

-- Also ensure users table is readable (needed for FK teacher name display)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view users" ON users;

CREATE POLICY "Authenticated can view users"
  ON users FOR SELECT
  TO authenticated
  USING (true);
