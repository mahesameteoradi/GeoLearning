'use client'

import Link from 'next/link'
import { ArrowRight, MapPin, Target, Sparkles, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden bg-slate-50">
      {/* Background - Very subtle dots instead of heavy mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left: Content */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Platform Gamifikasi Geografi
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-extrabold tracking-tighter text-slate-900 mb-6 leading-[1.05]"
          >
            Jelajahi Dunia dengan <br className="hidden md:block"/>
            <span className="text-indigo-600">
              Cara yang Menyenangkan
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
          >
            Tingkatkan pemahaman geografi Anda melalui kuis interaktif, tantangan menebak lokasi, dan sistem progres gamifikasi.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <Link 
              href="/login" 
              className="group flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold transition-colors"
            >
              Mulai Belajar Sekarang
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#fitur" 
              className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold transition-colors hover:bg-slate-50 hover:border-slate-300 shadow-sm"
            >
              Lihat Fitur
            </a>
          </motion.div>
        </div>

        {/* Right: Bento-style Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex-1 w-full max-w-lg lg:max-w-none relative"
        >
          <div className="relative aspect-square lg:aspect-[4/3] rounded-3xl bg-slate-100 border border-slate-200 shadow-2xl shadow-indigo-900/5 overflow-hidden flex items-center justify-center">
            
            {/* Mockup Map Background */}
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }} />
            
            {/* Interactive Cards */}
            <div className="relative z-10 w-full p-8 flex flex-col gap-4">
              
              {/* Card 1: Map Pin */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-slate-200/50 flex items-start gap-4 max-w-sm ml-auto"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tebak Lokasi Negara</h3>
                  <p className="text-xs text-slate-500 mt-1">Identifikasi batas negara di peta buta dengan akurasi 100%.</p>
                </div>
              </motion.div>

              {/* Card 2: XP / Gamification */}
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-4 max-w-xs"
              >
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-amber-400 flex items-center justify-center font-bold text-xs text-amber-900">1</div>
                  <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-emerald-400 flex items-center justify-center font-bold text-xs text-emerald-900">2</div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Sistem Level</h3>
                  <p className="text-xs text-slate-400 mt-1">+150 XP diperoleh hari ini</p>
                </div>
              </motion.div>
              
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  )
}
