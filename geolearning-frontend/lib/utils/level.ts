/**
 * Level & XP Utilities — GeoLearning Frontend
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
 */

export const MAX_LEVEL = 100

/** Calculates the level for a given XP amount (1 – MAX_LEVEL). */
export function calculateLevel(xp: number): number {
  if (xp <= 0) return 0
  const level = Math.floor(xp / 100)
  return Math.min(level, MAX_LEVEL)
}

/** Total XP required to reach a given level. */
export function xpForLevel(level: number): number {
  if (level <= 0) return 0
  return level * 100
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

/** 
 * Returns a title and description for a given level (Pemaknaan Level).
 */
export function getLevelMeaning(level: number): { title: string; description: string; color: string } {
  if (level >= 20) {
    return {
      title: 'Expert (Ahli)',
      description: 'Sangat berprestasi, konsisten aktif dan menguasai banyak materi pembelajaran.',
      color: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
    }
  }
  if (level >= 10) {
    return {
      title: 'Capable (Terampil)',
      description: 'Sangat aktif, memiliki pemahaman yang baik, dan sering berpartisipasi dalam kuis.',
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    }
  }
  if (level >= 5) {
    return {
      title: 'Developing (Berkembang)',
      description: 'Mulai aktif berpartisipasi dan memahami konsep-konsep dasar dengan baik.',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    }
  }
  return {
    title: 'Novice (Pemula)',
    description: 'Sedang memulai perjalanan belajar dan mulai mengenal materi dasar.',
    color: 'text-slate-500 bg-slate-500/10 border-slate-500/20'
  }
}
