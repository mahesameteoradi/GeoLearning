'use client'

import { useState } from 'react'
import { X, MessageSquare, Plus, Loader2, Pin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface ClassOption {
  id: string
  name: string
}

interface CreatePostModalProps {
  classes: ClassOption[]
  userId: string
  onClose: () => void
  onCreated?: (post: unknown) => void
}

export function CreatePostModal({ classes, userId, onClose, onCreated }: CreatePostModalProps) {
  const [form, setForm] = useState({
    classId: 'global',
    title: '',
    body: '',
    is_pinned: false,
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.classId || !form.title.trim() || !form.body.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('forum_posts').insert({
        class_id: form.classId === 'global' ? null : form.classId,
        user_id: userId,
        title: form.title.trim(),
        body: form.body.trim(),
        is_pinned: form.is_pinned,
      })
      if (error) {
        console.error('[CreatePostModal] Supabase insert error:', JSON.stringify(error, null, 2))
        throw error
      }
      toast.success('Post berhasil dibuat! 🎉')
      onCreated?.({})
      router.refresh()
      onClose()
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Unknown error'
      console.error('[CreatePostModal] handleSubmit error:', msg, err)
      toast.error(`Gagal membuat post: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div className="relative w-full max-w-lg animate-pop-in rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Buat Post Baru</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Kelas <span className="text-red-600">*</span>
            </label>
            <select
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            >
              <option value="global" style={{ backgroundColor: '#13131f' }}>
                🌐 Umum (Global)
              </option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id} style={{ backgroundColor: '#13131f' }}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Judul <span className="text-red-600">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={150}
              placeholder="Judul diskusi atau pengumuman…"
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
          </div>

          {/* Body */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Isi Post <span className="text-red-600">*</span>
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
              rows={5}
              maxLength={2000}
              placeholder="Tulis isi diskusi, materi, atau pengumuman di sini…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
          </div>

          {/* Pin toggle */}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-amber-200">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                form.is_pinned ? 'bg-amber-50' : 'bg-slate-100'
              }`}
            >
              <Pin className={`h-4 w-4 transition-colors ${form.is_pinned ? 'text-amber-600' : 'text-slate-600'}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">Pin Post</p>
              <p className="text-[11px] text-slate-600">Post akan selalu muncul di bagian atas forum</p>
            </div>
            <div
              className={`relative h-5 w-9 rounded-full transition-colors ${
                form.is_pinned ? 'bg-amber-500' : 'bg-slate-100'
              }`}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  form.is_pinned ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={form.is_pinned}
              onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
            />
          </label>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !form.title.trim() || !form.body.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memposting…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Buat Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
