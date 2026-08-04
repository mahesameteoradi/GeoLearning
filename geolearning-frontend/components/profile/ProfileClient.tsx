'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, User, Save, Building, Hash, GraduationCap, KeyRound, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { AvatarDisplay } from '@/components/ui/AvatarDisplay'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { profileStudentSteps, profileTeacherSteps } from '@/lib/utils/tourSteps'

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

  // Password states
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword.length < 6) {
      toast.error('Kata sandi harus minimal 6 karakter')
      return
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok')
      return
    }

    setSavingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      toast.error('Gagal memperbarui kata sandi')
      console.error(error)
    } else {
      toast.success('Kata sandi berhasil diperbarui')
      setNewPassword('')
      setConfirmNewPassword('')
    }
    setSavingPassword(false)
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
      {role === 'STUDENT' ? (
        <OnboardingTour tourKey="profile_student" steps={profileStudentSteps} />
      ) : (
        <OnboardingTour tourKey="profile_teacher" steps={profileTeacherSteps} />
      )}
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl shadow-indigo-900/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500 blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-105 hover:rotate-3">
            <User className="h-8 w-8 text-blue-200" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">Pengaturan Profil</h1>
            <p className="mt-1.5 text-indigo-100/80 max-w-xl text-sm leading-relaxed">
              Perbarui informasi pribadi dan sesuaikan tampilan profil Anda.
            </p>
          </div>
        </div>
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
          <form id={role === 'STUDENT' ? "tour-student-profile-edit" : "tour-teacher-profile-edit"} onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-60"
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

          {/* Change Password Form */}
          <form id={role === 'STUDENT' ? "tour-student-profile-password" : "tour-teacher-profile-password"} onSubmit={handleUpdatePassword} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-600" /> Keamanan Akun
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-11 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-11 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end border-t border-slate-100 pt-5">
              <button
                type="submit"
                disabled={savingPassword}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Perbarui Kata Sandi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
