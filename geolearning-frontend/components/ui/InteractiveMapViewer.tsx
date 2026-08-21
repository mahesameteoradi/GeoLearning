'use client'

import dynamic from 'next/dynamic'
import { InteractiveMapData } from '@/components/teacher/InteractiveMapEditorClient'
import { MapPin } from 'lucide-react'

const InteractiveMapViewerClient = dynamic(
  () => import('./InteractiveMapViewerClient'),
  { ssr: false, loading: () => <div className="h-[85vh] w-[95vw] max-w-7xl bg-white rounded-2xl flex flex-col items-center justify-center animate-pulse"><MapPin className="h-10 w-10 text-slate-300 mb-4" /><p className="text-slate-500 font-semibold">Memuat Peta...</p></div> }
)

interface Props {
  title: string
  dataString: string | null
  onClose: () => void
}

export function InteractiveMapViewer({ title, dataString, onClose }: Props) {
  let data: InteractiveMapData | null = null
  
  if (dataString) {
    try {
      data = JSON.parse(dataString)
    } catch (e) {
      console.error("Invalid map data")
    }
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-[100] flex items-start overflow-y-auto justify-center p-4 py-8 md:py-12" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
        <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
          <p className="text-red-600 font-semibold mb-4">Gagal memuat data peta</p>
          <button onClick={onClose} className="bg-slate-50 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold w-full">Tutup</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start overflow-y-auto justify-center p-4 py-8 md:py-12" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <InteractiveMapViewerClient title={title} data={data} onClose={onClose} />
    </div>
  )
}
