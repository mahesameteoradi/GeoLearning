'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, BookOpen, Clock, Loader2, Sparkles, CheckCircle, MapPin } from 'lucide-react'
import { triggerConfetti } from '@/lib/utils/confetti'
import { cn } from '@/lib/utils/cn'
import dynamic from 'next/dynamic'

const InteractiveMapViewerClient = dynamic(
  () => import('@/components/ui/InteractiveMapViewerClient'),
  { ssr: false, loading: () => <div className="h-[70vh] min-h-[500px] w-full bg-slate-100 rounded-2xl flex flex-col items-center justify-center animate-pulse my-8 border border-slate-200"><MapPin className="h-10 w-10 text-slate-300 mb-4" /><p className="text-slate-500 font-semibold">Memuat Peta...</p></div> }
)

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
  const [isAlreadyFinished, setIsAlreadyFinished] = useState(false)
  const [hasOpenedLink, setHasOpenedLink] = useState(false)

  useEffect(() => {
    const fetchMaterial = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

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
        
        // If there's no link, they implicitly "opened" it just by being here
        if (!data.content_url) {
          setHasOpenedLink(true)
        }
      }

      // Check if already completed
      if (user) {
        const { data: existing } = await supabase
          .from('material_completions')
          .select('id')
          .eq('user_id', user.id)
          .eq('material_id', materialId)
          .single()
        
        if (existing) {
          setIsAlreadyFinished(true)
        }
      }

      setLoading(false)
    }

    fetchMaterial()
  }, [materialId])

  const handleFinishReading = async () => {
    if (!material) return
    setIsFinished(true)
    triggerConfetti()
    
    // Save completion via secure API
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        const res = await fetch('/api/materials/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            materialId: materialId,
            materialTitle: material.title,
            materialType: material.type
          })
        })
        const result = await res.json()
        if (!result.success) {
          console.error('Error from API:', result.error)
        }
      } catch (err) {
        console.error('Fetch error:', err)
      }
    }

    setTimeout(() => {
      window.location.href = `/student/classes/${classId}`
    }, 1500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-4 w-32 bg-slate-200 rounded-full animate-pulse" />
          <div className="h-10 w-3/4 bg-slate-200 rounded-xl animate-pulse" />
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[60vh] animate-pulse" />
        </div>
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
      <main className={cn("mx-auto px-4 py-12 md:py-20", material.type === 'INTERACTIVE_MAP' ? "max-w-6xl" : "max-w-3xl")}>
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
          {material.type === 'INTERACTIVE_MAP' ? (
            <InteractiveMapViewerClient 
              title={material.title}
              data={JSON.parse(material.content_text || '{"center":{"lat":-0.7893,"lng":113.9213},"zoom":5,"markers":[]}')}
              inline={true}
            />
          ) : material.content_text ? (
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
                onClick={() => setHasOpenedLink(true)}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition"
              >
                Buka Referensi
              </a>
            </div>
          )}
        </article>

        {/* Completion Action */}
        <div className="mt-20 pt-10 border-t border-slate-200 text-center flex flex-col items-center">
          {isAlreadyFinished ? (
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-500 px-6 py-3 rounded-full font-bold">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Anda sudah menyelesaikan materi ini
            </div>
          ) : !isFinished ? (
            <>
              <button 
                onClick={handleFinishReading}
                disabled={!hasOpenedLink}
                className={cn(
                  "inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all",
                  hasOpenedLink 
                    ? "bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 hover:shadow-2xl active:scale-95" 
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                )}
              >
                <Sparkles className={cn("w-5 h-5", hasOpenedLink ? "text-yellow-400" : "text-slate-400")} />
                {material.type === 'INTERACTIVE_MAP' ? 'Tandai Selesai Eksplorasi' : 'Selesai Membaca & Dapatkan XP'}
              </button>
              {!hasOpenedLink && (
                <p className="mt-4 text-sm font-semibold text-rose-500 animate-pulse">
                  * Silakan klik &quot;Buka Referensi&quot; terlebih dahulu untuk mendapatkan XP
                </p>
              )}
            </>
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
