'use client'

import { useState } from 'react'
import { X, Edit2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface EditSiswaModalProps {
  classId: string
  student: {
    id: string
    no_absen: number | null
    student: {
      nis_nip: string | null
      name: string
      email: string
    }
  }
  onClose: () => void
  onSuccess: () => void
}

export function EditSiswaModal({ classId, student, onClose, onSuccess }: EditSiswaModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    no_absen: student.no_absen?.toString() || '',
    nis_nip: student.student.nis_nip || '',
    name: student.student.name || '',
    email: student.student.email || '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      
      // Only include password in the payload if the teacher actually typed one
      const payload: any = {
        no_absen: formData.no_absen,
        nis_nip: formData.nis_nip,
        name: formData.name,
        email: formData.email,
      }
      if (formData.password.trim()) {
        payload.password = formData.password.trim()
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/kelas/${classId}/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData.session?.access_token && { 'Authorization': `Bearer ${sessionData.session.access_token}` })
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Gagal mengupdate siswa')
      }

      toast.success('Data siswa berhasil diupdate')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start overflow-y-auto justify-center p-4 py-8 md:py-12 bg-slate-800/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Edit2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Edit Siswa</h2>
              <p className="text-xs text-slate-500">{student.student.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">No Absen (Opsional)</label>
              <input
                type="number"
                value={formData.no_absen}
                onChange={e => setFormData({ ...formData, no_absen: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">NIS (Opsional)</label>
              <input
                type="text"
                value={formData.nis_nip}
                onChange={e => setFormData({ ...formData, nis_nip: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Password Reset Section — separate from main edit */}
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-4">
            <p className="mb-2.5 text-xs font-bold text-amber-700 flex items-center gap-1.5">
              🔑 Reset Kata Sandi (Opsional)
            </p>
            <p className="mb-3 text-[11px] text-amber-600/90 leading-relaxed">
              Isi hanya jika siswa lupa kata sandi. Kosongkan jika tidak perlu direset.
            </p>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              placeholder="Kata sandi baru (min. 6 karakter)"
              minLength={formData.password ? 6 : undefined}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
