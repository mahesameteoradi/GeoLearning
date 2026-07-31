-- 1. Create the function that will revert XP and delete xp_logs
CREATE OR REPLACE FUNCTION revert_xp_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  log_record RECORD;
BEGIN
  -- Find all xp_logs associated with the deleted record
  FOR log_record IN 
    SELECT * FROM xp_logs 
    WHERE reference_id = OLD.id::text 
  LOOP
    -- Subtract XP from user (ensure it doesn't go below 0)
    UPDATE users 
    SET 
      xp = GREATEST(xp - log_record.amount, 0),
      level = FLOOR(SQRT(GREATEST(xp - log_record.amount, 0) / 100.0)) + 1
    WHERE id = log_record.user_id;

    -- Delete the xp_log entry to keep data clean
    DELETE FROM xp_logs WHERE id = log_record.id;
  END LOOP;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop existing triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS reset_xp_quiz_attempt_delete ON quiz_attempts;
DROP TRIGGER IF EXISTS reset_xp_project_submission_delete ON project_submissions;
DROP TRIGGER IF EXISTS reset_xp_material_completions_delete ON material_completions;

-- 3. Create triggers on the relevant tables
CREATE TRIGGER reset_xp_quiz_attempt_delete
BEFORE DELETE ON quiz_attempts
FOR EACH ROW EXECUTE FUNCTION revert_xp_on_delete();

CREATE TRIGGER reset_xp_project_submission_delete
BEFORE DELETE ON project_submissions
FOR EACH ROW EXECUTE FUNCTION revert_xp_on_delete();

CREATE TRIGGER reset_xp_material_completions_delete
BEFORE DELETE ON material_completions
FOR EACH ROW EXECUTE FUNCTION revert_xp_on_delete();
