'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, Hash, GraduationCap, Loader2, Users,
  LogOut, Plus, CheckCircle, AlertCircle, Search,
  Compass, BookMarked, X, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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

interface AvailableClass {
  id: string
  name: string
  description: string | null
  join_code: string
  created_at: string
  teacher: { name: string }[] | { name: string } | null
  modules: { id: string }[]
  class_students: { id: string }[]
}

type Tab = 'enrolled' | 'browse'

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className ?? ''}`} />
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

// ─── Enrolled Class Card ──────────────────────────────────────────────────────

function EnrolledCard({
  cls,
  onLeave,
}: {
  cls: EnrolledClass
  onLeave: (classId: string) => void
}) {
  const teacher = Array.isArray(cls.teacher) ? cls.teacher[0] : cls.teacher

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-blue-300 hover:shadow-lg hover:shadow-violet-900/20">
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-blue-50 blur-2xl transition-all group-hover:bg-blue-100" />

      {/* Clickable area → class detail */}
      <Link href={`/student/classes/${cls.id}`} className="block p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-base font-extrabold text-white shadow-md shadow-blue-600/20">
            {cls.name.charAt(0).toUpperCase()}
          </div>
          <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-mono text-slate-500">
            <Hash className="h-2.5 w-2.5" />
            {cls.join_code}
          </span>
        </div>

        {/* Name + desc */}
        <div className="mt-3">
          <h3 className="font-bold text-slate-900 group-hover:text-blue-800 transition-colors line-clamp-1">
            {cls.name}
          </h3>
          {cls.description && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{cls.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-slate-500">{teacher?.name ?? 'Unknown'}</span>
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {cls.modules.length} modul
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-cyan-500" />
            {cls.enrollmentCount}
          </span>
          <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-700 transition-colors group-hover:text-violet-500" />
        </div>
      </Link>

      {/* Leave button — separate from link */}
      <div className="border-t border-slate-100 px-5 py-2.5">
        <button
          onClick={() => onLeave(cls.id)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50"
        >
          <LogOut className="h-3 w-3" />
          Keluar dari Kelas
        </button>
      </div>
    </div>
  )
}

// ─── Available Class Card ─────────────────────────────────────────────────────

function AvailableCard({
  cls,
  enrolling,
  onEnroll,
}: {
  cls: AvailableClass
  enrolling: boolean
  onEnroll: (classId: string, className: string) => void
}) {
  const teacher = Array.isArray(cls.teacher) ? cls.teacher[0] : cls.teacher
  const moduleCount = cls.modules?.length ?? 0
  const studentCount = cls.class_students?.length ?? 0

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/10">
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-50 blur-2xl transition-all group-hover:bg-emerald-50" />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 border border-emerald-200 text-base font-extrabold text-emerald-600">
          {cls.name.charAt(0).toUpperCase()}
        </div>
        <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-mono text-slate-600">
          <Hash className="h-2.5 w-2.5" />
          {cls.join_code}
        </span>
      </div>

      {/* Name + desc */}
      <div className="mt-3">
        <h3 className="font-bold text-slate-900 group-hover:text-emerald-200 transition-colors line-clamp-1">
          {cls.name}
        </h3>
        {cls.description ? (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{cls.description}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-700 italic">Tidak ada deskripsi</p>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1">
          <GraduationCap className="h-3.5 w-3.5 text-violet-500" />
          <span className="text-slate-500">{teacher?.name ?? 'Unknown'}</span>
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          {moduleCount} modul
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-cyan-500" />
          {studentCount} siswa
        </span>
      </div>

      {/* Enroll Button */}
      <button
        onClick={() => onEnroll(cls.id, cls.name)}
        disabled={enrolling}
        className="mt-3.5 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-600 disabled:opacity-60"
      >
        {enrolling ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mendaftar…
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Enroll Kelas
          </>
        )}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentClassesPage() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => {
    return searchParams.get('tab') === 'browse' ? 'browse' : 'enrolled'
  })
  const [userId, setUserId] = useState<string | null>(null)

  // Enrolled state
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([])
  const [enrolledLoading, setEnrolledLoading] = useState(true)

  // Browse state
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseFetched, setBrowseFetched] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  // Join via code state
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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
  }, [])

  // ── Fetch available (not yet enrolled) classes ─────────────────────────────
  const fetchAvailableClasses = useCallback(async (uid: string, enrolledIds: string[]) => {
    setBrowseLoading(true)
    const supabase = createClient()

    const query = supabase
      .from('classes')
      .select(`
        id, name, description, join_code, created_at,
        teacher:users!classes_teacher_id_fkey(name),
        modules(id),
        class_students(id)
      `)
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Fetch available classes error:', error)
      setBrowseLoading(false)
      return
    }

    // Filter out classes the student is already enrolled in
    const available = (data ?? []).filter((cls) => !enrolledIds.includes(cls.id))
    setAvailableClasses(available as unknown as AvailableClass[])
    setBrowseLoading(false)
    setBrowseFetched(true)
  }, [])

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await fetchEnrolledClasses(user.id)
      setEnrolledLoading(false)
    }
    init()
  }, [fetchEnrolledClasses])

  // ── When switching to browse tab, fetch available classes ──────────────────
  useEffect(() => {
    if (tab === 'browse' && !browseFetched && userId) {
      const enrolledIds = enrolledClasses.map((c) => c.id)
      fetchAvailableClasses(userId, enrolledIds)
    }
  }, [tab, browseFetched, userId, enrolledClasses, fetchAvailableClasses])

  // ── Enroll via browse ──────────────────────────────────────────────────────
  async function handleEnroll(classId: string, className: string) {
    if (!userId) return
    setEnrollingId(classId)
    setStatusMsg(null)
    const supabase = createClient()

    const { error } = await supabase.from('class_students').insert({
      class_id: classId,
      student_id: userId,
    })

    if (error) {
      if (error.code === '23505') {
        setStatusMsg({ type: 'error', message: `Kamu sudah terdaftar di kelas "${className}".` })
      } else {
        console.error('Enroll error:', error)
        setStatusMsg({ type: 'error', message: 'Gagal mendaftar ke kelas. Coba lagi.' })
      }
    } else {
      setStatusMsg({ type: 'success', message: `Berhasil bergabung ke kelas "${className}"! 🎉` })
      // Remove from available, add to enrolled
      setAvailableClasses((prev) => prev.filter((c) => c.id !== classId))
      await fetchEnrolledClasses(userId)
    }

    setEnrollingId(null)
  }

  // ── Join via code ──────────────────────────────────────────────────────────
  async function handleJoinCode(e: React.FormEvent) {
    e.preventDefault()
    if (!joinCode.trim() || !userId) return
    setJoining(true)
    setStatusMsg(null)
    const supabase = createClient()

    const { data: cls, error: findError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('join_code', joinCode.trim().toUpperCase())
      .single()

    if (findError || !cls) {
      setStatusMsg({ type: 'error', message: 'Kode kelas tidak ditemukan. Periksa kembali.' })
      setJoining(false)
      return
    }

    const already = enrolledClasses.some((c) => c.id === cls.id)
    if (already) {
      setStatusMsg({ type: 'error', message: `Kamu sudah terdaftar di kelas "${cls.name}".` })
      setJoining(false)
      return
    }

    const { error: insertError } = await supabase.from('class_students').insert({
      class_id: cls.id,
      student_id: userId,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        setStatusMsg({ type: 'error', message: `Kamu sudah terdaftar di kelas "${cls.name}".` })
      } else {
        console.error('Join error:', insertError)
        setStatusMsg({ type: 'error', message: 'Gagal bergabung ke kelas. Coba lagi.' })
      }
    } else {
      setStatusMsg({ type: 'success', message: `Berhasil bergabung ke kelas "${cls.name}"! 🎉` })
      setJoinCode('')
      // Remove from available if present
      setAvailableClasses((prev) => prev.filter((c) => c.id !== cls.id))
      await fetchEnrolledClasses(userId)
      setTab('enrolled')
    }

    setJoining(false)
  }

  // ── Leave class ────────────────────────────────────────────────────────────
  async function handleLeave(classId: string) {
    if (!userId) return
    const cls = enrolledClasses.find((c) => c.id === classId)
    if (!confirm(`Keluar dari kelas "${cls?.name}"?`)) return
    const supabase = createClient()
    const { error } = await supabase
      .from('class_students')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', userId)
    if (!error) {
      setEnrolledClasses((prev) => prev.filter((c) => c.id !== classId))
      // Force re-fetch available on next browse visit
      setBrowseFetched(false)
    }
  }

  // ── Filtered available classes ─────────────────────────────────────────────
  const filteredAvailable = availableClasses.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cls.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full p-5 lg:p-7">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-blue-600" />
            Kelas
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {enrolledLoading ? '…' : `${enrolledClasses.length} kelas yang kamu ikuti`}
          </p>
        </div>

        {/* Join via kode */}
        <form onSubmit={handleJoinCode} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase())
                if (statusMsg) setStatusMsg(null)
              }}
              placeholder="Kode kelas..."
              maxLength={12}
              className="w-36 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-violet-500/30 font-mono tracking-widest"
            />
          </div>
          <button
            type="submit"
            disabled={joining || !joinCode.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Join
          </button>
        </form>
      </div>

      {/* ── Status Message ───────────────────────────────────────────────── */}
      {statusMsg && (
        <div
          className={cn(
            'mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm',
            statusMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
              : 'border-red-200 bg-red-50 text-red-600'
          )}
        >
          {statusMsg.type === 'success'
            ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
            : <AlertCircle className="h-4 w-4 flex-shrink-0" />
          }
          <span className="flex-1">{statusMsg.message}</span>
          <button onClick={() => setStatusMsg(null)} className="ml-auto opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
        <button
          onClick={() => setTab('enrolled')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
            tab === 'enrolled'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <BookOpen className="h-4 w-4" />
          Kelasku
          {!enrolledLoading && (
            <span className={cn(
              'ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
              tab === 'enrolled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            )}>
              {enrolledClasses.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('browse')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
            tab === 'browse'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Compass className="h-4 w-4" />
          Jelajahi Kelas
          {browseFetched && (
            <span className={cn(
              'ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
              tab === 'browse' ? 'bg-blue-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            )}>
              {availableClasses.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab: Kelasku ─────────────────────────────────────────────────── */}
      {tab === 'enrolled' && (
        <>
          {enrolledLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : enrolledClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-300 bg-blue-50">
                <BookOpen className="h-7 w-7 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Kamu belum bergabung ke kelas apapun</p>
              <p className="mt-1.5 max-w-xs text-xs text-slate-600">
                Gunakan kode kelas di atas atau jelajahi kelas yang tersedia
              </p>
              <button
                onClick={() => setTab('browse')}
                className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-600"
              >
                <Compass className="h-4 w-4" />
                Jelajahi Kelas
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-4 text-sm text-slate-500">
                <span><span className="font-bold text-slate-800">{enrolledClasses.length}</span> kelas</span>
                <span>·</span>
                <span><span className="font-bold text-slate-800">{enrolledClasses.reduce((s, c) => s + c.modules.length, 0)}</span> total modul</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {enrolledClasses.map((cls) => (
                  <EnrolledCard key={cls.id} cls={cls} onLeave={handleLeave} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Tab: Jelajahi ────────────────────────────────────────────────── */}
      {tab === 'browse' && (
        <>
          {/* Search bar */}
          <div className="mb-5 relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <input
              type="text"
              placeholder="Cari kelas berdasarkan nama atau deskripsi…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-200 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

          {browseLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filteredAvailable.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
                <Compass className="h-7 w-7 text-emerald-600" />
              </div>
              {searchQuery ? (
                <>
                  <p className="text-sm font-semibold text-slate-700">Kelas tidak ditemukan</p>
                  <p className="mt-1.5 text-xs text-slate-600">Coba kata kunci lain atau kosongkan pencarian</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-700">Belum ada kelas tersedia</p>
                  <p className="mt-1.5 max-w-xs text-xs text-slate-600">
                    Kamu sudah bergabung ke semua kelas yang ada, atau guru belum membuat kelas baru
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs text-slate-600">
                Menampilkan <span className="text-slate-500 font-semibold">{filteredAvailable.length}</span> kelas tersedia
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAvailable.map((cls) => (
                  <AvailableCard
                    key={cls.id}
                    cls={cls}
                    enrolling={enrollingId === cls.id}
                    onEnroll={handleEnroll}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
