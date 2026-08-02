'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { InteractiveMapData } from '@/components/teacher/InteractiveMapEditorClient'
import { X, MapPin, Play, ChevronLeft, ChevronRight, Trophy, Plane, Lightbulb, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const BASE_MAPS = [
  { id: 'satellite', name: 'Satelit (Esri)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA' },
  { id: 'osm', name: 'Standar (OSM)', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors' },
  { id: 'topo', name: 'Topografi', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenTopoMap (CC-BY-SA)' },
  { id: 'light', name: 'Bersih (Light)', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; CARTO' },
]

// Helper component to control map from outside
function MapController({ center, zoom, onFlyStart, onFlyEnd }: { center: [number, number], zoom: number, onFlyStart?: () => void, onFlyEnd?: () => void }) {
  const map = useMap()
  useEffect(() => {
    if (onFlyStart) onFlyStart()
    map.flyTo(center, zoom, { duration: 2.5 })
    const timeout = setTimeout(() => {
      if (onFlyEnd) onFlyEnd()
    }, 2500)
    return () => clearTimeout(timeout)
  }, [center, zoom, map])
  return null
}

interface Props {
  title: string
  data: InteractiveMapData
  onClose?: () => void
  inline?: boolean
}

export default function InteractiveMapViewerClient({ title, data, onClose, inline }: Props) {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null)
  
  const [currentCenter, setCurrentCenter] = useState<[number, number]>([data.center.lat, data.center.lng])
  const [currentZoom, setCurrentZoom] = useState(data.zoom)

  const [tourMode, setTourMode] = useState(false)
  const [tourIndex, setTourIndex] = useState(0)
  const [isFlying, setIsFlying] = useState(false)

  // Track discovered pins to prevent calling API repeatedly in same session
  const [discoveredPins, setDiscoveredPins] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  const activeMarker = data.markers.find(m => m.id === activeMarkerId)
  const activeBaseMap = BASE_MAPS.find(b => b.id === data.baseMapId) || BASE_MAPS[0]

  const handleMarkerClick = async (markerId: string) => {
    setActiveMarkerId(markerId)
    
    // Discovery XP Logic
    if (userId && !discoveredPins.has(markerId)) {
      setDiscoveredPins(prev => new Set(prev).add(markerId))
      
      try {
        const marker = data.markers.find(m => m.id === markerId)
        const res = await fetch('/api/maps/discover-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            pinId: markerId,
            mapTitle: title,
            pinTitle: marker?.title || 'Pin',
            xpAmount: marker?.xpReward ?? 5
          })
        })
        
        const result = await res.json()
        if (result.success && result.isNew) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b'],
            zIndex: 9999
          })
          toast.custom(() => (
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-xl border border-blue-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Lokasi Baru Ditemukan!</p>
                <p className="text-sm text-blue-600 font-semibold">+{result.xpEarned} XP</p>
              </div>
            </div>
          ), { duration: 4000 })
        }
      } catch (e) {
        console.error("Failed to discover pin", e)
      }
    }
  }

  const startTour = () => {
    if (data.markers.length === 0) {
      toast.error("Tidak ada lokasi untuk ditelusuri.")
      return
    }
    setTourMode(true)
    setTourIndex(0)
    const marker = data.markers[0]
    setCurrentCenter([marker.lat, marker.lng])
    setCurrentZoom(10) // Closer zoom for tour
    handleMarkerClick(marker.id)
  }

  const endTour = () => {
    setTourMode(false)
    setCurrentCenter([data.center.lat, data.center.lng])
    setCurrentZoom(data.zoom)
    setActiveMarkerId(null)
  }

  const nextTour = () => {
    if (tourIndex < data.markers.length - 1) {
      const nextIdx = tourIndex + 1
      setTourIndex(nextIdx)
      const marker = data.markers[nextIdx]
      setCurrentCenter([marker.lat, marker.lng])
      handleMarkerClick(marker.id)
    } else {
      endTour()
      toast.success("Tur Selesai!", { icon: '🏆' })
    }
  }

  const prevTour = () => {
    if (tourIndex > 0) {
      const prevIdx = tourIndex - 1
      setTourIndex(prevIdx)
      const marker = data.markers[prevIdx]
      setCurrentCenter([marker.lat, marker.lng])
      handleMarkerClick(marker.id)
    }
  }

  return (
    <div className={
      inline 
        ? "flex min-h-[85vh] md:min-h-0 md:h-[70vh] w-full flex-col md:flex-row overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-xl my-8 relative" 
        : "flex h-[90vh] md:h-[85vh] w-[95vw] max-w-7xl flex-col md:flex-row overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl relative"
    }>
      {/* Map Area */}
      <div className="relative bg-slate-100 z-0 h-[50vh] md:h-full md:flex-1 w-full shrink-0">
        <MapContainer
          center={currentCenter}
          zoom={currentZoom}
          className="h-full w-full z-0"
        >
          <MapController center={currentCenter} zoom={currentZoom} onFlyStart={() => setIsFlying(true)} onFlyEnd={() => setIsFlying(false)} />
          <TileLayer
            key={activeBaseMap.id}
            attribution={activeBaseMap.attribution}
            url={activeBaseMap.url}
          />
          
          {data.markers.map((m) => (
            <Marker 
              key={m.id} 
              position={[m.lat, m.lng]} 
              icon={icon} 
              eventHandlers={{ click: () => {
                if (!tourMode) {
                  setCurrentCenter([m.lat, m.lng])
                  handleMarkerClick(m.id)
                }
              }}}
            >
              {!tourMode && (
                <Popup>
                  <div className="font-bold text-slate-800">{m.title}</div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
        
        {/* Plane Animation Overlay */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-none transition-all duration-500 ${isFlying && tourMode ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="animate-bounce">
            <Plane className="h-16 w-16 text-blue-600 drop-shadow-[0_10px_8px_rgba(0,0,0,0.5)] -rotate-45" fill="currentColor" />
          </div>
        </div>
        
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

        {/* Tour Control Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400]">
          {!tourMode ? (
            <button onClick={startTour} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all">
              <Play className="h-4 w-4 fill-white" /> Mulai Tur
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur p-2 rounded-full shadow-xl border border-slate-200">
              <button onClick={prevTour} disabled={tourIndex === 0} className="p-3 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="px-4 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lokasi</p>
                <p className="text-sm font-black text-blue-600">{tourIndex + 1} / {data.markers.length}</p>
              </div>
              <button onClick={nextTour} className="p-3 rounded-full hover:bg-blue-50 text-blue-600">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="w-px h-8 bg-slate-200 mx-2"></div>
              <button onClick={endTour} className="p-3 rounded-full hover:bg-red-50 text-red-600 mr-1">
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Close Button Overlay */}
        {!inline && onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 z-[400] p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Sidebar Area */}
      {activeMarker && (
        <div className="w-full md:w-[35%] h-auto max-h-[50vh] md:max-h-none md:h-full flex flex-col border-t md:border-t-0 md:border-l border-slate-200 bg-white z-10 shrink-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-slate-800">Detail Lokasi</h2>
            <button onClick={() => !tourMode && setActiveMarkerId(null)} disabled={tourMode} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 disabled:opacity-0" title="Tutup Detail"><X className="h-5 w-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {activeMarker.imageUrl && (
                <div className="w-full aspect-video bg-slate-100 overflow-hidden relative">
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
                
                {/* Fakta Unik UI */}
                {(activeMarker as any).uniqueFact && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-2 -top-2 opacity-10">
                      <Sparkles className="w-16 h-16 text-indigo-500" />
                    </div>
                    <h4 className="flex items-center gap-2 font-bold text-indigo-900 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" /> Fakta Unik
                    </h4>
                    <p className="text-sm text-indigo-800 leading-relaxed relative z-10">
                      {(activeMarker as any).uniqueFact}
                    </p>
                  </div>
                )}
                
                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[10px] font-mono text-slate-400">Koordinat: {activeMarker.lat.toFixed(4)}, {activeMarker.lng.toFixed(4)}</p>
                  {discoveredPins.has(activeMarker.id) && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                      <Trophy className="h-3 w-3" /> Ditemukan
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
