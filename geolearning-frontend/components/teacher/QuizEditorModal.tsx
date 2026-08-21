'use client'

import { useState, useRef, useEffect } from 'react'
import {
  X, Plus, Trash2, Loader2, ClipboardList, FileText,
  ChevronDown, ChevronUp, Check, AlertCircle, Upload,
  Sparkles, GripVertical, Download, CheckCircle, Edit3
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import dynamic from 'next/dynamic'
import { useConfirm } from '@/components/ui/ConfirmProvider'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassOption {
  id: string
  name: string
  gamification_mode?: string
}

interface QuestionDraft {
  id?: string
  text: string
  type: 'MULTIPLE_CHOICE' | 'MAP_PINPOINT'
  options: any
  correct_answer: string
  explanation: string
  points?: number
  duration?: number
  order: number
  image_url?: string | null
}

interface QuizMeta {
  id: string
  title: string
  class_id: string | null
  module_id: string | null
  time_limit: number | null
  xp_reward: number
  passing_score?: number | null
  is_published: boolean
  order?: number
  quiz_type?: 'FORMATIF' | 'SUMATIF'
  max_attempts?: number | null
}

interface QuizEditorModalProps {
  classes?: ClassOption[]
  quiz: QuizMeta | null  // null = create new
  onClose: () => void
  onSaved: (newMod?: any) => void
  classId?: string
  existingModules?: {id: string, title: string}[]
  nextOrderMap?: Record<string, number>
}

const EMPTY_QUESTION = (): QuestionDraft => ({
  text: '',
  type: 'MULTIPLE_CHOICE',
  options: [
    { label: 'A', value: '' },
    { label: 'B', value: '' },
    { label: 'C', value: '' },
    { label: 'D', value: '' },
  ],
  correct_answer: 'A',
  explanation: '',
  points: undefined,
  duration: undefined,
  order: 0,
  image_url: null,
})

const EMPTY_MAP_QUESTION = (): QuestionDraft => ({
  text: '',
  type: 'MAP_PINPOINT',
  options: {
    target_lat: -0.7893,
    target_lng: 113.9213,
    radius_toleransi_meter: 50000,
    radius_maksimal_meter: 500000,
    clue_gambar_url: '',
  },
  correct_answer: 'MAP',
  explanation: '',
  points: undefined,
  duration: undefined,
  order: 0,
  image_url: null,
})

// ─── Parse plain text soal (format: 1. Soal\nA. ...\nB. ...\nJawaban: A) ─────

function parseTextToQuestions(text: string): QuestionDraft[] {
  const questions: QuestionDraft[] = []
  
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  
  // Split by question numbers (1. atau 1) atau Soal 1:)
  const questionBlocks = normalized.split(/\n(?=\d+[\.\)]\s)/g).filter(b => b.trim())
  
  for (const block of questionBlocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 3) continue

    // Question text: first line without the number
    const questionText = lines[0].replace(/^\d+[\.\)]\s*/, '').trim()
    if (!questionText) continue

    const options: { label: string; value: string }[] = []
    let correctAnswer = 'A'
    let explanation = ''

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      
      // Detect option lines: A. xxx or A) xxx or a. xxx
      const optMatch = line.match(/^([A-Ea-e])[\.\)]\s*(.+)/)
      if (optMatch) {
        options.push({
          label: optMatch[1].toUpperCase(),
          value: optMatch[2].trim(),
        })
        continue
      }

      // Detect answer line: Jawaban: A or Kunci: A or Answer: A
      const answerMatch = line.match(/^(?:jawaban|kunci|answer|kunci jawaban|correct)[:\s]+([A-Ea-e])/i)
      if (answerMatch) {
        correctAnswer = answerMatch[1].toUpperCase()
        continue
      }

      // Detect explanation line: Pembahasan: xxx or Penjelasan: xxx
      const expMatch = line.match(/^(?:pembahasan|penjelasan|explanation)[:\s]+(.+)/i)
      if (expMatch) {
        explanation = expMatch[1].trim()
        continue
      }
    }

    // Need at least 2 options
    if (options.length < 2) continue

    // Pad to 4 options if needed
    const labels = ['A', 'B', 'C', 'D']
    while (options.length < 4) {
      const nextLabel = labels[options.length] || `${options.length + 1}`
      options.push({ label: nextLabel, value: '(kosong)' })
    }

    questions.push({
      text: questionText,
      type: 'MULTIPLE_CHOICE',
      options: options.slice(0, 4),
      correct_answer: correctAnswer,
      explanation,
      order: questions.length,
    })
  }
  
  return questions
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  onChange,
  onDelete,
}: {
  question: QuestionDraft
  index: number
  onChange: (q: QuestionDraft) => void
  onDelete: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran maksimal 2MB')
      return
    }

    setIsUploading(true)
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const path = `quiz-materials/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('class-materials')
      .upload(path, file, { cacheControl: '31536000', upsert: false })

    if (uploadError) {
      toast.error(`Gagal mengunggah gambar: ${uploadError.message}`)
      setIsUploading(false)
      return
    }

    const { data } = supabase.storage.from('class-materials').getPublicUrl(path)
    
    // Update either the option clue (for map) or the general image_url (for MC)
    if (question.type === 'MAP_PINPOINT') {
      onChange({...question, options: {...question.options, clue_gambar_url: data.publicUrl}})
    } else {
      onChange({...question, image_url: data.publicUrl})
    }
    
    setIsUploading(false)
    toast.success('Gambar berhasil diunggah')
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="h-4 w-4 flex-shrink-0 text-slate-700" />
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-50 text-[10px] font-bold text-blue-600">
          {index + 1}
        </span>
        <div className="flex flex-1 min-w-0 flex-col gap-1">
          <input
            value={question.text}
            onChange={e => onChange({ ...question, text: e.target.value })}
            placeholder={`Teks soal nomor ${index + 1}…`}
            className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer hover:text-blue-600 transition" title="Unggah Gambar untuk Soal">
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Gambar
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
            </label>
            <label className="flex items-center gap-1 text-[10px] text-slate-500">
              Durasi (dtk):
              <input type="number" min="0" placeholder="Default" value={question.duration || ''} onChange={e => onChange({ ...question, duration: e.target.value ? parseInt(e.target.value) : undefined })} className="w-16 rounded border px-1.5 py-0.5 outline-none focus:border-blue-500" />
            </label>
            <label className="flex items-center gap-1 text-[10px] text-slate-500">
              Poin:
              <input type="number" min="0" max="100" placeholder="Default" value={question.points || ''} onChange={e => onChange({ ...question, points: e.target.value ? parseInt(e.target.value) : undefined })} className="w-16 rounded border px-1.5 py-0.5 outline-none focus:border-blue-500" />
            </label>
          </div>
        </div>
        <select
          value={question.type}
          onChange={e => {
            const newType = e.target.value as 'MULTIPLE_CHOICE' | 'MAP_PINPOINT'
            if (newType === 'MAP_PINPOINT') {
              onChange({ ...question, type: newType, options: EMPTY_MAP_QUESTION().options, correct_answer: 'MAP' })
            } else {
              onChange({ ...question, type: newType, options: EMPTY_QUESTION().options, correct_answer: 'A' })
            }
          }}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none"
        >
          <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
          <option value="MAP_PINPOINT">Peta (GeoGuessr)</option>
        </select>
        <button onClick={() => setCollapsed(c => !c)} className="text-slate-600 hover:text-slate-500">
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <button onClick={onDelete} className="text-slate-700 hover:text-red-600">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Options + answer */}
      {!collapsed && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          {question.image_url && question.type === 'MULTIPLE_CHOICE' && (
            <div className="relative inline-block mt-2 mb-2 group">
              <img src={question.image_url} alt="Gambar Soal" className="max-h-32 rounded-lg border border-slate-200 object-cover" />
              <button onClick={() => onChange({ ...question, image_url: null })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {question.type === 'MULTIPLE_CHOICE' ? (
            <div className="grid grid-cols-2 gap-2">
              {(question.options as {label: string, value: string}[]).map((opt, oi) => (
                <label
                  key={opt.label}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors',
                    question.correct_answer === opt.label
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-200'
                  )}
                >
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    value={opt.label}
                    checked={question.correct_answer === opt.label}
                    onChange={() => onChange({ ...question, correct_answer: opt.label })}
                    className="accent-emerald-500"
                  />
                  <span className={cn(
                    'text-[11px] font-bold',
                    question.correct_answer === opt.label ? 'text-emerald-600' : 'text-slate-500'
                  )}>
                    {opt.label}.
                  </span>
                  <input
                    value={opt.value}
                    onChange={e => {
                      const newOpts = [...(question.options as {label: string, value: string}[])]
                      newOpts[oi] = { ...opt, value: e.target.value }
                      onChange({ ...question, options: newOpts })
                    }}
                    placeholder={`Pilihan ${opt.label}…`}
                    className="flex-1 min-w-0 bg-transparent text-xs text-slate-700 placeholder-slate-700 outline-none"
                  />
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600">Gambar Clue (Opsional)</label>
                  <div className="mt-1 flex gap-2">
                    <input value={question.options.clue_gambar_url || ''} onChange={e => onChange({...question, options: {...question.options, clue_gambar_url: e.target.value}})} className="flex-1 min-w-0 rounded border px-2 py-1.5 outline-none focus:border-blue-500 text-xs" placeholder="URL https://..." />
                    <label className="flex-shrink-0 cursor-pointer flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded transition" title="Unggah Gambar">
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[10px] font-semibold text-slate-600">Toleransi Sempurna (m)
                    <input type="number" value={question.options.radius_toleransi_meter || 0} onChange={e => onChange({...question, options: {...question.options, radius_toleransi_meter: parseInt(e.target.value) || 0}})} className="w-full mt-1 rounded border px-2 py-1.5 outline-none focus:border-blue-500" />
                  </label>
                  <label className="block text-[10px] font-semibold text-slate-600">Batas Maksimal Skor 0 (m)
                    <input type="number" value={question.options.radius_maksimal_meter || 0} onChange={e => onChange({...question, options: {...question.options, radius_maksimal_meter: parseInt(e.target.value) || 0}})} className="w-full mt-1 rounded border px-2 py-1.5 outline-none focus:border-blue-500" />
                  </label>
                </div>
              </div>
              
              <div className="text-xs font-semibold text-slate-700 mt-2 border-t pt-2">Tentukan Lokasi Jawaban Benar</div>
              <MapPicker 
                position={{ lat: question.options.target_lat, lng: question.options.target_lng }} 
                onChange={(pos) => onChange({ ...question, options: { ...question.options, target_lat: pos.lat, target_lng: pos.lng } })} 
              />
              <p className="text-center text-[10px] text-slate-500">Siswa akan mendapatkan skor penuh jika menebak dalam {question.options.radius_toleransi_meter} meter dari pin ini.</p>
            </div>
          )}
          {/* Explanation */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Pembahasan (opsional)</p>
            <textarea
              value={question.explanation}
              onChange={e => onChange({ ...question, explanation: e.target.value })}
              placeholder="Penjelasan mengapa jawaban ini benar…"
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 placeholder-slate-700 outline-none focus:border-blue-200"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Import Panel ─────────────────────────────────────────────────────────────

function ImportPanel({ onImported }: { onImported: (qs: QuestionDraft[]) => void }) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<QuestionDraft[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleParse() {
    const qs = parseTextToQuestions(text)
    if (qs.length === 0) {
      toast.error('Tidak ada soal yang berhasil diparsing. Pastikan format sudah benar.')
      return
    }
    setParsed(qs)
    setShowPreview(true)
  }

  const [loadingFile, setLoadingFile] = useState(false)

  async function processFile(file: File | undefined) {
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      toast.error('Ukuran file maksimal adalah 500MB');
      return;
    }

    try {
      setLoadingFile(true)
      const name = file.name.toLowerCase()

      if (name.endsWith('.docx') || name.endsWith('.pdf')) {
        const formData = new FormData()
        formData.append('file', file)
        toast.loading('Mengekstrak teks...', { id: 'parse-doc' })
        const res = await fetch('/api/parse-document', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Failed to parse document')
        const json = await res.json()
        setText(json.text || '')
        toast.success('File berhasil diekstrak! Klik "Parse Soal Otomatis".', { id: 'parse-doc' })
      } else if (name.endsWith('.txt') || file.type === 'text/plain') {
        const content = await file.text()
        setText(content)
        toast.success('File TXT berhasil dibaca! Klik "Parse Soal Otomatis".')
      } else {
        toast.error('Format file tidak didukung.')
      }
    } catch(err) {
      toast.error('Terjadi kesalahan saat memproses file.', { id: 'parse-doc' })
    } finally {
      setLoadingFile(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleFileRead(e: React.ChangeEvent<HTMLInputElement>) {
    processFile(e.target.files?.[0])
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    processFile(e.dataTransfer.files?.[0])
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  async function downloadTemplate() {
    try {
      const content = `<html><body>
        <p>1. Apa ibukota Indonesia?</p>
        <p>A. Jakarta</p>
        <p>B. Surabaya</p>
        <p>C. Bandung</p>
        <p>D. Medan</p>
        <p>Jawaban: A</p>
        <p>Pembahasan: Jakarta adalah ibukota negara Indonesia secara de facto dan de jure.</p>
        <br/>
        <p>2. Gunung tertinggi di Indonesia adalah...</p>
        <p>A. Semeru</p>
        <p>B. Rinjani</p>
        <p>C. Puncak Jaya</p>
        <p>D. Kerinci</p>
        <p>Jawaban: C</p>
        <p>Pembahasan: Puncak Jaya terletak di Papua dan merupakan gunung tertinggi di Indonesia.</p>
      </body></html>`
      
      const blob = new Blob([content], { type: 'application/msword' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Template_Soal_GeoLearning.doc'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Gagal mengunduh template')
    }
  }

  if (showPreview) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-emerald-600">
            ✅ {parsed.length} soal berhasil diparsing
          </p>
          <button onClick={() => setShowPreview(false)} className="text-xs text-slate-500 hover:text-slate-700">
            Ubah teks
          </button>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">
          {parsed.map((q, i) => (
            <div key={i} className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
              <span className="mr-2 font-bold text-blue-600">{i + 1}.</span>
              {q.text.slice(0, 80)}{q.text.length > 80 ? '…' : ''}
              <span className="ml-2 text-emerald-600 font-semibold">✓ {q.correct_answer}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => { onImported(parsed); setShowPreview(false); setText(''); setParsed([]) }}
          className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Tambahkan {parsed.length} soal ke kuis
        </button>
      </div>
    )
  }

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "rounded-xl border p-4 transition-all",
        isDragging ? "border-blue-500 bg-blue-100/50 border-dashed border-2" : "border-blue-300 bg-violet-50"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <p className="text-sm font-semibold text-blue-700">Import Soal dari Dokumen</p>
      </div>
      <p className="mb-3 text-[11px] text-slate-500">
        Upload file (Word, PDF, TXT) atau salin-tempel langsung teksnya.
      </p>
      <input ref={fileRef} type="file" accept=".txt,.pdf,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleFileRead} />
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loadingFile}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-50 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          {loadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Pilih Dokumen
        </button>
        <button
          onClick={downloadTemplate}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-500 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
        >
          <Download className="h-4 w-4" />
          Template Word
        </button>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={`Tempel teks soal di sini...\n\nContoh format:\n1. Apa ibukota Indonesia?\nA. Jakarta\nB. Surabaya\nC. Bandung\nD. Medan\nJawaban: A\nPembahasan: Karena letaknya di situ.`}
        rows={6}
        className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 placeholder-slate-700 outline-none focus:border-blue-200 mb-2"
      />
      <button
        onClick={handleParse}
        disabled={!text.trim()}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Parse Soal Otomatis
      </button>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function QuizEditorModal({ classes, quiz, classId, existingModules, nextOrderMap, onClose, onSaved, onModuleAdded }: QuizEditorModalProps & { onModuleAdded?: (mod: any) => void }) {
  const supabase = createClient()
  const { confirm } = useConfirm()
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const [form, setForm] = useState({
    title: quiz?.title ?? '',
    class_id: quiz?.class_id ?? classId ?? (classes && classes.length > 0 ? classes[0].id : ''),
    timeLimit: quiz?.time_limit ? quiz.time_limit.toString() : '30',
    xpReward: quiz?.xp_reward ? quiz.xp_reward.toString() : '100',
    passingScore: quiz?.passing_score ? quiz.passing_score.toString() : '75',
    is_published: quiz?.is_published ?? false,
    quiz_type: quiz?.quiz_type ?? 'FORMATIF',
    max_attempts: quiz?.max_attempts ? quiz.max_attempts.toString() : '',
  })

  const [selectedModuleId, setSelectedModuleId] = useState<string>(existingModules?.[0]?.id || 'new')
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editedModuleTitle, setEditedModuleTitle] = useState('')
  const [isUpdatingModule, setIsUpdatingModule] = useState(false)
  const [order, setOrder] = useState<number>(quiz?.order ?? (nextOrderMap?.[existingModules?.[0]?.id || 'new'] ?? 1))

  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(!!quiz)

  useEffect(() => {
    if (!quiz && selectedModuleId !== 'new' && nextOrderMap) {
      setOrder(nextOrderMap[selectedModuleId] || 1)
    } else if (!quiz && selectedModuleId === 'new') {
      setOrder(1)
    }
  }, [selectedModuleId, quiz, nextOrderMap])

  // Load existing questions when editing
  useEffect(() => {
    if (!quiz) return
    const load = async () => {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order')
      setQuestions((data ?? []).map(q => ({
        id: q.id,
        text: q.text,
        type: q.type as 'MULTIPLE_CHOICE' | 'MAP_PINPOINT',
        options: q.options as any,
        correct_answer: q.correct_answer,
        explanation: q.explanation ?? '',
        order: q.order,
        image_url: q.image_url ?? null,
      })))
      setLoadingQuestions(false)
    }
    load()
  }, [quiz, supabase])

  async function handleSaveModuleEdit() {
    if (!editedModuleTitle.trim() || !editingModuleId) return
    setIsUpdatingModule(true)
    const { error } = await supabase.from('modules').update({ title: editedModuleTitle.trim() }).eq('id', editingModuleId)
    setIsUpdatingModule(false)
    if (error) { toast.error('Gagal memperbarui nama bab') } 
    else { toast.success('Nama bab diperbarui'); setEditingModuleId(null); window.location.reload() }
  }

  async function handleDeleteModule(modId: string) {
    const isConfirmed = await confirm({
      title: 'Hapus Bab',
      message: 'Hapus bab ini? (Semua materi dan kuis di dalamnya akan ikut terhapus!)',
      confirmText: 'Ya, Hapus',
      variant: 'danger'
    })
    if (!isConfirmed) return
    setIsUpdatingModule(true)
    const { error } = await supabase.from('modules').delete().eq('id', modId)
    setIsUpdatingModule(false)
    if (error) { toast.error('Gagal menghapus bab') } 
    else { toast.success('Bab berhasil dihapus'); window.location.reload() }
  }

  async function handleSaveNewModule() {
    if (!newModuleTitle.trim()) return
    setIsUpdatingModule(true)
    const targetModuleId = crypto.randomUUID()
    const { data: modData, error: modErr } = await supabase.from('modules').insert({
      id: targetModuleId, class_id: classId || form.class_id, title: newModuleTitle.trim(), order: existingModules?.length || 0, updated_at: new Date().toISOString()
    }).select().single()
    setIsUpdatingModule(false)
    if (modErr) {
      toast.error('Gagal membuat bab baru')
    } else {
      toast.success('Bab baru berhasil ditambahkan')
      if (onModuleAdded) onModuleAdded(modData)
      setSelectedModuleId(modData.id)
      setNewModuleTitle('')
    }
  }

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, { ...EMPTY_QUESTION(), order: prev.length }])
  }

  function updateQuestion(index: number, q: QuestionDraft) {
    setQuestions(prev => { const n = [...prev]; n[index] = q; return n })
  }

  function deleteQuestion(index: number) {
    setQuestions(prev => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i })))
  }

  function handleImported(qs: QuestionDraft[]) {
    setQuestions(prev => [
      ...prev,
      ...qs.map((q, i) => ({ ...q, order: prev.length + i })),
    ])
    setShowImport(false)
    toast.success(`${qs.length} soal ditambahkan!`)
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Judul kuis wajib diisi'); return }
    if (classId && !form.class_id) { toast.error('Pilih kelas terlebih dahulu'); return }
    if (questions.length === 0) { toast.error('Tambahkan minimal 1 soal'); return }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) { toast.error(`Soal #${i + 1} belum ada teksnya`); return }
      if (q.type === 'MULTIPLE_CHOICE') {
        if ((q.options as {value: string}[]).some(o => !o.value.trim())) { 
          toast.error(`Soal #${i + 1} ada pilihan yang kosong`); return 
        }
      }
      if (q.type === 'MAP_PINPOINT') {
        const { target_lat, target_lng, radius_toleransi_meter, radius_maksimal_meter } = q.options as any
        if (target_lat === undefined || target_lng === undefined) {
          toast.error(`Soal ke-${i + 1} tipe Peta belum memiliki koordinat target!`)
          return
        }
        if (radius_maksimal_meter <= radius_toleransi_meter) {
          toast.error(`Soal ke-${i + 1} tipe Peta: Radius maksimal harus lebih besar dari radius toleransi!`)
          return
        }
      }
    }

    setSaving(true)
    try {
      const timeLimitSeconds = parseInt(form.timeLimit) || 30
      const xpReward = parseInt(form.xpReward) || 100
      const passingScore = parseFloat(form.passingScore) || 75
      const maxAttempts = parseInt(form.max_attempts) || null
      
      let quizId = quiz?.id
      let targetModuleId = quiz?.module_id
      let newMod
      
      if (!quiz && existingModules && classId) {
        targetModuleId = selectedModuleId === 'new' ? null : selectedModuleId
        if (!targetModuleId) {
          if (!newModuleTitle.trim()) { toast.error("Bab / Modul baru tidak boleh kosong"); setSaving(false); return }
          targetModuleId = crypto.randomUUID()
          const { data: modData, error: modErr } = await supabase.from('modules').insert({
            id: targetModuleId, class_id: classId, title: newModuleTitle.trim(), order: existingModules.length, updated_at: new Date().toISOString()
          }).select().single()
          if (modErr) throw new Error(modErr.message)
          newMod = modData
        }
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (quizId) {
        const { error } = await supabase.from('quizzes').update({
          title: form.title.trim(),
          class_id: classId ? classId : null,
          module_id: targetModuleId || null,
          time_limit: timeLimitSeconds,
          xp_reward: xpReward,
          passing_score: passingScore,
          is_published: form.is_published,
          quiz_type: form.quiz_type,
          max_attempts: form.max_attempts ? parseInt(form.max_attempts) : null,
          updated_at: new Date().toISOString(),
        }).eq('id', quizId)
        if (error) throw error
        await supabase.from('questions').delete().eq('quiz_id', quizId)
      } else {
        const { data: newQuiz, error } = await supabase.from('quizzes').insert({
          id: crypto.randomUUID(),
          title: form.title.trim(),
          class_id: classId ? classId : null,
          module_id: targetModuleId || null,
          teacher_id: classId ? null : user?.id,
          time_limit: timeLimitSeconds,
          xp_reward: xpReward,
          passing_score: passingScore,
          is_published: form.is_published,
          quiz_type: form.quiz_type,
          max_attempts: form.max_attempts ? parseInt(form.max_attempts) : null,
          order: order,
          updated_at: new Date().toISOString(),
        }).select('id').single()
        if (error) throw error
        quizId = newQuiz.id
      }

      const { error: qError } = await supabase.from('questions').insert(
        questions.map((q, i) => ({
          id: crypto.randomUUID(),
          quiz_id: quizId,
          text: (q.text || '').trim(),
          type: q.type,
          options: q.options,
          correct_answer: q.type === 'MAP_PINPOINT' ? 'MAP' : q.correct_answer,
          explanation: (q.explanation || '').trim() || null,
          image_url: q.image_url || null,
          points: q.points ?? xpReward,
          duration: q.duration ?? timeLimitSeconds,
          order: i,
        }))
      )
      if (qError) {
        console.error("Supabase insert error:", qError)
        throw qError
      }

      toast.success(quiz ? 'Kuis berhasil diperbarui! ✅' : 'Kuis berhasil dibuat! 🎉')
      onSaved(newMod)
      onClose()
    } catch (err) {
      console.error('[QuizEditor] save error:', err)
      let msg = 'Unknown error'
      if (err instanceof Error) msg = err.message
      else if (typeof err === 'object' && err !== null) {
        msg = (err as any).message || JSON.stringify(err)
      }
      toast.error(`Gagal menyimpan: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
              <ClipboardList className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {quiz ? 'Edit Kuis' : 'Buat Kuis Baru'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Judul Kuis <span className="text-red-600">*</span>
              </label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Kuis Bab 1 — Geografi Indonesia"
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-violet-500/30"
              />
            </div>

            {/* Class / Module */}
            {!quiz && existingModules && classId ? (
              <>
                <div className="flex flex-col gap-2 relative col-span-2">
                  <div className="flex items-center justify-between -mb-0.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                      Bab / Modul <span className="text-red-600">*</span>
                    </label>
                    {selectedModuleId !== 'new' && existingModules.length > 0 && !editingModuleId && (
                      <div className="flex shrink-0 gap-1">
                        <button type="button" title="Edit Nama Bab" onClick={() => { setEditingModuleId(selectedModuleId); setEditedModuleTitle(existingModules.find(m => m.id === selectedModuleId)?.title || '') }} className="rounded-md bg-slate-100 p-1 text-slate-500 hover:bg-amber-100 hover:text-amber-600 transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button type="button" title="Hapus Bab" onClick={() => handleDeleteModule(selectedModuleId)} className="rounded-md bg-slate-100 p-1 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                  {editingModuleId ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={editedModuleTitle}
                        onChange={e => setEditedModuleTitle(e.target.value)}
                        disabled={isUpdatingModule}
                        className="flex-1 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                      />
                      <button type="button" onClick={handleSaveModuleEdit} disabled={isUpdatingModule || !editedModuleTitle.trim()} className="rounded-xl bg-amber-500 p-2.5 text-white hover:bg-amber-600 disabled:opacity-50"><CheckCircle className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setEditingModuleId(null)} disabled={isUpdatingModule} className="rounded-xl bg-slate-200 p-2.5 text-slate-600 hover:bg-slate-300 disabled:opacity-50"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <select
                      value={selectedModuleId}
                      onChange={e => setSelectedModuleId(e.target.value)}
                      disabled={isUpdatingModule}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-violet-500/30"
                    >
                      {existingModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      <option value="new">+ Tambah Bab / Modul Baru...</option>
                    </select>
                  )}
                  {selectedModuleId === 'new' && (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={newModuleTitle}
                        onChange={e => setNewModuleTitle(e.target.value)}
                        required={selectedModuleId === 'new'}
                        maxLength={120}
                        placeholder="Ketik nama bab baru (Contoh: Bab 1)"
                        className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900 placeholder-blue-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                      />
                      <button type="button" onClick={handleSaveNewModule} disabled={isUpdatingModule || !newModuleTitle.trim()} className="rounded-xl bg-blue-600 p-2.5 text-white hover:bg-blue-700 disabled:opacity-50"><CheckCircle className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {/* Order */}
            {classId && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  Urutan ke- <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={order}
                  onChange={e => setOrder(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
            )}

            {/* Default Time Limit */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Durasi Default / Soal (detik) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="5"
                value={form.timeLimit}
                onChange={e => setForm({ ...form, timeLimit: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Default Points */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Poin Default / Soal (10-1000) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={form.xpReward}
                onChange={e => setForm({ ...form, xpReward: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            
            {/* Passing Score */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Nilai Minimal (KKM) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.passingScore}
                onChange={e => setForm({ ...form, passingScore: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                placeholder="Contoh: 75"
              />
            </div>

            {/* Quiz Type */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Jenis Evaluasi <span className="text-red-600">*</span>
              </label>
              <select
                value={form.quiz_type}
                onChange={e => setForm({ ...form, quiz_type: e.target.value as 'FORMATIF' | 'SUMATIF' })}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="FORMATIF">Kuis Formatif (Latihan/Modul)</option>
                <option value="SUMATIF">Ujian Sumatif (Ujian Akhir Kelas)</option>
              </select>
            </div>

            {/* Max Attempts */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Batas Percobaan Kuis
              </label>
              <input
                type="number"
                min="1"
                value={form.max_attempts}
                onChange={e => setForm({ ...form, max_attempts: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                placeholder="Kosongkan untuk tanpa batas"
              />
            </div>

            {/* Publish toggle */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Status
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-emerald-200">
                <div className={cn('relative h-5 w-9 rounded-full transition-colors', form.is_published ? 'bg-emerald-500' : 'bg-slate-100')}>
                  <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form.is_published ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <input type="checkbox" className="sr-only" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
                <span className="text-sm text-slate-700">{form.is_published ? '✅ Published — siswa bisa mengerjakan' : '📝 Draft — hanya kamu yang bisa lihat'}</span>
              </label>
            </div>
          </div>

          {/* Questions section */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Soal ({questions.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImport(v => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                >
                  <Upload className="h-3 w-3" />
                  Import dari Dokumen
                </button>
                <button
                  onClick={handleAddQuestion}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  <Plus className="h-3 w-3" />
                  Tambah Soal
                </button>
              </div>
            </div>

            {/* Import panel */}
            {showImport && (
              <div className="mb-3">
                <ImportPanel onImported={handleImported} />
              </div>
            )}

            {/* Questions list */}
            {loadingQuestions ? (
              <div className="py-8 text-center text-slate-600 text-sm">Memuat soal…</div>
            ) : questions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-600">
                Belum ada soal. Klik &quot;Tambah Soal&quot; atau &quot;Import dari Dokumen&quot;.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {questions.map((q, i) => (
                  <QuestionCard
                    key={i}
                    question={q}
                    index={i}
                    onChange={updated => updateQuestion(i, updated)}
                    onDelete={() => deleteQuestion(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-slate-200 pt-4">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Menyimpan…</> : `💾 Simpan Kuis (${questions.length} soal)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
