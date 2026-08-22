'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface LogoLoaderProps {
  isOpen: boolean
  message?: string
  onCancel?: () => void
}

const MythicEmblem = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 200 200" 
    className={className} 
    style={{ filter: 'drop-shadow(0 10px 15px rgba(251,191,36,0.4))' }}
    preserveAspectRatio="none"
  >
    <defs>
      <linearGradient id="mythicGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="30%" stopColor="#F59E0B" />
        <stop offset="70%" stopColor="#B45309" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id="mythicGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Intense Blue Aura (Sweeping Up) */}
    <path d="M 100 195 Q 160 160 185 30 Q 130 90 100 140 Q 70 90 15 30 Q 40 160 100 195 Z" fill="url(#mythicGlow)" className="blur-[10px]" opacity="0.9" />
    <path d="M 100 185 Q 150 150 175 40 Q 120 100 100 130 Q 80 100 25 40 Q 50 150 100 185 Z" fill="url(#mythicGlow)" className="blur-[5px]" opacity="1" />

    {/* Center Core / Shield Base (The "V" connector) - Small and Sharp */}
    <path d="M 100 190 L 115 165 L 100 175 L 85 165 Z" fill="url(#mythicGold)" />
    <path d="M 100 182 L 108 168 L 100 173 L 92 168 Z" fill="#FEF08A" opacity="0.8" />

    {/* Sharp Sweeping Left Wing (Feathers) - Thin connection to V */}
    <path d="M 85 165 Q 30 150 10 70 Q 35 100 75 145 Z" fill="url(#mythicGold)" opacity="0.9" />
    <path d="M 80 155 Q 20 130 5 40 Q 25 70 65 135 Z" fill="url(#mythicGold)" />
    <path d="M 75 145 Q 20 110 15 20 Q 35 50 60 120 Z" fill="url(#mythicGold)" opacity="0.9" />

    {/* Sharp Sweeping Right Wing (Feathers) - Thin connection to V */}
    <path d="M 115 165 Q 170 150 190 70 Q 165 100 125 145 Z" fill="url(#mythicGold)" opacity="0.9" />
    <path d="M 120 155 Q 180 130 195 40 Q 175 70 135 135 Z" fill="url(#mythicGold)" />
    <path d="M 125 145 Q 180 110 185 20 Q 165 50 140 120 Z" fill="url(#mythicGold)" opacity="0.9" />
    
    {/* Inner Glowing Sharp Accents */}
    <path d="M 100 170 Q 50 150 25 70 Q 50 100 85 150 Z" fill="#FEF08A" opacity="0.5" />
    <path d="M 100 170 Q 150 150 175 70 Q 150 100 115 150 Z" fill="#FEF08A" opacity="0.5" />
  </svg>
)

