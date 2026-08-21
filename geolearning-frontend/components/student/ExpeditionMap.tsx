'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Lock, CheckCircle2, ClipboardList, PlayCircle, FileText, Map as MapIcon, BookOpen, HelpCircle } from 'lucide-react'
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

// Zigzag X positions (%) — wider spread on desktop, tighter on mobile handled via CSS
const ZIGZAG = [18, 50, 82, 50, 18, 50, 82, 50, 18, 50, 82, 50, 18, 50, 82, 50]
// Mobile tighter zigzag (fits narrow screens)
const ZIGZAG_MOBILE = [15, 50, 85, 50, 15, 50, 85, 50, 15, 50, 85, 50, 15, 50, 85, 50]

interface FlatNode {
  id: string
  title: string
  isQuiz: boolean
  type?: string
  xp_reward?: number
  modId: string
  modTitle: string
  isFirstOfMod: boolean
  url: string
}

export function ExpeditionMap({
  modules,
  completedMaterials,
  completedQuizzes,
  unlockedModules,
  classId,
}: {
  modules: ModuleItem[]
  completedMaterials: Set<string>
  completedQuizzes: Set<string>
  unlockedModules: Set<string>
  classId: string
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Flatten ALL materials + quizzes into one ordered list
  const flatNodes: FlatNode[] = []
  modules.forEach((mod) => {
    const items: any[] = []
    mod.materials?.forEach(m => items.push({ ...m, isQuiz: false }))
    mod.quizzes?.forEach(q => items.push({ ...q, isQuiz: true }))
    items.sort((a, b) => a.order - b.order)
    items.forEach((item, itemIdx) => {
      flatNodes.push({
        id: item.id,
        title: item.title,
        isQuiz: item.isQuiz,
        type: item.type,
        xp_reward: item.xp_reward,
        modId: mod.id,
        modTitle: mod.title,
        isFirstOfMod: itemIdx === 0,
        url: item.isQuiz
          ? `/student/quizzes/${item.id}`
          : `/student/classes/${classId}/materials/${item.id}`,
      })
    })
  })

  // Sequential lock map
  let globalLocked = false
  const lockMap = new Map<string, boolean>()
  flatNodes.forEach((node) => {
    const modIdx = modules.findIndex(m => m.id === node.modId)
    const modUnlocked = modIdx === 0 || unlockedModules.has(node.modId)
    if (node.isFirstOfMod && modUnlocked && globalLocked) {
      lockMap.set(node.id, false)
    } else {
      lockMap.set(node.id, globalLocked)
    }
    const done = node.isQuiz ? completedQuizzes.has(node.id) : completedMaterials.has(node.id)
    if (!done && !lockMap.get(node.id)) globalLocked = true
  })
  if (flatNodes.length > 0) lockMap.set(flatNodes[0].id, false)

  // Responsive sizing
  const NODE_SIZE = isMobile ? 40 : 44
  const NODE_GAP = isMobile ? 110 : 130
  const LABEL_OFFSET = isMobile ? -28 : -32

  const zigzag = isMobile ? ZIGZAG_MOBILE : ZIGZAG

  // Node positions
  const nodePositions = flatNodes.map((_, i) => ({
    x: zigzag[i % zigzag.length],
    y: 70 + i * NODE_GAP,
  }))

  // Build SVG cubic bezier path
  const buildPath = () => {
    if (flatNodes.length < 2) return ''
    let d = `M ${nodePositions[0].x} ${nodePositions[0].y}`
    for (let i = 1; i < nodePositions.length; i++) {
      const p = nodePositions[i - 1]
      const c = nodePositions[i]
      const midY = (p.y + c.y) / 2
      d += ` C ${p.x} ${midY}, ${c.x} ${midY}, ${c.x} ${c.y}`
    }
    return d
  }

  const mapHeight = Math.max(360, flatNodes.length * NODE_GAP + 120)

  if (flatNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <BookOpen className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-semibold">Belum ada materi atau kuis</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full overflow-x-hidden">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-blue-100 shadow-md"
        style={{
          background: 'linear-gradient(180deg, #eff6ff 0%, #eef2ff 40%, #f0fdf4 100%)',
          height: `${mapHeight}px`,
        }}
      >
        {/* World map background */}
        <div
          className="absolute inset-0 opacity-[0.11]"
          style={{
            backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1.5px, transparent 1.5px)',
            backgroundSize: isMobile ? '28px 28px' : '40px 40px',
          }}
        />

        {/* SVG — paths */}
        <svg
          className="absolute inset-0 w-full pointer-events-none"
          height={mapHeight}
          viewBox={`0 0 100 ${mapHeight}`}
          preserveAspectRatio="none"
          style={{ zIndex: 1 }}
        >
          {/* Dashed full route */}
          <path
            d={buildPath()}
            fill="none"
            stroke="rgba(148,163,184,0.3)"
            strokeWidth="1.2"
            strokeDasharray="3,3"
          />

          {/* Colored completed/active segments */}
          {flatNodes.map((node, i) => {
            if (i === 0) return null
            const prevDone = flatNodes[i - 1].isQuiz
              ? completedQuizzes.has(flatNodes[i - 1].id)
              : completedMaterials.has(flatNodes[i - 1].id)
            const currLocked = lockMap.get(node.id) ?? true
            if (!prevDone && currLocked) return null

            const p = nodePositions[i - 1]
            const c = nodePositions[i]
            const midY = (p.y + c.y) / 2

            return (
              <path
                key={`seg-${node.id}`}
                d={`M ${p.x} ${p.y} C ${p.x} ${midY}, ${c.x} ${midY}, ${c.x} ${c.y}`}
                fill="none"
                stroke={prevDone ? '#10b981' : 'rgba(99,102,241,0.65)'}
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {/* ── NODES ── */}
        {flatNodes.map((node, i) => {
          const pos = nodePositions[i]
          const isDone = node.isQuiz
            ? completedQuizzes.has(node.id)
            : completedMaterials.has(node.id)
          const isLocked = lockMap.get(node.id) ?? true
          const isCurrent = !isDone && !isLocked
          const isHovered = hoveredId === node.id

          let Icon = FileText
          if (node.isQuiz) Icon = HelpCircle
          else if (node.type === 'VIDEO') Icon = PlayCircle
          else if (node.type === 'INTERACTIVE_MAP') Icon = MapIcon

          return (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 20,
              }}
            >
              {/* Chapter label (first item of each module) */}
              {node.isFirstOfMod && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
                  style={{ top: `${LABEL_OFFSET}px`, zIndex: 30 }}
                >
                  <span className={cn(
                    'bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full shadow-sm',
                    isMobile ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'
                  )}>
                    {node.modTitle}
                  </span>
                </div>
              )}

              {/* Pulse for active node */}
              {isCurrent && (
                <motion.div
                  className="absolute rounded-full bg-blue-400/30 pointer-events-none"
                  style={{
                    width: NODE_SIZE + 14,
                    height: NODE_SIZE + 14,
                    top: -(NODE_SIZE + 14) / 2 + NODE_SIZE / 2,
                    left: -(NODE_SIZE + 14) / 2 + NODE_SIZE / 2,
                    zIndex: 0,
                  }}
                  animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Tooltip on hover (desktop only) */}
              <AnimatePresence>
                {isHovered && !isMobile && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute z-50 bg-slate-800 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-md pointer-events-none"
                    style={{
                      bottom: `${NODE_SIZE + 6}px`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      maxWidth: 140,
                      whiteSpace: 'normal',
                      textAlign: 'center',
                    }}
                  >
                    {node.isQuiz ? '📝 ' : '📖 '}{node.title}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Node circle */}
              {isLocked ? (
                <div
                  className="rounded-full flex items-center justify-center border-2 border-slate-200 bg-white/70 text-slate-300 shadow-sm cursor-not-allowed opacity-50 relative z-10"
                  style={{ width: NODE_SIZE, height: NODE_SIZE }}
                >
                  <Lock className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                </div>
              ) : (
                <Link href={node.url} className="relative z-10 block">
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.92 }}
                    onHoverStart={() => setHoveredId(node.id)}
                    onHoverEnd={() => setHoveredId(null)}
                    className={cn(
                      'rounded-full flex items-center justify-center border-2 border-white shadow-md cursor-pointer transition-shadow overflow-hidden',
                      isDone
                        ? 'bg-green-500 text-white shadow-green-300/60 hover:shadow-green-300/80'
                        : 'bg-blue-600 text-white shadow-blue-300/60 hover:shadow-blue-300/80'
                    )}
                    style={{ width: NODE_SIZE, height: NODE_SIZE }}
                  >
                    {isDone
                      ? <CheckCircle2 className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                      : <Icon className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                    }
                  </motion.div>
                </Link>
              )}

              {/* Type label below node (mobile: smaller) */}
              <div
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
                style={{ top: `${NODE_SIZE + 2}px` }}
              >
                <span className={cn(
                  'font-bold rounded',
                  isMobile ? 'text-[8px]' : 'text-[9px]',
                  isDone ? 'text-green-600' :
                  isCurrent ? 'text-blue-600' :
                  'text-slate-400'
                )}>
                  {node.isQuiz ? 'Kuis' : 'Materi'}
                </span>
              </div>
            </div>
          )
        })}

        {/* Legend — responsive position */}
        <div className="absolute bottom-3 right-3 z-30 flex flex-wrap items-center gap-2 sm:gap-3 bg-white/85 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-full shadow border border-white">
          {[
            { cls: 'bg-green-500', label: 'Selesai' },
            { cls: 'bg-blue-600', label: 'Aktif' },
            { cls: 'bg-slate-300', label: 'Terkunci' },
          ].map(({ cls, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={cn('w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full', cls)} />
              <span className="text-[9px] sm:text-[10px] text-slate-600 font-semibold">{label}</span>
            </div>
          ))}
        </div>

        {/* Progress badge — top right */}
        <div className="absolute top-3 right-3 z-30 bg-white/85 backdrop-blur-sm px-2.5 sm:px-3 py-1 rounded-full border border-white shadow">
          <span className="text-[10px] sm:text-[11px] font-bold text-blue-700">
            {flatNodes.filter(n => n.isQuiz ? completedQuizzes.has(n.id) : completedMaterials.has(n.id)).length}
            /{flatNodes.length} selesai
          </span>
        </div>
      </div>
    </div>
  )
}
