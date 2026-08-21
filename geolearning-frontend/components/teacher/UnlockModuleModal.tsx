'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Unlock, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ModuleItem {
  id: string
  title: string
  order: number
}

interface UnlockModuleModalProps {
  classId: string
  studentId: string
  studentName: string
  teacherId: string
  onClose: () => void
  onSuccess: () => void
}

export function UnlockModuleModal({ classId, studentId, studentName, teacherId, onClose, onSuccess }: UnlockModuleModalProps) {
  const [loading, setLoading] = useState(false)
  const [modules, setModules] = useState<ModuleItem[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    async function fetchModules() {
      const supabase = createClient()
      const { data } = await supabase
        .from('modules')
        .select('id, title, order')
        .eq('class_id', classId)
        .order('order', { ascending: true })
      
      if (data) {
        setModules(data)
        if (data.length > 0) {
          setSelectedModuleId(data[0].id)
        }
      }
    }
    fetchModules()
  }, [classId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModuleId) {
      toast.error('Pilih bab/modul terlebih dahulu')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      
      const actualTeacherId = sessionData.session?.user?.id || teacherId

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/kelas/${classId}/students/${studentId}/unlock-module`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData.session?.access_token && { 'Authorization': `Bearer ${sessionData.session.access_token}` })
        },
        body: JSON.stringify({
          module_id: selectedModuleId,
          teacher_id: actualTeacherId,
          note: note
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Gagal membuka bab/modul')
      }

      toast.success('Berhasil membuka bab/modul untuk siswa ini')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start overflow-y-auto justify-center bg-slate-800/50 backdrop-blur-sm p-4 py-8 md:py-12">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-md">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Buka Akses Bab</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-slate-600">Buka akses bab yang terkunci untuk siswa:</p>
            <p className="font-semibold text-slate-800 mt-1">{studentName}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Pilih Bab / Modul <span className="text-rose-500">*</span></label>
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Catatan untuk Siswa <span className="text-slate-400 font-normal">(opsional)</span></label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Berikan alasan mengapa bab ini dibuka (misal: Siswa sudah mengikuti remedial...)"
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !selectedModuleId}
              className="flex w-1/2 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              Buka Akses
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
