'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Flame, BookOpen, GraduationCap, Users, Plus, ArrowRight, Compass, Loader2, AlertTriangle, Zap, Trophy, CheckCircle, Target, BrainCircuit } from 'lucide-react'
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion'
import { AvatarDisplay } from '@/components/ui/AvatarDisplay'
import { LevelBadge } from '@/components/ui/LevelBadge'
import { XpProgressBar } from '@/components/ui/XpProgressBar'
import { BadgeGrid } from '@/components/ui/BadgeGrid'
// import { StatsCard } from '@/components/student/StatsCard'
import { ActivityFeed } from '@/components/student/ActivityFeed'
import { LeaderboardWidget } from '@/components/student/LeaderboardWidget'
// import { FlashcardWidget } from './FlashcardWidget'
import { calculateLevel, xpForLevel } from '@/lib/utils/level'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { dashboardStudentSteps } from '@/lib/utils/tourSteps'
import { VarkTestModal } from '@/components/student/VarkTestModal'

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
  learning_style: string | null
  badges: BadgeItem[]
}

interface AttemptItem {
  id: string
  type: 'quiz' | 'material' | 'project'
  title: string
  subtitle: string
  timestamp: string
  xp: number
  quizId?: string
  projectId?: string
  materialId?: string
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
    <div className="min-h-full p-3 md:p-5 lg:p-7 space-y-5">
      {/* Hero Header skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 md:p-5">
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



// ─── Main Client Component ────────────────────────────────────────────────────

interface DashboardClientProps {
  initialData?: {
    profile: Profile
    attempts: AttemptItem[]
    notifications: NotifItem[]
    leaderboard: LeaderboardEntry[]
    availableClasses: AvailableClassItem[]
    interventions: { id: string, note: string, type: string, teacher: string, created_at: string }[]
    xpBreakdown: Record<string, number>
  }
  initialError?: string
}

export function DashboardClient({ initialData, initialError }: DashboardClientProps = {}) {
  const [profile, setProfile] = useState<Profile | null>(initialData?.profile ?? null)
  const [attempts, setAttempts] = useState<AttemptItem[]>(initialData?.attempts ?? [])
  const [notifications, setNotifications] = useState<NotifItem[]>(initialData?.notifications ?? [])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialData?.leaderboard ?? [])
  const [availableClasses, setAvailableClasses] = useState<AvailableClassItem[]>(initialData?.availableClasses ?? [])
  const [availableLoading, setAvailableLoading] = useState(!initialData)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [interventions, setInterventions] = useState<{ id: string, note: string, type: string, teacher: string, created_at: string }[]>(initialData?.interventions ?? [])
  const [xpBreakdown, setXpBreakdown] = useState<Record<string, number>>(initialData?.xpBreakdown ?? {})
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [showVarkModal, setShowVarkModal] = useState(false)

  useEffect(() => {
    if (profile?.learning_style === null) {
      setShowVarkModal(true)
    }
  }, [profile?.learning_style])

  useEffect(() => {
    // If we have initialData from SSR, skip client-side fetch entirely!
    if (initialData || initialError) return;

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
        const [profileRes, attemptsRes, notifsRes, enrolledRes, interventionsRes, materialRes, projectRes, allQuizAttemptsRes, allMaterialCompletionsRes, allProjectSubmissionsRes] = await Promise.all([
          supabase
            .from('users')
            .select(`
              id, name, xp, level, avatar_url, current_streak, longest_streak, equipped_badge_id, learning_style,
              badges:user_badges!user_badges_user_id_fkey(
                id, badge_id, earned_at,
                badge:badges(id, display_name, description, icon)
              )
            `)
            .eq('id', user.id)
            .single(),

          supabase
            .from('quiz_attempts')
            .select('id, score, xp_earned, completed_at, quiz_id, quiz:quizzes(title)')
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
            .from('class_students')
            .select(`
              class_id
            `)
            .eq('student_id', user.id),

          // Fetch interventions for this student
          supabase
            .from('interventions')
            .select('id, note, type, created_at, teacher:users!interventions_teacher_id_fkey(name)')
            .eq('student_id', user.id)
            .order('created_at', { ascending: false }),

          // Fetch material completions
          supabase
            .from('material_completions')
            .select('id, created_at, material_id, material:materials(title)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),

          // Fetch project submissions
          supabase
            .from('project_submissions')
            .select('id, submitted_at, assignment_id, xp_earned, score, project_assignment:project_assignments(title)')
            .eq('user_id', user.id)
            .order('submitted_at', { ascending: false })
            .limit(5),

          // Fetch ALL quiz attempts for exact XP
          supabase
            .from('quiz_attempts')
            .select('xp_earned, quiz_id')
            .eq('user_id', user.id)
            .not('completed_at', 'is', null),

          // Fetch ALL material completions for exact XP (assume 15 XP each)
          supabase
            .from('material_completions')
            .select('id')
            .eq('user_id', user.id),

          // Fetch ALL project submissions for exact XP
          supabase
            .from('project_submissions')
            .select('xp_earned')
            .eq('user_id', user.id)
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

        // 3. Process activity items (quizzes, materials, projects)
        const quizItems: AttemptItem[] = (attemptsRes.data ?? []).map((a: {
          id: string
          score: number
          xp_earned: number
          completed_at: string
          quiz: { title: string }[] | { title: string } | null
          quiz_id: string
        }) => ({
          id: a.id,
          type: 'quiz',
          title: `Kuis: ${(Array.isArray(a.quiz) ? a.quiz[0] : a.quiz as { title: string } | null)?.title ?? 'Tanpa Judul'}`,
          subtitle: `Skor: ${Math.round(a.score)}%`,
          timestamp: a.completed_at,
          xp: a.xp_earned,
          quizId: a.quiz_id,
        }))

        // Material completions → ActivityFeed items
        const materialItems: AttemptItem[] = (materialRes.data ?? []).map((m: any) => ({
          id: m.id,
          type: 'material',
          title: `Materi: ${(Array.isArray(m.material) ? m.material[0] : m.material)?.title ?? 'Tanpa Judul'}`,
          subtitle: 'Membaca Materi',
          timestamp: m.created_at,
          xp: 15,
          materialId: m.material_id,
        }))

        // Project submissions → ActivityFeed items
        const projectItems: AttemptItem[] = (projectRes.data ?? []).map((p: any) => ({
          id: p.id,
          type: 'project',
          title: `Proyek: ${(Array.isArray(p.project_assignment) ? p.project_assignment[0] : p.project_assignment)?.title ?? 'Tanpa Judul'}`,
          subtitle: p.score !== null ? `Nilai: ${p.score}` : 'Menunggu Penilaian',
          timestamp: p.submitted_at,
          xp: p.xp_earned || 0,
          projectId: p.assignment_id,
        }))

        let allAttempts = [...quizItems, ...materialItems, ...projectItems]

        allAttempts = allAttempts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        setAttempts(allAttempts.slice(0, 15))

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

        setNotifications(notifItems)

        // Calculate exact XP Breakdown from source tables
        const allQuizAttempts = allQuizAttemptsRes.data || []
        const allMaterialCompletions = allMaterialCompletionsRes.data || []
        const allProjectSubmissions = allProjectSubmissionsRes.data || []

        // Only count the best score per quiz for quizXp
        const bestQuizXp = new Map<string, number>()
        allQuizAttempts.forEach((q: any) => {
          if (q.quiz_id) {
            const currentBest = bestQuizXp.get(q.quiz_id) || 0
            if ((q.xp_earned || 0) > currentBest) {
              bestQuizXp.set(q.quiz_id, q.xp_earned || 0)
            }
          }
        })
        const quizXp = Array.from(bestQuizXp.values()).reduce((sum, xp) => sum + xp, 0)

        const materialXp = allMaterialCompletions.length * 15
        const projectXp = allProjectSubmissions.reduce((sum: number, p: any) => sum + (p.xp_earned || 0), 0)

        const totalCalculatedXp = quizXp + materialXp + projectXp
        const userTotalXp = profileRes.data?.xp || 0
        const lainnyaXp = Math.max(0, userTotalXp - totalCalculatedXp)

        const formattedBreakdown = {
          quiz: quizXp,
          material: materialXp,
          project: projectXp,
          lainnya: lainnyaXp
        }

        setXpBreakdown(formattedBreakdown)

        // Core data loaded, hide main skeleton immediately
        setLoading(false)

        // Parse interventions
        const activeInterventions = (interventionsRes.data ?? []).map((i: any) => ({
          id: i.id,
          note: i.note,
          type: i.type,
          created_at: i.created_at,
          teacher: Array.isArray(i.teacher) ? i.teacher[0]?.name : i.teacher?.name ?? 'Guru',
        }))
        setInterventions(activeInterventions)

        // Fetch available classes (not yet enrolled)
        const enrolledIds = (enrolledRes.data ?? []).map((r) => r.class_id)

        // --- Leaderboard logic ---
        let leaderboardData: LeaderboardEntry[] = []
        if (enrolledIds.length > 0) {
          const { data: classMatesRes } = await supabase
            .from('class_students')
            .select('student_id')
            .in('class_id', enrolledIds)

          const classmateIds = Array.from(new Set((classMatesRes ?? []).map(c => c.student_id)))

          if (classmateIds.length > 0) {
            const { data: topStudents } = await supabase
              .from('users')
              .select('id, name, xp, avatar_url, current_streak')
              .eq('role', 'STUDENT')
              .in('id', classmateIds)
              .order('xp', { ascending: false })
              .limit(5)

            leaderboardData = topStudents ?? []
          }
        }
        setLeaderboard(leaderboardData)



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
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  // ── Realtime Subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.id) return;
    const supabase = createClient()
    const channel = supabase
      .channel('public:users:dashboard')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${profile.id}` },
        (payload) => {
          setProfile((prev) => {
            if (!prev) return prev
            // Update only specific stats to avoid clobbering badges/arrays
            return {
              ...prev,
              xp: payload.new.xp ?? prev.xp,
              level: payload.new.level ?? prev.level,
              current_streak: payload.new.current_streak ?? prev.current_streak,
              longest_streak: payload.new.longest_streak ?? prev.longest_streak,
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id])

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

  // ── Compute Memoized Data ────────────────────────────────────────────────
  const level = useMemo(() => profile ? calculateLevel(profile.xp) : 0, [profile?.xp])
  const equippedBadge = useMemo(() => profile ? profile.badges.find((b) => b.id === profile.equipped_badge_id) ?? null : null, [profile?.badges, profile?.equipped_badge_id])

  const activityItems = useMemo(() => {
    return [...attempts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6)
  }, [attempts])

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

  const greeting = getGreeting()

  return (
    <div className="min-h-full p-3 md:p-5 lg:p-7 relative overflow-x-hidden">
      <OnboardingTour tourKey="dashboard_student" steps={dashboardStudentSteps} />

      {/* Interactive Cursor Glow is handled by InteractiveBackground component in the layout/page now, so it is removed from here to prevent duplication */}

