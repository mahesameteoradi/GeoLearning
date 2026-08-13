"use client"

import { useState } from 'react'
import { Users, BookOpen, TrendingUp, Edit2, BellRing, Plus, Trash2 } from 'lucide-react'
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
  gamificationMode?: string
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
  gamificationMode = 'STANDARD',
  className,
}: ClassCardProps) {
  const [isEditing, setIsEditing] = useState(false)




  return (
    <div
      className={cn(
        'group relative block overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 transition-all duration-300 hover:border-indigo-300/50 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1',
        className
      )}
    >
      {/* Decorative gradient corner */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 blur-3xl transition-all duration-500 group-hover:bg-indigo-100 group-hover:scale-150" />

      <div className="mb-3 flex items-start justify-between relative z-10">
        <div className="flex flex-col">
          <Link href={`/teacher/classes/${id}`} className="hover:underline">
            <h3 className="line-clamp-1 text-base font-bold text-slate-900 pr-12">{name}</h3>
          </Link>
          <code className="mt-1 w-fit flex-shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500">
            {joinCode}
          </code>
        </div>

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
