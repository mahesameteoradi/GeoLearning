'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, User, Save, Building, Hash, GraduationCap, KeyRound, Eye, EyeOff, Trophy, Flame, Target, Book, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { AvatarDisplay } from '@/components/ui/AvatarDisplay'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { profileStudentSteps, profileTeacherSteps } from '@/lib/utils/tourSteps'
import { levelProgressPercent, getLevelMeaning } from '@/lib/utils/level'
import { BadgeGrid } from '@/components/ui/BadgeGrid'

interface Badge {
  id: string
  display_name: string
  description: string
  icon: string
}

interface UserBadge {
  id: string
  earned_at: string
  badge: Badge
}

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  nis_nip: string | null
  school_class: string | null
  xp: number
  level: number
  current_streak: number
  longest_streak: number
  badges: UserBadge[]
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

  // Bio state
  const [bio, setBio] = useState('')
  
  // Teacher Active Classes
  const [activeClasses, setActiveClasses] = useState<any[]>([])

  // Gamification stats
  const [stats, setStats] = useState({
    quizCount: 0,
    materialCount: 0
  })

  const [teacherStats, setTeacherStats] = useState({
    classCount: 0,
    studentCount: 0,
    quizCount: 0
  })

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, avatar_url, nis_nip, school_class, bio, xp, level, current_streak, longest_streak,
          badges:user_badges!user_id(
            id, earned_at,
            badge:badges(id, display_name, description, icon)
          )
        `)
        .eq('id', userId)
        .single()

      if (error) {
        toast.error('Gagal memuat profil')
        console.error(error)
      } else if (data) {
        setProfile(data as unknown as UserProfile)
        setName(data.name || '')
        setNisNip(data.nis_nip || '')
        setSchoolClass(data.school_class || '')
        setBio(data.bio || '')
      }

      if (role === 'STUDENT') {
        const { count: quizCount } = await supabase
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('completed_at', 'is', null)

        const { count: materialCount } = await supabase
          .from('material_completions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)

        setStats({
          quizCount: quizCount || 0,
          materialCount: materialCount || 0
        })
      } else if (role === 'TEACHER') {
        const { count: classCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', userId)
          
        const { data: classesData } = await supabase
          .from('classes')
          .select('id, name, description')
          .eq('teacher_id', userId)
          .order('created_at', { ascending: false })
          
        if (classesData) {
          setActiveClasses(classesData)
        }
          
        let studentCount = 0
        let tQuizCount = 0
        
        if (classesData && classesData.length > 0) {
          const classIds = classesData.map((c: any) => c.id)
          
          const { count: sCount } = await supabase
            .from('class_students')
            .select('*', { count: 'exact', head: true })
            .in('class_id', classIds)
            
          studentCount = sCount || 0
          
          const { count: qCount } = await supabase
            .from('quizzes')
            .select('*', { count: 'exact', head: true })
            .in('class_id', classIds)
            
          tQuizCount = qCount || 0
        }

        setTeacherStats({
          classCount: classCount || 0,
          studentCount,
          quizCount: tQuizCount
        })
      }

      setLoading(false)
    }
    fetchProfile()
  }, [userId, role])

  // ── Realtime Subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient()
    const channel = supabase
      .channel('public:users:profile')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        (payload) => {
          setProfile((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              xp: payload.new.xp ?? prev.xp,
              level: payload.new.level ?? prev.level,
              current_streak: payload.new.current_streak ?? prev.current_streak,
              longest_streak: payload.new.longest_streak ?? prev.longest_streak,
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
        bio: role === 'TEACHER' ? (bio.trim() || null) : null,
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
      .upload(filePath, file, { cacheControl: '31536000', upsert: false })

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
    <div className="mx-auto max-w-3xl p-5 lg:p-8 overflow-x-hidden">
      {role === 'STUDENT' ? (
        <OnboardingTour tourKey="profile_student" steps={profileStudentSteps} />
      ) : (
        <OnboardingTour tourKey="profile_teacher" steps={profileTeacherSteps} />
      )}
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-[#0B1120] p-8 shadow-md border border-slate-800">
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-inner backdrop-blur-sm transition-transform duration-500 hover:scale-105 hover:rotate-3">
            <User className="h-8 w-8 text-blue-400 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">Pengaturan Profil</h1>
            <p className="mt-1.5 text-blue-100/80 max-w-xl text-sm leading-relaxed">
              Perbarui informasi pribadi dan sesuaikan tampilan profil Anda.
            </p>
          </div>
        </div>
      </div>

      {/* ── Gamification Section (STUDENT ONLY) ──────────────────────────── */}
      {role === 'STUDENT' && (
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Status & Progress */}
          <div id="tour-student-profile-gamification" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" /> Status Gamifikasi
            </h2>
            
            <div className="flex flex-col md:flex-row items-center gap-5 mb-5">
              <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border-4 border-blue-200">
                <div className="text-center">
                  <p className="text-xs font-bold text-blue-500 uppercase">Level</p>
                  <p className="text-3xl font-black text-blue-700">{profile.level}</p>
                </div>
              </div>
              
              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-slate-700">{getLevelMeaning(profile.level).title}</span>
                  <span className="font-semibold text-slate-500">{profile.xp} XP</span>
                </div>
                <div className="h-4 w-full rounded-full bg-slate-50 overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 relative"
                    style={{ width: `${levelProgressPercent(profile.xp)}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/30 to-transparent"></div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">{getLevelMeaning(profile.level).description}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Rangkuman Akademik</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                  <Flame className="mx-auto h-6 w-6 text-orange-500 mb-1" />
                  <p className="text-xl font-bold text-slate-800">{profile.current_streak}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Streak Belajar</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                  <Book className="mx-auto h-6 w-6 text-green-500 mb-1" />
                  <p className="text-xl font-bold text-slate-800">{stats.materialCount}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Ketuntasan Materi</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                  <Target className="mx-auto h-6 w-6 text-blue-500 mb-1" />
                  <p className="text-xl font-bold text-slate-800">{stats.quizCount}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Kuis Diselesaikan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Badge Showcase */}
          <div id="tour-student-profile-badges" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Pameran Lencana
            </h2>
            
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <BadgeGrid 
                earned={profile.badges.map(ub => ({
                  id: ub.badge.id,
                  display_name: ub.badge.display_name,
                  description: ub.badge.description,
                  icon: ub.badge.icon,
                  earned_at: ub.earned_at
                }))} 
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Gamification Section (TEACHER ONLY) ──────────────────────────── */}
      {role === 'TEACHER' && (
        <div className="mb-8">
          <div id="tour-teacher-profile-stats" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" /> Statistik Mengajar
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-50 p-5 text-center border border-slate-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 hover:shadow-md">
                <Building className="h-8 w-8 text-blue-500 mb-2" />
                <p className="text-3xl font-black text-slate-800">{teacherStats.classCount}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Kelas Aktif</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-5 text-center border border-slate-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 hover:shadow-md">
                <GraduationCap className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-3xl font-black text-slate-800">{teacherStats.studentCount}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Siswa Diajar</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-5 text-center border border-slate-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 hover:shadow-md">
                <Target className="h-8 w-8 text-blue-500 mb-2" />
                <p className="text-3xl font-black text-slate-800">{teacherStats.quizCount}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Kuis Dibuat</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-800/40 opacity-0 transition-opacity group-hover:opacity-100">
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
            <h3 className="font-bold text-slate-800">{profile.name}</h3>
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
            <h2 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">
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
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nama Lengkap & Gelar
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email (Readonly) - Only show for Teachers */}
              {role !== 'STUDENT' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </label>
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={profile.email}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-[10px] text-slate-600">Email tidak dapat diubah.</p>
                </div>
              )}

              {/* NIS/NIP */}
              {role === 'STUDENT' ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    NISN / NIM
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      value={nisNip}
                      onChange={(e) => setNisNip(e.target.value)}
                      placeholder="Masukkan NISN / NIM"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    NIP / NIDN
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      value={nisNip}
                      onChange={(e) => setNisNip(e.target.value)}
                      placeholder="Contoh: 19800101 200501 1 001"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* School Class */}
              {role === 'STUDENT' ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Kelas / Jurusan
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      value={schoolClass}
                      onChange={(e) => setSchoolClass(e.target.value)}
                      placeholder="Contoh: XII IPA 1"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Mata Pelajaran yang Diampu / Wali Kelas
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      value={schoolClass}
                      onChange={(e) => setSchoolClass(e.target.value)}
                      placeholder="Contoh: Guru Geografi"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Teacher Bio */}
              {role === 'TEACHER' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Spesialisasi & Riwayat Singkat
                  </label>
                  <div className="relative">
                    <Book className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-600" />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tuliskan spesialisasi, bidang keahlian, dan riwayat singkat..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

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
          </form>

          {/* Change Password Form */}
          <form id={role === 'STUDENT' ? "tour-student-profile-password" : "tour-teacher-profile-password"} onSubmit={handleUpdatePassword} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-green-600" /> Keamanan Akun
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-11 text-sm text-slate-800 focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500/20 outline-none transition-all"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-11 text-sm text-slate-800 focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end border-t border-slate-100 pt-5">
              <button
                type="submit"
                disabled={savingPassword}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition-all hover:bg-green-700 disabled:opacity-60"
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

