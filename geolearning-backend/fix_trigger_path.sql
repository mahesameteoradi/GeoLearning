CREATE OR REPLACE FUNCTION public.update_user_xp_on_material_completion()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.users SET xp = COALESCE(xp, 0) + 50 WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
