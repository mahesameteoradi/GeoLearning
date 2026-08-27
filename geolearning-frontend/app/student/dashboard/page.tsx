import { DashboardClient, DashboardSkeleton } from './DashboardClient'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'GeoLearning — Student Dashboard',
  description: 'Track your XP, badges, and learning progress',
}

export const dynamic = 'force-dynamic'

async function StudentDashboardData({ user }: { user: any }) {
  const supabase = await createClient()
  try {
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

      supabase
        .from('interventions')
        .select('id, note, type, created_at, teacher:users!interventions_teacher_id_fkey(name)')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false }),

      supabase
        .from('material_completions')
        .select('id, created_at, material_id, material:materials(title, xp_reward)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),

      supabase
        .from('project_submissions')
        .select('id, submitted_at, assignment_id, xp_earned, score, project_assignment:project_assignments(title)')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(5),

      supabase
        .from('quiz_attempts')
        .select('xp_earned, quiz_id')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null),

      supabase
        .from('xp_logs')
        .select('amount, source')
        .eq('user_id', user.id)
        .eq('source', 'MATERIAL_READ'),

      supabase
        .from('project_submissions')
        .select('xp_earned')
        .eq('user_id', user.id)
    ])

    if (profileRes.error) throw new Error(profileRes.error.message)

    const rawProfile = profileRes.data
    const earnedBadges = (rawProfile.badges ?? []).map((ub: any) => {
      const b = Array.isArray(ub.badge) ? ub.badge[0] : ub.badge
      return {
        id: b?.id ?? ub.badge_id,
        display_name: b?.display_name ?? ub.badge_id,
        description: b?.description ?? '',
        icon: b?.icon ?? '🏅',
        earned_at: ub.earned_at,
      }
    })

    const profile = { ...rawProfile, badges: earnedBadges }

    const quizItems = (attemptsRes.data ?? []).map((a: any) => ({
      id: a.id,
      type: 'quiz' as const,
      title: `Kuis: ${(Array.isArray(a.quiz) ? a.quiz[0] : a.quiz)?.title ?? 'Tanpa Judul'}`,
      subtitle: `Skor: ${Math.round(a.score)}%`,
      timestamp: a.completed_at,
      xp: a.xp_earned,
      quizId: a.quiz_id,
    }))

    const materialItems = (materialRes.data ?? []).map((m: any) => ({
      id: m.id,
      type: 'material' as const,
      title: `Materi: ${(Array.isArray(m.material) ? m.material[0] : m.material)?.title ?? 'Tanpa Judul'}`,
      subtitle: 'Membaca Materi',
      timestamp: m.created_at,
      xp: (Array.isArray(m.material) ? m.material[0] : m.material)?.xp_reward ?? 15,
      materialId: m.material_id,
    }))

    const projectItems = (projectRes.data ?? []).map((p: any) => ({
      id: p.id,
      type: 'project' as const,
      title: `Proyek: ${(Array.isArray(p.project_assignment) ? p.project_assignment[0] : p.project_assignment)?.title ?? 'Tanpa Judul'}`,
      subtitle: p.score !== null ? `Nilai: ${p.score}` : 'Menunggu Penilaian',
      timestamp: p.submitted_at,
      xp: p.xp_earned || 0,
      projectId: p.assignment_id,
    }))

    let allAttempts = [...quizItems, ...materialItems, ...projectItems]
    allAttempts = allAttempts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const attempts = allAttempts.slice(0, 15)

    const notifications = (notifsRes.data ?? []).map((n: any) => ({
      id: n.id,
      type: 'notification' as const,
      title: n.message,
      timestamp: n.created_at,
    }))

    const allQuizAttempts = allQuizAttemptsRes.data || []
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
    
    // Calculate exact historical XP earned from materials instead of joining current material xp_reward
    // (since teacher might have edited the material's XP after the student completed it)
    const materialXp = (allMaterialCompletionsRes.data || []).reduce((sum: number, log: any) => {
      return sum + (log.amount || 0)
    }, 0)
    
    const projectXp = (allProjectSubmissionsRes.data || []).reduce((sum: number, p: any) => sum + (p.xp_earned || 0), 0)
    const totalCalculatedXp = quizXp + materialXp + projectXp
    const userTotalXp = profileRes.data?.xp || 0
    const lainnyaXp = Math.max(0, userTotalXp - totalCalculatedXp)

    const xpBreakdown = { quiz: quizXp, material: materialXp, project: projectXp, lainnya: lainnyaXp }

    const interventions = (interventionsRes.data ?? []).map((i: any) => ({
      id: i.id,
      note: i.note,
      type: i.type,
      created_at: i.created_at,
      teacher: Array.isArray(i.teacher) ? i.teacher[0]?.name : i.teacher?.name ?? 'Guru',
    }))

    const enrolledIds = (enrolledRes.data ?? []).map((r: any) => r.class_id)
    
    let leaderboardData: any[] = []
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

    const allClassesRes = await supabase
      .from('classes')
      .select(`
        id, name, description, join_code,
        teacher:users!classes_teacher_id_fkey(name),
        modules(id),
        class_students(id)
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    const availableClasses = (allClassesRes.data ?? []).filter(
      (cls) => !enrolledIds.includes(cls.id)
    )

    const initialData = {
      profile,
      attempts,
      notifications,
      leaderboard: leaderboardData,
      availableClasses,

      interventions,
      xpBreakdown,
    }

    return <DashboardClient initialData={initialData} />
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    return <DashboardClient initialError="Gagal memuat data dashboard. Coba refresh halaman." />
  }
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <StudentDashboardData user={user} />
    </Suspense>
  )
}
