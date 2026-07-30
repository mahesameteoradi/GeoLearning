'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Clock, Zap, ChevronRight, CheckCircle, XCircle,
  Trophy, Star, ArrowLeft, Loader2, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { hitungJarakMeter, hitungSkorPeta } from '@/lib/utils/scoreUtils'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

// ─── Gamification Audio Utility ─────────────────────────────────────────────

function playSound(type: 'correct' | 'wrong' | 'start' | 'finish') {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    if (type === 'correct') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime) // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1) // A5
      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } else if (type === 'wrong') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } else if (type === 'start') {
      osc.type = 'square'
      osc.frequency.setValueAtTime(330, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } else if (type === 'finish') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1) // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2) // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3) // C6
      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
      osc.start()
      osc.stop(ctx.currentTime + 0.6)
    }
  } catch (e) {
    // Ignore audio errors (e.g. autoplay policy)
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

// Removed legacy distance formula

interface Question {
  id: string
  text: string
  type: 'MULTIPLE_CHOICE' | 'MAP_PINPOINT'
  options: any
  correct_answer: string
  explanation: string | null
  points: number | null
  duration: number | null
  order: number
}

interface QuizData {
  id: string
  title: string
  time_limit: number | null
  xp_reward: number
  questions: Question[]
}

type GameState = 'loading' | 'ready' | 'playing' | 'reviewing' | 'finished' | 'error' | 'already_done'

// ─── Confetti ─────────────────────────────────────────────────────────────────

function ConfettiPiece({ style }: { style: React.CSSProperties }) {
  return <div className="absolute h-2 w-2 rounded-sm opacity-80" style={style} />
}

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      top: `-${Math.random() * 20 + 5}%`,
      background: ['#7C3AED', '#06B6D4', '#F59E0B', '#10B981', '#EC4899', '#EF4444'][i % 6],
      animation: `fall ${1.5 + Math.random() * 2}s ${Math.random() * 0.5}s ease-in forwards`,
      transform: `rotate(${Math.random() * 360}deg)`,
    } as React.CSSProperties,
  }))
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => <ConfettiPiece key={p.id} style={p.style} />)}
    </div>
  )
}

// ─── Timer ────────────────────────────────────────────────────────────────────

