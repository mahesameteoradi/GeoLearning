'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, BookOpen, Sparkles, Globe2, Compass, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { loginPageSteps } from '@/lib/utils/tourSteps'
import Link from 'next/link'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let loginEmail = identifier.trim()
      if (loginEmail && !loginEmail.includes('@')) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/resolve-identifier`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: loginEmail }),
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.email) {
              loginEmail = data.email;
            } else {
              loginEmail = `${loginEmail}@siswa.com`;
            }
          } else {
            loginEmail = `${loginEmail}@siswa.com`;
          }
        } catch (resolveErr) {
          console.error('Resolve Identifier Error:', resolveErr);
          loginEmail = `${loginEmail}@siswa.com`;
        }
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })

      if (signInError) {
        setError('Email atau password salah.')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = profile?.role || data?.user?.user_metadata?.role

      if (role === 'ADMIN') {
        router.push('/admin')
      } else if (role === 'TEACHER') {
        router.push('/teacher/dashboard')
      } else {
        router.push('/student/dashboard')
      }
      
      router.refresh()
    } catch (err: any) {
      console.error('Login Error:', err)
      setError(err.message === 'Failed to fetch'
        ? 'Gagal terhubung ke server. Periksa koneksi internet atau matikan AdBlock.'
        : err.message || 'Terjadi kesalahan saat masuk.')
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    let resetEmail = identifier.trim()
    if (!resetEmail) {
      setError('Masukkan Email atau Username Anda')
      setLoading(false)
      return
    }
    
    if (!resetEmail.includes('@')) {
      resetEmail = `${resetEmail}@siswa.com`
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        setError('Gagal mengirim tautan. Pastikan email terdaftar.')
      } else {
        setResetSent(true)
      }
    } catch (err: any) {
      console.error('Forgot Password Error:', err)
      setError(err.message === 'Failed to fetch'
        ? 'Gagal terhubung ke server. Periksa koneksi internet atau matikan AdBlock.'
        : err.message || 'Terjadi kesalahan saat mereset kata sandi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col md:flex-row w-full max-w-5xl mx-auto bg-white rounded-[2rem] overflow-hidden shadow-md shadow-blue-900/10 border border-slate-100 min-h-[600px]"
    >
      <OnboardingTour tourKey="login_page" steps={loginPageSteps} />
      
      {/* ── LEFT PANEL (Branding) ── */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 relative p-12 flex-col justify-between overflow-hidden bg-slate-800">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-cover bg-center opacity-[0.15]" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-blue-900/95 to-slate-800/95" />
          
          {/* Animated decorative orbs */}
          <motion.div 
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }} 
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -left-10 w-40 h-40 bg-blue-500 rounded-full blur-[80px]" 
          />
          <motion.div 
            animate={{ x: [0, 30, 0], opacity: [0.2, 0.5, 0.2] }} 
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 -right-10 w-56 h-56 bg-blue-500 rounded-full blur-[100px]" 
          />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="relative z-10 mt-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-6 shadow-md"
          >
            <Compass className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4"
          >
            Mulai <br />
            Petualangan <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Belajarmu.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-blue-100/80 text-lg max-w-sm leading-relaxed"
          >
            Jelajahi geografi dengan cara yang interaktif, kumpulkan XP, dan raih posisi teratas di kelasmu.
          </motion.p>
        </div>

        <div className="relative z-10 flex items-center gap-4 mt-12 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm max-w-sm">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
            <Globe2 className="w-6 h-6 text-blue-300" />
          </div>
          <p className="text-sm text-blue-100/90 font-medium leading-relaxed">
            Jadikan setiap materi geografi sebagai misi seru untuk ditaklukkan.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (Form) ── */}
      <div className="w-full md:w-7/12 lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative">
        <div className="max-w-md w-full mx-auto">
          
          <div className="md:hidden mb-10">
             <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Beranda</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 mb-2">
              {isForgotPassword ? 'Lupa Kata Sandi?' : 'Selamat Datang! 👋'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isForgotPassword 
                ? (resetSent ? 'Cek kotak masuk email Anda' : 'Masukkan identitas untuk mereset kata sandi')
                : 'Silakan masuk untuk melanjutkan.'
              }
            </p>
          </div>

          {/* Form */}
          <motion.form 
            id="tour-login-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} 
            className="space-y-5" 
            suppressHydrationWarning
          >
            {/* Email / NIPD */}
            <div suppressHydrationWarning>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Identitas (Nama / Email / NIPD)
              </label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="Contoh: Budi Santoso atau 2024001"
                />
              </div>
            </div>

            {/* Password */}
            <AnimatePresence mode="wait">
              {!isForgotPassword && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  suppressHydrationWarning
                >
                  <label htmlFor="login-password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 mt-5">
                    Kata Sandi
                  </label>
                  <div className="relative group" suppressHydrationWarning>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required={!isForgotPassword}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      suppressHydrationWarning
                      className="w-full rounded-xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3.5 pr-12 text-sm text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Alert Messages */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="rounded-xl px-4 py-3 bg-red-50 border border-red-100 mt-4"
                >
                  <p className="text-xs text-red-600 font-medium">❌ {error}</p>
                </motion.div>
              )}
              {resetSent && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="rounded-xl px-4 py-3 bg-green-50 border border-green-100 mt-4"
                >
                  <p className="text-xs text-green-700 font-medium">✅ Tautan reset telah dikirim! Silakan periksa email Anda.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white transition-all disabled:opacity-70 disabled:hover:scale-100 disabled:hover:y-0 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 overflow-hidden"
              >
                {/* Button background with hover effect */}
                <div className="absolute inset-0 bg-slate-800 transition-colors group-hover:bg-blue-600" />
                
                <span className="relative z-10 flex items-center gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Memproses...' : isForgotPassword ? 'Kirim Tautan' : 'Masuk ke Platform'}
                </span>
              </motion.button>
            </div>
          </motion.form>

          {/* Toggle Forgot Password */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center md:text-left"
          >
            <button
              type="button"
              onClick={() => { setIsForgotPassword(!isForgotPassword); setError(null); setResetSent(false); }}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
              {isForgotPassword ? '← Kembali ke halaman masuk' : 'Lupa kata sandi?'}
            </button>
          </motion.div>

          {/* Bottom Footer Area */}
          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center md:justify-start gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              GeoLearning Platform
            </span>
          </div>

        </div>
      </div>

    </motion.div>
  )
}
