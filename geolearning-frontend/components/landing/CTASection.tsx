import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="py-24 bg-white text-center">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Siap Memulai Petualangan Belajar?</h2>
        <p className="text-xl text-slate-600 mb-10">
          Masuk ke akun Anda sekarang dan lihat sejauh mana kemampuan geografi Anda berkembang.
        </p>
        <Link 
          href="/login"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-xl"
        >
          Masuk ke Dashboard
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  )
}
