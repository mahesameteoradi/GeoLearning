'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'



export function FlashcardWidget({ userId, customFlashcards = [] }: { userId: string, customFlashcards?: { question: string, answer: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  if (!customFlashcards || customFlashcards.length === 0) {
    return (
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-8 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center h-[240px]">
        <Sparkles className="h-10 w-10 text-indigo-300 mb-4 opacity-50" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600 mb-2">
          Tebak Cepat (Flashcard)
        </h2>
        <p className="text-xs text-indigo-500/80 max-w-xs">
          Belum ada flashcard yang dibuat oleh gurumu. Flashcard akan muncul di sini saat tersedia.
        </p>
      </div>
    )
  }

  const flashcards = customFlashcards
  const card = flashcards[currentIndex] || flashcards[0]

  const handleNext = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length)
    }, 150)
  }



  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 shadow-sm relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
      
      <div className="mb-3 flex items-center justify-between relative z-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Tebak Cepat (Flashcard)
        </h2>
      </div>

      <div className="relative h-32 w-full perspective-1000">
        <div 
          className={`w-full h-full transition-transform duration-500 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => {
            setIsFlipped(!isFlipped)
          }}
        >
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden rounded-xl bg-white border border-indigo-100 shadow-sm flex flex-col items-center justify-center p-4 text-center">
            <span className="text-xs font-medium text-slate-400 mb-1">Pertanyaan:</span>
            <p className="text-sm font-semibold text-slate-800">{card.question}</p>
            <span className="text-[10px] text-indigo-400 mt-2">Klik untuk melihat jawaban</span>
          </div>
          
          {/* Back */}
          <div className="absolute w-full h-full backface-hidden rounded-xl bg-indigo-600 shadow-sm flex flex-col items-center justify-center p-4 text-center rotate-y-180 text-white">
            <span className="text-xs font-medium text-indigo-200 mb-1">Jawaban:</span>
            <p className="text-lg font-bold">{card.answer}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-center relative z-10">
        <button 
          onClick={handleNext}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Kartu Berikutnya
        </button>
      </div>
    </div>
  )
}
