/**
 * Level & XP Utilities — GeoLearning Frontend
 *
 * Mirrors the quadratic formula from the backend:
 *   level = floor(sqrt(xp / 100)) + 1
 *
 * XP checkpoints:
 *   Level 1  →    0 XP
 *   Level 2  →  100 XP
 *   Level 5  → 1600 XP
 *   Level 10 → 8100 XP
 */

export const MAX_LEVEL = 100

/** Calculates the level for a given XP amount (1 – MAX_LEVEL). */
export function calculateLevel(xp: number): number {
  if (xp < 0) return 1
  const level = Math.floor(Math.sqrt(xp / 100)) + 1
  return Math.min(level, MAX_LEVEL)
}

/** Total XP required to reach a given level. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.pow(level - 1, 2) * 100
}

/** XP still needed to reach the next level. */
export function xpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp)
  if (currentLevel >= MAX_LEVEL) return 0
  return xpForLevel(currentLevel + 1) - currentXp
}

/**
 * XP progress within the current level as a 0–100 percentage.
 * Used to render progress bars.
 */
export function levelProgressPercent(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp)
  if (currentLevel >= MAX_LEVEL) return 100
  const levelStartXp = xpForLevel(currentLevel)
  const levelEndXp = xpForLevel(currentLevel + 1)
  const progress = (currentXp - levelStartXp) / (levelEndXp - levelStartXp)
  return Math.round(progress * 100)
}

/** Formatted level label e.g. "Lv. 12" */
export function levelLabel(xp: number): string {
  return `Lv. ${calculateLevel(xp)}`
}

/** XP needed for the next level, for display e.g. "340 / 500 XP" */
export function xpProgressLabel(currentXp: number): string {
  const level = calculateLevel(currentXp)
  if (level >= MAX_LEVEL) return `${currentXp} XP (MAX)`
  const start = xpForLevel(level)
  const end = xpForLevel(level + 1)
  return `${currentXp - start} / ${end - start} XP`
}
