-- ============================================================
-- Setup: Storage Bucket + RLS for Modules & Materials
-- ============================================================

-- ─── 1. Create public storage bucket for class materials ──────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'class-materials',
  'class-materials',
  true,
  104857600,
  ARRAY[
    'application/pdf',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 'video/x-msvideo',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 104857600;

-- ─── 2. Storage policies ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated can upload class materials" ON storage.objects;
DROP POLICY IF EXISTS "Public can read class materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete class materials" ON storage.objects;

CREATE POLICY "Authenticated can upload class materials"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'class-materials');

CREATE POLICY "Public can read class materials"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'class-materials');

CREATE POLICY "Authenticated can delete class materials"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'class-materials');

-- ─── 3. Fix materials table DB-level defaults ─────────────────────────────────
ALTER TABLE materials ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE materials ALTER COLUMN updated_at SET DEFAULT now();

-- ─── 4. RLS for modules ───────────────────────────────────────────────────────
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view modules" ON modules;
DROP POLICY IF EXISTS "Teachers can insert modules" ON modules;
DROP POLICY IF EXISTS "Teachers can update modules" ON modules;
DROP POLICY IF EXISTS "Teachers can delete modules" ON modules;

CREATE POLICY "Authenticated can view modules"
  ON modules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can insert modules"
  ON modules FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM classes WHERE id = class_id AND teacher_id = auth.uid()::text)
  );

CREATE POLICY "Teachers can update modules"
  ON modules FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM classes WHERE id = class_id AND teacher_id = auth.uid()::text)
  );

CREATE POLICY "Teachers can delete modules"
  ON modules FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM classes WHERE id = class_id AND teacher_id = auth.uid()::text)
  );

-- ─── 5. RLS for materials ─────────────────────────────────────────────────────
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view materials" ON materials;
DROP POLICY IF EXISTS "Teachers can insert materials" ON materials;
DROP POLICY IF EXISTS "Teachers can update materials" ON materials;
DROP POLICY IF EXISTS "Teachers can delete materials" ON materials;

CREATE POLICY "Authenticated can view materials"
  ON materials FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can insert materials"
  ON materials FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN classes c ON c.id = m.class_id
      WHERE m.id = module_id AND c.teacher_id = auth.uid()::text
    )
  );

CREATE POLICY "Teachers can update materials"
  ON materials FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN classes c ON c.id = m.class_id
      WHERE m.id = module_id AND c.teacher_id = auth.uid()::text
    )
  );

CREATE POLICY "Teachers can delete materials"
  ON materials FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN classes c ON c.id = m.class_id
      WHERE m.id = module_id AND c.teacher_id = auth.uid()::text
    )
  );
