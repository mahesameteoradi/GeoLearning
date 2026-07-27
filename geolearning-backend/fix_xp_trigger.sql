CREATE OR REPLACE FUNCTION update_user_xp_on_material_completion()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users SET xp = xp + 50 WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
