CREATE OR REPLACE FUNCTION update_user_xp_on_material_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Tambahkan 50 XP (atau jumlah yang Anda inginkan) untuk setiap materi yang selesai
  UPDATE users SET xp = xp + 50 WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_user_xp_material ON material_completions;

CREATE TRIGGER tr_update_user_xp_material
  AFTER INSERT ON material_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_xp_on_material_completion();
