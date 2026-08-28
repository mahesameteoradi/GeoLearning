import { Loader2 } from 'lucide-react'

export default function StudentLoading() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <div className="space-y-1 text-center">
          <h3 className="text-sm font-bold text-slate-700">Memuat Data...</h3>
          <p className="text-xs text-slate-500">Menyiapkan halaman untuk Anda</p>
        </div>
      </div>
    </div>
  )
}
