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
        
        // Removed auto-set of hasOpenedLink to enforce reading/watching rule.
        // We will set it via scroll or video interaction.
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

  // Track if user reads the material (scrolls to bottom) or interacts with iframe
  useEffect(() => {
    const handleScroll = () => {
      // If user scrolls near the bottom
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 150) {
        // If there is no video url, scrolling is enough to unlock XP
        if (material && !material.content_url?.match(/youtube\.com|youtu\.be|\.(mp4|webm|ogg)$/i)) {
          setHasOpenedLink(true)
        }
      }
    }
    
    const handleBlur = () => {
      // If focus moves to an iframe (e.g. clicking play on YouTube)
      if (document.activeElement?.tagName === 'IFRAME') {
        setHasOpenedLink(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('blur', handleBlur)
    
    // Trigger scroll check immediately in case content is short
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('blur', handleBlur)
    }
  }, [material])

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
        <header className="mb-8 md:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 md:mb-6 leading-tight">
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

          {/* Embed Content in Glassmorphism Card */}
          {material.content_url && (
            <div className="mt-12 not-prose">
              <div className="p-2 sm:p-3 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(37,99,235,0.1)] overflow-hidden mb-4">
                <div className="bg-slate-900/5 rounded-2xl overflow-hidden relative w-full flex items-center justify-center min-h-[250px]">
                  {(() => {
                    const url = material.content_url;
                    
                    let embedUrl = url;
                    if (!embedUrl.startsWith('http://') && !embedUrl.startsWith('https://')) {
                      embedUrl = 'https://' + embedUrl;
                    }

                    const isRawVideo = embedUrl.match(/\.(mp4|webm|ogg)$/i);
                    const isYouTube = embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be');
                    const isOfficeDoc = embedUrl.match(/\.(ppt|pptx|doc|docx|xls|xlsx)$/i);
                    
                    if (isYouTube) {
                      const videoId = embedUrl.includes('v=') ? new URL(embedUrl).searchParams.get('v') : embedUrl.split('youtu.be/')[1]?.split('?')[0];
                      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
                    } else if (embedUrl.includes('drive.google.com/file/d/')) {
                      const fileId = embedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
                      if (fileId) embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
                    } else if (isOfficeDoc) {
                      embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(embedUrl)}`;
                    }

                    if (isRawVideo) {
                      return (
                        <video 
                          src={embedUrl} 
                          controls 
                          className="w-full aspect-video object-cover"
                          onPlay={() => setHasOpenedLink(true)}
                        />
                      );
                    } else if (isYouTube) {
                      return (
                        <iframe 
                          src={embedUrl}
                          className="w-full aspect-video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      );
                    } else {
                      return (
                        <iframe 
                          src={embedUrl}
                          className="w-full h-[600px]"
                          onLoad={() => setHasOpenedLink(true)}
                        />
                      )
                    }
                  })()}
                </div>
              </div>
              
              <div className="text-center mt-6">
                <a 
                  href={material.content_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => setHasOpenedLink(true)} 
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-4 py-2 rounded-full"
                >
                  Tidak bisa memutar / melihat konten? Buka di tab baru <ArrowLeft className="w-4 h-4 rotate-135" style={{ transform: 'rotate(135deg)' }} />
                </a>
              </div>
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
                  "inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg shadow-xl transition-all w-full sm:w-auto",
                  hasOpenedLink 
                    ? "bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 hover:shadow-2xl active:scale-95" 
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                )}
              >
                <Sparkles className={cn("w-5 h-5 flex-shrink-0", hasOpenedLink ? "text-yellow-400" : "text-slate-400")} />
                <span className="text-center">{material.type === 'INTERACTIVE_MAP' ? 'Tandai Selesai Eksplorasi' : 'Selesai Membaca & Dapatkan XP'}</span>
              </button>
              {!hasOpenedLink && (
                <p className="mt-4 text-xs sm:text-sm font-semibold text-rose-500 animate-pulse text-center px-4">
                  * {material.content_url?.match(/youtube\.com|youtu\.be|\.(mp4|webm|ogg)$/i) ? 'Putar video terlebih dahulu untuk mendapatkan XP' : 'Baca materi hingga akhir untuk mendapatkan XP'}
                </p>
              )}
            </>
          ) : (
            <div className="inline-flex items-center justify-center gap-2 sm:gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-lg w-full sm:w-auto">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0" />
              <span className="text-center">Materi Selesai! Mengarahkan kembali...</span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
