'use client'
import Link from 'next/link'
import { ShieldCheck, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

export default function UntukGuruSection() {
  return (
    <section id="untuk-guru" className="py-24 bg-white border-y border-slate-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, type: "spring", stiffness: 100, damping: 20 }}
          className="bg-slate-800 rounded-[2.5rem] overflow-hidden relative shadow-md shadow-blue-900/40 border border-slate-800"
        >
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/4 mix-blend-overlay" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500 rounded-full blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/4 mix-blend-overlay" />
          
          <div className="relative p-10 md:p-16 flex flex-col md:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
              className="md:w-1/3 flex justify-center"
            >
              <div className="w-32 h-32 bg-slate-800/50 rounded-[2rem] flex items-center justify-center backdrop-blur-md border border-slate-700 shadow-inner">
                <ShieldCheck className="w-16 h-16 text-blue-400 drop-shadow-md" />
              </div>
            </motion.div>
            <div className="md:w-2/3 text-center md:text-left text-white">
              <motion.h2 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight"
              >
                Mengapa Tidak Ada Tombol Daftar?
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-slate-400 text-lg mb-10 leading-relaxed max-w-2xl font-medium"
              >
                Untuk menjaga keamanan dan eksklusivitas lingkungan belajar, platform kami <strong>tidak melayani pendaftaran akun mandiri</strong>. Semua akun diprovisioning (dibuatkan) secara resmi oleh pihak Sekolah atau Guru Anda.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
              >
                <Link 
                  href="/login"
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-900/50 hover:-translate-y-1 border border-blue-500"
                >
                  Sudah punya akun? Masuk
                </Link>
                <a 
                  href="mailto:admin@sekolah.edu"
                  className="flex items-center justify-center gap-2 bg-slate-800/50 backdrop-blur-sm text-slate-300 border border-slate-700 px-8 py-4 rounded-2xl font-bold transition-all hover:bg-slate-700 hover:text-white hover:-translate-y-1"
                >
                  <Mail className="w-5 h-5" />
                  Hubungi Admin
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
