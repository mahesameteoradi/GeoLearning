'use client'
import { useState } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'

export default function CaraKerjaSection() {
  const [activeTab, setActiveTab] = useState<'guru' | 'siswa'>('guru')

  const stepsGuru = [
    { num: 1, title: 'Akun Dibuatkan', desc: 'Dapatkan email & password awal dari Admin Sekolah.' },
    { num: 2, title: 'Login & Amankan Akun', desc: 'Masuk ke sistem dan ganti password awal Anda.' },
    { num: 3, title: 'Kelola Kelas', desc: 'Buat kelas baru dan undang siswa (atau daftarkan otomatis).' },
    { num: 4, title: 'Publish Kuis', desc: 'Buat kuis seru dan pantau statistik nilai serta XP siswa.' },
  ]

  const stepsSiswa = [
    { num: 1, title: 'Menerima Akun', desc: 'Dapatkan NIS/email & password awal dari Guru Anda.' },
    { num: 2, title: 'Login Pertama', desc: 'Masuk ke sistem dan ubah password agar akun aman.' },
    { num: 3, title: 'Masuk Kelas', desc: 'Temukan kelas yang sudah Anda ikuti di dashboard.' },
    { num: 4, title: 'Mulai Belajar', desc: 'Kerjakan kuis, kumpulkan XP, dan raih posisi teratas!' },
  ]

  const steps = activeTab === 'guru' ? stepsGuru : stepsSiswa

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
  }

  return (
    <section id="cara-kerja" className="py-24 bg-slate-50 relative">
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Cara Kerja</h2>
          <p className="text-lg text-slate-600">Alur penggunaan yang sangat simpel dan terarah.</p>
        </motion.div>

        <div className="flex justify-center gap-4 mb-16 relative">
          <button 
            onClick={() => setActiveTab('guru')}
            className={`relative px-8 py-3 rounded-full font-bold text-sm transition-all overflow-hidden ${activeTab === 'guru' ? 'text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {activeTab === 'guru' && (
              <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-blue-600" />
            )}
            <span className="relative z-10">Untuk Guru</span>
          </button>
          <button 
            onClick={() => setActiveTab('siswa')}
            className={`relative px-8 py-3 rounded-full font-bold text-sm transition-all overflow-hidden ${activeTab === 'siswa' ? 'text-white shadow-lg shadow-emerald-500/30' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {activeTab === 'siswa' && (
              <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-emerald-600" />
            )}
            <span className="relative z-10">Untuk Siswa</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative"
          >
            {/* Connecting line for desktop */}
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block absolute top-[28px] left-[12%] right-[12%] h-[2px] bg-slate-200 -z-10 origin-left" 
            />
            
            {steps.map((step, i) => (
              <motion.div 
                key={`${activeTab}-${step.num}`} 
                variants={itemVariants}
                className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm relative z-10 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300 group"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-xl text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 ${activeTab === 'guru' ? 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/40' : 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/40'}`}>
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
