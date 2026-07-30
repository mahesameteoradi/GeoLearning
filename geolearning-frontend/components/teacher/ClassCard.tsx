"use client"

import { useState } from 'react'
import { Users, BookOpen, TrendingUp, Edit2, BellRing } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface ClassCardProps {
  id: string
  name: string
  description?: string | null
  joinCode: string
  studentCount: number
  moduleCount: number
  avgXp?: number
  className?: string
}

export function ClassCard({
  id,
  name,
  description,
  joinCode,
  studentCount,
  moduleCount,
  avgXp = 0,
  className,
}: ClassCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [reminder, setReminder] = useState(description || '')
  const [isSaving, setIsSaving] = useState(false)
  const [currentDescription, setCurrentDescription] = useState(description || '')

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    const supabase = createClient()
    const { error } = await supabase
      .from('classes')
      .update({ description: reminder })
      .eq('id', id)
      
    if (error) {
      toast.error('Gagal menyimpan reminder')
      console.error(error)
    } else {
      toast.success('Reminder berhasil disimpan')
      setCurrentDescription(reminder)
      setIsEditing(false)
    }
    
    setIsSaving(false)
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsEditing(false)
    setReminder(currentDescription)
  }

  return (
    <div
      className={cn(
        'group relative block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-lg hover:shadow-violet-900/20',
        className
      )}
    >
      {/* Decorative gradient corner */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-50 blur-2xl transition-all group-hover:bg-blue-100" />

      <div className="mb-3 flex items-start justify-between relative z-10">
        <Link href={`/teacher/classes/${id}`} className="hover:underline">
          <h3 className="line-clamp-1 text-base font-bold text-slate-900">{name}</h3>
        </Link>
        <code className="ml-2 flex-shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500">
          {joinCode}
        </code>
      </div>

      {/* Reminder Section */}
      <div className="mb-4 relative z-10">
        {!isEditing ? (
          <div className="rounded-lg bg-amber-50/50 p-3 border border-amber-100/50 transition-colors hover:bg-amber-50 hover:border-amber-200">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <BellRing className="w-3 h-3" /> Reminder Materi
              </p>
              <button 
                onClick={(e) => { e.preventDefault(); setIsEditing(true) }} 
                className="text-amber-600/50 hover:text-amber-700 transition-colors"
                title="Edit Reminder"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
            {currentDescription ? (
              <p className="line-clamp-2 text-xs text-amber-900">{currentDescription}</p>
            ) : (
              <p className="text-xs text-amber-700/60 italic">Belum ada reminder...</p>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-3 border border-blue-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
              <Edit2 className="w-3 h-3" /> Edit Reminder
            </p>
            <textarea 
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              className="w-full text-xs p-2 rounded-md border border-slate-200 bg-slate-50 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
              rows={3}
              placeholder="Ketik materi sebelumnya atau pengingat untuk pertemuan ini..."
            />
            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={handleCancel} 
                className="text-[10px] px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="text-[10px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 relative z-10">
        <div className="flex flex-col items-center rounded-xl bg-white/60 py-3 shadow-sm border border-slate-100">
          <Users className="mb-1 h-4 w-4 text-cyan-600" />
          <span className="text-base font-bold text-slate-800">{studentCount}</span>
          <span className="text-[10px] text-slate-500">Students</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-white/60 py-3 shadow-sm border border-slate-100">
          <BookOpen className="mb-1 h-4 w-4 text-blue-600" />
          <span className="text-base font-bold text-slate-800">{moduleCount}</span>
          <span className="text-[10px] text-slate-500">Modules</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-white/60 py-3 shadow-sm border border-slate-100">
          <TrendingUp className="mb-1 h-4 w-4 text-amber-600" />
          <span className="text-base font-bold text-slate-800">{avgXp.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500">Avg XP</span>
        </div>
      </div>
    </div>
  )
}
