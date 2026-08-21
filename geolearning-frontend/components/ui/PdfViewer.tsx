'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { ChevronLeft, ChevronRight, Download, Loader2, ZoomIn, ZoomOut } from 'lucide-react'

// Set worker to unpkg CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => prevPageNumber + offset)
  }

  return (
    <div className="flex flex-col w-full h-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
          <button 
            type="button" 
            disabled={pageNumber <= 1} 
            onClick={() => changePage(-1)}
            className="p-1.5 rounded bg-white shadow-sm text-slate-600 disabled:opacity-40 disabled:shadow-none hover:bg-slate-50 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-600 min-w-[3rem] text-center">
            {pageNumber} / {numPages || '-'}
          </span>
          <button 
            type="button" 
            disabled={numPages === null || pageNumber >= numPages} 
            onClick={() => changePage(1)}
            className="p-1.5 rounded bg-white shadow-sm text-slate-600 disabled:opacity-40 disabled:shadow-none hover:bg-slate-50 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 hidden sm:flex">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-1.5 text-slate-600 hover:bg-white rounded transition"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs font-semibold text-slate-600 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-1.5 text-slate-600 hover:bg-white rounded transition"><ZoomIn className="w-4 h-4" /></button>
          </div>
          
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Unduh PDF</span>
          </a>
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="flex-1 overflow-auto bg-slate-200/50 flex flex-col items-center p-4 custom-scrollbar relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Memuat Dokumen...</p>
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={null}
          error={
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-3"><Download className="w-8 h-8" /></div>
              <h3 className="font-bold text-slate-800 mb-1">Gagal Menampilkan PDF</h3>
              <p className="text-sm text-slate-600 mb-4 max-w-sm">File ini mungkin terlalu besar atau memiliki format yang tidak didukung untuk pratinjau langsung.</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition">
                Buka File
              </a>
            </div>
          }
          className="flex flex-col items-center drop-shadow-xl"
        >
          {numPages !== null && (
            <Page 
              pageNumber={pageNumber} 
              scale={scale} 
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="bg-white" 
              loading={
                <div className="w-full aspect-[1/1.4] bg-white flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              }
            />
          )}
        </Document>
      </div>
    </div>
  )
}
