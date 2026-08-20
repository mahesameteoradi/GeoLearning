'use client'

import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, X, Sparkles, Map as MapIcon } from 'lucide-react'
import { MapThemeLayer, MapTheme } from '@/components/ui/MapThemeLayer'

export interface InteractiveMapData {
  center: { lat: number; lng: number }
  zoom: number
  themes?: MapTheme[]
  theme?: MapTheme // Kept for backwards compatibility
  markers?: any[] // Kept for backwards compatibility, not used
}

export const MAP_TYPES = [
  { id: 'topography', category: 'Peta Umum', name: 'Peta Topografi', baseMap: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenTopoMap (CC-BY-SA)' },
  { id: 'chorography', category: 'Peta Umum', name: 'Peta Korografi', baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors' },
  { id: 'geology', category: 'Peta Tematik', name: 'Peta Geologi', baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OSM' },
  { id: 'climate', category: 'Peta Tematik', name: 'Peta Iklim & Curah Hujan', baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OSM' },
  { id: 'land_use', category: 'Peta Tematik', name: 'Peta Penggunaan Lahan', baseMap: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri' },
  { id: 'population', category: 'Peta Tematik', name: 'Peta Kepadatan Penduduk', baseMap: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; CARTO' },
  { id: 'flora_fauna', category: 'Peta Tematik', name: 'Peta Flora & Fauna', baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OSM' },
  { id: 'mining', category: 'Peta Tematik', name: 'Peta Potensi Tambang', baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OSM' },
  { id: 'maritime', category: 'Peta Tematik', name: 'Peta Poros Maritim Dunia', baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OSM' }
]

interface ClientProps {
  initialData?: InteractiveMapData
  existingModules: {id: string, title: string}[]
  defaultModuleId: string
  nextOrderMap?: Record<string, number>
  defaultTitle: string
  onSave: (data: InteractiveMapData, meta: { title: string, moduleId: string, order: number }) => void
  onCancel: () => void
}

export default function InteractiveMapEditorClient({ initialData, existingModules, defaultModuleId, nextOrderMap, defaultTitle, onSave, onCancel }: ClientProps) {
  const [center] = useState(initialData?.center || { lat: -0.7893, lng: 113.9213 })
  const [zoom] = useState(initialData?.zoom || 5)
  const [mapTitle, setMapTitle] = useState(defaultTitle)
  const [moduleId, setModuleId] = useState(defaultModuleId)
  const [order, setOrder] = useState(nextOrderMap?.[defaultModuleId] ?? 1)
  
  // Use existing themes array if available, or fallback to the single theme, or default to topography
  const [selectedThemes, setSelectedThemes] = useState<MapTheme[]>(
    initialData?.themes ? initialData.themes : (initialData?.theme ? [initialData.theme] : ['topography'])
  )
  
  // The theme currently being previewed in the editor map
  const [previewTheme, setPreviewTheme] = useState<MapTheme>(selectedThemes[0] || 'topography')
  
  const mapRef = useRef<L.Map | null>(null)
  
  const activeMapType = MAP_TYPES.find(m => m.id === previewTheme) || MAP_TYPES[0]

  useEffect(() => {
    if (nextOrderMap) {
      setOrder(nextOrderMap[moduleId] || 1)
    }
  }, [moduleId, nextOrderMap])

  function handleSaveAll() {
    const currentMap = mapRef.current
    onSave({
      center: currentMap ? { lat: currentMap.getCenter().lat, lng: currentMap.getCenter().lng } : center,
      zoom: currentMap ? currentMap.getZoom() : zoom,
      themes: selectedThemes,
      theme: selectedThemes[0] // for backwards compatibility
    }, {
      title: mapTitle,
      moduleId,
      order
    })
  }

  return (
    <div className="flex h-[90vh] md:h-[80vh] w-[95vw] md:w-[90vw] max-w-6xl flex-col md:flex-row overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl">
      {/* Map Area */}
      <div className="relative bg-slate-100 z-0 h-[50vh] md:h-full md:flex-1 shrink-0">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          minZoom={4}
          maxBounds={[[-15.0, 90.0], [10.0, 145.0]]}
          maxBoundsViscosity={1.0}
          ref={mapRef}
          className="h-full w-full z-0"
        >
          <TileLayer
            key={activeMapType.id}
            attribution={activeMapType.attribution}
            url={activeMapType.baseMap}
          />
          <MapThemeLayer theme={previewTheme} />
        </MapContainer>
        
        <div className="absolute top-4 left-4 z-[400] rounded-xl bg-white/95 backdrop-blur-sm p-4 shadow-lg flex items-center gap-3 border border-slate-200">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <MapIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pratinjau</p>
            <p className="text-sm font-black text-slate-800">{activeMapType.name}</p>
          </div>
        </div>
      </div>

      {/* Editor Sidebar */}
      <div className="flex w-full md:w-[350px] flex-col bg-white border-l border-slate-200 shadow-[-10px_0_20px_rgba(0,0,0,0.03)] z-[10]">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            Pengaturan Peta
          </h2>
          <button onClick={onCancel} className="rounded-full p-2 hover:bg-slate-200 text-slate-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Judul Peta <span className="text-red-500">*</span></label>
            <input value={mapTitle} onChange={e => setMapTitle(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-800" placeholder="Contoh: Peta Persebaran Flora" />
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Bab / Modul <span className="text-red-500">*</span></label>
            <select value={moduleId} onChange={e => setModuleId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-800">
              {existingModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Urutan ke- <span className="text-red-500">*</span></label>
            <input type="number" min={0} value={order} onChange={e => setOrder(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-800" />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Jenis Peta
            </label>
            <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1">
              {MAP_TYPES.map(m => (
                <label key={m.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${selectedThemes.includes(m.id as MapTheme) ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedThemes.includes(m.id as MapTheme)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedThemes(prev => [...prev, m.id as MapTheme]);
                        setPreviewTheme(m.id as MapTheme); // Auto preview the newly checked theme
                      } else {
                        setSelectedThemes(prev => prev.filter(t => t !== m.id));
                        if (previewTheme === m.id) {
                          // Change preview if we unchecked the current preview
                          setPreviewTheme(selectedThemes.filter(t => t !== m.id)[0] || 'topography');
                        }
                      }
                    }}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{m.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{m.category}</p>
                  </div>
                  {selectedThemes.includes(m.id as MapTheme) && (
                    <button 
                      onClick={(e) => { e.preventDefault(); setPreviewTheme(m.id as MapTheme) }} 
                      className={`ml-auto text-xs px-2 py-1 rounded-md font-bold ${previewTheme === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                      {previewTheme === m.id ? 'Pratinjau Aktif' : 'Lihat'}
                    </button>
                  )}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Peta dan legendanya akan otomatis dihasilkan saat siswa membuka materi ini.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <button
            onClick={handleSaveAll}
            disabled={!mapTitle}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            Simpan Peta Pembelajaran
          </button>
        </div>
      </div>
    </div>
  )
}
