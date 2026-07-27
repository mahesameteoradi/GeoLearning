'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Flame, BookOpen, GraduationCap, Users, Plus, ArrowRight, Compass, Loader2, AlertTriangle } from 'lucide-react'
import { AvatarDisplay } from '@/components/ui/AvatarDisplay'
import { LevelBadge } from '@/components/ui/LevelBadge'
import { XpProgressBar } from '@/components/ui/XpProgressBar'
import { BadgeGrid } from '@/components/ui/BadgeGrid'
import { StatsCard } from '@/components/student/StatsCard'
import { ActivityFeed } from '@/components/student/ActivityFeed'
import { LeaderboardWidget } from '@/components/student/LeaderboardWidget'
import { FlashcardWidget } from './FlashcardWidget'
import { calculateLevel } from '@/lib/utils/level'

// ─── Types ───────────────────────────────────────────────────────────────────

interface BadgeItem {
  id: string
  display_name: string
  description: string
  icon: string
  earned_at: string
}

interface Profile {
  id: string
  name: string
  xp: number
  level: number
  avatar_url: string | null
  current_streak: number
  longest_streak: number
  equipped_badge_id: string | null
  badges: BadgeItem[]
}

interface AttemptItem {
  id: string
  type: 'quiz'
  title: string
  subtitle: string
  timestamp: string
  xp: number
}

interface NotifItem {
  id: string
  type: 'notification'
  title: string
  timestamp: string
}

interface LeaderboardEntry {
  id: string
  name: string
  xp: number
  avatar_url: string | null
  current_streak: number
}

interface AvailableClassItem {
  id: string
  name: string
  description: string | null
  join_code: string
  teacher: { name: string }[] | { name: string } | null
  modules: { id: string }[]
  class_students: { id: string }[]
}

