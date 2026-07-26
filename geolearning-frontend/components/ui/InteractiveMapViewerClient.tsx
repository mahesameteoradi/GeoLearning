'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { InteractiveMapData } from '@/components/teacher/InteractiveMapEditorClient'
import { X, MapPin } from 'lucide-react'

// Fix missing marker icons in leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

interface Props {
  title: string
  data: InteractiveMapData
  onClose: () => void
}

export default function InteractiveMapViewerClient({ title, data, onClose }: Props) {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null)
  
  // Cache initial center and zoom to prevent MapContainer re-renders crashing Leaflet
  const [initialCenter] = useState<[number, number]>([data.center.lat, data.center.lng])
  const [initialZoom] = useState(data.zoom)

  const activeMarker = data.markers.find(m => m.id === activeMarkerId)

  return (
    <div className="flex h-[85vh] w-[95vw] max-w-7xl flex-col md:flex-row overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl">
      {/* Map Area */}
      <div className="flex-1 relative bg-slate-100 z-0 h-full w-full">
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          
          {data.markers.map((m) => (
            <Marker 
              key={m.id} 
              position={[m.lat, m.lng]} 
              icon={icon} 
              eventHandlers={{ click: () => setActiveMarkerId(m.id) }}
            >
              <Popup>
                <div className="font-bold text-slate-800">{m.title}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Top Header overlay */}
        <div className="absolute top-4 left-4 z-[400] flex items-center gap-3 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Peta Interaktif</p>
            <h1 className="text-sm font-extrabold text-slate-900 max-w-[250px] truncate">{title}</h1>
          </div>
        </div>

        {/* Close Button Mobile Overlay */}
        <button onClick={onClose} className="absolute top-4 right-4 z-[400] p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 text-slate-600 md:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar Area */}
      <div className="w-full md:w-96 flex flex-col border-l border-slate-200 bg-white z-10">
        <div className="p-4 border-b border-slate-200 bg-slate-50 hidden md:flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Detail Lokasi</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {activeMarker ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {activeMarker.imageUrl && (
                <div className="w-full aspect-video bg-slate-100 overflow-hidden">
                  <img src={activeMarker.imageUrl} alt={activeMarker.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-black text-slate-900 leading-tight">{activeMarker.title}</h3>
                <div className="h-1 w-12 bg-blue-600 rounded-full" />
                
                {activeMarker.description ? (
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {activeMarker.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-slate-400">Tidak ada deskripsi untuk lokasi ini.</p>
                )}
                
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <p className="text-[10px] font-mono text-slate-400">Koordinat: {activeMarker.lat.toFixed(4)}, {activeMarker.lng.toFixed(4)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <MapPin className="h-12 w-12 text-slate-200 mb-4" />
              <p className="font-semibold text-slate-600">Pilih Lokasi</p>
              <p className="text-sm mt-1">Klik salah satu pin di peta untuk melihat detail informasi geografisnya.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
