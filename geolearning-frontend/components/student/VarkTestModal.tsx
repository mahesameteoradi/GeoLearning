'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, BrainCircuit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type StyleKey = 'V' | 'A' | 'R' | 'K'

interface Question {
  id: number
  text: string
  options: {
    text: string
    style: StyleKey
  }[]
}

const varkQuestions: Question[] = [
  {
    id: 1,
    text: 'Saat belajar hal baru (misalnya mengoperasikan alat baru), saya lebih suka...',
    options: [
      { text: 'Melihat diagram, gambar, atau video panduan.', style: 'V' },
      { text: 'Mendengarkan penjelasan dari seseorang.', style: 'A' },
      { text: 'Membaca buku panduan tertulis.', style: 'R' },
      { text: 'Langsung mencoba dan mempraktikkannya.', style: 'K' },
    ]
  },
  {
    id: 2,
    text: 'Jika saya harus menjelaskan sebuah jalan ke seseorang, saya akan...',
    options: [
      { text: 'Menggambar peta jalan tersebut.', style: 'V' },
      { text: 'Memberitahunya secara lisan arah dan belokannya.', style: 'A' },
      { text: 'Menuliskan daftar arah (kiri, kanan, nama jalan).', style: 'R' },
      { text: 'Berjalan bersamanya atau menggunakan isyarat tangan.', style: 'K' },
    ]
  },
  {
    id: 3,
    text: 'Saat bersantai di waktu luang, hal yang paling saya nikmati adalah...',
    options: [
      { text: 'Menonton film atau melihat foto/lukisan.', style: 'V' },
      { text: 'Mendengarkan musik, podcast, atau mengobrol.', style: 'A' },
      { text: 'Membaca buku, artikel, atau novel.', style: 'R' },
      { text: 'Berolahraga, jalan-jalan, atau membuat sesuatu.', style: 'K' },
    ]
  },
  {
    id: 4,
    text: 'Mengingat sebuah momen yang berkesan, hal yang paling kuat di ingatan saya adalah...',
    options: [
      { text: 'Pemandangan, warna, atau tempat kejadian.', style: 'V' },
      { text: 'Suara, percakapan, atau musik yang sedang diputar.', style: 'A' },
      { text: 'Kata-kata tertulis dari pesan atau surat saat itu.', style: 'R' },
      { text: 'Perasaan fisik, sentuhan, atau aktivitas yang dilakukan.', style: 'K' },
    ]
  },
  {
    id: 5,
    text: 'Ketika mempersiapkan ujian, cara belajar yang paling efektif bagi saya adalah...',
    options: [
      { text: 'Membuat mind map, skema, atau menggunakan stabilo warna.', style: 'V' },
      { text: 'Berdiskusi dengan teman atau merekam dan mendengarkan materi.', style: 'A' },
      { text: 'Membuat ringkasan tertulis dan membacanya berulang-ulang.', style: 'R' },
      { text: 'Belajar sambil memegang benda, berjalan mondar-mandir, atau praktek langsung.', style: 'K' },
    ]
  }
]

// Mapping singkatan gaya belajar ke nama lengkap
const styleNames = {
  'V': 'Visual',
  'A': 'Auditory',
  'R': 'Reading/Writing',
  'K': 'Kinesthetic'
}

interface VarkTestModalProps {
  userId: string
  onComplete: (result: string) => void
}

export function VarkTestModal({ userId, onComplete }: VarkTestModalProps) {
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answers, setAnswers] = useState<StyleKey[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const supabase = createClient()
  const currentQ = varkQuestions[currentQIndex]
  const isFinished = currentQIndex >= varkQuestions.length

  // Calculate results if finished
  const calculateResult = () => {
    const counts = { V: 0, A: 0, R: 0, K: 0 }
    answers.forEach(a => { counts[a]++ })
    
    // Find highest score
    let maxStyle: StyleKey = 'V'
    let maxCount = -1
    
    ;(Object.keys(counts) as StyleKey[]).forEach(k => {
      if (counts[k] > maxCount) {
        maxCount = counts[k]
        maxStyle = k
      }
    })
    
    return styleNames[maxStyle]
  }

  const handleSelect = async (style: StyleKey) => {
    const newAnswers = [...answers, style]
    setAnswers(newAnswers)

    if (currentQIndex + 1 < varkQuestions.length) {
      setCurrentQIndex(prev => prev + 1)
    } else {
      // Selesai
      setIsSubmitting(true)
      const counts = { V: 0, A: 0, R: 0, K: 0 }
      newAnswers.forEach(a => { counts[a]++ })
      let maxStyle: StyleKey = 'V'
      let maxCount = -1
      ;(Object.keys(counts) as StyleKey[]).forEach(k => {
        if (counts[k] > maxCount) {
          maxCount = counts[k]
          maxStyle = k
        }
      })
      const finalStyle = styleNames[maxStyle]

      try {
        const { error } = await supabase
          .from('users')
          .update({ learning_style: finalStyle })
          .eq('id', userId)

        if (error) throw error
        toast.success(`Gaya belajar kamu: ${finalStyle}!`)
        onComplete(finalStyle)
      } catch (err) {
        console.error(err)
        toast.error('Gagal menyimpan gaya belajar')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start overflow-y-auto justify-center p-4 py-8 md:py-12 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/img/pattern.svg')] opacity-10"></div>
          <BrainCircuit className="w-12 h-12 mx-auto mb-3 text-indigo-200" />
          <h2 className="text-2xl font-black mb-1 relative z-10">Kenali Gaya Belajarmu!</h2>
          <p className="text-indigo-100/90 text-sm max-w-md mx-auto relative z-10">
            Jawab beberapa pertanyaan singkat ini agar kami bisa menyesuaikan pengalaman belajarmu.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          {!isFinished ? (
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${(currentQIndex / varkQuestions.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {currentQIndex + 1} / {varkQuestions.length}
                </span>
              </div>

              {/* Question */}
              <h3 className="text-lg md:text-xl font-bold text-slate-800">
                {currentQ.text}
              </h3>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(opt.style)}
                    disabled={isSubmitting}
                    className="flex items-center justify-between w-full p-4 text-left border-2 border-slate-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group disabled:opacity-50"
                  >
                    <span className="text-slate-700 font-medium group-hover:text-indigo-900">
                      {opt.text}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Menganalisis Jawaban...</h3>
              <p className="text-slate-500">Mohon tunggu sebentar, kami sedang menyiapkan profil belajarmu.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
