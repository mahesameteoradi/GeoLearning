'use client'

import { useState } from 'react'
import { AlertTriangle, Plus, X, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type InterventionType = 'ACADEMIC' | 'BEHAVIORAL' | 'ATTENDANCE' | 'EMOTIONAL' | 'POSITIVE' | 'CORRECTIVE'

interface Intervention {
  id: string
  student_id: string
  studentName: string
  note: string
  type: InterventionType
  resolved: boolean
  created_at: string
}

interface Student {
  id: string
  name: string
}

interface InterventionPanelProps {
  interventions: Intervention[]
  students: Student[]
  teacherId: string
  className?: string
}

const typeColors: Record<InterventionType, string> = {
  ACADEMIC:    'border-blue-300 bg-amber-50 text-blue-700',
  BEHAVIORAL:  'border-orange-200 bg-orange-50 text-orange-600',
  ATTENDANCE:  'border-blue-200 bg-blue-50 text-blue-600',
  EMOTIONAL:   'border-pink-200 bg-pink-50 text-pink-600',
  POSITIVE:    'border-green-300 bg-green-50 text-green-700',
  CORRECTIVE:  'border-red-300 bg-red-50 text-red-700',
}

export function InterventionPanel({ interventions: initial, students, teacherId, className }: InterventionPanelProps) {
  const [interventions, setInterventions] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ studentId: '', note: '', type: 'ACADEMIC' as InterventionType, xpBonus: 50 })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.studentId || !form.note.trim()) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      
      let newIv: Intervention;

      if (form.type === 'POSITIVE') {
        const { data: { session } } = await supabase.auth.getSession()
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const res = await fetch(`${backendUrl}/v1/gamification/boost`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            studentId: form.studentId,
            xpBonus: form.xpBonus,
            note: form.note
          })
        })
        if (!res.ok) throw new Error('Failed to send boost')
        
        const result = await res.json()
        const stu = students.find(s => s.id === form.studentId)
        newIv = {
          ...result.intervention,
          studentName: stu?.name ?? 'Unknown',
        }
      } else {
        // 1. Insert normal intervention
        const interventionId = crypto.randomUUID()
        const { data: interData, error: interError } = await supabase
          .from('interventions')
          .insert({
            id: interventionId,
            teacher_id: teacherId,
            student_id: form.studentId,
            note: form.note,
            type: form.type,
            resolved: false,
            updated_at: new Date().toISOString()
          })
          .select(`
            id, note, type, resolved, created_at,
            student:users!interventions_student_id_fkey(id, name)
          `)
          .single()
          
        if (interError) throw interError

        // 2. Insert notification
        await supabase.from('notifications').insert({
          id: crypto.randomUUID(),
          user_id: form.studentId,
          message: `Pesan Guru: ${form.note}`,
          type: 'INTERVENTION'
        })

        const stu = Array.isArray(interData.student) ? interData.student[0] : interData.student
        newIv = {
          ...interData,
          student_id: form.studentId,
          studentName: (stu as any)?.name ?? 'Unknown',
        } as Intervention
      }

      setInterventions([newIv, ...interventions])
      toast.success('Intervention recorded')
      setForm({ studentId: '', note: '', type: 'ACADEMIC', xpBonus: 50 })
      setShowForm(false)
    } catch {
      toast.error('Failed to save intervention')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-slate-50 p-5', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <h3 className="text-sm font-bold text-slate-800">Interventions</h3>
          {interventions.filter((i) => !i.resolved).length > 0 && (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
              {interventions.filter((i) => !i.resolved).length} open
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-50"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-slate-500">
              Student
            </label>
            <select
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-200 focus:outline-none"
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-slate-500">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as InterventionType })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-200 focus:outline-none"
            >
              {(['ACADEMIC', 'BEHAVIORAL', 'ATTENDANCE', 'EMOTIONAL', 'POSITIVE', 'CORRECTIVE'] as const).map((t) => (
                <option key={t} value={t}>{t === 'POSITIVE' ? 'POSITIVE (Kirim Motivasi)' : t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-slate-500">
              Note
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              required
              rows={3}
              placeholder="Describe the issue or action taken…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-200 focus:outline-none"
            />
          </div>
          {form.type === 'POSITIVE' && (
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-green-600">
                XP Bonus (Reward)
              </label>
              <input
                type="number"
                min="10"
                step="10"
                value={form.xpBonus}
                onChange={(e) => setForm({ ...form, xpBonus: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-slate-800 focus:border-green-400 focus:outline-none"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save Intervention'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-2">
        {interventions.slice(0, 5).map((iv) => (
          <div
            key={iv.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-3',
              iv.resolved ? 'opacity-50' : '',
              'border-white/5 bg-slate-50'
            )}
          >
            <span className={cn('mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-bold', typeColors[iv.type])}>
              {iv.type}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700">{iv.studentName}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{iv.note}</p>
            </div>
            {iv.resolved && <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />}
          </div>
        ))}
        {interventions.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-600">No interventions yet</p>
        )}
      </div>
    </div>
  )
}
