import { Globe } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-slate-950 py-16 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-3 opacity-90 group cursor-pointer">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
            <Globe className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400">GeoLearning</span>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-8 text-sm font-medium text-slate-400">
          <Link href="#" className="hover:text-blue-400 transition-colors">Tentang</Link>
          <Link href="#" className="hover:text-blue-400 transition-colors">Kontak</Link>
          <Link href="#" className="hover:text-blue-400 transition-colors">Kebijakan Privasi</Link>
          <Link href="#" className="hover:text-blue-400 transition-colors">Syarat Layanan</Link>
        </div>
        
        <div className="text-slate-500 text-sm font-medium">
          &copy; {new Date().getFullYear()} GeoLearning. Semua hak cipta dilindungi.
        </div>
      </div>
    </footer>
  )
}
