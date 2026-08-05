'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Medal, Loader2, Target } from 'lucide-react'
import { AvatarDisplay } from '@/components/ui/AvatarDisplay'
import { cn } from '@/lib/utils/cn'

interface StudentRank {
  id: string
  name: string
  xp: number
  avatar_url: string | null
  equipped_badge: {
    id: string
    icon: string
    display_name: string
  } | null
}

export function ClassLeaderboard({ classId }: { classId: string }) {
  const [students, setStudents] = useState<StudentRank[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [debugError, setDebugError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      // Get enrolled students for this class
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId)

      if (enrollError || !enrollments) {
        setDebugError('enrollError: ' + JSON.stringify(enrollError))
        console.error('ClassLeaderboard enrollError:', enrollError)
        setLoading(false)
        return
      }
      
      // 1. Fetch students in this class
      // (enrollments already fetched above)

      const studentIds = enrollments.map(e => e.student_id)

      if (studentIds.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id, name, avatar_url, equipped_badge_id, xp,
          badges:user_badges!user_badges_user_id_fkey(id, badge_id, badge:badges(id, icon, display_name))
        `)
        .in('id', studentIds)

      if (usersError || !usersData) {
        console.error('ClassLeaderboard usersError:', usersError)
        setLoading(false)
        return
      }

      const processed = usersData.map((u: any) => {
        const equippedBadgeUb = (u.badges || []).find((ub: any) => ub.id === u.equipped_badge_id || ub.badge_id === u.equipped_badge_id)
        const equipped = equippedBadgeUb?.badge ? (Array.isArray(equippedBadgeUb.badge) ? equippedBadgeUb.badge[0] : equippedBadgeUb.badge) : null

        return {
          id: u.id,
          name: u.name,
          xp: u.xp || 0,
          avatar_url: u.avatar_url,
          equipped_badge: equipped,
        }
      })
      
      // Sort by global XP descending
      processed.sort((a, b) => b.xp - a.xp)

      setStudents(processed)
      setLoading(false)
    }
    fetchLeaderboard()
  }, [classId])

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500 animate-pulse">Memuat peringkat...</div>
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <Target className="h-10 w-10 mb-2 opacity-50" />
        <p>Belum ada siswa di kelas ini.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Peringkat Kelas</h2>
          <p className="text-xs text-slate-500">Siswa dengan XP terbanyak di kelas ini</p>
        </div>
      </div>

      <div className="grid gap-3">
        {students.map((student, idx) => {
          const isCurrentUser = student.id === currentUserId
          return (
            <div
              key={student.id}
              className={cn(
                "relative flex items-center gap-2 sm:gap-4 rounded-2xl border p-2 sm:p-3 overflow-hidden",
                isCurrentUser 
                  ? "border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50/50 shadow-sm" 
                  : idx === 0 
                    ? "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50/50"
                    : idx === 1 
                      ? "border-slate-300 bg-gradient-to-r from-slate-100 to-slate-50"
                      : idx === 2 
                        ? "border-orange-200 bg-gradient-to-r from-orange-50 to-rose-50/30"
                        : "border-slate-100 bg-white"
              )}
            >
              {/* Rank Badge */}
              <div className="flex w-10 flex-shrink-0 justify-center">
                {idx === 0 ? <Medal className="h-6 w-6 text-amber-400 drop-shadow-sm" /> :
                 idx === 1 ? <Medal className="h-6 w-6 text-slate-700 drop-shadow-sm" /> :
                 idx === 2 ? <Medal className="h-6 w-6 text-amber-700 drop-shadow-sm" /> :
                 <span className="text-sm font-bold text-slate-600">#{idx + 1}</span>}
              </div>

              {/* Avatar & Info */}
              <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
                <AvatarDisplay
                  name={student.name}
                  xp={student.xp}
                  avatarUrl={student.avatar_url}
                  equippedBadge={student.equipped_badge}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "truncate text-sm font-bold",
                    isCurrentUser ? "text-blue-700" : "text-slate-700"
                  )}>
                    {student.name} {isCurrentUser && <span className="text-[10px] font-normal text-blue-500 ml-1">(Kamu)</span>}
                  </p>
                  <p className="text-xs font-medium text-amber-500">{student.xp} XP</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