function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const pct = (seconds / total) * 100
  const color = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-500'
  const urgent = pct <= 25

  return (
    <div className="flex items-center gap-2">
      <Clock className={cn('h-4 w-4 flex-shrink-0', urgent ? 'text-red-600 animate-pulse' : 'text-slate-500')} />
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-xs font-mono font-bold tabular-nums w-10 text-right', urgent ? 'text-red-600' : 'text-slate-500')}>
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
      </span>
    </div>
  )
}

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({
  score,
  xpEarned,
  totalQuestions,
  correctCount,
  onBack,
}: {
  score: number
  xpEarned: number
  totalQuestions: number
  correctCount: number
  onBack: () => void
}) {
  useEffect(() => {
    if (score >= 70) {
      import('@/lib/utils/confetti').then(({ triggerConfetti }) => {
        triggerConfetti()
      })
    }
  }, [score])

  const emoji = score >= 85 ? '🏆' : score >= 70 ? '🎉' : score >= 55 ? '💪' : '📚'
  const message =
    score >= 85 ? 'Luar Biasa! Nilai sempurna!' :
    score >= 70 ? 'Bagus sekali! Kerja keras terbayar!' :
    score >= 55 ? 'Cukup baik! Terus berlatih!' :
    'Jangan menyerah! Pelajari lagi materinya.'

  const scoreColor =
    score >= 85 ? 'from-emerald-500 to-cyan-500' :
    score >= 70 ? 'from-violet-500 to-fuchsia-500' :
    score >= 55 ? 'from-amber-500 to-orange-500' :
    'from-red-500 to-rose-500'

  return (
    <>
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950">
        <div className="w-full max-w-md text-center">
          {/* Big score */}
          <div className="mb-6 relative">
            <div className={`mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br ${scoreColor} shadow-[0_0_40px_rgba(139,92,246,0.3)]`}>
              <div>
                <p className="text-5xl font-black text-white tabular-nums">{score.toFixed(0)}</p>
                <p className="text-sm font-bold text-white/70">%</p>
              </div>
            </div>
            <div className="absolute -right-2 -top-2 text-4xl">{emoji}</div>
          </div>

          <h1 className="mb-1 text-2xl font-extrabold text-white drop-shadow-md">{message}</h1>
          <p className="mb-8 text-sm text-purple-200">
            {correctCount} dari {totalQuestions} soal benar
          </p>

          {/* XP earned */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/50 px-5 py-2.5 backdrop-blur-sm">
            <Zap className="h-5 w-5 text-amber-400" />
            <span className="text-lg font-bold text-amber-400">+{xpEarned} XP</span>
            <span className="text-sm text-amber-400/70">diperoleh!</span>
          </div>

          {/* Score breakdown */}
          <div className="mb-8 grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Benar', value: correctCount, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
              { label: 'Salah', value: totalQuestions - correctCount, color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
              { label: 'Total', value: totalQuestions, color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10' },
            ].map(({ label, value, color, border, bg }) => (
              <div key={label} className={`rounded-xl border ${border} ${bg} p-3 backdrop-blur-sm`}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onBack}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-indigo-900 shadow-xl shadow-black/20 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Kuis
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuizPlayerPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [state, setState] = useState<GameState>('loading')
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [mapAnswer, setMapAnswer] = useState<{lat: number, lng: number} | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})  // questionId → selected JSON

  const [timeLeft, setTimeLeft] = useState(0)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [result, setResult] = useState<{ score: number; xpEarned: number; correctCount: number } | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [userId, setUserId] = useState('')
  const [streak, setStreak] = useState(0)
  const [shake, setShake] = useState(false)
  const [showCombo, setShowCombo] = useState(false)
  const [timeBonusActive, setTimeBonusActive] = useState(false)
  const [praiseText, setPraiseText] = useState('Mantap!')

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load quiz data
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setState('error'); return }
      setUserId(user.id)

      // Check if already completed
      const { data: existing } = await supabase
        .from('quiz_attempts')
        .select('id, score, xp_earned, completed_at')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .maybeSingle()

      if (existing?.completed_at) {
        setState('already_done')
        setResult({ score: existing.score, xpEarned: existing.xp_earned, correctCount: 0 })
        return
      }

      const { data: q } = await supabase
        .from('quizzes')
        .select(`
          id, title, time_limit, xp_reward,
          questions(id, text, type, options, correct_answer, explanation, points, duration, order)
        `)
        .eq('id', quizId)
        .eq('is_published', true)
        .single()

      if (!q) { setState('error'); return }

      const sorted = [...(q.questions as Question[])].sort((a, b) => a.order - b.order)
      setQuiz({ ...q, questions: sorted })
      
      const firstQ = sorted[0]
      setTimeLeft(firstQ?.duration ?? q.time_limit ?? 0)
      setState('ready')
    }
    load()
  }, [quizId, supabase])

  // Start quiz
  const startQuiz = useCallback(async () => {
    if (!quiz || !userId) return
    const { data, error } = await supabase.from('quiz_attempts').insert({
      id: crypto.randomUUID(),
      quiz_id: quiz.id,
      user_id: userId,
      score: 0,
      xp_earned: 0,
    }).select('id').single()
    if (error || !data) { toast.error('Gagal memulai kuis'); return }
    setAttemptId(data.id)
    setState('playing')
    playSound('start')
    if (quiz.time_limit) setTimeLeft(quiz.time_limit)
  }, [quiz, userId, supabase])

  // Timer
  useEffect(() => {
    if (state !== 'playing' || timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          // If multiple choice, answer incorrectly by giving no answer
          // If map, answer with current mapAnswer or nothing
          if (quiz?.questions[currentIndex].type === 'MAP_PINPOINT') {
            if (mapAnswer) handleAnswer(JSON.stringify(mapAnswer))
            else handleAnswer(JSON.stringify({ lat: 0, lng: 0 }))
          } else {
            handleAnswer('')
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state, timeLeft, currentIndex, quiz, mapAnswer])

  const handleAnswer = (optionLabel: string) => {
    if (state === 'reviewing' || selectedOption !== null) return

    const q = quiz!.questions[currentIndex]
    
    let correct = false
    let answerObj: any = {}

    if (q.type === 'MAP_PINPOINT') {
      try {
        const studentPos = JSON.parse(optionLabel)
        const { target_lat, target_lng, radius_toleransi_meter, radius_maksimal_meter } = q.options
        const distance = hitungJarakMeter(studentPos.lat, studentPos.lng, target_lat, target_lng)
        const qPoints = q.points ?? quiz?.xp_reward ?? 100
        const scoreEarned = hitungSkorPeta(distance, radius_toleransi_meter, radius_maksimal_meter, qPoints)
        correct = scoreEarned > 0
        answerObj = { lat: studentPos.lat, lng: studentPos.lng, distance, score: scoreEarned }
        optionLabel = JSON.stringify(answerObj)
      } catch (e) {
        correct = false
      }
    } else {
      correct = optionLabel === q.correct_answer
    }

    setSelectedOption(optionLabel)

    setIsCorrect(correct)
    
    // Save to local state and update DB immediately (fire-and-forget for live monitor)
    setAnswers(prev => {
      const newAnswers = { ...prev, [q.id]: optionLabel }
      
      // Update DB
      if (attemptId) {
        supabase.from('quiz_attempts').update({
          answers: newAnswers,
          // We can optionally keep score updated live, but since score depends on the final calculation,
          // updating just `answers` is enough for progress tracking.
        }).eq('id', attemptId).then()
      }
      
      return newAnswers
    })

    setState('reviewing')

    if (correct) {
      playSound('correct')
      const newStreak = streak + 1
      setStreak(newStreak)
      
      const praises = ['Mantap!', 'Hebat!', 'Luar Biasa!', 'On Fire! 🔥', 'Jenius! 🧠']
      setPraiseText(praises[Math.min(newStreak - 1, praises.length - 1)])

      // Time Bonus mechanic
      if (newStreak > 1 && newStreak % 3 === 0 && quiz?.time_limit) {
        setTimeBonusActive(true)
        setTimeLeft(t => t + 10) // +10s bonus!
        setTimeout(() => setTimeBonusActive(false), 2000)
      }

      if (newStreak > 1) {
        setShowCombo(true)
        setTimeout(() => setShowCombo(false), 1500)
      }
    } else {
      playSound('wrong')
      setStreak(0)
      setShake(true)
      setTimeout(() => setShake(false), 400)
    }

    // Auto advance after 3 seconds (Quizizz style) only for multiple choice
    // For map pinpoint, let them see the distance until they press Next manually
    if (q.type !== 'MAP_PINPOINT') {
      setTimeout(() => {
        handleNextRef.current?.()
      }, 3000)
    }
  }


  const handleSubmit = useCallback(async () => {
    if (!quiz || !attemptId) return
    setState('finished')
    playSound('finish')

    const finalAnswers = answers
    let correct = 0
    let totalXp = 0
    let maxTotalPoints = 0

    for (const q of quiz.questions) {
      const qPoints = q.points ?? quiz.xp_reward ?? 100
      maxTotalPoints += qPoints

      if (q.type === 'MAP_PINPOINT') {
        try {
          const answerObj = JSON.parse(finalAnswers[q.id] || '{}')
          if (answerObj.score > 0) correct++
          totalXp += (answerObj.score || 0)
        } catch (e) {}
      } else {
        if (finalAnswers[q.id] === q.correct_answer) {
          correct++
          totalXp += qPoints
        }
      }
    }
    const score = maxTotalPoints > 0 ? (totalXp / maxTotalPoints) * 100 : 0
    const xpEarned = totalXp

    const { error } = await supabase.from('quiz_attempts').update({
      score,
      xp_earned: xpEarned,
      answers: finalAnswers,
      completed_at: new Date().toISOString(),
    }).eq('id', attemptId)

    if (error) console.error('[QuizPlayer] submit error:', error)
    
    // Call gamification backend to award XP, calculate streaks, and unlock badges
    if (xpEarned > 0) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { count } = await supabase
            .from('quiz_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .not('completed_at', 'is', null)

          await fetch('http://localhost:3001/v1/gamification/award-xp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              userId,
              xpAmount: xpEarned,
              quizAttemptId: attemptId,
              quizScore: score,
              isFirstQuiz: count === 1
            })
          })
        }
      } catch (err) {
        console.error('Failed to trigger gamification:', err)
      }
    }

    setResult({ score, xpEarned, correctCount: correct })
  }, [quiz, attemptId, answers, supabase, userId])

  // Ref to hold handleNext so setTimeout can call it with fresh state
  const handleNextRef = useRef<(() => void) | null>(null)
  
  const handleNext = useCallback(() => {
    if (!quiz) return
    if (currentIndex < quiz.questions.length - 1) {
      const nextIdx = currentIndex + 1
      setCurrentIndex(nextIdx)
      setSelectedOption(null)
      setMapAnswer(null)
      setIsCorrect(null)
      setState('playing')
      const nextQ = quiz.questions[nextIdx]
      setTimeLeft(nextQ.duration ?? quiz.time_limit ?? 0)
    } else {
      clearInterval(timerRef.current!)
      handleSubmit()
    }
  }, [quiz, currentIndex, handleSubmit])

  useEffect(() => {
    handleNextRef.current = handleNext
  }, [handleNext])

  // ── Render ──────────────────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC] text-center p-4">
        <AlertTriangle className="h-12 w-12 text-red-600" />
        <p className="text-slate-800 font-bold">Kuis tidak ditemukan atau belum dipublikasikan.</p>
        <button onClick={() => router.push('/student/quizzes')} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
          Kembali
        </button>
      </div>
    )
  }

  if (state === 'already_done' && result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950">
        <div className="flex flex-col items-center gap-4">
          <CheckCircle className="h-16 w-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
          <h1 className="text-2xl font-black text-white">Kuis Sudah Dikerjakan</h1>
          <p className="text-purple-200">Nilaimu: <span className="text-3xl font-black text-amber-400">{result.score.toFixed(0)}%</span></p>
          <button onClick={() => router.push('/student/quizzes')} className="mt-4 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-indigo-900 hover:bg-slate-100 transition-colors shadow-xl">
            Kembali ke Daftar Kuis
          </button>
        </div>
      </div>
    )
  }

  if (state === 'finished' && result) {
    return (
      <ResultScreen
        score={result.score}
        xpEarned={result.xpEarned}
        totalQuestions={quiz?.questions.length ?? 0}
        correctCount={result.correctCount}
        onBack={() => router.push('/student/quizzes')}
      />
    )
  }

  if (state === 'ready' && quiz) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950">
        <div className="w-full max-w-md text-center z-10">
          <div className="mb-6 flex h-24 w-24 mx-auto items-center justify-center rounded-3xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-[0_0_30px_rgba(168,85,247,0.5)] transform -rotate-3">
            <Trophy className="h-12 w-12 text-white" />
          </div>
          <h1 className="mb-3 text-3xl font-black text-white drop-shadow-md">{quiz.title}</h1>
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-purple-200">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm"><span className="text-white">{quiz.questions.length}</span> soal</span>
            {quiz.time_limit && <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm"><Clock className="h-4 w-4 text-cyan-400" /><span className="text-cyan-400">{Math.floor(quiz.time_limit / 60)} menit</span></span>}
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 px-4 py-1.5 backdrop-blur-sm"><Zap className="h-4 w-4 text-amber-400" /><span className="text-amber-400">+{quiz.xp_reward} XP</span></span>
          </div>
          
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-sm text-purple-100 backdrop-blur-md shadow-xl">
            <p className="font-bold text-white mb-3 text-base flex items-center gap-2">🕹️ Cara Bermain:</p>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">👉 <span>Pilih satu jawaban yang paling tepat.</span></li>
              <li className="flex items-start gap-2">🔥 <span>Raih <b>Streak (3x berturut-turut)</b> untuk <b>Bonus Waktu +10 Detik!</b></span></li>
              {quiz.time_limit && <li className="flex items-start gap-2">⏳ <span>Kuis otomatis diserahkan jika waktu habis. Kerjakan dengan cepat!</span></li>}
            </ul>
          </div>
          <button
            onClick={startQuiz}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 py-3.5 text-sm font-bold text-slate-800 shadow-xl shadow-violet-900/40 transition hover:from-violet-500 hover:to-fuchsia-500"
          >
            🚀 Mulai Kuis!
          </button>
          <button onClick={() => router.push('/student/quizzes')} className="mt-3 text-xs text-slate-600 hover:text-slate-500">
            Kembali
          </button>
        </div>
      </div>
    )
  }

  // Playing / reviewing
  if (!quiz) return null
  const currentQ = quiz.questions[currentIndex]
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100

  // Royalty free upbeat 8-bit game music loop
  const BGM_URL = "https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=8-bit-arcade-138828.mp3"

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 p-4 relative overflow-hidden">
      {/* Background Music */}
      <audio src={BGM_URL} autoPlay loop />
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          50% { transform: translateX(10px); }
          75% { transform: translateX(-10px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        
        @keyframes popUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.8) rotate(-10deg); }
          50% { opacity: 1; transform: translateY(-10px) scale(1.2) rotate(5deg); }
          100% { opacity: 0; transform: translateY(-30px) scale(1) rotate(0deg); }
        }
        .animate-popup { animation: popUp 1.5s ease-out forwards; }

        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(0); }
          20% { opacity: 1; transform: translateY(-20px); }
          80% { opacity: 1; transform: translateY(-60px); }
          100% { opacity: 0; transform: translateY(-80px); }
        }
        .animate-float-up { animation: floatUp 2s ease-out forwards; }
      `}</style>

      {/* Decorative background elements */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Time Bonus Animation */}
      {timeBonusActive && (
        <div className="pointer-events-none fixed right-10 top-20 z-50 flex flex-col items-center animate-float-up">
          <span className="text-3xl font-black italic text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">
            +10 DETIK! ⏳
          </span>
        </div>
      )}

      {/* Combo Floating Text */}
      {showCombo && (
        <div className="pointer-events-none fixed left-1/2 top-1/4 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center animate-popup">
          <span className="text-5xl font-black italic tracking-wider text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]">
            {streak}x STREAK! 🔥
          </span>
          <span className="mt-1 text-2xl font-bold text-white drop-shadow-md">{praiseText}</span>
        </div>
      )}

      <div className="mx-auto max-w-xl relative z-10 pt-4">
        {/* Header */}
        <div className="mb-6 space-y-4">
          {/* Progress */}
          <div className="flex items-center justify-between text-sm font-bold text-purple-200">
            <span className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">Soal {currentIndex + 1} / {quiz.questions.length}</span>
            <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/50 px-3 py-1 rounded-full backdrop-blur-sm">
              <Zap className="h-4 w-4" />
              +{quiz.xp_reward} XP
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Timer */}
          {quiz.time_limit && timeLeft > 0 && (
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/5">
              <TimerBar seconds={timeLeft} total={quiz.time_limit} />
            </div>
          )}
        </div>

        {/* Question card */}
        <div className={cn(
          "rounded-3xl bg-white p-7 mb-6 transition-transform duration-200 shadow-[0_10px_40px_rgba(0,0,0,0.2)]", 
          shake && "animate-shake border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
        )}>
          <p className="mb-8 text-lg font-bold leading-relaxed text-slate-800 text-center">
            {currentQ.text}
          </p>

          {/* Options */}
          {currentQ.type === 'MULTIPLE_CHOICE' ? (
            <div className="space-y-2.5">
              {(currentQ.options as {label: string, value: string}[]).map((opt) => {
                const isSelected = selectedOption === opt.label
                const isCorrectOpt = opt.label === currentQ.correct_answer
                const showResult = state === 'reviewing'

                let optStyle = 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md'
                if (showResult) {
                  if (isCorrectOpt) optStyle = 'border-emerald-500 bg-emerald-100/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  else if (isSelected && !isCorrectOpt) optStyle = 'border-rose-400 bg-rose-50'
                  else optStyle = 'border-slate-100 bg-white opacity-40'
                } else if (isSelected) {
                  optStyle = 'border-indigo-500 bg-indigo-50 shadow-md transform scale-[1.02]'
                }

                return (
                  <button
                    key={opt.label}
                    onClick={() => handleAnswer(opt.label)}
                    disabled={state === 'reviewing'}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200',
                      optStyle,
                      state !== 'reviewing' && 'cursor-pointer'
                    )}
                  >
                    <span className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black transition-colors',
                      showResult && isCorrectOpt ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                      showResult && isSelected && !isCorrectOpt ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' :
                      isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' :
                      'bg-slate-200 text-slate-600'
                    )}>
                      {showResult && isCorrectOpt ? '✓' :
                      showResult && isSelected && !isCorrectOpt ? '✗' :
                      opt.label}
                    </span>
                    <span className={cn(
                      "flex-1 text-base font-bold", 
                      showResult && isCorrectOpt ? 'text-emerald-900' :
                      showResult && isSelected && !isCorrectOpt ? 'text-rose-900' :
                      'text-slate-700'
                    )}>{opt.value}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {currentQ.options.clue_gambar_url && (
                <div className="flex justify-center mb-4">
                  <img src={currentQ.options.clue_gambar_url} alt="Clue" className="rounded-xl max-h-48 object-contain shadow-md border border-slate-200" />
                </div>
              )}
              <div className="rounded-xl border border-slate-200 p-2 bg-slate-50 relative z-0">
                <MapPicker 
                  position={state === 'reviewing' && selectedOption ? JSON.parse(selectedOption) : mapAnswer}
                  onChange={(pos) => {
                    if (state !== 'reviewing') {
                      setMapAnswer(pos)
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 text-center flex-1">
                  Pilih lokasi jawaban dengan mengklik titik pada peta.
                </p>
                {state !== 'reviewing' && (
                  <button
                    onClick={() => {
                      if (mapAnswer) handleAnswer(JSON.stringify(mapAnswer))
                    }}
                    disabled={!mapAnswer}
                    className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 shadow-md shadow-emerald-500/20"
                  >
                    Konfirmasi Lokasi
                  </button>
                )}
              </div>
              
              {state === 'reviewing' && selectedOption && (
                <div className="text-center rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <p className="text-sm text-slate-700 font-medium">
                    Jarak jawabanmu: <span className="font-bold text-blue-600">
                      {(() => {
                        try {
                          const ansObj = JSON.parse(selectedOption)
                          return (ansObj.distance / 1000).toFixed(2)
                        } catch(e) { return 0 }
                      })()} km
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Toleransi benar: {(currentQ.options.radius_toleransi_meter / 1000).toFixed(1)} km | 
                    Maksimal: {(currentQ.options.radius_maksimal_meter / 1000).toFixed(1)} km
                  </p>
                  <p className="text-lg font-black mt-2 text-amber-500">
                    Skor Peta: {(() => {
                        try {
                          const ansObj = JSON.parse(selectedOption)
                          return ansObj.score
                        } catch(e) { return 0 }
                      })()} Poin
                  </p>
                  
                  {/* Manual Next Button for Map */}
                  <button
                    onClick={() => handleNextRef.current?.()}
                    className="mt-4 rounded-xl bg-indigo-600 px-6 py-2 text-sm font-bold text-white hover:bg-indigo-500 shadow-md"
                  >
                    Lanjut Soal Berikutnya
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Explanation after answer */}
          {state === 'reviewing' && currentQ.explanation && (
            <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-600 mb-1">💡 Pembahasan</p>
              <p className="text-xs text-slate-500">{currentQ.explanation}</p>
            </div>
          )}
        </div>

        {state === 'reviewing' && currentQ.type === 'MULTIPLE_CHOICE' && (
          <div className="flex flex-col items-center justify-center mt-6">
            <div className={cn(
              'flex items-center gap-3 rounded-2xl px-8 py-4 backdrop-blur-md shadow-2xl border transition-all animate-popup',
              isCorrect ? 'bg-emerald-500/90 border-emerald-400 text-white' : 'bg-rose-500/90 border-rose-400 text-white'
            )}>
              {isCorrect
                ? <><CheckCircle className="h-8 w-8" /><span className="text-xl font-black tracking-wide">{praiseText} {streak > 1 ? `(Streak 🔥)` : ''}</span></>
                : <><XCircle className="h-8 w-8" /><span className="text-xl font-black tracking-wide">Sayang Sekali!</span></>
              }
            </div>
            {/* Loading bar for auto-next */}
            <div className="w-64 h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-white/80 rounded-full" style={{ animation: 'shrink 3s linear forwards' }} />
            </div>
            <style>{`
              @keyframes shrink { from { width: 100%; } to { width: 0%; } }
            `}</style>
          </div>
        )}
      </div>
    </div>
  )
}
