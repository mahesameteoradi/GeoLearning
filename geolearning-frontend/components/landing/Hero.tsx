'use client'

import Link from 'next/link'
import { ArrowRight, MapPin, Trophy, Star } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative pt-28 pb-24 sm:pt-40 sm:pb-32 overflow-hidden bg-slate-50">
      {/* Background Decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] bg-gradient-to-tr from-blue-300/40 via-emerald-200/20 to-purple-300/30 rounded-full blur-3xl -z-10" />
      
      <motion.div 
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-24 right-10 md:right-32 opacity-60"
      >
        <MapPin className="w-12 h-12 text-blue-500 drop-shadow-lg" />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-20 left-10 md:left-32 opacity-60"
      >
        <Trophy className="w-12 h-12 text-amber-500 drop-shadow-lg" />
      </motion.div>
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-48 left-16 md:left-24"
      >
        <Star className="w-8 h-8 text-emerald-500 drop-shadow-lg" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 border border-white/80 text-blue-700 text-sm font-bold mb-8 shadow-sm backdrop-blur-md"
        >
          <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]"></span>
          Platform Pembelajaran Geografi Interaktif
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl leading-tight"
        >
          Jelajahi Dunia dengan <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500">
            Cara yang Menyenangkan
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed"
        >
          Tingkatkan pemahaman geografi Anda melalui kuis interaktif, tantangan menebak peta lokasi, dan sistem gamifikasi yang membuat belajar tidak pernah membosankan.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link 
            href="/login" 
            className="group relative inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
            Masuk
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="#fitur" 
            className="inline-flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 border-2 border-slate-200/80 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:border-slate-300 hover:shadow-sm"
          >
            Pelajari Fitur
          </a>
        </motion.div>
      </div>
    </section>
  )
}
