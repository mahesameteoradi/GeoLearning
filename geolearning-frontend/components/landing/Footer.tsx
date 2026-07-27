import { Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 opacity-90">
          <Globe className="w-6 h-6 text-blue-500" />
          <span className="text-xl font-bold text-white tracking-tight">GeoLearning</span>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-400">
          <a href="#" className="hover:text-white transition-colors">Tentang</a>
          <a href="#" className="hover:text-white transition-colors">Kontak</a>
          <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
          <a href="#" className="hover:text-white transition-colors">Syarat Layanan</a>
        </div>
        
        <div className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} GeoLearning. Semua hak cipta dilindungi.
        </div>
      </div>
    </footer>
  )
}
