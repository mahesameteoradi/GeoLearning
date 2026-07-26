-- ============================================================
-- Chat Messages Table for Instagram DM-style Forum
-- ============================================================

-- 1. Create the chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     TEXT NOT NULL,  -- 'global' or class_id
  user_id     TEXT NOT NULL,
  body        TEXT NOT NULL,
  reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Index for fast room queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id, created_at DESC);

-- 3. Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop old policies if re-running
DROP POLICY IF EXISTS "Authenticated users can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authors can delete own messages" ON chat_messages;

-- 5. SELECT: Authenticated users can see messages from rooms they belong to
CREATE POLICY "Authenticated users can view chat messages"
  ON chat_messages FOR SELECT TO authenticated
  USING (
    -- Global room: all authenticated users
    room_id = 'global'
    -- Class room: student enrolled OR teacher of the class
    OR EXISTS (
      SELECT 1 FROM class_students
      WHERE class_id = chat_messages.room_id
        AND student_id = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM classes
      WHERE id = chat_messages.room_id
        AND teacher_id = auth.uid()::text
    )
  );

-- 6. INSERT: Authenticated users can send messages to rooms they belong to
CREATE POLICY "Authenticated users can send chat messages"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()::text
    AND (
      room_id = 'global'
      OR EXISTS (
        SELECT 1 FROM class_students
        WHERE class_id = chat_messages.room_id
          AND student_id = auth.uid()::text
      )
      OR EXISTS (
        SELECT 1 FROM classes
        WHERE id = chat_messages.room_id
          AND teacher_id = auth.uid()::text
      )
    )
  );

-- 7. DELETE: Authors can delete their own messages
CREATE POLICY "Authors can delete own messages"
  ON chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- 8. Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

SELECT 'chat_messages table created and configured!' AS status;
