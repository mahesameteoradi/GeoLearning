DELETE FROM user_badges;
DELETE FROM xp_logs;
UPDATE users SET xp = 0, level = 0, equipped_badge_id = null;
