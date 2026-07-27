import React from 'react'
import { Map, Lock, CheckCircle2, BookOpen, ClipboardList, PlayCircle, FileText, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

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
  classId
}: { 
  modules: ModuleItem[],
  completedMaterials: Set<string>,
  completedQuizzes: Set<string>,
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
    isModuleStart: boolean
  }

  const nodes: MapNode[] = []
  
  modules.forEach((mod) => {
    let isFirstInModule = true
    
    // 1. Add all materials
    mod.materials?.forEach((mat) => {
      let icon = FileText
      if (mat.type === 'VIDEO') icon = PlayCircle
      if (mat.type === 'INTERACTIVE_MAP') icon = Map

      nodes.push({
        id: mat.id,
        type: 'material',
        title: mat.title,
        isCompleted: completedMaterials.has(mat.id),
        url: `/student/classes/${classId}/materials/${mat.id}`,
        icon,
        moduleTitle: mod.title,
        isModuleStart: isFirstInModule
      })
      isFirstInModule = false
    })

    // 2. Add all quizzes
    mod.quizzes?.forEach((quiz) => {
      nodes.push({
        id: quiz.id,
        type: 'quiz',
        title: quiz.title,
        isCompleted: completedQuizzes.has(quiz.id),
        url: `/student/quizzes/${quiz.id}`,
        icon: ClipboardList,
        moduleTitle: mod.title,
        isModuleStart: isFirstInModule
      })
      isFirstInModule = false
    })
  })

  // Calculate unlocked status
  // A node is unlocked if ALL previous nodes are completed
  let isLocked = false

  return (
    <div className="relative py-12 flex flex-col items-center">
      <div className="w-full max-w-md">
        {nodes.map((node, i) => {
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

          return (
            <div key={node.id} className="relative w-full mb-10 flex flex-col items-center group">
              {/* Connecting line to NEXT node */}
              {i < nodes.length - 1 && (
                <div className={cn(
                  "absolute top-16 w-1 -z-10 h-24",
                  node.isCompleted ? "bg-indigo-500" : "bg-slate-200"
                )} style={{ 
                  transform: isLeft ? 'rotate(-25deg) translateX(30px)' : 'rotate(25deg) translateX(-30px)' 
                }} />
              )}

              {showModuleTitle && (
                <div className="w-full text-center mb-8 mt-4">
                  <h3 className="inline-block px-4 py-1.5 rounded-full bg-slate-800 text-white font-bold text-sm shadow-md">
                    {node.moduleTitle}
                  </h3>
                </div>
              )}

              <div className={cn("relative w-full flex", isLeft ? 'justify-start' : 'justify-end')}>
                <div className={cn("relative z-10", offsetClass)}>
                  {currentLocked ? (
                    // Locked Node
                    <div className="w-20 h-20 rounded-full border-4 border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-slate-400 opacity-70">
                      <Lock className="w-6 h-6 mb-1" />
                    </div>
                  ) : (
                    // Unlocked / Completed Node
                    <Link href={node.url}>
                      <div className={cn(
                        "w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center transition-transform hover:scale-110 hover:shadow-xl cursor-pointer shadow-md",
                        node.isCompleted 
                          ? "border-emerald-500 bg-emerald-100 text-emerald-600 shadow-emerald-500/20" 
                          : "border-indigo-500 bg-indigo-500 text-white shadow-indigo-500/40",
                        isCurrent && "ring-4 ring-indigo-200 ring-offset-2 animate-bounce-slow"
                      )}>
                        {node.isCompleted ? (
                          <CheckCircle2 className="w-8 h-8" />
                        ) : (
                          <node.icon className="w-8 h-8" />
                        )}
                      </div>
                    </Link>
                  )}
                  
                  {/* Floating Label */}
                  <div className={cn(
                    "absolute top-full mt-3 w-32 text-center text-xs font-bold transition-all",
                    isLeft ? "left-1/2 -translate-x-1/2" : "right-1/2 translate-x-1/2",
                    currentLocked ? "text-slate-400" : "text-slate-700 group-hover:text-indigo-600"
                  )}>
                    {node.title}
                  </div>
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
