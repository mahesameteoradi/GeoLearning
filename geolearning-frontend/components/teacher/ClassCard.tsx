"use client"

import { useState } from 'react'
import { Users, BookOpen, TrendingUp, Edit2, BellRing, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export interface FlashcardData {
  question: string
  answer: string
}

interface ClassCardProps {
  id: string
  name: string
  description?: string | null
  joinCode: string
  flashcards?: FlashcardData[] | null
  studentCount: number
  moduleCount: number
  avgXp?: number
  gamificationMode?: string
  className?: string
}

export function ClassCard({
  id,
  name,
  description,
  joinCode,
  flashcards,
  studentCount,
  moduleCount,
  avgXp = 0,
  gamificationMode = 'STANDARD',
  className,
}: ClassCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [cards, setCards] = useState<FlashcardData[]>(
    Array.isArray(flashcards) ? flashcards : []
  )
  const [isSaving, setIsSaving] = useState(false)
  const [currentCards, setCurrentCards] = useState<FlashcardData[]>(
    Array.isArray(flashcards) ? flashcards : []
  )

  const handleAddCard = (e: React.MouseEvent) => {
    e.preventDefault()
    setCards([...cards, { question: '', answer: '' }])
  }

  const handleUpdateCard = (idx: number, field: 'question' | 'answer', val: string) => {
    const newCards = [...cards]
    newCards[idx][field] = val
    setCards(newCards)
  }

  const handleRemoveCard = (e: React.MouseEvent, idx: number) => {
    e.preventDefault()
    setCards(cards.filter((_, i) => i !== idx))
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Filter out empty cards
    const validCards = cards.filter(c => c.question.trim() || c.answer.trim())

    const supabase = createClient()
    const { error } = await supabase
      .from('classes')
      .update({ flashcards: validCards })
      .eq('id', id)

    if (error) {
      toast.error('Gagal menyimpan reminder flashcard')
      console.error(error)
    } else {
      toast.success('Reminder berhasil disimpan')
      setCurrentCards(validCards)
      setCards(validCards)
      setIsEditing(false)
    }

    setIsSaving(false)
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsEditing(false)
    setCards(currentCards)
  }



  return (
    <div
      className={cn(
        'group relative block overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 transition-all duration-300 hover:border-indigo-300/50 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1',
        className
      )}
    >
      {/* Decorative gradient corner */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 blur-3xl transition-all duration-500 group-hover:bg-indigo-100 group-hover:scale-150" />

      <div className="mb-3 flex items-start justify-between relative z-10">
        <div className="flex flex-col">
          <Link href={`/teacher/classes/${id}`} className="hover:underline">
            <h3 className="line-clamp-1 text-base font-bold text-slate-900 pr-12">{name}</h3>
          </Link>
          <code className="mt-1 w-fit flex-shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500">
            {joinCode}
          </code>
        </div>

      </div>

      {/* Reminder Section */}
      {/* <div className="mb-4 relative z-10">
        {!isEditing ? (
          <div className="rounded-lg bg-amber-50/50 p-3 border border-amber-100/50 transition-colors hover:bg-amber-50 hover:border-amber-200">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <BellRing className="w-3 h-3" /> Reminder Materi
              </p>
              <button
                onClick={(e) => { e.preventDefault(); setIsEditing(true) }}
                className="text-amber-600/50 hover:text-amber-700 transition-colors"
                title="Edit Reminder"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
            {currentCards.length > 0 ? (
              <div className="space-y-1 mt-2">
                <p className="text-xs font-semibold text-amber-900 line-clamp-1">
                  Q: {currentCards[0].question}
                </p>
                {currentCards.length > 1 && (
                  <p className="text-[10px] text-amber-700/80">
                    +{currentCards.length - 1} poin materi lainnya
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-amber-700/60 italic">Belum ada flashcard reminder...</p>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-3 border border-blue-200 shadow-sm max-h-[250px] overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5"><Edit2 className="w-3 h-3" /> Edit Flashcards</span>
            </p>

            <div className="space-y-3 mb-3">
              {cards.map((card, idx) => (
                <div key={idx} className="relative rounded-md border border-slate-100 bg-slate-50 p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-slate-500">Kartu {idx + 1}</span>
                    <button
                      onClick={(e) => handleRemoveCard(e, idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={card.question}
                    onChange={(e) => handleUpdateCard(idx, 'question', e.target.value)}
                    className="w-full text-xs p-1.5 mb-1.5 rounded border border-slate-200 bg-white focus:border-blue-500 focus:outline-none"
                    placeholder="Materi / Pertanyaan..."
                  />
                  <input
                    type="text"
                    value={card.answer}
                    onChange={(e) => handleUpdateCard(idx, 'answer', e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white focus:border-blue-500 focus:outline-none"
                    placeholder="Jawaban..."
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleAddCard}
              className="w-full mb-3 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded border border-dashed border-slate-300 text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-3 h-3" /> Tambah Kartu
            </button>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleCancel}
                className="text-[10px] px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="text-[10px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        )}
      </div> */}

      <div className="grid grid-cols-3 gap-3 relative z-10">
        <div className="flex flex-col items-center rounded-xl bg-white/60 py-3 shadow-sm border border-slate-100">
          <Users className="mb-1 h-4 w-4 text-cyan-600" />
          <span className="text-base font-bold text-slate-800">{studentCount}</span>
          <span className="text-[10px] text-slate-500">Students</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-white/60 py-3 shadow-sm border border-slate-100">
          <BookOpen className="mb-1 h-4 w-4 text-blue-600" />
          <span className="text-base font-bold text-slate-800">{moduleCount}</span>
          <span className="text-[10px] text-slate-500">Modules</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-white/60 py-3 shadow-sm border border-slate-100">
          <TrendingUp className="mb-1 h-4 w-4 text-amber-600" />
          <span className="text-base font-bold text-slate-800">{avgXp.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500">Avg XP</span>
        </div>
      </div>


    </div>
  )
}
