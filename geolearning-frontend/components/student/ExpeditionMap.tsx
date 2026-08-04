import React from 'react'
import { Map, Lock, CheckCircle2, BookOpen, ClipboardList, PlayCircle, FileText, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
  // Flatten everything into a single linear sequence
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
  
  modules.forEach((mod) => {
    const combinedNodes: (MapNode & { order: number })[] = []
    
    // 1. Add all materials
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

    // 2. Add all quizzes
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

    // Sort by order
    combinedNodes.sort((a, b) => a.order - b.order)

    // Assign module start and push to global nodes
    let isFirstInModule = true
    combinedNodes.forEach((node) => {
      node.isModuleStart = isFirstInModule
      nodes.push(node)
      isFirstInModule = false
    })
  })

  // Calculate unlocked status
  // A node is unlocked if ALL previous nodes are completed
  let isLocked = false

  return (
    <div className="relative py-12 flex flex-col items-center overflow-hidden w-full px-4 sm:px-6">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        {nodes.map((node, i) => {
          // If a new module starts and it is manually unlocked by teacher, remove the lock!
          if (node.isModuleStart && unlockedModules.has(node.moduleId)) {
            isLocked = false
          }

          // If we hit a locked flag from previous nodes, this node is locked
          const currentLocked = isLocked
          
          // If this node is NOT completed, all subsequent nodes will be locked
          if (!node.isCompleted) {
            isLocked = true
          }

          const isCurrent = !node.isCompleted && !currentLocked
          const showModuleTitle = node.isModuleStart
          
          // Wavy positioning
          const isLeft = i % 2 === 0
          const offsetClass = isLeft ? 'mr-auto ml-4 md:ml-12' : 'ml-auto mr-4 md:mr-12'

          const nodeContent = (
            <div className="relative flex flex-col items-center group">
              {/* ─── Animated Explorer ─── */}
              {isCurrent && (
                <motion.div 
                  layoutId="explorer"
                  className="absolute -top-6 -left-6 text-4xl z-20 drop-shadow-md pointer-events-none"
                  animate={{ 
                    y: [0, -10, 0],
                    x: [0, 5, 0],
                    rotate: [0, 10, -5, 0]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  title="Kamu berada di sini!"
                >
                  🏃‍♂️
                </motion.div>
              )}

              {/* ─── Planted Flag for Completed ─── */}
              {node.isCompleted && (
                <motion.div
                  initial={{ scale: 0, originY: 1, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className={cn(
                    "absolute z-20 pointer-events-none",
                    node.type === 'quiz' ? "-top-4 -right-5 text-4xl drop-shadow-[0_4px_8px_rgba(251,191,36,0.5)]" : "-top-2 -right-4 text-3xl drop-shadow-sm"
                  )}
                  title={node.type === 'quiz' ? "Kuis selesai ditaklukkan!" : "Materi selesai ditaklukkan!"}
                >
                  {node.type === 'quiz' ? '🏆' : '🚩'}
                </motion.div>
              )}

              {currentLocked ? (
                // Locked Node
                <div className={cn(
                  "rounded-full border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-slate-400 opacity-70",
                  node.type === 'quiz' ? "w-24 h-24 border-8" : "w-20 h-20 border-4"
                )}>
                  <Lock className={cn("mb-1", node.type === 'quiz' ? "w-8 h-8" : "w-6 h-6")} />
                </div>
              ) : (
                // Unlocked / Completed Node
                <Link href={node.url}>
                  <div className={cn(
                    "rounded-full flex flex-col items-center justify-center transition-all hover:scale-110 hover:shadow-xl cursor-pointer shadow-md",
                    node.type === 'quiz' ? "w-24 h-24 border-8" : "w-20 h-20 border-4",
                    node.isCompleted 
                      ? (node.type === 'quiz' 
                          ? "border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 shadow-amber-400/30" 
                          : "border-emerald-500 bg-emerald-100 text-emerald-600 shadow-emerald-500/20")
                      : (node.type === 'quiz'
                          ? "border-amber-500 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/40"
                          : "border-indigo-500 bg-indigo-500 text-white shadow-indigo-500/40"),
                    isCurrent && "ring-4 ring-offset-2 animate-bounce-slow",
                    isCurrent && (node.type === 'quiz' ? "ring-amber-200" : "ring-indigo-200")
                  )}>
                    {node.isCompleted ? (
                      <CheckCircle2 className={cn(node.type === 'quiz' ? "w-10 h-10 text-amber-500" : "w-8 h-8")} />
                    ) : (
                      <node.icon className={cn(node.type === 'quiz' ? "w-10 h-10 drop-shadow-md" : "w-8 h-8")} />
                    )}
                  </div>
                </Link>
              )}
              
              {/* Floating Label */}
              <div className={cn(
                "absolute top-full mt-3 w-32 text-center text-xs font-bold transition-all left-1/2 -translate-x-1/2",
                currentLocked ? "text-slate-400" : "text-slate-700 group-hover:text-indigo-600"
              )}>
                {node.title}
              </div>
            </div>
          )

          return (
            <div key={node.id} className="relative w-full mb-12 flex flex-col items-center">
              {showModuleTitle && (
                <div className="w-full text-center mb-8 mt-4">
                  <h3 className="inline-block px-4 py-1.5 rounded-full bg-slate-800 text-white font-bold text-sm shadow-md">
                    {node.moduleTitle}
                  </h3>
                </div>
              )}

              <div className="relative w-full flex">
                
                {/* SVG Connecting Line */}
                {i < nodes.length - 1 && (
                  <svg className="absolute top-1/2 left-0 w-full h-[calc(100%+3rem)] z-0 pointer-events-none overflow-visible" preserveAspectRatio="none">
                    <line 
                      x1={isLeft ? "25%" : "75%"} 
                      y1="0" 
                      x2={isLeft ? "75%" : "25%"} 
                      y2="100%" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      strokeDasharray="8 8" 
                      className={node.isCompleted ? "text-indigo-400" : "text-slate-300"} 
                    />
                  </svg>
                )}

                {/* Left Side */}
                <div className="w-1/2 flex justify-center z-10">
                  {isLeft && nodeContent}
                </div>

                {/* Right Side */}
                <div className="w-1/2 flex justify-center z-10">
                  {!isLeft && nodeContent}
                </div>

              </div>
            </div>
          )
        })}
      </div>
      
      {/* Custom Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
      `}} />
    </div>
  )
}
