'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, User, Save, Building, Hash, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { AvatarDisplay } from '@/components/ui/AvatarDisplay'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  nis_nip: string | null
  school_class: string | null
}

interface ProfileClientProps {
  userId: string
  role: 'STUDENT' | 'TEACHER'
}

export function ProfileClient({ userId, role }: ProfileClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [name, setName] = useState('')
  const [nisNip, setNisNip] = useState('')
  const [schoolClass, setSchoolClass] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, nis_nip, school_class')
        .eq('id', userId)
        .single()

      if (error) {
        toast.error('Gagal memuat profil')
        console.error(error)
      } else if (data) {
        setProfile(data as UserProfile)
        setName(data.name || '')
        setNisNip(data.nis_nip || '')
        setSchoolClass(data.school_class || '')
      }
      setLoading(false)
    }
    fetchProfile()
  }, [userId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        nis_nip: nisNip.trim() || null,
        school_class: schoolClass.trim() || null,
      })
      .eq('id', userId)

    if (error) {
      toast.error('Gagal menyimpan profil')
      console.error(error)
    } else {
      toast.success('Profil berhasil diperbarui')
      setProfile((prev) => prev ? {
        ...prev,
        name: name.trim(),
        nis_nip: nisNip.trim() || null,
        school_class: schoolClass.trim() || null
      } : null)
    }
    setSaving(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran maksimal foto adalah 2MB')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Math.random()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) {
      toast.error('Gagal mengunggah foto')
      console.error(uploadError)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      toast.error('Gagal menyimpan foto profil')
    } else {
      toast.success('Foto profil diperbarui')
      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : null)
    }

    setUploading(false)
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="mx-auto max-w-3xl p-5 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          Pengaturan Profil
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Perbarui informasi pribadi dan sesuaikan tampilan profil Anda.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column: Avatar */}
        <div className="md:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
            <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <AvatarDisplay
                avatarUrl={profile.avatar_url}
                name={profile.name}
                xp={0}
                size="lg"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <h3 className="font-bold text-slate-900">{profile.name}</h3>
            <span className={cn(
              "mt-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              role === 'TEACHER' ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-blue-50 text-blue-600 border border-blue-200"
            )}>
              {role === 'TEACHER' ? 'Guru' : 'Siswa'}
            </span>
            
            <p className="mt-4 text-[11px] text-slate-500">
              Klik foto untuk mengubah. Maks 2MB.
            </p>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-5 border-b border-slate-100 pb-3">
              Biodata Diri
            </h2>

            <div className="space-y-4">
              {/* Name */}
              {role === 'STUDENT' ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={profile.name}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email (Readonly) */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={profile.email}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
                <p className="mt-1.5 text-[10px] text-slate-600">Email tidak dapat diubah.</p>
              </div>

              {/* NIS/NIP */}
              {role === 'STUDENT' ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    NIS (Nomor Induk Siswa)
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={profile.nis_nip || '-'}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      value={nisNip}
                      onChange={(e) => setNisNip(e.target.value)}
                      placeholder="Contoh: 19800101 200501 1 001"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* School Class (Only for Teacher) */}
              {role === 'TEACHER' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Wali Kelas / Guru Bidang (Opsional)
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      value={schoolClass}
                      onChange={(e) => setSchoolClass(e.target.value)}
                      placeholder="Contoh: Geografi Lintas Minat"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {role === 'TEACHER' && (
              <div className="mt-8 flex items-center justify-end border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-slate-800 shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Simpan Perubahan
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
