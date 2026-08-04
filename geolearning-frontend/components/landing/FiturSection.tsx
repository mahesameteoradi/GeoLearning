'use client'

import { Globe, MapPin, Award, Users } from 'lucide-react'
import { motion, Variants } from 'framer-motion'

export default function FiturSection() {
  const features = [
    {
      title: 'Soal Pilihan Ganda',
      description: 'Latih pemahaman dasar dengan kuis interaktif yang memberikan feedback instan dan pembahasan lengkap.',
      icon: <Globe className="w-8 h-8 text-blue-500" />,
      bg: 'bg-blue-50/80 border-blue-100',
      shadow: 'hover:shadow-blue-500/20',
    },
    {
      title: 'Soal Peta/Lokasi',
      description: 'Tandai titik presisi di atas peta nyata! Skor dihitung otomatis berdasarkan kedekatan jarak jawaban Anda (ala GeoGuessr).',
      icon: <MapPin className="w-8 h-8 text-emerald-500" />,
      bg: 'bg-emerald-50/80 border-emerald-100',
      shadow: 'hover:shadow-emerald-500/20',
    },
    {
      title: 'Sistem Gamifikasi',
      description: 'Kumpulkan XP dari setiap jawaban benar, penuhi progress bar, dapatkan badge, dan bersaing di papan peringkat kelas.',
      icon: <Award className="w-8 h-8 text-amber-500" />,
      bg: 'bg-amber-50/80 border-amber-100',
      shadow: 'hover:shadow-amber-500/20',
    },
    {
      title: 'Manajemen Kelas Mudah',
      description: 'Guru cukup membagikan kode kelas, dan siswa dapat bergabung dalam satu klik tanpa proses registrasi yang membingungkan.',
      icon: <Users className="w-8 h-8 text-purple-500" />,
      bg: 'bg-purple-50/80 border-purple-100',
      shadow: 'hover:shadow-purple-500/20',
    },
  ]

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 12 } }
  }

  return (
    <section id="fitur" className="py-24 bg-white border-t border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Fitur Unggulan</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Pengalaman belajar geografi yang dirancang khusus untuk meningkatkan partisipasi dan pemahaman melalui pendekatan bermain (gamifikasi).
          </p>
        </motion.div>

        <motion.div 
          id="tour-landing-fitur"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((f, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              className={`group p-8 rounded-[2rem] bg-white border border-slate-200/60 hover:border-transparent hover:shadow-2xl ${f.shadow} transition-all duration-300 relative overflow-hidden hover:-translate-y-2`}
            >
              <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${f.bg} opacity-50 -z-10 transition-transform duration-500 group-hover:scale-[2]`} />
              <div className={`w-16 h-16 rounded-2xl ${f.bg} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border backdrop-blur-sm`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm font-medium">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
