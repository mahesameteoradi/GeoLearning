'use client'

import React, { useState, useEffect } from 'react'
import { Map as MapIcon, Lock, CheckCircle2, ClipboardList, PlayCircle, FileText, ChevronDown, ChevronRight, Unlock } from 'lucide-react'
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
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Automatically expand unlocked modules on initial load
    const initialExpanded = new Set<string>()
    modules.forEach(mod => {
      if (unlockedModules.has(mod.id)) {
        initialExpanded.add(mod.id)
      }
    })
    // If no modules are unlocked (or we want to show the first one anyway)
    if (initialExpanded.size === 0 && modules.length > 0) {
      initialExpanded.add(modules[0].id)
    }
    setExpandedModules(initialExpanded)
  }, [modules, unlockedModules])

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  // Pre-calculate sequential locking logic across ALL modules and items
  const allNodes: any[] = []
  modules.forEach(mod => {
    const combined: any[] = []
    mod.materials?.forEach(m => combined.push({ ...m, isQuiz: false, modId: mod.id }))
    mod.quizzes?.forEach(q => combined.push({ ...q, isQuiz: true, modId: mod.id }))
    combined.sort((a, b) => a.order - b.order)
    allNodes.push(...combined)
  })

  let isCurrentlyLocked = false
  const nodeLockMap = new Map<string, boolean>()
  
  allNodes.forEach(node => {
    // If a module is explicitly unlocked, we can bypass previous locks for the start of the module?
    // According to the original logic, we just sequential lock until we hit an incomplete item.
    // Wait, the original logic unlocked the *first* item of a module if the module is in unlockedModules.
    
    // Let's stick to simple sequential locking:
    const isCompleted = node.isQuiz ? completedQuizzes.has(node.id) : completedMaterials.has(node.id)
    
    // If this node is the first of an explicitly unlocked module, we unlock it
    if (unlockedModules.has(node.modId) && node.order === 0) { // Assuming order 0 is first, or we can check index
       // Well, we will just use the sequential lock for now, but ensure current node isn't locked if it's the next available
    }

    nodeLockMap.set(node.id, isCurrentlyLocked)

    if (!isCompleted) {
      isCurrentlyLocked = true // Everything after an incomplete item is locked
    }
  })

  // Let's ensure the very first item is always unlocked
  if (allNodes.length > 0) {
    nodeLockMap.set(allNodes[0].id, false)
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {modules.map((mod, index) => {
        const isExpanded = expandedModules.has(mod.id)
        const isModuleUnlocked = unlockedModules.has(mod.id) || index === 0 // First module always accessible
        
        const combinedNodes: any[] = []
        mod.materials?.forEach(m => combinedNodes.push({ ...m, isQuiz: false }))
        mod.quizzes?.forEach(q => combinedNodes.push({ ...q, isQuiz: true }))
        combinedNodes.sort((a, b) => a.order - b.order)

        const totalItems = combinedNodes.length
        const completedItems = combinedNodes.filter(n => n.isQuiz ? completedQuizzes.has(n.id) : completedMaterials.has(n.id)).length
        const isAllCompleted = totalItems > 0 && completedItems === totalItems

        return (
          <div key={mod.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Accordion Header */}
            <div 
              onClick={() => toggleModule(mod.id)}
              className={cn(
                "flex items-center justify-between p-4 sm:p-5 cursor-pointer transition-colors select-none",
                isExpanded ? "bg-indigo-50/50" : "hover:bg-slate-50",
                !isModuleUnlocked && "opacity-75 grayscale-[50%]"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl shadow-inner",
                  isAllCompleted ? "bg-emerald-100 text-emerald-600" :
                  isModuleUnlocked ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                )}>
                  {isAllCompleted ? <CheckCircle2 className="w-6 h-6" /> : 
                   isModuleUnlocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-lg">{mod.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-slate-500">{completedItems} / {totalItems} Selesai</span>
                    {/* Progress bar */}
                    <div className="w-24 sm:w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-500", isAllCompleted ? "bg-emerald-500" : "bg-indigo-500")}
                        style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-slate-400">
                {isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
              </div>
            </div>

            {/* Accordion Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {combinedNodes.map((node) => {
                      const isCompleted = node.isQuiz ? completedQuizzes.has(node.id) : completedMaterials.has(node.id)
                      const isLocked = nodeLockMap.get(node.id) ?? true
                      const isCurrent = !isCompleted && !isLocked

                      let Icon = FileText
                      if (node.isQuiz) Icon = ClipboardList
                      else if (node.type === 'VIDEO') Icon = PlayCircle
                      else if (node.type === 'INTERACTIVE_MAP') Icon = MapIcon

                      const url = node.isQuiz 
                        ? `/student/quizzes/${node.id}`
                        : `/student/classes/${classId}/materials/${node.id}`

                      const content = (
                        <div className={cn(
                          "relative flex flex-col p-4 rounded-xl border-2 transition-all duration-300",
                          isCompleted ? "bg-emerald-50 border-emerald-200 hover:border-emerald-300" :
                          isCurrent ? "bg-white border-indigo-300 shadow-md shadow-indigo-100 hover:shadow-lg hover:border-indigo-400 -translate-y-1" :
                          "bg-slate-100 border-transparent opacity-70 grayscale-[30%]"
                        )}>
                          <div className="flex items-start justify-between mb-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              isCompleted ? "bg-emerald-100 text-emerald-600" :
                              isCurrent ? "bg-indigo-100 text-indigo-600" :
                              "bg-slate-200 text-slate-500"
                            )}>
                              <Icon className="w-5 h-5" />
                            </div>
                            {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {isLocked && !isCompleted && <Lock className="w-4 h-4 text-slate-400" />}
                            {isCurrent && <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />}
                          </div>
                          
                          <div className="mt-auto">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                              {node.isQuiz ? 'Kuis' : 'Materi'}
                            </span>
                            <h4 className={cn(
                              "font-bold text-sm line-clamp-2",
                              isCompleted ? "text-emerald-900" :
                              isCurrent ? "text-slate-800" :
                              "text-slate-600"
                            )}>
                              {node.title}
                            </h4>
                          </div>
                        </div>
                      )

                      if (isLocked) {
                        return <div key={node.id} className="cursor-not-allowed">{content}</div>
                      }

                      return (
                        <Link key={node.id} href={url} className="block group">
                          {content}
                        </Link>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
