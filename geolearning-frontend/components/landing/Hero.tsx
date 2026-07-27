import Link from 'next/link'
import { ArrowRight, MapPin, Trophy, Star } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative pt-20 pb-24 sm:pt-32 sm:pb-32 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-3xl -z-10" />
      <div className="absolute top-20 right-10 md:right-32 animate-bounce-slow opacity-60">
        <MapPin className="w-12 h-12 text-blue-500" />
      </div>
      <div className="absolute bottom-20 left-10 md:left-32 animate-bounce-slow delay-1000 opacity-60">
        <Trophy className="w-12 h-12 text-amber-500" />
      </div>
      <div className="absolute top-40 left-20 animate-pulse opacity-40">
        <Star className="w-8 h-8 text-emerald-500" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100 text-blue-600 text-sm font-semibold mb-8 shadow-sm backdrop-blur-sm animate-fade-in-up">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          Platform Pembelajaran Geografi Interaktif
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl leading-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          Jelajahi Dunia dengan <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Cara yang Menyenangkan</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Tingkatkan pemahaman geografi Anda melalui kuis interaktif, tantangan menebak peta lokasi, dan sistem gamifikasi yang membuat belajar tidak pernah membosankan.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-500/20 hover:-translate-y-1"
          >
            Masuk
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a 
            href="#fitur" 
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:border-slate-300"
          >
            Pelajari Fitur
          </a>
        </div>
      </div>
    </section>
  )
}
