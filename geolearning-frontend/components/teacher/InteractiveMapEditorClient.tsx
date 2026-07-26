'use client'

import { useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapPin, X, Plus, Image as ImageIcon, Trash2 } from 'lucide-react'

// Fix missing marker icons in leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

export interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  description: string
  imageUrl?: string
}

export interface InteractiveMapData {
  center: { lat: number; lng: number }
  zoom: number
  markers: MapMarker[]
}

interface ClientProps {
  initialData?: InteractiveMapData
  onSave: (data: InteractiveMapData) => void
  onCancel: () => void
}

function MapEventsHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

export default function InteractiveMapEditorClient({ initialData, onSave, onCancel }: ClientProps) {
  const [markers, setMarkers] = useState<MapMarker[]>(initialData?.markers || [])
  const [center] = useState(initialData?.center || { lat: -0.7893, lng: 113.9213 })
  const [zoom] = useState(initialData?.zoom || 5)
  const mapRef = useRef<L.Map | null>(null)
  
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editImg, setEditImg] = useState('')

  const handleMapClick = useCallback((lat: number, lng: number) => {
    const newMarker: MapMarker = {
      id: Date.now().toString(),
      lat,
      lng,
      title: 'Pin Baru',
      description: '',
    }
    setMarkers(prev => [...prev, newMarker])
    openEditor(newMarker)
  }, [])

  function openEditor(marker: MapMarker) {
    setEditingMarkerId(marker.id)
    setEditTitle(marker.title)
    setEditDesc(marker.description)
    setEditImg(marker.imageUrl || '')
  }

  function saveEditingMarker() {
    if (!editingMarkerId) return
    setMarkers(prev => prev.map(m => m.id === editingMarkerId ? {
      ...m,
      title: editTitle || 'Pin Tanpa Judul',
      description: editDesc,
      imageUrl: editImg
    } : m))
    setEditingMarkerId(null)
  }

  function deleteMarker(id: string) {
    if (editingMarkerId === id) setEditingMarkerId(null)
    setMarkers(prev => prev.filter(m => m.id !== id))
  }

  function handleSaveAll() {
    const currentMap = mapRef.current
    onSave({
      center: currentMap ? { lat: currentMap.getCenter().lat, lng: currentMap.getCenter().lng } : center,
      zoom: currentMap ? currentMap.getZoom() : zoom,
      markers
    })
  }

  return (
    <div className="flex h-[80vh] w-[90vw] max-w-6xl flex-col md:flex-row overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl">
      {/* Map Area */}
      <div className="flex-1 relative bg-slate-100 z-0">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          ref={mapRef}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <MapEventsHandler onMapClick={handleMapClick} />
          
          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={icon} eventHandlers={{ click: () => openEditor(m) }}>
              <Popup>
                <div className="font-semibold">{m.title}</div>
                <div className="text-xs text-slate-500">Klik untuk mengedit</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="absolute top-4 left-4 z-[400] rounded-xl bg-white/90 backdrop-blur-sm p-3 shadow-lg pointer-events-none">
          <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            Mode Editor
          </p>
          <p className="text-xs text-slate-500 mt-1">Klik sembarang tempat di peta untuk menambah Pin</p>
        </div>
      </div>

      {/* Sidebar Area */}
      <div className="w-full md:w-80 flex flex-col border-l border-slate-200 bg-white z-10">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Pin Peta ({markers.length})</h2>
          <button onClick={onCancel} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {editingMarkerId ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Edit Pin
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase text-blue-700">Judul</label>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase text-blue-700">Deskripsi</label>
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-blue-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase text-blue-700">URL Gambar (Opsional)</label>
                  <input value={editImg} onChange={e => setEditImg(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={saveEditingMarker} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">Simpan Pin</button>
                </div>
              </div>
            </div>
          ) : (
            markers.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Belum ada pin. Klik area peta untuk menambahkan.</p>
              </div>
            ) : (
              markers.map(m => (
                <div key={m.id} className="group rounded-xl border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{m.title}</h4>
                      {m.imageUrl && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 mt-1 inline-flex items-center gap-1 border border-slate-200"><ImageIcon className="h-3 w-3" /> Ada Gambar</span>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditor(m)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md"><MapPin className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteMarker(m.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <button onClick={handleSaveAll} disabled={!!editingMarkerId || markers.length === 0} 
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition-all">
            Simpan Peta Interaktif
          </button>
          <p className="text-[10px] text-center text-slate-500 mt-2">Pastikan posisi peta (zoom & geser) sudah pas sebelum menyimpan.</p>
        </div>
      </div>
    </div>
  )
}
