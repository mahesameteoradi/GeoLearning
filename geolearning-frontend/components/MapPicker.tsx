'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix missing marker icons
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface MapPickerProps {
  position: { lat: number; lng: number } | null
  onChange: (pos: { lat: number; lng: number }) => void
}

function LocationMarker({ position, onChange }: MapPickerProps) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  return position === null ? null : (
    <Marker position={position} icon={icon} />
  )
}

export default function MapPicker({ position, onChange }: MapPickerProps) {
  const [mounted, setMounted] = useState(false)
  const [initialCenter] = useState<[number, number]>(position ? [position.lat, position.lng] : [-0.7893, 113.9213])
  const [initialZoom] = useState(position ? 12 : 5)
  
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-[300px] w-full bg-slate-50 rounded-xl animate-pulse" />

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      className="h-[300px] w-full rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <LocationMarker position={position} onChange={onChange} />
    </MapContainer>
  )
}
