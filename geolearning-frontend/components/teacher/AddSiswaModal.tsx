'use client'

import { useState } from 'react'
import { X, UserPlus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface AddSiswaModalProps {
  classId: string
  onClose: () => void
  onSuccess: () => void
}

export function AddSiswaModal({ classId, onClose, onSuccess }: AddSiswaModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    nis_nip: '',
    no_absen: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      
      const payload = {
        name: formData.name,
        nis_nip: formData.nis_nip,
        no_absen: formData.no_absen ? parseInt(formData.no_absen) : undefined,
        email: `${formData.nis_nip.trim()}@siswa.com`,
        password: `12345678`
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/kelas/${classId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData.session?.access_token && { 'Authorization': `Bearer ${sessionData.session.access_token}` })
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Gagal menambahkan siswa')
      }

      toast.success('Siswa berhasil ditambahkan')
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
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Tambah Siswa</h2>
              <p className="text-xs text-slate-500">Tambahkan siswa secara manual</p>
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
              <label className="mb-1 block text-xs font-bold text-slate-700">NIPD / NISN</label>
              <input
                type="text"
                required
                value={formData.nis_nip}
                onChange={e => setFormData({ ...formData, nis_nip: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Nama Peserta / Lengkap</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
            <p className="text-xs text-blue-700 font-semibold mb-1">Informasi Login Akun:</p>
            <ul className="text-xs text-blue-600 list-disc pl-4">
              <li>Sistem akan otomatis membuat akun untuk siswa.</li>
              <li>Email: <strong>[NIPD]@siswa.com</strong></li>
              <li>Sandi Awal: <strong>12345678</strong></li>
            </ul>
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
