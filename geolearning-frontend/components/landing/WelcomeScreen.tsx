'use client'

import { useEffect, useState } from 'react'
import { Globe, MapPin, Compass, Navigation } from 'lucide-react'

export default function WelcomeScreen() {
  const [show, setShow] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('hasSeenWelcome')

    if (hasSeen) {
      setShow(false)
      return
    }

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2
      })
    }, 35)

    // Start fade out after 2.2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, 2200)

    // Completely remove after 2.8 seconds
    const removeTimer = setTimeout(() => {
      setShow(false)
      sessionStorage.setItem('hasSeenWelcome', 'true')
    }, 2800)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!show) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-600 ${isFading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
      style={{ transition: 'opacity 0.6s ease-out, transform 0.6s ease-out' }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px]" style={{ animation: 'float 4s ease-in-out infinite' }} />
        <div className="absolute bottom-1/3 right-1/3 w-[350px] h-[350px] rounded-full bg-amber-500/8 blur-[100px]" style={{ animation: 'float 5s ease-in-out infinite reverse' }} />

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-400/40"
            style={{
              top: `${10 + Math.random() * 80}%`,
              left: `${10 + Math.random() * 80}%`,
              animation: `floatParticle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content — centered */}
      <div className="relative flex flex-col items-center z-10">
        {/* Globe with rings */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full border border-blue-500/20" style={{ animation: 'pingRing 2s ease-out infinite' }} />
          <div className="absolute -inset-4 rounded-full border border-blue-400/10" style={{ animation: 'pingRing 2s ease-out infinite 0.5s' }} />
          <div className="absolute -inset-8 rounded-full border border-blue-300/5" style={{ animation: 'pingRing 2s ease-out infinite 1s' }} />

          {/* Globe */}
          <Globe className="w-20 h-20 text-blue-500" strokeWidth={1.2} style={{ animation: 'spinGlobe 6s linear infinite' }} />

          {/* Compass center */}
          <Compass className="w-7 h-7 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" style={{ animation: 'pulseGlow 2s ease-in-out infinite' }} />

          {/* Orbiting pin 1 */}
          <div className="absolute inset-0" style={{ animation: 'orbit 3s linear infinite' }}>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 shadow-lg shadow-rose-500/30">
              <MapPin className="w-4 h-4 text-rose-500" />
            </div>
          </div>

          {/* Orbiting pin 2 */}
          <div className="absolute -inset-3" style={{ animation: 'orbit 4s linear infinite reverse' }}>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 shadow-lg shadow-emerald-500/30">
              <Navigation className="w-3 h-3 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mt-10 flex flex-col items-center">
          <h1 className="text-4xl font-black text-white tracking-tight" style={{ animation: 'fadeSlideUp 0.8s ease-out forwards' }}>
            Geo<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Learning</span>
          </h1>
          <p className="text-slate-400 mt-3 text-sm font-medium tracking-[0.2em] uppercase" style={{ animation: 'fadeSlideUp 0.8s ease-out 0.2s both' }}>
            Menyiapkan petualanganmu...
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-8 w-56" style={{ animation: 'fadeSlideUp 0.8s ease-out 0.4s both' }}>
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-amber-400 shadow-lg shadow-blue-500/30 transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-[11px] text-slate-500 mt-2.5 font-mono tabular-nums">
            {progress}%
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spinGlobe {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pingRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-15px) translateX(8px); opacity: 0.7; }
          50% { transform: translateY(-25px) translateX(-5px); opacity: 0.4; }
          75% { transform: translateY(-10px) translateX(12px); opacity: 0.8; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
