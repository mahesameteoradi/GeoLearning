import { useState, useEffect } from 'react'
import { GeoJSON } from 'react-leaflet'
import type { FeatureCollection, Feature, Geometry } from 'geojson'

export type MapTheme = 'custom' | 'population' | 'earthquake' | 'flora_fauna' | 'topography' | 'chorography' | 'geology' | 'climate' | 'land_use' | 'mining' | 'maritime'

interface MapThemeLayerProps {
  theme?: MapTheme
  activeFilter?: string | null
}

export function MapThemeLayer({ theme, activeFilter }: MapThemeLayerProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null)

  useEffect(() => {
    if (theme && theme !== 'custom') {
      fetch('/indonesia-province.json')
        .then(res => res.json())
        .then(data => setGeoData(data))
        .catch(err => console.error("Failed to load geojson", err))
    }
  }, [theme])

  if (!theme || theme === 'custom') return null
  if (!geoData) return null

  // Helper to determine style based on province name and theme
  const getStyle = (feature?: Feature<Geometry, any>) => {
    const province = feature?.properties?.Propinsi?.toUpperCase() || ''
    
    let fillColor = '#cccccc'
    let fillOpacity = 0.5
    
    if (theme === 'population') {
      if (['JAWA BARAT', 'JAWA TENGAH', 'JAWA TIMUR', 'BANTEN', 'DKI JAKARTA', 'DI YOGYAKARTA', 'BALI'].includes(province)) {
        fillColor = '#ef4444' // Merah (Sangat Padat)
      } else if (['SUMATERA UTARA', 'SUMATERA SELATAN', 'LAMPUNG', 'SULAWESI SELATAN', 'NUSA TENGGARA BARAT'].includes(province)) {
        fillColor = '#eab308' // Kuning (Sedang)
      } else {
        fillColor = '#22c55e' // Hijau (Renggang)
      }
    } else if (theme === 'geology') {
      if (['JAWA BARAT', 'JAWA TENGAH', 'JAWA TIMUR', 'BANTEN', 'BALI', 'NUSA TENGGARA BARAT', 'NUSA TENGGARA TIMUR'].includes(province)) {
        fillColor = '#dc2626' // Vulkanik
      } else if (province.includes('KALIMANTAN') || province.includes('SUMATERA') || province === 'RIAU' || province === 'JAMBI' || province === 'BENGKULU') {
        fillColor = '#ca8a04' // Sedimen
      } else {
        fillColor = '#4f46e5' // Metamorf
      }
    } else if (theme === 'climate') {
      if (['SUMATERA BARAT', 'KALIMANTAN BARAT', 'PAPUA', 'PAPUA BARAT', 'BENGKULU'].includes(province)) {
        fillColor = '#1d4ed8' // Sangat Tinggi
      } else if (province.includes('SULAWESI') || province.includes('KALIMANTAN') || ['SUMATERA UTARA', 'ACEH', 'JAWA BARAT', 'BANTEN'].includes(province)) {
        fillColor = '#3b82f6' // Tinggi
      } else if (['JAWA TENGAH', 'JAWA TIMUR', 'BALI'].includes(province)) {
        fillColor = '#60a5fa' // Sedang
      } else if (['NUSA TENGGARA BARAT', 'NUSA TENGGARA TIMUR'].includes(province)) {
        fillColor = '#f59e0b' // Rendah / Kering
      } else {
        fillColor = '#3b82f6'
      }
    } else if (theme === 'land_use') {
      if (province.includes('KALIMANTAN') || province.includes('PAPUA') || province === 'MALUKU') {
        fillColor = '#15803d' // Hutan
      } else if (province.includes('SUMATERA') || province === 'RIAU' || province === 'JAMBI') {
        fillColor = '#a3e635' // Perkebunan
      } else if (province.includes('JAWA') || province === 'DKI JAKARTA' || province === 'BANTEN' || province === 'BALI') {
        fillColor = '#64748b' // Pemukiman & Industri
      } else {
        fillColor = '#15803d'
      }
    } else if (theme === 'topography') {
      if (['PAPUA', 'PAPUA BARAT', 'SUMATERA BARAT', 'ACEH', 'JAWA BARAT'].includes(province)) {
        fillColor = '#c2410c' // Pegunungan Tinggi
      } else if (['JAWA TENGAH', 'JAWA TIMUR', 'SULAWESI SELATAN', 'SUMATERA UTARA', 'BENGKULU'].includes(province)) {
        fillColor = '#facc15' // Dataran Tinggi / Perbukitan
      } else {
        fillColor = '#16a34a' // Dataran Rendah
      }
    } else if (theme === 'flora_fauna') {
      if (province.includes('PAPUA') || province === 'MALUKU' || province === 'MALUKU UTARA') {
        fillColor = '#8b5cf6' // Australis (Ungu)
      } else if (province.includes('SULAWESI') || province.includes('NUSA TENGGARA') || province === 'BALI') {
        fillColor = '#ec4899' // Peralihan (Pink)
      } else {
        fillColor = '#10b981' // Asiatis (Teal)
      }
    } else if (theme === 'mining') {
      if (['PAPUA', 'PAPUA TENGAH'].includes(province)) {
        fillColor = '#eab308' // Emas (Kuning)
      } else if (province.includes('KALIMANTAN') || province === 'SUMATERA SELATAN') {
        fillColor = '#334155' // Batu Bara (Hitam/Abu Tua)
      } else if (['RIAU', 'KEPULAUAN RIAU', 'BANGKA BELITUNG'].includes(province)) {
        fillColor = '#3b82f6' // Timah/Minyak (Biru)
      } else if (['SULAWESI TENGAH', 'SULAWESI TENGGARA', 'MALUKU UTARA'].includes(province)) {
        fillColor = '#f97316' // Nikel (Oranye)
      } else {
        fillColor = '#cbd5e1' // Potensi Lain
      }
    } else if (theme === 'maritime') {
      if (['KEPULAUAN RIAU', 'SUMATERA UTARA', 'ACEH'].includes(province)) {
        fillColor = '#0369a1' // ALKI I / Selat Malaka (Biru Tua)
      } else if (['KALIMANTAN TIMUR', 'SULAWESI SELATAN', 'BALI', 'NUSA TENGGARA BARAT'].includes(province)) {
        fillColor = '#0284c7' // ALKI II (Biru Sedang)
      } else if (['MALUKU', 'MALUKU UTARA', 'PAPUA BARAT'].includes(province)) {
        fillColor = '#38bdf8' // ALKI III (Biru Muda)
      } else {
        fillColor = '#e0f2fe' // Penunjang
      }
    } else if (theme === 'chorography') {
      fillColor = '#94a3b8' // Slate for Chorography (Wilayah Administratif)
      fillOpacity = 0.2 // Very transparent so the atlas map is visible
    }

    // Apply filter logic
    if (activeFilter && fillColor !== activeFilter) {
      return {
        fillColor: '#cbd5e1',
        fillOpacity: 0.1, // Dimmed
        weight: 1.5,
        opacity: 0.6,
        color: '#e2e8f0', // Lighter grey for inactive borders
        dashArray: ''
      }
    }

    return {
      fillColor,
      fillOpacity,
      weight: 1.5, // Slightly thicker border
      opacity: 1,
      color: '#ffffff', // Solid white for neatness
      dashArray: '' // Remove dashed lines
    }
  }

  const onEachFeature = (feature?: Feature<Geometry, any>, layer?: any) => {
    if (!feature || !layer) return;
    
    const province = feature.properties?.Propinsi || 'Wilayah'
    let description = ''

    if (theme === 'population') {
      const color = getStyle(feature).fillColor
      description = color === '#ef4444' ? 'Sangat Padat (>1000 jiwa/km²)' : color === '#eab308' ? 'Kepadatan Sedang (100-1000 jiwa/km²)' : 'Kepadatan Renggang (<100 jiwa/km²)'
    } else if (theme === 'geology') {
      const color = getStyle(feature).fillColor
      description = color === '#dc2626' ? 'Didominasi Formasi Batuan Vulkanik (Jalur Gunung Api)' : color === '#ca8a04' ? 'Didominasi Formasi Batuan Sedimen (Dataran Rendah & Rawa)' : 'Didominasi Formasi Batuan Metamorf & Kompleks'
    } else if (theme === 'climate') {
      const color = getStyle(feature).fillColor
      description = color === '#1d4ed8' ? 'Curah Hujan Sangat Tinggi (>3000 mm/tahun)' : color === '#3b82f6' ? 'Curah Hujan Tinggi (2000-3000 mm/tahun)' : color === '#60a5fa' ? 'Curah Hujan Sedang (1000-2000 mm/tahun)' : 'Curah Hujan Rendah / Iklim Sabana Kering (<1000 mm/tahun)'
    } else if (theme === 'land_use') {
      const color = getStyle(feature).fillColor
      description = color === '#15803d' ? 'Kawasan Hutan Lindung & Hutan Hujan Tropis' : color === '#a3e635' ? 'Kawasan Perkebunan (Kelapa Sawit, Karet, dll)' : 'Pusat Kawasan Pemukiman, Bisnis & Perindustrian'
    } else if (theme === 'topography') {
      const color = getStyle(feature).fillColor
      description = color === '#c2410c' ? 'Wilayah dengan Pegunungan Tinggi (Elevasi Dominan >1000 mdpl)' : color === '#facc15' ? 'Wilayah Dataran Tinggi & Perbukitan (200-1000 mdpl)' : 'Didominasi Dataran Rendah & Pesisir (<200 mdpl)'
    } else if (theme === 'flora_fauna') {
      const color = getStyle(feature).fillColor
      description = color === '#10b981' ? 'Zona Asiatis (Harimau, Badak, Orangutan)' : color === '#ec4899' ? 'Zona Peralihan / Endemik (Komodo, Anoa, Babi Rusa)' : 'Zona Australis (Burung Cenderawasih, Kanguru Pohon)'
    } else if (theme === 'mining') {
      const color = getStyle(feature).fillColor
      description = color === '#eab308' ? 'Potensi Tambang Emas & Tembaga Terbesar (Grasberg)' : color === '#334155' ? 'Pusat Tambang Batu Bara & Migas' : color === '#f97316' ? 'Sentra Tambang Nikel (Bahan Baku Baterai EV)' : color === '#3b82f6' ? 'Pusat Tambang Timah & Minyak Bumi' : 'Potensi Tambang Campuran / Non-Logam Utama'
    } else if (theme === 'maritime') {
      const color = getStyle(feature).fillColor
      description = color === '#0369a1' ? 'ALKI I & Selat Malaka (Jalur Tersibuk Dunia)' : color === '#0284c7' ? 'ALKI II (Jalur Selat Lombok - Makassar)' : color === '#38bdf8' ? 'ALKI III (Jalur Samudra Pasifik - Australia)' : 'Wilayah Penunjang & Zona Ekonomi Eksklusif'
    } else if (theme === 'chorography') {
      description = 'Wilayah Administratif Provinsi'
    }

    const popupContent = `
      <div style="font-family: inherit;">
        <strong style="font-size: 14px; color: #1e293b;">Provinsi ${province}</strong><br/>
        <span style="font-size: 12px; color: #64748b; margin-top: 4px; display: inline-block;">${description}</span>
      </div>
    `
    layer.bindPopup(popupContent)
    
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target
        layer.setStyle({
          fillOpacity: 0.8,
          weight: 3, // Thicker border on hover
          color: '#0f172a' // Dark slate for sharp contrast on hover
        })
        layer.bringToFront()
      },
      mouseout: (e: any) => {
        layer.setStyle(getStyle(feature))
      }
    })
  }

  // We need a key to force re-render when theme changes, because GeoJSON doesn't auto-update styling on prop change sometimes.
  return <GeoJSON key={theme} data={geoData} style={getStyle} onEachFeature={onEachFeature} />
}

