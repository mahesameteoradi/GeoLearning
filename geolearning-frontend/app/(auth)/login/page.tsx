'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Eye, EyeOff, Loader2, BookOpen, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
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
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white"
      style={{
        border: '1px solid #E2E8F0',
        boxShadow: '0 20px 50px rgba(0,0,0,0.08), 0 4px 16px rgba(37,99,235,0.06)',
      }}>

      {/* Top accent line — blue gradient like a ruler */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #2563EB, #0EA5E9, #10B981)' }} />

      <div className="p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 relative inline-flex">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
                boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
              }}>
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 text-lg">✨</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Selamat Datang Kembali!
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Masuk untuk melanjutkan perjalanan belajarmu 📖
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4" suppressHydrationWarning>
          {/* Email */}
          <div suppressHydrationWarning>
            <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Alamat Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              suppressHydrationWarning
              className="w-full rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all bg-slate-50"
              style={{ border: '1.5px solid #E2E8F0' }}
              onFocus={(e) => { e.target.style.border = '1.5px solid #2563EB'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)' }}
              onBlur={(e) => { e.target.style.border = '1.5px solid #E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Password */}
          <div suppressHydrationWarning>
            <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Kata Sandi
            </label>
            <div className="relative" suppressHydrationWarning>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
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

          {/* Error */}
          {error && (
            <div className="rounded-xl px-4 py-2.5 bg-red-50 border border-red-200">
              <p className="text-xs text-red-600">❌ {error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-slate-800 transition-all disabled:opacity-60"
            style={{
              background: loading ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #0EA5E9)',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Memproses…' : '🎓 Masuk Sekarang'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a href="#" className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
            Lupa kata sandi?
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          <BookOpen className="h-3 w-3 text-blue-400" />
          <span className="text-[10px] font-medium text-slate-500">
            Platform Belajar Geografi Interaktif
          </span>
          <Sparkles className="h-3 w-3 text-amber-600" />
        </div>
      </div>
    </div>
  )
}
