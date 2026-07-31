'use client'

import React, { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { calculateLevel } from '@/lib/utils/level'

interface UserPayload {
  id: string
  xp: number
  level: number
  equipped_badge_id: string | null
  current_streak: number
}

const BADGE_NAMES: Record<string, { name: string; icon: string }> = {
  first_quiz:    { name: 'First Steps',     icon: '🎯' },
  perfect_score: { name: 'Perfectionist',   icon: '💯' },
  xp_100:        { name: 'Getting Started', icon: '⭐' },
  xp_500:        { name: 'Rising Star',     icon: '🌟' },
  xp_1000:       { name: 'XP Machine',      icon: '💫' },
  xp_5000:       { name: 'Veteran',         icon: '🔮' },
  level_5:       { name: 'Apprentice',      icon: '🔥' },
  level_10:      { name: 'Scholar',         icon: '📚' },
  level_20:      { name: 'Expert',          icon: '🏆' },
  level_50:      { name: 'Master',          icon: '👑' },
  streak_3:      { name: 'On a Roll',       icon: '🔥' },
  streak_7:      { name: 'Week Warrior',    icon: '⚡' },
  streak_30:     { name: 'Unstoppable',     icon: '🌈' },
  top_10:        { name: 'Elite',           icon: '🥇' },
}

/** Lightweight toast: no heavy shadow, solid border only */
function XpToast({ xpDelta, newLevel }: { xpDelta: number; newLevel: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-[#1A1A2E] px-4 py-3 animate-pop-in">
      <span className="text-xl leading-none">⚡</span>
      <div>
        <p className="text-sm font-bold text-amber-400">+{xpDelta} XP</p>
        <p className="text-xs text-slate-400">Level {newLevel}</p>
      </div>
    </div>
  )
}

function LevelUpToast({ newLevel }: { newLevel: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-[#1A1A2E] px-4 py-3 animate-pop-in">
      <span className="text-2xl leading-none">🎉</span>
      <div>
        <p className="text-sm font-extrabold text-cyan-400">Level Up! → {newLevel}</p>
        <p className="text-xs text-slate-400">Milestone tercapai!</p>
      </div>
    </div>
  )
}

function BadgeToast({ icon, name }: { icon: string; name: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-[#1A1A2E] px-4 py-3 animate-pop-in">
      <span className="text-2xl leading-none">{icon}</span>
      <div>
        <p className="text-sm font-bold text-amber-300">Badge Unlocked!</p>
        <p className="text-xs text-slate-400">{name}</p>
      </div>
    </div>
  )
}

function NotificationToast({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-[#1A1A2E] px-4 py-3 animate-pop-in">
      <span className="text-xl leading-none">🔔</span>
      <div>
        <p className="text-sm font-bold text-blue-400">Pemberitahuan Baru</p>
        <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{message}</p>
      </div>
    </div>
  )
}

/**
 * useGamificationRealtime
 *
 * Single Supabase channel for both user XP/level updates and badge inserts.
 * XP toasts are debounced (1.5s) to avoid rapid spam.
 */
export function useGamificationRealtime(userId: string | null) {
  const prevXpRef = useRef<number | null>(null)
  const prevLevelRef = useRef<number | null>(null)
  const prevBadgesRef = useRef<Set<string>>(new Set())
  const xpDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingXpRef = useRef<number>(0)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`gamification:${userId}`)

      // ── User XP/level updates ─────────────────────────────────────────────
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newUser = payload.new as UserPayload
          const oldXp = prevXpRef.current ?? newUser.xp
          const oldLevel = prevLevelRef.current ?? calculateLevel(newUser.xp)
          const newLevel = calculateLevel(newUser.xp)
          const xpDelta = newUser.xp - oldXp

          if (xpDelta > 0) {
            pendingXpRef.current += xpDelta
            if (xpDebounceRef.current) clearTimeout(xpDebounceRef.current)
            xpDebounceRef.current = setTimeout(() => {
              const total = pendingXpRef.current
              pendingXpRef.current = 0
              toast.custom(() => <XpToast xpDelta={total} newLevel={newLevel} />, { duration: 3000 })
            }, 1500)
          }

          if (newLevel > oldLevel) {
            toast.custom(() => <LevelUpToast newLevel={newLevel} />, { duration: 5000 })
          }

          prevXpRef.current = newUser.xp
          prevLevelRef.current = newLevel
        }
      )

      // ── New badge inserts ─────────────────────────────────────────────────
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const badgeId = (payload.new as { badge_id: string }).badge_id
          if (prevBadgesRef.current.has(badgeId)) return
          prevBadgesRef.current.add(badgeId)

          const badge = BADGE_NAMES[badgeId]
          const icon = badge?.icon ?? '🏅'
          const name = badge?.name ?? badgeId

          toast.custom(() => <BadgeToast icon={icon} name={name} />, { duration: 5000 })
        }
      )

      // ── New notifications ─────────────────────────────────────────────────
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const message = (payload.new as { message: string }).message
          if (message) {
            toast.custom(() => <NotificationToast message={message} />, { duration: 6000 })
          }
        }
      )
      .subscribe()

    return () => {
      if (xpDebounceRef.current) clearTimeout(xpDebounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [userId])
}
