'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { CreateClassModal } from '@/components/teacher/CreateClassModal'
import { EditClassModal } from '@/components/teacher/EditClassModal'
import { ImportClassesModal } from '@/components/teacher/ImportClassesModal'
import toast from 'react-hot-toast'
import { BookMarked, Users, BookOpen, Copy, Check, Plus, TrendingUp, Trash2, Edit2, FileSpreadsheet, CheckSquare, Square } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { classesTeacherSteps } from '@/lib/utils/tourSteps'

interface ClassItem {
  id: string
  name: string
  description: string | null
  gamification_mode?: string
  join_code: string

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
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] text-slate-500 transition-all hover:border-blue-300 hover:text-blue-700"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {code}
    </button>
  )
}

export function ClassesClient({ classes, teacherId, totalStudents, totalModules }: ClassesClientProps) {
  const { confirm } = useConfirm()
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const isConfirmed = await confirm({
      title: 'Hapus Kelas',
      message: `Apakah Anda yakin ingin menghapus kelas "${name}"? Semua data di dalamnya akan terhapus.`,
      confirmText: 'Ya, Hapus',
      variant: 'danger'
    })
    
    if (!isConfirmed) return
    
    setIsDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from('classes').delete().eq('id', id)
    
    if (error) {
      toast.error('Gagal menghapus kelas')
      console.error(error)
      setIsDeleting(null)
    } else {
      toast.success('Kelas berhasil dihapus')
      window.location.reload()
    }
  }

  const handleBulkDelete = async () => {
    if (selectedClasses.length === 0) return
    const isConfirmed = await confirm({
      title: 'Hapus Banyak Kelas',
      message: `Apakah Anda yakin ingin menghapus ${selectedClasses.length} kelas terpilih? Semua data siswa dan modul di dalamnya akan ikut terhapus!`,
      confirmText: 'Ya, Hapus Semua',
      variant: 'danger'
    })
    
    if (!isConfirmed) return
    
    setIsBulkDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('classes').delete().in('id', selectedClasses)
    
    if (error) {
      toast.error('Gagal menghapus kelas terpilih')
      console.error(error)
      setIsBulkDeleting(false)
    } else {
      toast.success(`${selectedClasses.length} Kelas berhasil dihapus`)
      window.location.reload()
    }
  }

  const toggleSelectClass = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedClasses(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  return (
    <>
      <OnboardingTour tourKey="classes_teacher" steps={classesTeacherSteps} />
      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Kelas', value: classes.length, icon: BookMarked, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', gradient: 'from-blue-500/5 to-transparent' },
          { label: 'Total Siswa', value: totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', gradient: 'from-blue-500/5 to-transparent' },
          { label: 'Total Modul', value: totalModules, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', gradient: 'from-amber-500/5 to-transparent' },
        ].map(({ label, value, icon: Icon, color, bg, border, gradient }) => (
          <div key={label} className={`group relative overflow-hidden rounded-2xl border ${border} bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-blue-900/5 hover:-translate-y-1`}>
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
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300"
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Import Excel
            </button>
            <button
              id="tour-teacher-create-class"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Buat Kelas Pertama
            </button>
          </div>
        </div>
      ) : (
        <div id="tour-teacher-class-list">
          <div className="mb-4 flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-700">Daftar Kelas</h2>
              <span className="bg-slate-50 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{classes.length}</span>
            </div>
            
            <div className="flex items-center gap-3">
              {isSelectMode ? (
                <>
                  <span className="text-xs font-semibold text-slate-500 mr-2">{selectedClasses.length} terpilih</span>
                  <button 
                    onClick={() => {
                      setIsSelectMode(false)
                      setSelectedClasses([])
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleBulkDelete}
                    disabled={selectedClasses.length === 0 || isBulkDeleting}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Terpilih
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsSelectMode(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition-all"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Pilih Kelas
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={isSelectMode ? '#' : `/teacher/classes/${cls.id}`}
                onClick={(e) => {
                  if (isSelectMode) toggleSelectClass(e, cls.id)
                }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-white p-6 transition-all duration-300 block",
                  isSelectMode && selectedClasses.includes(cls.id) 
                    ? "border-blue-500 shadow-md shadow-blue-500/10" 
                    : "border-slate-200/60 hover:border-blue-300/50 hover:shadow-md hover:shadow-blue-900/5 hover:-translate-y-1 cursor-pointer"
                )}
              >
                {/* Checkbox overlay when select mode is active */}
                {isSelectMode && (
                  <div className="absolute right-4 top-4 z-20">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-colors border",
                      selectedClasses.includes(cls.id) ? "bg-blue-500 border-blue-500 text-white" : "border-slate-300 bg-slate-50 text-transparent"
                    )}>
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                )}
              {/* Decorative blur */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-50 to-blue-50 blur-3xl transition-all duration-500 group-hover:bg-blue-100 group-hover:scale-150" />

              {/* Header */}
              <div className="mb-4 flex items-start justify-between relative z-10">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-lg font-black text-white shadow-lg shadow-blue-600/20">
                    {cls.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1 mt-0.5">
                  <CopyableCode code={cls.join_code} />
                </div>
              </div>
              
              {!isSelectMode && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingClass(cls); }}
                    disabled={isDeleting === cls.id}
                  className="p-1.5 text-slate-400 opacity-0 transition-all hover:bg-blue-50 hover:text-blue-600 rounded-md group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                  title="Edit Kelas"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, cls.id, cls.name)}
                  disabled={isDeleting === cls.id}
                  className="p-1.5 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 rounded-md group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                  title="Hapus Kelas"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              )}
            </div>

              <h3 className="mb-1.5 line-clamp-1 text-lg font-bold text-slate-800 relative z-10">
                {cls.name}
              </h3>
              {cls.description && (
                <p className="mb-3 line-clamp-2 text-xs text-slate-500">{cls.description}</p>
              )}

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-semibold text-slate-700">{cls.studentCount}</span>
                  <span>siswa</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-semibold text-slate-700">{cls.moduleCount}</span>
                  <span>modul</span>
                </div>
                <div className="ml-auto">
                  <TrendingUp className="h-3.5 w-3.5 text-slate-700 transition-colors group-hover:text-amber-500" />
                </div>
              </div>
            </Link>
          ))}

          {/* Add New Card */}
          <button
            id="tour-teacher-create-class"
            onClick={() => setShowModal(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-slate-500',
              'transition-all duration-300 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 hover:-translate-y-1'
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-current">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Buat Kelas Baru</span>
          </button>

          {/* Import Excel Card */}
          <button
            onClick={() => setShowImportModal(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-slate-500',
              'transition-all duration-300 hover:border-green-300 hover:bg-green-50/50 hover:text-green-600 hover:-translate-y-1'
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-current">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Import dari Excel</span>
          </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && <CreateClassModal teacherId={teacherId} onClose={() => setShowModal(false)} />}
      
      {showImportModal && <ImportClassesModal teacherId={teacherId} onClose={() => setShowImportModal(false)} />}

      {editingClass && (
        <EditClassModal 
          onClose={() => setEditingClass(null)} 
          classData={editingClass} 
        />
      )}
    </>
  )
}