export function LogoLoader({ isOpen, message = 'Memproses...', onCancel }: LogoLoaderProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="flex flex-col items-center justify-center rounded-[2rem] bg-white p-8 shadow-2xl shadow-blue-900/20 w-80 max-w-[90vw] border border-white/50 relative overflow-hidden"
          >
            {/* Background decorative elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-50"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-100 rounded-full blur-2xl opacity-50"></div>

            {/* Book Flipping Animation with Rank Border */}
            <div className="relative mb-12 mt-8 z-10 flex w-40 h-40 items-center justify-center [perspective:1200px]">
              
              {/* Rank Borders (Mobile Legends Style) */}
              <div className="absolute inset-[-30px] flex items-center justify-center pointer-events-none z-0">
                {/* Glowing Aura */}
                <div className="absolute inset-10 bg-gradient-to-tr from-amber-400/30 to-blue-600/30 rounded-full blur-2xl animate-pulse" />
                
                {/* Golden Spinning Rings (Smaller, inside the wings) */}
                <div className="absolute w-[124px] h-[124px] flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-[2px] border-dashed border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border border-amber-300/40"
                  />
                </div>

                {/* Unified Epic Mythic Emblem (V-Base & Sharp Wings) */}
                <motion.div 
                  animate={{ scale: [1, 1.03, 1], y: [0, -2, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute flex items-center justify-center z-0 w-[170px] h-[135px] mt-12"
                >
                  <MythicEmblem className="w-full h-full opacity-90" />
                </motion.div>

                {/* Top Location Pin (Replacing Crystal) */}
                <motion.div
                  animate={{ y: [0, 6, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1 left-1/2 -translate-x-1/2 w-9 h-9 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)] z-20 flex justify-center"
                >
                  <svg viewBox="0 0 24 24" fill="url(#pinGradient)" className="w-full h-full relative z-10">
                    <defs>
                      <linearGradient id="pinGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FB923C" /> {/* orange-400 */}
                        <stop offset="100%" stopColor="#EA580C" /> {/* orange-600 */}
                      </linearGradient>
                    </defs>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  {/* Glowing white core for the pin hole */}
                  <div className="absolute top-[28%] w-[10px] h-[10px] bg-white rounded-full shadow-[0_0_10px_white] z-20" />
                </motion.div>
              </div>

              {/* Pedestal for the Book */}
              <motion.div
                className="absolute -bottom-6 w-32 h-8 bg-blue-600/30 rounded-[100%] blur-xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* The 3D Book (Matching Logo Shape - Adjusted Proportions) */}
              <motion.div 
                className="relative flex w-[104px] h-[72px] bg-blue-600 rounded-xl shadow-[0_20px_40px_rgba(37,99,235,0.5)] items-center justify-center z-10"
                animate={{ y: [-5, 5, -5], rotateX: 50, rotateZ: -12 }}
                transition={{ y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" } }}
                style={{ 
                  transformStyle: 'preserve-3d',
                  clipPath: 'polygon(0 8%, 50% 18%, 100% 8%, 100% 92%, 50% 100%, 0 92%)' 
                }}
              >
                {/* Deep center spine shadow */}
                <div className="absolute left-1/2 top-0 bottom-0 w-3 bg-blue-900/60 -translate-x-1/2 blur-[2px] z-0" />

                {/* Static pages base (V shape) */}
                <div 
                  className="relative flex w-[90px] h-[56px] rounded-lg bg-white shadow-inner z-10 overflow-hidden" 
                  style={{ 
                    transform: 'translateZ(1px)',
                    clipPath: 'polygon(0 6%, 50% 16%, 100% 6%, 100% 94%, 50% 100%, 0 94%)'
                  }}
                >
                  <div className="w-[45px] h-full bg-slate-50 border-r-2 border-slate-200 shadow-[inset_4px_0_10px_rgba(0,0,0,0.03)]" />
                  <div className="w-[45px] h-full bg-white flex items-center justify-center shadow-[inset_-4px_0_10px_rgba(0,0,0,0.03)] relative">
                     <div className="opacity-15 grayscale scale-110">
                      <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
                    </div>
                  </div>
                </div>

                {/* Flipping pages */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-[45px] h-[56px] left-1/2 origin-left z-20"
                    style={{ 
                      transformStyle: 'preserve-3d', 
                      transform: 'translateZ(2px)',
                      clipPath: 'polygon(0 16%, 100% 6%, 100% 94%, 0 100%)' // Angled page shape
                    }}
                    animate={{ rotateY: [0, -180] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.7
                    }}
                  >
                    {/* Front of flipping page (Right Side) */}
                    <div 
                      className="absolute inset-0 bg-white shadow-md border border-slate-100/80 flex items-center justify-center overflow-hidden" 
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain scale-105" />
                      
                      {/* Magical Page shine effect */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/60 to-transparent opacity-80"
                        animate={{ x: ['-150%', '150%'] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: i * 0.7 }}
                      />
                    </div>
                    
                    {/* Back of flipping page (Left Side) */}
                    <div 
                      className="absolute inset-0 bg-slate-100 shadow-md border border-slate-200/80" 
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Message */}
            <h3 className="text-lg font-extrabold text-slate-800 text-center mb-2 z-10 mt-2">
              Mohon Tunggu
            </h3>
            <p className="text-sm font-medium text-slate-500 text-center z-10 animate-pulse">
              {message}
            </p>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="mt-6 w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors z-10"
              >
                Batal
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
