'use client'

import { useEffect, useState } from 'react'
import { Globe, MapPin, Compass } from 'lucide-react'

export default function WelcomeScreen() {
  const [show, setShow] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    // Check if user has already seen the welcome screen in this session
    const hasSeen = sessionStorage.getItem('hasSeenWelcome')
    
    if (hasSeen) {
      setShow(false)
      return
    }

    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, 2000)

    // Completely remove after 2.5 seconds (allowing 500ms for fade out transition)
    const removeTimer = setTimeout(() => {
      setShow(false)
      sessionStorage.setItem('hasSeenWelcome', 'true')
    }, 2500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!show) return null

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="relative">
        <Globe className="w-24 h-24 text-blue-500 animate-[spin_4s_linear_infinite]" strokeWidth={1.5} />
        <Compass className="w-8 h-8 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        
        {/* Orbiting Map Pin */}
        <div className="absolute top-0 left-0 w-full h-full animate-[spin_3s_linear_infinite_reverse]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 shadow-lg">
            <MapPin className="w-5 h-5 text-rose-500" />
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center">
        <h1 className="text-3xl font-extrabold text-white tracking-tight animate-pulse">
          Geo<span className="text-blue-400">Learning</span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm font-medium tracking-widest uppercase">
          Menyiapkan petualanganmu...
        </p>
        
        {/* Loading bar */}
        <div className="w-48 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-amber-500 animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '100%', transformOrigin: 'left', animation: 'scale-x 2s ease-out forwards' }} />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scale-x {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}</style>
    </div>
  )
}