      {/* ─── Hero Header ─────────────────────────────────────────────────── */}
      <div id="tour-student-hero" className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-900/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500 blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          <div className="flex-shrink-0 transition-transform duration-500 hover:scale-105 hover:rotate-3 drop-shadow-xl">
            <AvatarDisplay
              avatarUrl={profile.avatar_url}
              name={profile.name}
              xp={profile.xp}
              equippedBadge={equippedBadge}
              size="lg"
            />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left mt-2 sm:mt-0">
            <p className="text-sm font-medium text-indigo-200/80 mb-1">{greeting},</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">{profile.name}</h1>
              <LevelBadge level={level} size="md" />
              {profile.current_streak > 0 && (
                <span className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-300 shadow-sm backdrop-blur-sm">
                  <Flame className="h-4 w-4 text-orange-400" />
                  {profile.current_streak} Hari Beruntun!
                </span>
              )}
              {profile.learning_style && (
                <span className="flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 shadow-sm backdrop-blur-sm">
                  <BrainCircuit className="h-4 w-4 text-indigo-400" />
                  Gaya Belajar: {profile.learning_style}
                </span>
              )}
            </div>
            <p className="text-sm text-indigo-100/80 mb-5 max-w-xl leading-relaxed">
              Terus tingkatkan semangat belajarmu! Kamu telah mengumpulkan <span className="font-bold text-amber-400">{profile.xp.toLocaleString()} XP</span> secara keseluruhan dan mencapai predikat <span className="font-bold text-white">Level {level} Explorer</span>.
            </p>
            <div className="max-w-md bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner">
              <XpProgressBar xp={profile.xp} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats Row ───────────────────────────────────────────────────── */}
      <div id="tour-student-stats" className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total XP', value: profile.xp.toLocaleString(), icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', gradient: 'from-amber-500/5 to-transparent', subtitle: 'Keep going!' },
          { label: 'Level', value: level, icon: Trophy, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', gradient: 'from-indigo-500/5 to-transparent', subtitle: `Max: ${xpForLevel(level + 1).toLocaleString()} XP` },
          { label: 'Streak', value: `${profile.current_streak}d`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', gradient: 'from-orange-500/5 to-transparent', subtitle: `Best: ${profile.longest_streak}d` },
          { label: 'Kuis Selesai', value: attempts.length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', gradient: 'from-emerald-500/5 to-transparent', subtitle: 'Great work!' },
        ].map(({ label, value, icon: Icon, color, bg, border, gradient, subtitle }) => (
          <div key={label} className={`group relative overflow-hidden rounded-2xl border ${border} bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                <p className={`mt-1.5 text-3xl font-black tabular-nums ${color} drop-shadow-sm`}>{value}</p>
                <p className="mt-1 text-[11px] text-slate-500 font-medium">{subtitle}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg} transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Main Grid ───────────────────────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Left — flashcards + badges + activity */}
        <div className="space-y-5 xl:col-span-2">


          <section id="tour-student-badges">
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

          <section id="tour-student-xp-breakdown" className="mb-5">
            <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-500">
              📊 Distribusi XP
            </h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid gap-4 grid-cols-3">
                <div className="flex flex-col gap-1 rounded-xl bg-amber-50 p-3">
                  <span className="text-xs font-semibold text-amber-700">Dari Kuis</span>
                  <span className="text-xl font-black text-amber-600">{xpBreakdown.quiz?.toLocaleString() || 0} XP</span>
                </div>
                <div className="flex flex-col gap-1 rounded-xl bg-indigo-50 p-3">
                  <span className="text-xs font-semibold text-indigo-700">Dari Materi</span>
                  <span className="text-xl font-black text-indigo-600">{xpBreakdown.material?.toLocaleString() || 0} XP</span>
                </div>
                <div className="flex flex-col gap-1 rounded-xl bg-emerald-50 p-3">
                  <span className="text-xs font-semibold text-emerald-700">Dari Proyek</span>
                  <span className="text-xl font-black text-emerald-600">{xpBreakdown.project?.toLocaleString() || 0} XP</span>
                </div>
              </div>
            </div>
          </section>

          <section id="tour-student-activity">
            <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-500">
              📋 Recent Activity
            </h2>
            <ActivityFeed items={activityItems} />
          </section>
        </div>

        {/* Right — leaderboard & interventions */}
        <div className="space-y-5">
          <div id="tour-student-leaderboard">
            <LeaderboardWidget entries={leaderboard} currentUserId={profile.id} />
          </div>

          {/* Interventions (Catatan Guru) */}
          <div id="tour-student-interventions" className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                💬 Pesan Guru
              </h2>
            </div>

            {interventions.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {interventions.map((intv) => (
                  <div key={intv.id} className="rounded-xl bg-orange-50 p-3 border border-orange-100">
                    <div className="flex justify-between items-start mb-1.5">
                      <p className="text-[11px] font-bold text-slate-700">
                        {intv.teacher}
                      </p>
                      <span className="text-[9px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {new Date(intv.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed italic">
                      "{intv.note}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-slate-500 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada catatan atau teguran dari guru Anda.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render VARK Modal Outside Flow */}
      {showVarkModal && profile && (
        <VarkTestModal
          userId={profile.id}
          onComplete={(style) => {
            setShowVarkModal(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
