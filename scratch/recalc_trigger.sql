-- Function to recalculate user XP
CREATE OR REPLACE FUNCTION trigger_recalculate_user_xp()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id TEXT;
  quiz_xp INT := 0;
  material_xp INT := 0;
  project_xp INT := 0;
  pin_xp INT := 0;
  calculated_xp INT := 0;
  calculated_level INT := 0;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  -- quizXp (MAX xp per quiz per user)
  SELECT COALESCE(SUM(max_xp), 0) INTO quiz_xp
  FROM (
    SELECT MAX(xp_earned) as max_xp
    FROM quiz_attempts
    WHERE user_id = target_user_id AND completed_at IS NOT NULL
    GROUP BY quiz_id
  ) q;

  -- materialXp
  SELECT (COUNT(*) * 15) INTO material_xp
  FROM material_completions
  WHERE user_id = target_user_id;

  -- projectXp
  SELECT COALESCE(SUM(xp_earned), 0) INTO project_xp
  FROM project_submissions
  WHERE user_id = target_user_id;

  -- pinXp
  SELECT COALESCE(SUM(amount), 0) INTO pin_xp
  FROM xp_logs
  WHERE user_id = target_user_id AND source = 'MAP_PIN_DISCOVERY';

  calculated_xp := quiz_xp + material_xp + project_xp + pin_xp;
  calculated_level := FLOOR(calculated_xp / 100);

  UPDATE users 
  SET xp = calculated_xp, 
      level = calculated_level
  WHERE id = target_user_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
DROP TRIGGER IF EXISTS trg_recalculate_xp_quiz ON quiz_attempts;
CREATE TRIGGER trg_recalculate_xp_quiz
AFTER INSERT OR UPDATE OR DELETE ON quiz_attempts
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_user_xp();

DROP TRIGGER IF EXISTS trg_recalculate_xp_material ON material_completions;
CREATE TRIGGER trg_recalculate_xp_material
AFTER INSERT OR UPDATE OR DELETE ON material_completions
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_user_xp();

DROP TRIGGER IF EXISTS trg_recalculate_xp_project ON project_submissions;
CREATE TRIGGER trg_recalculate_xp_project
AFTER INSERT OR UPDATE OR DELETE ON project_submissions
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_user_xp();

DROP TRIGGER IF EXISTS trg_recalculate_xp_logs ON xp_logs;
CREATE TRIGGER trg_recalculate_xp_logs
AFTER INSERT OR UPDATE OR DELETE ON xp_logs
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_user_xp();