interface MapThemeLegendProps extends MapThemeLayerProps {
  onFilterChange?: (color: string | null) => void
}

export function MapThemeLegend({ theme, activeFilter, onFilterChange }: MapThemeLegendProps) {
  if (!theme || theme === 'custom') return null

  const legends: Record<string, {color: string, label: string, hexColor: string}[]> = {
    population: [
      { color: 'bg-red-500', hexColor: '#ef4444', label: 'Sangat Padat (>1000 jiwa/km²)' },
      { color: 'bg-yellow-500', hexColor: '#eab308', label: 'Sedang (100-1000 jiwa/km²)' },
      { color: 'bg-green-500', hexColor: '#22c55e', label: 'Renggang (<100 jiwa/km²)' }
    ],
    geology: [
      { color: 'bg-red-600', hexColor: '#dc2626', label: 'Batuan Vulkanik (Gunung Api)' },
      { color: 'bg-yellow-600', hexColor: '#ca8a04', label: 'Batuan Sedimen' },
      { color: 'bg-indigo-600', hexColor: '#4f46e5', label: 'Batuan Metamorf & Kompleks' }
    ],
    climate: [
      { color: 'bg-blue-700', hexColor: '#1d4ed8', label: 'Curah Hujan Sangat Tinggi' },
      { color: 'bg-blue-500', hexColor: '#3b82f6', label: 'Curah Hujan Tinggi' },
      { color: 'bg-blue-400', hexColor: '#60a5fa', label: 'Curah Hujan Sedang' },
      { color: 'bg-orange-500', hexColor: '#f59e0b', label: 'Curah Hujan Rendah / Kering' }
    ],
    land_use: [
      { color: 'bg-green-700', hexColor: '#15803d', label: 'Hutan Tropis / Lindung' },
      { color: 'bg-lime-400', hexColor: '#a3e635', label: 'Kawasan Perkebunan Utama' },
      { color: 'bg-slate-500', hexColor: '#64748b', label: 'Pemukiman & Industri' }
    ],
    topography: [
      { color: 'bg-orange-700', hexColor: '#c2410c', label: 'Pegunungan Tinggi (>1000 mdpl)' },
      { color: 'bg-yellow-400', hexColor: '#facc15', label: 'Dataran Tinggi / Perbukitan' },
      { color: 'bg-green-600', hexColor: '#16a34a', label: 'Dataran Rendah & Pesisir' }
    ],
    chorography: [
      { color: 'bg-slate-400', hexColor: '#94a3b8', label: 'Wilayah Administratif Daratan' }
    ],
    flora_fauna: [
      { color: 'bg-teal-500', hexColor: '#10b981', label: 'Zona Asiatis (Garis Wallace)' },
      { color: 'bg-pink-500', hexColor: '#ec4899', label: 'Zona Peralihan (Endemik)' },
      { color: 'bg-purple-500', hexColor: '#8b5cf6', label: 'Zona Australis (Garis Weber)' }
    ],
    mining: [
      { color: 'bg-yellow-500', hexColor: '#eab308', label: 'Potensi Emas & Tembaga' },
      { color: 'bg-slate-700', hexColor: '#334155', label: 'Potensi Batu Bara & Migas' },
      { color: 'bg-orange-500', hexColor: '#f97316', label: 'Potensi Nikel (Bahan Baterai)' },
      { color: 'bg-blue-500', hexColor: '#3b82f6', label: 'Potensi Timah & Minyak Bumi' }
    ],
    maritime: [
      { color: 'bg-sky-800', hexColor: '#0369a1', label: 'ALKI I (Selat Sunda - Karimata)' },
      { color: 'bg-sky-600', hexColor: '#0284c7', label: 'ALKI II (Selat Lombok - Makassar)' },
      { color: 'bg-sky-400', hexColor: '#38bdf8', label: 'ALKI III (Maluku - Samudra Pasifik)' }
    ]
  }

  const items = legends[theme as keyof typeof legends]
  if (!items) return null

  return (
    <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-200 pointer-events-auto">
      <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Keterangan Peta</h3>
        {activeFilter && (
          <button 
            onClick={() => onFilterChange?.(null)}
            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded"
          >
            Tampilkan Semua
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => {
          const isActive = activeFilter === item.hexColor
          const isFaded = activeFilter && !isActive
          
          return (
            <button 
              key={i} 
              onClick={() => onFilterChange?.(isActive ? null : item.hexColor)}
              className={`flex items-center gap-2 p-1.5 rounded-lg transition-all text-left ${isActive ? 'bg-slate-100 shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-50'} ${isFaded ? 'opacity-40' : 'opacity-100'}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full ${item.color} shadow-sm shrink-0`} />
              <span className={`text-xs font-semibold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
