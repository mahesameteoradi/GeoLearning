'use client'

import { Globe, MapPin, Map, Award, Users, CheckCircle2 } from 'lucide-react'
import { motion, Variants } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export default function FiturSection() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  }

  return (
    <section id="fitur" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-2xl"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 mb-6 tracking-tighter leading-tight">
            Pembelajaran Interaktif yang <span className="text-blue-600">Dirancang Khusus</span>
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Tidak ada lagi tugas membaca yang membosankan. GeoLearning menggabungkan gamifikasi dengan peta interaktif untuk meningkatkan partisipasi kelas Anda.
          </p>
        </motion.div>

        <motion.div 
          id="tour-landing-fitur"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          
          {/* Bento Item 1: Large Soal Peta */}
          <motion.div variants={itemVariants} className="md:col-span-2 relative rounded-[2rem] bg-blue-50 border border-blue-100 overflow-hidden flex flex-col sm:flex-row group transition-all hover:shadow-md hover:shadow-blue-900/5">
            <div className="p-8 sm:w-1/2 flex flex-col justify-center">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-6 text-white shadow-sm">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Peta Tematik Sebaran</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Pelajari persebaran fenomena geografi melalui peta tematik interaktif yang dirancang khusus untuk memudahkan pemahaman spasial.
              </p>
            </div>
            <div className="sm:w-1/2 bg-blue-100/50 relative overflow-hidden min-h-[200px] flex items-center justify-center p-6">
               <div className="w-full h-full bg-white rounded-xl shadow-sm border border-blue-200 p-4 relative transform group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                  <div className="absolute inset-0 opacity-15 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-cover bg-center" />
                  {/* Thematic Map Overlay Visualization */}
                  <div className="absolute inset-0 opacity-60">
                    <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-rose-400 rounded-full blur-xl mix-blend-multiply" />
                    <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-green-400 rounded-full blur-xl mix-blend-multiply" />
                    <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-amber-400 rounded-full blur-xl mix-blend-multiply" />
                    <div className="absolute bottom-1/3 right-1/4 w-14 h-14 bg-blue-400 rounded-full blur-xl mix-blend-multiply" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 rounded-full flex items-center justify-center backdrop-blur-sm shadow-md border border-slate-100 animate-pulse">
                     <Map className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm border border-blue-200">
                    Persebaran Flora & Fauna
                  </div>
               </div>
            </div>
          </motion.div>

          {/* Bento Item 2: Soal Pilihan Ganda */}
          <motion.div variants={itemVariants} className="md:col-span-1 rounded-[2rem] bg-slate-50 border border-slate-200 p-8 flex flex-col group transition-all hover:shadow-md hover:shadow-slate-200">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-6 text-slate-600 shadow-sm group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Kuis Interaktif</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Latih pemahaman dasar dengan soal pilihan ganda yang memberikan feedback instan dan pembahasan lengkap.
            </p>
            
            <div className="mt-8 space-y-2">
               <div className="h-2 w-full bg-green-100 rounded-full overflow-hidden">
                 <div className="h-full bg-green-500 w-[80%]" />
               </div>
               <div className="h-2 w-full bg-rose-100 rounded-full overflow-hidden">
                 <div className="h-full bg-rose-500 w-[20%]" />
               </div>
            </div>
          </motion.div>

          {/* Bento Item 3: Gamifikasi */}
          <motion.div variants={itemVariants} className="md:col-span-1 rounded-[2rem] bg-slate-800 border border-slate-800 p-8 flex flex-col text-white group transition-all hover:shadow-md hover:shadow-blue-900/30">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6 text-amber-400 shadow-sm group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Sistem XP & Level</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Kumpulkan XP dari setiap jawaban benar, penuhi progress bar, dapatkan badge keren, dan naik level.
            </p>
            
            <div className="mt-8 flex -space-x-2">
               <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-slate-800 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
               <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-slate-800 flex items-center justify-center"><Award className="w-5 h-5" /></div>
            </div>
          </motion.div>

          {/* Bento Item 4: Manajemen Kelas */}
          <motion.div variants={itemVariants} className="md:col-span-2 relative rounded-[2rem] bg-white border border-slate-200 overflow-hidden flex flex-col sm:flex-row group transition-all hover:shadow-md hover:shadow-slate-200">
            <div className="p-8 sm:w-1/2 flex flex-col justify-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 text-blue-600 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Manajemen Kelas</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Pantau progres ratusan siswa dalam satu layar. Bagikan kode kelas, dan siswa dapat bergabung dengan satu klik tanpa registrasi manual.
              </p>
            </div>
            <div className="sm:w-1/2 bg-slate-50 relative overflow-hidden flex items-center justify-center p-6 border-l border-slate-100">
               {/* Mockup Dashboard Table */}
               <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 p-3 transform group-hover:scale-105 transition-transform duration-500 rotate-2">
                 <div className="flex gap-2 mb-3 border-b border-slate-100 pb-2">
                   <div className="w-8 h-2 bg-slate-200 rounded-full" />
                   <div className="w-16 h-2 bg-slate-200 rounded-full" />
                 </div>
                 {[1, 2, 3].map(i => (
                   <div key={i} className="flex items-center gap-3 mb-2">
                     <div className="w-6 h-6 rounded-full bg-blue-100" />
                     <div className="w-1/2 h-2 bg-slate-50 rounded-full" />
                     <div className="w-1/4 h-2 bg-green-100 rounded-full ml-auto" />
                   </div>
                 ))}
               </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
      `}} />
    </section>
  )
}
