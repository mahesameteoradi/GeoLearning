'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
      },
    })

    if (signUpError) {
      // Supabase kadang mengembalikan error 500 tanpa message yang jelas
      const msg =
        signUpError.message && signUpError.message !== '{}'
          ? signUpError.message
          : `Registration failed (status ${(signUpError as any).status ?? 'unknown'}). ` +
            'This may be caused by a database configuration issue. Please contact admin.'
      setError(msg)
      setLoading(false)
      return
    }

    // Session exists → langsung redirect ke dashboard tanpa konfirmasi email
    if (data.session) {
      router.push('/auth/callback?code=already_signed_in')
      return
    }

    // Jika session tidak ada, kemungkinan Supabase masih membutuhkan konfirmasi email
    setError('Registration failed: email confirmation may still be enabled on the server. Please contact admin.')
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-black/5">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-lg shadow-cyan-900/50">
          <GraduationCap className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Start your journey
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create your account and start earning XP
        </p>
        {/* Perks */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {['🏆 Earn Badges', '⚡ Level Up', '🌟 Leaderboard'].map((p) => (
            <span
              key={p}
              className="rounded-full border border-blue-300 bg-violet-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Register Form */}
      <form onSubmit={handleRegister} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-500">
            Full name
          </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-500">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-500">
              Password <span className="text-slate-600">(min. 8 characters)</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-cyan-600 to-violet-600 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-500 hover:to-violet-500 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Sign in
        </Link>
      </p>
    </div>
  )
}
