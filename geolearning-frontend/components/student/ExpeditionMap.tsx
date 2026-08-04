import React from 'react'
import { Map, Lock, CheckCircle2, ClipboardList, PlayCircle, FileText } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface MaterialItem {
  id: string
  title: string
  type: string
  content_url: string | null
  content_text: string | null
  order: number
  created_at: string
}

interface QuizItem {
  id: string
  title: string
  xp_reward: number
  order: number
  created_at: string
}

interface ModuleItem {
  id: string
  title: string
  order: number
  materials: MaterialItem[]
  quizzes: QuizItem[]
}

export function ExpeditionMap({ 
  modules,
  completedMaterials,
  completedQuizzes,
  unlockedModules,
  classId
}: { 
  modules: ModuleItem[],
  completedMaterials: Set<string>,
  completedQuizzes: Set<string>,
  unlockedModules: Set<string>,
  classId: string
}) {
  type MapNode = {
    id: string
    type: 'material' | 'quiz'
    title: string
    isCompleted: boolean
    url: string
    icon: React.ElementType
    moduleTitle: string
    moduleId: string
    isModuleStart: boolean
  }

  const nodes: MapNode[] = []
  
  const WORLD_TOUR = [
    { country: 'Brasil', flag: '🇧🇷', emoji: '🗿', x: 33, y: 70 },
    { country: 'Prancis', flag: '🇫🇷', emoji: '🗼', x: 49, y: 28 },
    { country: 'Jepang', flag: '🇯🇵', emoji: '⛩️', x: 87, y: 33 },
    { country: 'Mesir', flag: '🇪🇬', emoji: '🏜️', x: 55, y: 45 },
    { country: 'Amerika Serikat', flag: '🇺🇸', emoji: '🗽', x: 20, y: 35 },
    { country: 'India', flag: '🇮🇳', emoji: '🕌', x: 72, y: 45 },
    { country: 'Italia', flag: '🇮🇹', emoji: '🏛️', x: 52, y: 33 },
    { country: 'Australia', flag: '🇦🇺', emoji: '🏖️', x: 86, y: 78 },
    { country: 'Tiongkok', flag: '🇨🇳', emoji: '🏯', x: 78, y: 38 },
    { country: 'Yunani', flag: '🇬🇷', emoji: '🏺', x: 54, y: 38 },
    { country: 'Meksiko', flag: '🇲🇽', emoji: '🌵', x: 18, y: 48 },
    { country: 'Inggris', flag: '🇬🇧', emoji: '🏰', x: 47, y: 24 },
  ]
  
  modules.forEach((mod) => {
    const combinedNodes: (MapNode & { order: number })[] = []
    
    mod.materials?.forEach((mat) => {
      let icon = FileText
      if (mat.type === 'VIDEO') icon = PlayCircle
      if (mat.type === 'INTERACTIVE_MAP') icon = Map

      combinedNodes.push({
        id: mat.id,
        type: 'material',
        title: mat.title,
        isCompleted: completedMaterials.has(mat.id),
        url: `/student/classes/${classId}/materials/${mat.id}`,
        icon,
        moduleTitle: mod.title,
        moduleId: mod.id,
        isModuleStart: false,
        order: mat.order
      })
    })

    mod.quizzes?.forEach((quiz) => {
      combinedNodes.push({
        id: quiz.id,
        type: 'quiz',
        title: quiz.title,
        isCompleted: completedQuizzes.has(quiz.id),
        url: `/student/quizzes/${quiz.id}`,
        icon: ClipboardList,
        moduleTitle: mod.title,
        moduleId: mod.id,
        isModuleStart: false,
        order: quiz.order
      })
    })

    combinedNodes.sort((a, b) => a.order - b.order)

    let isFirstInModule = true
    combinedNodes.forEach((node) => {
      node.isModuleStart = isFirstInModule
      nodes.push(node)
      isFirstInModule = false
    })
  })

  // Pre-calculate logic
  let currentLockState = false
  const pNodes = nodes.map((node, i) => {
    if (node.isModuleStart && unlockedModules.has(node.moduleId)) {
      currentLockState = false
    }
    const locked = currentLockState
    if (!node.isCompleted) {
      currentLockState = true
    }
    const isCurrent = !node.isCompleted && !locked
    const tourStop = WORLD_TOUR[i % WORLD_TOUR.length]
    
    const landmarkEmoji = tourStop.emoji

    return {
      ...node,
      locked,
      isCurrent,
      tourStop,
      landmarkEmoji
    }
  })

  const renderPin = (pNode: typeof pNodes[0], layoutIdPrefix: string) => (
    <div className="relative flex flex-col items-center group">
      {pNode.isCurrent && (
        <motion.div 
          layoutId={`explorer-${layoutIdPrefix}`}
          className="absolute -top-10 -left-4 text-4xl z-30 drop-shadow-md pointer-events-none"
          animate={{ y: [0, -10, 0], x: [0, 5, 0], rotate: [0, 10, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          title="Kamu berada di sini!"
        >
          🏃‍♂️
        </motion.div>
      )}

      {pNode.isCompleted && (
        <motion.div
          initial={{ scale: 0, originY: 1, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className={cn(
            "absolute z-30 pointer-events-none",
            pNode.type === 'quiz' ? "-top-6 -right-6 text-4xl drop-shadow-[0_4px_8px_rgba(251,191,36,0.5)]" : "-top-4 -right-5 text-3xl drop-shadow-sm"
          )}
        >
          {pNode.type === 'quiz' ? '🏆' : '🚩'}
        </motion.div>
      )}

      {pNode.locked ? (
        <div 
          className="bg-slate-200/80 flex flex-col items-center justify-center text-slate-400 opacity-80 shadow-inner backdrop-blur-sm border-slate-300 w-16 h-16 border-4"
          style={{ borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }}
        >
          <div style={{ transform: 'rotate(45deg)' }} className="relative flex flex-col items-center justify-center w-full h-full">
            <span className="grayscale opacity-50 drop-shadow-sm -translate-y-4 text-[2.5rem]">
              {pNode.landmarkEmoji}
            </span>
            <Lock className="absolute -bottom-1 -right-1 w-5 h-5 text-slate-500 bg-white rounded-full p-0.5 shadow-sm" />
          </div>
        </div>
      ) : (
        <Link href={pNode.url}>
          <div className={cn(pNode.isCurrent && "animate-bounce-slow")}>
            <div 
              className={cn(
                "flex flex-col items-center justify-center transition-all hover:scale-110 hover:shadow-xl cursor-pointer shadow-lg w-16 h-16 border-4",
                pNode.isCompleted 
                  ? "border-emerald-400 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-emerald-500/20"
                  : "border-indigo-300 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-500/40",
                pNode.isCurrent && "ring-4 ring-offset-4 ring-indigo-200"
              )}
              style={{ borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }}
            >
              <div style={{ transform: 'rotate(45deg)' }} className="relative flex flex-col items-center justify-center w-full h-full">
                <span className="drop-shadow-md transition-transform hover:scale-110 -translate-y-4 text-[2.5rem]">
                  {pNode.landmarkEmoji}
                </span>
                {pNode.isCompleted && (
                  <CheckCircle2 className="absolute -bottom-1 -right-1 w-6 h-6 text-emerald-500 bg-white rounded-full p-0.5 shadow-sm" />
                )}
              </div>
            </div>
          </div>
        </Link>
      )}
      
      <div className={cn(
        "absolute top-full mt-3 w-max max-w-[12rem] text-center text-xs font-bold transition-all left-1/2 -translate-x-1/2",
        "px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200/50",
        pNode.locked ? "text-slate-500" : "text-slate-800 group-hover:text-indigo-700 group-hover:bg-white"
      )}>
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 opacity-80">{pNode.type === 'quiz' ? 'KUIS' : 'MATERI'}</span>
        </div>
        <p className="truncate w-full drop-shadow-sm">{pNode.title}</p>
      </div>
    </div>
  )

  return (
    <div className="w-full bg-[#f8fafc]">
      
      {/* ─── VERTICAL LAYOUT (All Devices) ─── */}
      <div className="relative py-16 flex flex-col items-center overflow-hidden w-full px-4 sm:px-6 min-h-[500px]">
        <div 
          className="absolute inset-0 z-0 pointer-events-none" 
          style={{
            backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            opacity: 0.25,
            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.1)) saturate(120%)'
          }}
        />
        <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl z-10 relative">
          {pNodes.map((pNode, i) => {
            const isLeft = i % 2 === 0
            return (
              <div key={`mobile-${pNode.id}`} className="relative w-full mb-12 flex flex-col items-center">
                {pNode.isModuleStart && (
                  <div className="w-full text-center mb-8 mt-4">
                    <h3 className="inline-block px-4 py-1.5 rounded-full bg-slate-800 text-white font-bold text-sm shadow-md">
                      {pNode.moduleTitle}
                    </h3>
                  </div>
                )}
                <div className="relative w-full flex">
                  {i < pNodes.length - 1 && (
                    <svg 
                      viewBox="0 0 100 100" 
                      className="absolute top-1/2 left-0 w-full h-[calc(100%+3rem)] z-0 pointer-events-none overflow-visible" 
                      preserveAspectRatio="none"
                    >
                      <path 
                        d={isLeft ? "M 25 0 C 25 60, 75 40, 75 100" : "M 75 0 C 75 60, 25 40, 25 100"} 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="none"
                        strokeDasharray="6 6" 
                        vectorEffect="non-scaling-stroke"
                        className={cn(pNode.isCompleted ? "text-indigo-400 animate-dash-move" : "text-slate-300 opacity-60")} 
                      />
                    </svg>
                  )}
                  <div className="w-1/2 flex justify-center z-10">{isLeft && renderPin(pNode, 'mobile')}</div>
                  <div className="w-1/2 flex justify-center z-10">{!isLeft && renderPin(pNode, 'mobile')}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
        @keyframes dash-move {
          from { stroke-dashoffset: 12; }
          to { stroke-dashoffset: 0; }
        }
        .animate-dash-move {
          animation: dash-move 1s linear infinite;
        }
      `}} />
    </div>
  )
}
