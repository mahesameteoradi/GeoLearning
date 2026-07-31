'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, Loader2, BookOpen, Sparkles, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function UpdatePasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Verify that the user has a valid session for updating password
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Just let them try, if no session then updateUser fails.
      }
    }
    checkSession()
  }, [supabase.auth])

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    if (password.length < 6) {
      setError('Kata sandi harus minimal 6 karakter')
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      setError('Gagal memperbarui kata sandi. Tautan mungkin kadaluwarsa.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2000)
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

      {/* Top accent line */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #10B981, #0EA5E9)' }} />

      <div className="p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-4 relative inline-flex"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg bg-emerald-50 border border-emerald-100">
              <KeyRound className="h-8 w-8 text-emerald-600" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Perbarui Kata Sandi
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Masukkan kata sandi baru untuk akun Anda
          </p>
        </div>

        {/* Form */}
        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl px-4 py-6 bg-emerald-50 border border-emerald-200 text-center"
          >
            <p className="text-sm font-semibold text-emerald-700">✅ Kata sandi berhasil diperbarui!</p>
            <p className="text-xs text-emerald-600 mt-2">Mengarahkan ke halaman masuk...</p>
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleUpdatePassword} className="space-y-4"
          >
            {/* Password */}
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all bg-slate-50"
                  style={{ border: '1.5px solid #E2E8F0' }}
                  onFocus={(e) => { e.target.style.border = '1.5px solid #10B981'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }}
                  onBlur={(e) => { e.target.style.border = '1.5px solid #E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all bg-slate-50"
                  style={{ border: '1.5px solid #E2E8F0' }}
                  onFocus={(e) => { e.target.style.border = '1.5px solid #10B981'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)' }}
                  onBlur={(e) => { e.target.style.border = '1.5px solid #E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Error */}
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
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-60 hover:shadow-lg hover:shadow-emerald-500/30"
              style={{
                background: loading ? '#6EE7B7' : 'linear-gradient(135deg, #10B981, #059669)',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Menyimpan…' : 'Simpan Kata Sandi'}
            </motion.button>
          </motion.form>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            Kembali ke halaman masuk
          </button>
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex items-center justify-center gap-1.5"
        >
          <BookOpen className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-medium text-slate-500">
            Platform Belajar Geografi Interaktif
          </span>
          <Sparkles className="h-3 w-3 text-amber-600" />
        </motion.div>
      </div>
    </motion.div>
  )
}
