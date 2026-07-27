'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const GEOGRAPHY_FLASHCARDS = [
  { question: 'Apa ibu kota negara Jepang?', answer: 'Tokyo' },
  { question: 'Sungai terpanjang di dunia adalah?', answer: 'Sungai Nil' },
  { question: 'Benua terbesar di dunia?', answer: 'Benua Asia' },
  { question: 'Negara mana yang memiliki bentuk seperti sepatu bot?', answer: 'Italia' },
  { question: 'Gunung tertinggi di dunia?', answer: 'Gunung Everest' },
  { question: 'Lautan mana yang merupakan lautan terbesar?', answer: 'Samudra Pasifik' },
  { question: 'Apa nama gurun terluas di dunia?', answer: 'Gurun Sahara' },
]

export function FlashcardWidget({ userId }: { userId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [claiming, setClaiming] = useState(false)

  const card = GEOGRAPHY_FLASHCARDS[currentIndex]

  const handleNext = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % GEOGRAPHY_FLASHCARDS.length)
    }, 150)
  }

  const handleClaimXP = async () => {
    if (claimed || claiming) return
    setClaiming(true)
    
    try {
      const supabase = createClient()
      
      // Get current XP
      const { data: user } = await supabase
        .from('users')
        .select('xp')
        .eq('id', userId)
        .single()
        
      if (user) {
        // Add 10 XP
        await supabase
          .from('users')
          .update({ xp: user.xp + 10 })
          .eq('id', userId)
          
        toast.success('+10 XP dari Flashcard Harian!', { icon: '✨' })
        setClaimed(true)
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal klaim XP')
    } finally {
      setClaiming(false)
    }
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
        {!claimed ? (
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">
            +10 XP
          </span>
        ) : (
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-full">
            Diklaim
          </span>
        )}
      </div>

      <div className="relative h-32 w-full perspective-1000">
        <div 
          className={`w-full h-full transition-transform duration-500 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => {
            setIsFlipped(!isFlipped)
            if (!claimed && !isFlipped) {
              handleClaimXP()
            }
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
