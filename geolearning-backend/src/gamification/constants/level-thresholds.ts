/**
 * Level Thresholds — Quadratic XP Progression Curve
 *
 * Formula: level = floor(xp / 100)
 *
 * XP checkpoints:
 *   Level 0  →    0 XP
 *   Level 1  →  100 XP
 *   Level 2  →  200 XP
 *   Level 5  →  500 XP
 *   Level 10 → 1000 XP
 *   Level 20 → 2000 XP
 *
 */

/** Maximum level cap */
export const MAX_LEVEL = 100;

/**
 * Calculates the level for a given XP amount.
 * Always returns a value between 1 and MAX_LEVEL.
 */
export function calculateLevel(xp: number): number {
  if (xp <= 0) return 0;
  const level = Math.floor(xp / 100);
  return Math.min(level, MAX_LEVEL);
}

/**
 * Returns the total XP required to reach a given level.
 * e.g. xpForLevel(5) = (5-1)^2 * 100 = 1600
 */
export function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  return level * 100;
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
