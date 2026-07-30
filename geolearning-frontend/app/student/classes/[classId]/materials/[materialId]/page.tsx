'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, BookOpen, Clock, Loader2, Sparkles, CheckCircle } from 'lucide-react'
import { triggerConfetti } from '@/lib/utils/confetti'

interface MaterialItem {
  id: string
  title: string
  type: string
  content_text: string | null
  content_url: string | null
  module: {
    title: string
  }
}

export default function MaterialReaderPage() {
  const params = useParams()
  const router = useRouter()
  const classId = params.classId as string
  const materialId = params.materialId as string

  const [material, setMaterial] = useState<MaterialItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    const fetchMaterial = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('materials')
        .select(`
          id, title, type, content_text, content_url,
          module:modules(title)
        `)
        .eq('id', materialId)
        .single()

      if (data) {
        const mod = data.module as any
        const modTitle = Array.isArray(mod) ? mod[0]?.title : mod?.title
        setMaterial({ ...data, module: { title: modTitle || 'Modul' } } as MaterialItem)
      }
      setLoading(false)
    }

    fetchMaterial()
  }, [materialId])

  const handleFinishReading = async () => {
    setIsFinished(true)
    triggerConfetti()
    
    // Save completion
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('material_completions').insert({
        user_id: user.id,
        material_id: materialId
      })
      if (error && error.code !== '23505') { // 23505 is unique violation, which is fine
        console.error('Error inserting material completion:', error)
      }
    }

    setTimeout(() => {
      window.location.href = `/student/classes/${classId}`
    }, 4000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!material) {
    return (
      <div className="p-8 text-center">Materi tidak ditemukan.</div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-200">
      {/* Top Navbar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            href={`/student/classes/${classId}`}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full">
            <BookOpen className="w-3.5 h-3.5" />
            {material.module.title}
          </div>
        </div>
      </div>

      {/* Reader Content */}
      <main className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            {material.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Estimasi baca: 5 menit
            </span>
          </div>
        </header>

        {/* The rich text content */}
        <article className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-indigo-600 hover:prose-a:text-indigo-500 prose-img:rounded-2xl prose-img:shadow-lg">
          {material.content_text ? (
            <div dangerouslySetInnerHTML={{ __html: material.content_text }} />
          ) : (
            <p className="italic text-slate-400 text-center">Teks materi tidak tersedia. Silakan cek lampiran file.</p>
          )}

          {/* If there's a URL but type is TEXT, maybe it's an external reading link */}
          {material.content_url && (
            <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-indigo-900 mb-1">Referensi Eksternal</h4>
                <p className="text-sm text-indigo-700">Terdapat tautan atau file tambahan untuk materi ini.</p>
              </div>
              <a 
                href={material.content_url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => {
                  if (!isFinished) {
                    handleFinishReading()
                  }
                }}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition"
              >
                Buka Referensi
              </a>
            </div>
          )}
        </article>

        {/* Completion Action */}
        <div className="mt-20 pt-10 border-t border-slate-200 text-center">
          {!isFinished ? (
            <button 
              onClick={handleFinishReading}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition-all hover:scale-105 shadow-xl hover:shadow-2xl active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Selesai Membaca & Dapatkan XP
            </button>
          ) : (
            <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-8 py-4 rounded-full font-bold text-lg">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
              Materi Selesai! Mengarahkan kembali...
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
