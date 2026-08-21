'use client'

import { useState, useRef } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { InteractiveMapData } from '@/components/teacher/InteractiveMapEditorClient'
import { MapPin, Info, Layers, Maximize2, Minimize2, X } from 'lucide-react'
import { MapThemeLayer, MapThemeLegend } from '@/components/ui/MapThemeLayer'

const MAP_TYPES = [
  { id: 'topography', category: 'Peta Umum', name: 'Peta Topografi', baseMap: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenTopoMap (CC-BY-SA)' },
  { id: 'chorography', category: 'Peta Umum', name: 'Peta Korografi', baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors' },
  { id: 'geology', category: 'Peta Tematik', name: 'Peta Geologi', baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OSM' },
  { id: 'climate', category: 'Peta Tematik', name: 'Peta Iklim & Curah Hujan', baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OSM' },
  { id: 'land_use', category: 'Peta Tematik', name: 'Peta Penggunaan Lahan', baseMap: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri' },
  { id: 'population', category: 'Peta Tematik', name: 'Peta Kepadatan Penduduk', baseMap: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; CARTO' },
  { id: 'flora_fauna', category: 'Peta Tematik', name: 'Peta Flora & Fauna', baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OSM' },
  { id: 'mining', category: 'Peta Tematik', name: 'Peta Potensi Tambang', baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OSM' },
  { id: 'maritime', category: 'Peta Tematik', name: 'Peta Poros Maritim', baseMap: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; CARTO' },
  { id: 'custom', category: 'Lainnya', name: 'Peta Dasar (Kosong)', baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OSM' }
]

interface Props {
  title: string
  data: InteractiveMapData
  onClose?: () => void
  inline?: boolean
}

export default function InteractiveMapViewerClient({ title, data, onClose, inline }: Props) {
  const [currentCenter] = useState<[number, number]>([data.center?.lat ?? -0.7893, data.center?.lng ?? 113.9213])
  const [currentZoom] = useState(data.zoom ?? 5)

  // Use provided themes array or fallback
  const availableThemes = data.themes && data.themes.length > 0 ? data.themes : (data.theme ? [data.theme] : ['topography'])
  const [activeThemeId, setActiveThemeId] = useState<string>(availableThemes[0])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [isLayerSelectorOpen, setIsLayerSelectorOpen] = useState(false)
  
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  // Listen to fullscreen changes to sync state
  if (typeof window !== 'undefined') {
    window.addEventListener('fullscreenchange', () => {
      setIsFullscreen(!!document.fullscreenElement)
    })
  }

  const activeMapType = MAP_TYPES.find(b => b.id === activeThemeId) || MAP_TYPES.find(b => b.id === 'custom')!

  const handleThemeChange = (themeId: string) => {
    setActiveThemeId(themeId)
    setActiveFilter(null) // Reset filter when changing theme
  }

  return (
    <div ref={containerRef} className={
      isFullscreen 
        ? "w-screen h-screen bg-white fixed inset-0 z-[9999]" 
        : inline 
          ? "flex min-h-[85vh] md:min-h-0 md:h-[70vh] w-full flex-col md:flex-row overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-xl my-8 relative" 
          : "flex h-[90vh] md:h-[85vh] w-[95vw] max-w-7xl flex-col md:flex-row overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl relative"
    }>
      {/* Map Area */}
      <div className="relative bg-slate-100 z-0 h-full w-full shrink-0">
        <MapContainer
          center={currentCenter}
          zoom={currentZoom}
          minZoom={4}
          maxBounds={[[-15.0, 90.0], [10.0, 145.0]]}
          maxBoundsViscosity={1.0}
          className="h-full w-full z-0"
        >
          <TileLayer
            key={activeMapType.id}
            attribution={activeMapType.attribution}
            url={activeMapType.baseMap}
          />
          <MapThemeLayer theme={activeThemeId as any} activeFilter={activeFilter} />
        </MapContainer>
        
        {/* Top Header overlay */}
        <div className="absolute top-4 left-4 z-[400] flex items-center gap-3 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-200">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
            <MapPin className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">{activeMapType.category}</p>
            <h1 className="text-base font-black text-slate-900 max-w-[250px] truncate">{title}</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" /> {activeMapType.name}
            </p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="ml-2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-500 transition-colors"
              title="Tutup Peta"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Layer Selector for Multiple Themes */}
        {availableThemes.length > 1 && (
          <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 flex flex-col max-w-[250px] overflow-hidden transition-all duration-300">
            <button 
              onClick={() => setIsLayerSelectorOpen(!isLayerSelectorOpen)}
              className="flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors w-full"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-700">Pilih Layer Peta</span>
              </div>
              <div className={`transform transition-transform ${isLayerSelectorOpen ? 'rotate-180' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            
            <div className={`flex flex-col gap-1 overflow-y-auto transition-all duration-300 ${isLayerSelectorOpen ? 'max-h-[300px] p-2 border-t border-slate-100 opacity-100' : 'max-h-0 p-0 opacity-0'}`}>
              {availableThemes.map(themeId => {
                const mapTypeInfo = MAP_TYPES.find(m => m.id === themeId)
                if (!mapTypeInfo) return null
                const isActive = activeThemeId === themeId
                
                return (
                  <button 
                    key={themeId}
                    onClick={() => {
                      handleThemeChange(themeId)
                      setIsLayerSelectorOpen(false)
                    }}
                    className={`text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-indigo-50 text-slate-600'
                    }`}
                  >
                    {mapTypeInfo.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <button 
          onClick={toggleFullscreen}
          className="absolute top-4 right-[19rem] md:right-4 z-[400] bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          style={{ right: availableThemes.length > 1 ? '18rem' : '1rem' }}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        <MapThemeLegend theme={activeThemeId as any} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>
    </div>
  )
}
