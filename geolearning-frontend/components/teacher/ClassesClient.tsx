'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookMarked, Users, BookOpen, Copy, Check, Plus, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CreateClassModal } from '@/components/teacher/CreateClassModal'
import toast from 'react-hot-toast'

interface ClassItem {
  id: string
  name: string
  description: string | null
  join_code: string
  flashcards?: any
  moduleCount: number
  studentCount: number
}

interface ClassesClientProps {
  classes: ClassItem[]
  teacherId: string
  totalStudents: number
  totalModules: number
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Kode disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-[11px] text-slate-500 transition-all hover:border-blue-300 hover:text-blue-700"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {code}
    </button>
  )
}

export function ClassesClient({ classes, teacherId, totalStudents, totalModules }: ClassesClientProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Kelas', value: classes.length, icon: BookMarked, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', gradient: 'from-indigo-500/5 to-transparent' },
          { label: 'Total Siswa', value: totalStudents, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', gradient: 'from-cyan-500/5 to-transparent' },
          { label: 'Total Modul', value: totalModules, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', gradient: 'from-amber-500/5 to-transparent' },
        ].map(({ label, value, icon: Icon, color, bg, border, gradient }) => (
          <div key={label} className={`group relative overflow-hidden rounded-2xl border ${border} bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                <p className={`mt-2 text-4xl font-black tabular-nums ${color} drop-shadow-sm`}>{value}</p>
              </div>
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bg} transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-24 text-center">
          <BookMarked className="mb-3 h-10 w-10 text-slate-700" />
          <p className="text-sm font-medium text-slate-500">Belum ada kelas</p>
          <p className="mt-1 text-xs text-slate-600">Buat kelas pertama Anda untuk memulai perjalanan mengajar</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Buat Kelas Pertama
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/teacher/classes/${cls.id}`}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 transition-all duration-300 hover:border-indigo-300/50 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1 cursor-pointer block"
            >
              {/* Decorative blur */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 blur-3xl transition-all duration-500 group-hover:bg-indigo-100 group-hover:scale-150" />

              {/* Header */}
              <div className="mb-4 flex items-start justify-between relative z-10">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-lg font-black text-white shadow-lg shadow-indigo-600/20">
                  {cls.name.charAt(0).toUpperCase()}
                </div>
                <CopyableCode code={cls.join_code} />
              </div>

              <h3 className="mb-1.5 line-clamp-1 text-lg font-bold text-slate-900 relative z-10">
                {cls.name}
              </h3>
              {cls.description && (
                <p className="mb-3 line-clamp-2 text-xs text-slate-500">{cls.description}</p>
              )}

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="h-3.5 w-3.5 text-cyan-500" />
                  <span className="font-semibold text-slate-700">{cls.studentCount}</span>
                  <span>siswa</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <BookOpen className="h-3.5 w-3.5 text-violet-500" />
                  <span className="font-semibold text-slate-700">{cls.moduleCount}</span>
                  <span>modul</span>
                </div>
                <div className="ml-auto">
                  <TrendingUp className="h-3.5 w-3.5 text-slate-700 transition-colors group-hover:text-violet-500" />
                </div>
              </div>
            </Link>
          ))}

          {/* Add New Card */}
          <button
            onClick={() => setShowModal(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-slate-500',
              'transition-all duration-300 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 hover:-translate-y-1'
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-current">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Buat Kelas Baru</span>
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <CreateClassModal onClose={() => setShowModal(false)} teacherId={teacherId} />
      )}
    </>
  )
}
