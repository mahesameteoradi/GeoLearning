'use client'
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CTASection() {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/30 rounded-full blur-[100px]" />

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-sm font-semibold mb-8">
            <Zap className="w-4 h-4 text-yellow-400" />
            Mulai Sekarang Juga
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Siap Memulai Petualangan Belajar?
          </h2>
          <p className="text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Masuk ke akun Anda sekarang dan lihat sejauh mana kemampuan geografi Anda berkembang dengan tantangan interaktif.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Link 
              href="/login"
              className="group relative inline-flex items-center gap-3 bg-white text-blue-900 px-10 py-5 rounded-2xl font-extrabold text-lg transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Masuk ke Dashboard
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 rounded-2xl ring-2 ring-white/50 ring-offset-4 ring-offset-blue-900 animate-pulse" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
