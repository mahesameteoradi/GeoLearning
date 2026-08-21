'use client'
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CTASection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto rounded-[3rem] overflow-hidden relative">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-blue-600" />
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-[100px]" />

        <div className="relative z-10 px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 text-sm font-semibold mb-8">
            <Zap className="w-4 h-4 text-amber-300" />
            Mulai Sekarang Juga
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Siap Memulai Petualangan Belajar?
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Masuk ke akun Anda sekarang dan lihat sejauh mana kemampuan geografi Anda berkembang dengan tantangan interaktif.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Link 
              href="/login"
              className="group relative inline-flex items-center gap-3 bg-white text-blue-900 px-10 py-5 rounded-2xl font-extrabold text-lg transition-all shadow-md shadow-blue-900/20 hover:shadow-md hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Masuk ke Dashboard
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </motion.div>
        </motion.div>
        </div>
      </div>
    </section>
  )
}