// ─── Skeleton Components ──────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-100 ${className ?? ''}`}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-full p-5 lg:p-7 space-y-5">
      {/* Hero Header skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-full max-w-xs rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>

      {/* Main grid skeleton */}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* Badges skeleton */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <Skeleton className="h-3 w-16 mb-3" />
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {[...Array(14)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>
          {/* Activity skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 mb-3" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Leaderboard skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
          <Skeleton className="h-3 w-20 mb-3" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-12" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

// ─── Main Client Component ────────────────────────────────────────────────────

// ─── Available Classes Widget ─────────────────────────────────────────────────

function AvailableClassesWidget({
  classes,
  loading,
  enrollingId,
  onEnroll,
  onJoinByCode,
}: {
  classes: AvailableClassItem[]
  loading: boolean
  enrollingId: string | null
  onEnroll: (id: string, name: string) => void
  onJoinByCode: (code: string) => Promise<void>
}) {
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode || joinCode.length < 5) return
    setJoining(true)
    await onJoinByCode(joinCode.toUpperCase())
    setJoinCode('')
    setJoining(false)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5 text-emerald-600" />
          Kelas Tersedia
        </h2>
        <Link
          href="/student/classes?tab=browse"
          className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-emerald-600 transition-colors"
        >
          Lihat semua <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Join by Code Form */}
      <form onSubmit={handleJoinByCode} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Kode Kelas (6 digit)"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={6}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
        />
        <button
          type="submit"
          disabled={joining || joinCode.length < 5}
          className="flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {joining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Gabung'}
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-50 animate-pulse" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs text-slate-600">Semua kelas sudah diikuti</p>
        </div>
      ) : (
        <div className="space-y-2">
          {classes.slice(0, 4).map((cls) => {
            const teacher = Array.isArray(cls.teacher) ? cls.teacher[0] : cls.teacher
            return (
              <div
                key={cls.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 transition-all hover:border-emerald-200"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-600">
                  {cls.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{cls.name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-600">
                    <span className="flex items-center gap-0.5">
                      <GraduationCap className="h-3 w-3" />
                      {teacher?.name ?? 'Unknown'}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {cls.class_students?.length ?? 0}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <BookOpen className="h-3 w-3" />
                      {cls.modules?.length ?? 0} modul
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onEnroll(cls.id, cls.name)}
                  disabled={enrollingId === cls.id}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                  title="Enroll kelas ini"
                >
                  {enrollingId === cls.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Plus className="h-3.5 w-3.5" />}
                </button>
              </div>
            )
          })}
          {classes.length > 4 && (
            <Link
              href="/student/classes?tab=browse"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2 text-xs text-slate-600 transition-all hover:border-emerald-200 hover:text-emerald-600"
            >
              +{classes.length - 4} kelas lainnya <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function DashboardClient() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [attempts, setAttempts] = useState<AttemptItem[]>([])
  const [notifications, setNotifications] = useState<NotifItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [availableClasses, setAvailableClasses] = useState<AvailableClassItem[]>([])
  const [availableLoading, setAvailableLoading] = useState(true)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [interventions, setInterventions] = useState<{id: string, note: string, type: string, teacher: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function fetchAll() {
      try {
        // Step 1: Get current user (fast — uses cached session)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = '/login'
          return
        }

        // Step 2: Fetch all data in PARALLEL (not serial!)
        const [profileRes, attemptsRes, notifsRes, leaderboardRes, enrolledRes, interventionsRes] = await Promise.all([
          supabase
            .from('users')
            .select(`
              id, name, xp, level, avatar_url, current_streak, longest_streak, equipped_badge_id,
              badges:user_badges!user_id(
                id, badge_id, earned_at,
                badge:badges(id, display_name, description, icon)
              )
            `)
            .eq('id', user.id)
            .single(),

          supabase
            .from('quiz_attempts')
            .select('id, score, xp_earned, completed_at, quiz:quizzes(title)')
            .eq('user_id', user.id)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(5),

          supabase
            .from('notifications')
            .select('id, message, type, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),

          supabase
            .from('users')
            .select('id, name, xp, avatar_url, current_streak')
            .eq('role', 'STUDENT')
            .order('xp', { ascending: false })
            .limit(5),

          // Fetch enrolled class IDs to exclude from available list
          supabase
            .from('class_students')
            .select('class_id')
            .eq('student_id', user.id),

          // Fetch active interventions for this student
          supabase
            .from('interventions')
            .select('id, note, type, teacher:users!interventions_teacher_id_fkey(name)')
            .eq('student_id', user.id)
            .eq('resolved', false)
        ])

        if (profileRes.error) throw new Error(profileRes.error.message)

        const rawProfile = profileRes.data
        const earnedBadges: BadgeItem[] = (rawProfile.badges ?? []).map((ub: {
          id: string
          badge_id: string
          earned_at: string
          badge: { id: string; display_name: string; description: string; icon: string }[] | { id: string; display_name: string; description: string; icon: string }
        }) => {
          const b = Array.isArray(ub.badge) ? ub.badge[0] : ub.badge
          return {
            id: b?.id ?? ub.badge_id,
            display_name: b?.display_name ?? ub.badge_id,
            description: b?.description ?? '',
            icon: b?.icon ?? '🏅',
            earned_at: ub.earned_at,
          }
        })

        setProfile({ ...rawProfile, badges: earnedBadges })

        // Quiz attempts → ActivityFeed items
        const attemptItems: AttemptItem[] = (attemptsRes.data ?? []).map((a: {
          id: string
          score: number
          xp_earned: number
          completed_at: string
          quiz: { title: string }[] | { title: string } | null
        }) => ({
          id: a.id,
          type: 'quiz',
          title: (Array.isArray(a.quiz) ? a.quiz[0] : a.quiz as { title: string } | null)?.title ?? 'Quiz',
          subtitle: `Score: ${Math.round(a.score)}%`,
          timestamp: a.completed_at,
          xp: a.xp_earned,
        }))

        const notifItems: NotifItem[] = (notifsRes.data ?? []).map((n: {
          id: string
          message: string
          created_at: string
        }) => ({
          id: n.id,
          type: 'notification',
          title: n.message,
          timestamp: n.created_at,
        }))

        setAttempts(attemptItems)
        setNotifications(notifItems)
        setLeaderboard(leaderboardRes.data ?? [])

        // Parse interventions
        const activeInterventions = (interventionsRes.data ?? []).map((i: any) => ({
          id: i.id,
          note: i.note,
          type: i.type,
          teacher: Array.isArray(i.teacher) ? i.teacher[0]?.name : i.teacher?.name ?? 'Guru',
        }))
        setInterventions(activeInterventions)

        // Fetch available classes (not yet enrolled)
        const enrolledIds = (enrolledRes.data ?? []).map((r) => r.class_id)
        const allClassesRes = await supabase
          .from('classes')
          .select(`
            id, name, description, join_code,
            teacher:users!classes_teacher_id_fkey(name),
            modules(id),
            class_students(id)
          `)
          .order('created_at', { ascending: false })

        const available = (allClassesRes.data ?? []).filter(
          (cls) => !enrolledIds.includes(cls.id)
        )
        setAvailableClasses(available as unknown as AvailableClassItem[])
        setAvailableLoading(false)
      } catch (err) {
        console.error('[DashboardClient] fetch error:', err)
        setError('Gagal memuat data dashboard. Coba refresh halaman.')
        setAvailableLoading(false)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  // ── Quick enroll from dashboard widget ─────────────────────────────────────
  async function handleQuickEnroll(classId: string, className: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEnrollingId(classId)
    const { error } = await supabase.from('class_students').insert({
      class_id: classId,
      student_id: user.id,
    })
    if (!error) {
      setAvailableClasses((prev) => prev.filter((c) => c.id !== classId))
    }
    setEnrollingId(null)
  }

  // ── Join class by 6-digit code ─────────────────────────────────────────────
  async function handleJoinByCode(code: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Find class by join code
    const { data: cls, error: findError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('join_code', code)
      .single()

    if (findError || !cls) {
      alert('Kelas tidak ditemukan dengan kode tersebut.')
      return
    }

    // Enroll in the class
    const { error: enrollError } = await supabase.from('class_students').insert({
      class_id: cls.id,
      student_id: user.id,
    })

    if (enrollError) {
      // If it's a unique constraint violation, they are already enrolled
      if (enrollError.code?.includes('23505')) {
        alert('Kamu sudah tergabung di kelas ini.')
      } else {
        alert('Gagal bergabung ke kelas. Silakan coba lagi.')
      }
      return
    }

    // Remove from available list if it was there
    setAvailableClasses((prev) => prev.filter((c) => c.id !== cls.id))
    alert(`Berhasil bergabung ke kelas ${cls.name}!`)
  }

  // ── Loading state → show skeleton immediately ──────────────────────────────
  if (loading) return <DashboardSkeleton />

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="text-sm text-red-600">{error ?? 'Profil tidak ditemukan.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  // ── Data ready → render dashboard ─────────────────────────────────────────
  const level = calculateLevel(profile.xp)
  const equippedBadge = profile.badges.find((b) => b.id === profile.equipped_badge_id) ?? null

  const activityItems = [
    ...attempts,
    ...notifications,
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6)

  const greeting = getGreeting()

  return (
    <div className="min-h-full p-5 lg:p-7">
      
      {/* ─── Active Interventions Alert ───────────────────────────────────── */}
      {interventions.length > 0 && (
        <div className="mb-6 space-y-3">
          {interventions.map((iv) => (
            <div key={iv.id} className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-200 text-orange-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-orange-900">
                  Pesan Khusus dari {iv.teacher}
                </h3>
                <p className="mt-1 text-sm text-orange-800">{iv.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Hero Header ─────────────────────────────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="relative flex flex-wrap items-center gap-4">
          <AvatarDisplay
            avatarUrl={profile.avatar_url}
            name={profile.name}
            xp={profile.xp}
            equippedBadge={equippedBadge}
            size="lg"
          />

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 mb-0.5">{greeting},</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
              <LevelBadge level={level} size="md" />
              {profile.current_streak > 0 && (
                <span className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600">
                  <Flame className="h-3 w-3" />
                  {profile.current_streak}d streak
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {profile.xp.toLocaleString()} XP total · Level {level} Explorer
            </p>
            <div className="mt-3 max-w-xs">
              <XpProgressBar xp={profile.xp} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats Row ───────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard label="Total XP" value={profile.xp} icon="⚡" subtitle="Keep going!" variant="xp" />
        <StatsCard label="Level" value={level} icon="🏅" subtitle="Max: 100" variant="default" />
        <StatsCard label="Streak" value={`${profile.current_streak}d`} icon="🔥" subtitle={`Best: ${profile.longest_streak}d`} variant="streak" />
        <StatsCard label="Quizzes" value={attempts.length} icon="✅" subtitle="Completed" variant="quiz" />
      </div>

      {/* ─── Main Grid ───────────────────────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Left — flashcards + badges + activity */}
        <div className="space-y-5 xl:col-span-2">
          <section>
            <FlashcardWidget userId={profile.id} />
          </section>

          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                🏅 Badges
              </h2>
              <span className="text-[11px] text-slate-600">
                {profile.badges.length} / 14 earned
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <BadgeGrid earned={profile.badges} equippedId={profile.equipped_badge_id} />
            </div>
          </section>

          <section>
            <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-500">
              📋 Recent Activity
            </h2>
            <ActivityFeed items={activityItems} />
          </section>
        </div>

        {/* Right — leaderboard + available classes */}
        <div className="space-y-5">
          <LeaderboardWidget entries={leaderboard} currentUserId={profile.id} />
          <AvailableClassesWidget
            classes={availableClasses}
            loading={availableLoading}
            enrollingId={enrollingId}
            onEnroll={handleQuickEnroll}
            onJoinByCode={handleJoinByCode}
          />
        </div>
      </div>
    </div>
  )
}
