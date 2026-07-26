/**
 * Level Thresholds — Quadratic XP Progression Curve
 *
 * Formula: level = floor(sqrt(xp / 100)) + 1
 *
 * XP checkpoints:
 *   Level 1  →    0 XP
 *   Level 2  →  100 XP  (needs 100 more)
 *   Level 3  →  400 XP  (needs 300 more)
 *   Level 5  → 1600 XP  (needs 900 more)
 *   Level 10 → 8100 XP  (needs 2700 more)
 *   Level 20 → 36100 XP
 *
 * Each level requires progressively more XP — rewards sustained engagement.
 */

/** Maximum level cap */
export const MAX_LEVEL = 100;

/**
 * Calculates the level for a given XP amount.
 * Always returns a value between 1 and MAX_LEVEL.
 */
export function calculateLevel(xp: number): number {
  if (xp < 0) return 1;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  return Math.min(level, MAX_LEVEL);
}

/**
 * Returns the total XP required to reach a given level.
 * e.g. xpForLevel(5) = (5-1)^2 * 100 = 1600
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 100;
}

/**
 * Returns how much XP the user still needs to reach the next level.
 */
export function xpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  if (currentLevel >= MAX_LEVEL) return 0;
  return xpForLevel(currentLevel + 1) - currentXp;
}

/**
 * Returns XP progress within the current level as a 0–100 percentage.
 * Useful for rendering progress bars on the frontend.
 */
export function levelProgressPercent(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  if (currentLevel >= MAX_LEVEL) return 100;
  const levelStartXp = xpForLevel(currentLevel);
  const levelEndXp = xpForLevel(currentLevel + 1);
  const progress = (currentXp - levelStartXp) / (levelEndXp - levelStartXp);
  return Math.round(progress * 100);
}
