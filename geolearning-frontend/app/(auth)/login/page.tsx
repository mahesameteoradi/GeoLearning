'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Eye, EyeOff, Loader2, BookOpen, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { loginPageSteps } from '@/lib/utils/tourSteps'

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
      // If it doesn't contain '@', it might be a student's NIPD or Name. Resolve it via backend.
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
              // Fallback to default domain if not found, to allow standard Supabase error message
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

      // Get profile from database to ensure correct role
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
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="overflow-hidden rounded-2xl bg-white"
      style={{
        border: '1px solid #E2E8F0',
        boxShadow: '0 20px 50px rgba(0,0,0,0.08), 0 4px 16px rgba(37,99,235,0.06)',
      }}>
      <OnboardingTour tourKey="login_page" steps={loginPageSteps} />
      {/* Top accent line — blue gradient like a ruler */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #2563EB, #0EA5E9, #10B981)' }} />

      <div className="p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-4 relative inline-flex"
          >
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg bg-white overflow-hidden border border-slate-200 cursor-pointer"
              style={{
                boxShadow: '0 8px 24px rgba(37,99,235,0.1)',
              }}>
              <img src="/logo.png" alt="GeoLearning Logo" className="h-full w-full object-cover" />
            </motion.div>
          </motion.div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {isForgotPassword ? 'Lupa Kata Sandi?' : 'Selamat Datang Kembali!'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {isForgotPassword 
              ? (resetSent ? 'Cek kotak masuk email Anda' : 'Masukkan email untuk mereset kata sandi')
              : 'Masuk untuk melanjutkan perjalanan belajarmu 📖'
            }
          </p>
        </div>

        {/* Form */}
        <motion.form 
          id="tour-login-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className="space-y-4" suppressHydrationWarning
        >
          {/* Email */}
          <div suppressHydrationWarning>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email, NIPD, atau Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Contoh: Budi Santoso atau 2024001"
                />
              </div>
          </div>

          {/* Password */}
          {!isForgotPassword && (
            <div suppressHydrationWarning>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kata Sandi
              </label>
              <div className="relative" suppressHydrationWarning>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required={!isForgotPassword}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  suppressHydrationWarning
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all bg-slate-50"
                  style={{ border: '1.5px solid #E2E8F0' }}
                  onFocus={(e) => { e.target.style.border = '1.5px solid #2563EB'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)' }}
                  onBlur={(e) => { e.target.style.border = '1.5px solid #E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="rounded-xl px-4 py-2.5 bg-red-50 border border-red-200 overflow-hidden"
              >
                <p className="text-xs text-red-600">❌ {error}</p>
              </motion.div>
            )}
            {resetSent && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="rounded-xl px-4 py-2.5 bg-emerald-50 border border-emerald-200 overflow-hidden"
              >
                <p className="text-xs text-emerald-600">✅ Tautan reset telah dikirim! Silakan periksa email Anda.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-60 hover:shadow-lg hover:shadow-blue-500/30"
            style={{
              background: loading ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #0EA5E9)',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Memproses…' : isForgotPassword ? 'Kirim Tautan Reset' : '🎓 Masuk Sekarang'}
          </motion.button>
        </motion.form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-center"
        >
          <button
            type="button"
            onClick={() => { setIsForgotPassword(!isForgotPassword); setError(null); setResetSent(false); }}
            className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isForgotPassword ? 'Kembali ke halaman masuk' : 'Lupa kata sandi?'}
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex items-center justify-center gap-1.5"
        >
          <BookOpen className="h-3 w-3 text-blue-400" />
          <span className="text-[10px] font-medium text-slate-500">
            Platform Belajar Geografi Interaktif
          </span>
          <Sparkles className="h-3 w-3 text-amber-600" />
        </motion.div>
      </div>
    </motion.div>
  )
}
