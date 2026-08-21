'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, Hash, GraduationCap, Users, BookMarked, ChevronRight,
} from 'lucide-react'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { classesStudentSteps } from '@/lib/utils/tourSteps'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassModule {
  id: string
  title: string
  order: number
}

interface EnrolledClass {
  id: string
  name: string
  description: string | null
  join_code: string
  created_at: string
  teacher: { name: string }[] | { name: string } | null
  modules: ClassModule[]
  enrollmentCount: number
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-50 ${className ?? ''}`} />
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
      <div className="flex justify-between">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

// ─── Enrolled Class Card ──────────────────────────────────────────────────────

function EnrolledCard({ cls }: { cls: EnrolledClass }) {
  const teacher = Array.isArray(cls.teacher) ? cls.teacher[0] : cls.teacher

  return (
    <Link href={`/student/classes/${cls.id}`} className="block group h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-500 ease-out hover:-translate-y-2 hover:border-blue-300 hover:shadow-md hover:shadow-blue-900/10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-50 blur-3xl transition-all duration-500 group-hover:bg-blue-100 group-hover:scale-150" />
        
        {/* Header */}
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-500 text-xl font-black text-white shadow-lg shadow-blue-500/30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            {cls.name.charAt(0).toUpperCase()}
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-mono text-slate-500 transition-colors group-hover:border-blue-200 group-hover:bg-blue-50/50">
            <Hash className="h-3 w-3" />
            {cls.join_code}
          </span>
        </div>

        {/* Name + desc */}
        <div className="relative z-10 mt-5 flex-1">
          <h3 className="text-xl font-bold text-slate-800 transition-colors duration-300 group-hover:text-blue-700 line-clamp-2">
            {cls.name}
          </h3>
          {cls.description && (
            <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">
              {cls.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 text-sm text-slate-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 transition-colors group-hover:text-slate-700">
              <GraduationCap className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{teacher?.name ?? 'Unknown'}</span>
            </span>
            <span className="flex items-center gap-1.5 transition-colors group-hover:text-slate-700">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{cls.enrollmentCount} Siswa</span>
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 font-semibold text-blue-600 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
            Masuk <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentClassesPage() {
  const router = useRouter()
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([])
  const [enrolledLoading, setEnrolledLoading] = useState(true)

  // ── Fetch enrolled classes ──────────────────────────────────────────────────
  const fetchEnrolledClasses = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('class_students')
      .select(`
        class:classes(
          id, name, description, join_code, created_at,
          teacher:users!classes_teacher_id_fkey(name),
          modules(id, title, order)
        )
      `)
      .eq('student_id', uid)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Fetch enrolled error:', error)
      setEnrolledLoading(false)
      return
    }

    const classIds = (data ?? [])
      .map((row) => (row.class as unknown as EnrolledClass)?.id)
      .filter(Boolean)

    let enrollmentCounts: Record<string, number> = {}
    if (classIds.length > 0) {
      const { data: countData } = await supabase
        .from('class_students')
        .select('class_id')
        .in('class_id', classIds)
      if (countData) {
        enrollmentCounts = countData.reduce((acc, row) => {
          acc[row.class_id] = (acc[row.class_id] ?? 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }

    const classes = (data ?? [])
      .map((row) => row.class as unknown as EnrolledClass)
      .filter(Boolean)
      .map((cls) => ({ ...cls, enrollmentCount: enrollmentCounts[cls.id] ?? 0 }))

    setEnrolledClasses(classes)
    
    // Auto-redirect if exactly 1 class
    if (classes.length === 1) {
      router.push(`/student/classes/${classes[0].id}`)
    } else {
      setEnrolledLoading(false)
    }
  }, [router])

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await fetchEnrolledClasses(user.id)
    }
    init()
  }, [fetchEnrolledClasses])

  // ── Render ─────────────────────────────────────────────────────────────────
  
  // If redirecting, keep loading state
  if (enrolledLoading) {
    return (
      <div className="min-h-full p-5 lg:p-7">
        <div className="mb-10 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-800 via-blue-950 to-slate-800 p-8 md:p-10 shadow-md">
          <Skeleton className="h-20 w-80 bg-white/10" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full p-5 lg:p-7">
      <OnboardingTour tourKey="classes_student" steps={classesStudentSteps} />
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-10 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-800 via-blue-950 to-slate-800 p-8 md:p-10 shadow-md shadow-blue-900/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="h-20 w-20 flex-shrink-0 flex items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 shadow-inner backdrop-blur-md transition-transform duration-500 hover:scale-105 hover:rotate-3">
            <BookMarked className="h-10 w-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              Ruang Kelasku
            </h1>
            <p className="mt-2 text-blue-100/80 max-w-xl text-sm md:text-base leading-relaxed">
              Kamu tergabung dalam {enrolledClasses.length} kelas. Pilih kelasmu di bawah ini untuk mulai belajar dan raih prestasimu!
            </p>
          </div>
        </div>
      </div>

      {/* ── Class List ─────────────────────────────────────────────────── */}
      {enrolledClasses.length === 0 ? (
        <div id="tour-student-class-cards" className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white/50 py-32 text-center backdrop-blur-sm">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-blue-50 bg-blue-100/50 shadow-inner">
            <BookOpen className="h-10 w-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Belum ada kelas</h2>
          <p className="mt-2 max-w-sm text-slate-500 leading-relaxed">
            Guru kamu belum memasukkan kamu ke dalam kelas manapun. Harap tunggu atau hubungi guru kamu.
          </p>
        </div>
      ) : (
        <div id="tour-student-class-cards" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {enrolledClasses.map((cls) => (
            <EnrolledCard key={cls.id} cls={cls} />
          ))}
        </div>
      )}
    </div>
  )
}
