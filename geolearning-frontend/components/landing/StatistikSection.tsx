'use client'
import { motion, Variants } from 'framer-motion'

export default function StatistikSection() {
  const stats = [
    { label: 'Siswa Aktif', value: '5,000+' },
    { label: 'Kuis Geografi', value: '250+' },
    { label: 'Guru Terdaftar', value: '100+' },
    { label: 'XP Terkumpul', value: '1M+' },
  ]

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } }
  }

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-slate-200"
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="text-center px-4">
              <div className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-800 to-slate-600 mb-3 drop-shadow-sm">{stat.value}</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
        <p className="text-center text-xs text-slate-400 mt-12 italic">
          *Statistik di atas adalah data ilustrasi. Data asli akan diupdate secara berkala.
        </p>
      </div>
    </section>
  )
}
