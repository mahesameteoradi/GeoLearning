'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, BookOpen, Clock, Loader2, Sparkles, CheckCircle, MapPin, Maximize, ChevronLeft, ChevronRight, FileText, PlayCircle } from 'lucide-react'
import { triggerConfetti } from '@/lib/utils/confetti'
import { cn } from '@/lib/utils/cn'
import dynamic from 'next/dynamic'

const PdfViewer = dynamic(() => import('@/components/ui/PdfViewer'), { ssr: false })

const InteractiveMapViewerClient = dynamic(
  () => import('@/components/ui/InteractiveMapViewerClient'),
  { ssr: false, loading: () => <div className="h-[70vh] min-h-[500px] w-full bg-slate-50 rounded-2xl flex flex-col items-center justify-center animate-pulse my-8 border border-slate-200"><MapPin className="h-10 w-10 text-slate-300 mb-4" /><p className="text-slate-500 font-semibold">Memuat Peta...</p></div> }
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
  const [hasInteracted, setHasInteracted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(-1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)

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
        
        // Set minimum study time
        let requiredTime = 5;
        if (data.type === 'VIDEO' || data.content_url?.match(/youtube\.com|youtu\.be|\.(mp4|webm|ogg)$/i)) {
          requiredTime = 15;
        } else if (data.content_text && data.content_text.length > 500) {
          requiredTime = 10;
        }
        setTimeLeft(requiredTime);
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

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft])

  // Track if user reads the material (scrolls to bottom) or interacts with iframe
  useEffect(() => {
    const handleScroll = () => {
      // If user scrolls near the bottom
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 150) {
        // If there is no video url, scrolling is enough to unlock XP
        if (material && !material.content_url?.match(/youtube\.com|youtu\.be|\.(mp4|webm|ogg)$/i)) {
          setHasInteracted(true)
        }
      }
    }
    
    const handleBlur = () => {
      // If focus moves to an iframe (e.g. clicking play on YouTube)
      if (document.activeElement?.tagName === 'IFRAME') {
        setHasInteracted(true)
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
    if (!material || isFinished) return
    setIsFinished(true)
    triggerConfetti()
    
    // Save completion via secure backend API
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session && session.user) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kelas/${classId}/materials/${materialId}/complete`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            userId: session.user.id
          })
        })
        const result = await res.json()
        if (!result.success) {
          console.error('Error from API:', result.error)
        } else {
          // Show toast for newly earned badges
          if (result.earnedBadges && result.earnedBadges.length > 0) {
            // Need to import toast from react-hot-toast dynamically or at top of file
            // Assuming we can use window.toast or dynamically import
            import('react-hot-toast').then(({ toast }) => {
              result.earnedBadges.forEach((badge: any) => {
                toast.success(`Lencana Baru: ${badge.name}! ${badge.icon}`, {
                  duration: 5000,
                  icon: '🏅',
                })
              })
            })
          }
        }
      } catch (err) {
        console.error('Fetch error:', err)
      }
    }

    const timerId = setTimeout(() => {
      router.push(`/student/classes/${classId}`)
    }, 2500)

    // Store timer in window so we can clear it if needed
    ;(window as any)._materialFinishTimer = timerId;
  }

  // Clear timeout if unmounted
  useEffect(() => {
    return () => {
      if ((window as any)._materialFinishTimer) {
        clearTimeout((window as any)._materialFinishTimer)
      }
    }
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen?.()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-4 w-32 bg-slate-200 rounded-full animate-pulse" />
          <div className="h-10 w-3/4 bg-slate-200 rounded-xl animate-pulse" />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[60vh] animate-pulse" />
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
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      {/* Top Navbar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            href={`/student/classes/${classId}`}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full">
            <BookOpen className="w-3.5 h-3.5" />
            {material.module.title}
          </div>
        </div>
      </div>

      {/* Reader Content */}
      <main className={cn("mx-auto px-4 py-12 md:py-20", material.type === 'INTERACTIVE_MAP' ? "max-w-6xl" : "max-w-3xl")}>
        <header className="mb-8 md:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-800 mb-4 md:mb-6 leading-tight">
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
        <article className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-img:rounded-2xl prose-img:shadow-lg">
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
              <div className="p-2 sm:p-3 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(37,99,235,0.1)] overflow-hidden mb-4">
                <div ref={containerRef} className="bg-slate-800/5 rounded-2xl overflow-hidden relative w-full flex flex-col items-center justify-center min-h-[250px] group bg-white">
                  
                  <button 
                    onClick={toggleFullScreen}
                    className="absolute top-4 right-4 z-10 p-2.5 bg-slate-800/40 hover:bg-slate-800/70 backdrop-blur-md rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                    title="Layar Penuh"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>

                  {(() => {
                    const url = material.content_url;
                    
                    let embedUrl = url;
                    if (!embedUrl.startsWith('http://') && !embedUrl.startsWith('https://')) {
                      embedUrl = 'https://' + embedUrl;
                    }

                    const isRawVideo = embedUrl.match(/\.(mp4|webm|ogg)$/i);
                    const isYouTube = embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be');
                    const isOfficeDoc = embedUrl.match(/\.(ppt|pptx|doc|docx|xls|xlsx)$/i);
                    const isPdf = embedUrl.match(/\.(pdf)$/i);
                    
                    if (isYouTube) {
                      const videoId = embedUrl.includes('v=') ? new URL(embedUrl).searchParams.get('v') : embedUrl.split('youtu.be/')[1]?.split('?')[0];
                      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
                    } else if (embedUrl.includes('drive.google.com/file/d/')) {
                      const fileId = embedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
                      if (fileId) embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
                    } else if (isOfficeDoc) {
                      // Gunakan Google Docs Viewer hanya untuk file Office
                      embedUrl = `https://docs.google.com/gview?url=${encodeURIComponent(embedUrl)}&embedded=true`;
                    }

                    if (isRawVideo) {
                      return (
                        <video 
                          src={embedUrl} 
                          controls 
                          className="w-full aspect-video object-cover"
                          onPlay={() => setHasInteracted(true)}
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
                    } else if (isPdf) {
                      return (
                        <div className="w-full h-[85vh] transition-all duration-300" style={isFullscreen ? { minHeight: '100vh', height: '100vh' } : undefined} onClick={() => setHasInteracted(true)}>
                          <PdfViewer url={embedUrl} />
                        </div>
                      )
                    } else {
                      return (
                        <iframe 
                          src={embedUrl}
                          className="w-full h-[85vh] transition-all duration-300"
                          style={isFullscreen ? { minHeight: '100vh' } : undefined}
                          onLoad={() => setHasInteracted(true)}
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
                  onClick={() => setHasInteracted(true)} 
                  className="inline-flex flex-wrap justify-center items-center gap-2 text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-4 py-2 rounded-2xl md:rounded-full"
                >
                  <span className="text-center">Tidak bisa memutar / melihat konten? Buka di tab baru</span> <ArrowLeft className="w-4 h-4 rotate-135 flex-shrink-0" style={{ transform: 'rotate(135deg)' }} />
                </a>
              </div>
            </div>
          )}
        </article>

        {/* Completion Action */}
        <div className="mt-20 pt-10 border-t border-slate-200 text-center flex flex-col items-center">
          {isAlreadyFinished ? (
            <div className="inline-flex items-center gap-2 bg-slate-50 text-slate-500 px-6 py-3 rounded-full font-bold">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Anda sudah menyelesaikan materi ini
            </div>
          ) : !isFinished ? (
            <>
              <button 
                onClick={handleFinishReading}
                disabled={!hasInteracted || timeLeft > 0}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg shadow-md transition-all w-full sm:w-auto",
                  (hasInteracted && timeLeft <= 0) 
                    ? "bg-slate-800 text-white hover:bg-slate-800 hover:scale-105 hover:shadow-md active:scale-95" 
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                )}
              >
                <Sparkles className={cn("w-5 h-5 flex-shrink-0", (hasInteracted && timeLeft <= 0) ? "text-amber-400" : "text-slate-400")} />
                <span className="text-center">
                  {timeLeft > 0 
                    ? `Pelajari materi... (${timeLeft}s)` 
                    : material.type === 'INTERACTIVE_MAP' ? 'Tandai Selesai Eksplorasi' : 'Selesai Membaca & Dapatkan XP'}
                </span>
              </button>
              {(!hasInteracted && timeLeft <= 0) && (
                <p className="mt-4 text-xs sm:text-sm font-semibold text-rose-500 animate-pulse text-center px-4">
                  * {material.content_url?.match(/youtube\.com|youtu\.be|\.(mp4|webm|ogg)$/i) ? 'Putar video terlebih dahulu untuk mendapatkan XP' : 'Baca materi hingga akhir untuk mendapatkan XP'}
                </p>
              )}
              {timeLeft > 0 && (
                <p className="mt-4 text-xs sm:text-sm font-semibold text-amber-500 animate-pulse text-center px-4">
                  * Waktu belajar minimal belum tercapai. Jangan terburu-buru!
                </p>
              )}
            </>
          ) : (
            <div className="inline-flex items-center justify-center gap-2 sm:gap-3 bg-green-50 border border-green-200 text-green-700 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-lg w-full sm:w-auto">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
              <span className="text-center">Materi Selesai! Mengarahkan kembali...</span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
