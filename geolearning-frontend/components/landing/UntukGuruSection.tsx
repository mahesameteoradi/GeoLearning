import Link from 'next/link'
import { ShieldCheck, Mail } from 'lucide-react'

export default function UntukGuruSection() {
  return (
    <section id="untuk-guru" className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl overflow-hidden relative shadow-2xl">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-900 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative p-10 md:p-16 flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/3 flex justify-center">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                <ShieldCheck className="w-16 h-16 text-white" />
              </div>
            </div>
            <div className="md:w-2/3 text-center md:text-left text-white">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6">Mengapa Tidak Ada Tombol Daftar?</h2>
              <p className="text-blue-100 text-lg mb-10 leading-relaxed max-w-2xl">
                Untuk menjaga keamanan dan eksklusivitas lingkungan belajar, platform kami <strong>tidak melayani pendaftaran akun mandiri</strong>. Semua akun diprovisioning (dibuatkan) secara resmi oleh pihak Sekolah atau Guru Anda.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link 
                  href="/login"
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold transition-all hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-900/20"
                >
                  Sudah punya akun? Masuk
                </Link>
                <a 
                  href="mailto:admin@sekolah.edu"
                  className="flex items-center justify-center gap-2 bg-blue-700/50 text-white border border-blue-500 px-8 py-4 rounded-xl font-bold transition-all hover:bg-blue-700"
                >
                  <Mail className="w-5 h-5" />
                  Hubungi Admin Sekolah
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
