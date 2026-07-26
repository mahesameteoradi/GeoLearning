-- 1. Create function to add XP to user
CREATE OR REPLACE FUNCTION update_user_xp_on_quiz_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL AND NEW.xp_earned > 0) THEN
      UPDATE users SET xp = xp + NEW.xp_earned WHERE id = NEW.user_id;
    END IF;
  ELSIF (TG_OP = 'INSERT') THEN
    IF (NEW.completed_at IS NOT NULL AND NEW.xp_earned > 0) THEN
      UPDATE users SET xp = xp + NEW.xp_earned WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS tr_update_user_xp ON quiz_attempts;
CREATE TRIGGER tr_update_user_xp
  AFTER INSERT OR UPDATE ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_xp_on_quiz_completion();

-- 3. Sync existing XP! (Important so they don't lose past progress)
UPDATE users 
SET xp = (
  SELECT COALESCE(SUM(xp_earned), 0) 
  FROM quiz_attempts 
  WHERE user_id = users.id AND completed_at IS NOT NULL
);
