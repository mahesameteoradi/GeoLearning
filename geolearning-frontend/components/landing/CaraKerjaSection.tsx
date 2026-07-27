'use client'
import { useState } from 'react'

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

  return (
    <section id="cara-kerja" className="py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Cara Kerja</h2>
          <p className="text-lg text-slate-600">Alur penggunaan yang sangat simpel dan terarah.</p>
        </div>

        <div className="flex justify-center gap-4 mb-16">
          <button 
            onClick={() => setActiveTab('guru')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${activeTab === 'guru' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
          >
            Untuk Guru
          </button>
          <button 
            onClick={() => setActiveTab('siswa')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${activeTab === 'siswa' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
          >
            Untuk Siswa
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-[24px] left-[12%] right-[12%] h-[2px] bg-slate-200 -z-10" />
          
          {steps.map((step, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative z-10 flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg text-white mb-6 shadow-md ${activeTab === 'guru' ? 'bg-blue-600 shadow-blue-200' : 'bg-emerald-600 shadow-emerald-200'}`}>
                {step.num}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
