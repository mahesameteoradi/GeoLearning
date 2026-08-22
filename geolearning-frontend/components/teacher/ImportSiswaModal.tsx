'use client'

import { useState, useRef } from 'react'
import { X, UploadCloud, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import * as xlsx from 'xlsx'
import { LogoLoader } from '@/components/ui/LogoLoader'

interface ImportSiswaModalProps {
  classId: string
  onClose: () => void
  onSuccess: () => void
}

export function ImportSiswaModal({ classId, onClose, onSuccess }: ImportSiswaModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleDownloadTemplate = () => {
    // Generate a simple Excel template
    const headers = [['NO', 'NIPD', 'NAMA PESERTA', 'L/P']]
    const sampleData = [
      [1, '2024001', 'Ahmad Fauzi', 'L'],
      [2, '2024002', 'Siti Nurhaliza', 'P']
    ]
    
    const ws = xlsx.utils.aoa_to_sheet([...headers, ...sampleData])
    
    // Set column widths for better UX
    ws['!cols'] = [
      { wch: 10 }, { wch: 20 }, { wch: 35 }, { wch: 10 }
    ]
    
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Daftar Siswa')
    
    xlsx.writeFile(wb, 'template_import_siswa.xlsx')
    toast.success('Template berhasil diunduh')
  }

  const handleFileChange = (f: File) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      toast.error('Gunakan file Excel (.xlsx / .xls)')
      return
    }
    setFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    
    try {
      // Get the session from Supabase to send Bearer token
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      
      abortControllerRef.current = new AbortController()

      const res = await fetch(`${apiUrl}/kelas/${classId}/import-siswa`, {
        method: 'POST',
        headers: {
          ...(sessionData.session?.access_token && { 'Authorization': `Bearer ${sessionData.session.access_token}` })
        },
        body: formData,
        signal: abortControllerRef.current.signal
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Terjadi kesalahan saat import')
      }

      setResult(data)
      toast.success('Proses import selesai!')
      onSuccess()
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.error('Proses import dibatalkan')
      } else {
        toast.error(err.message)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setUploading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start overflow-y-auto justify-center p-4 py-8 md:py-12 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[2rem] border border-white/20 bg-white p-6 shadow-2xl">
        <LogoLoader isOpen={uploading} message="Memproses Data Siswa..." onCancel={handleCancel} />
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Import Data Siswa</h2>
              <p className="text-xs text-slate-500">Unggah file Excel berisi daftar siswa</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {!result ? (
          <>
            <div className="space-y-5">
            <button
              onClick={handleDownloadTemplate}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Unduh Template Excel
            </button>

            <div>
                  <div 
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }} 
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileChange(f) }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 px-6 text-center transition-all ${
                      dragOver ? 'border-blue-500 bg-blue-50' : file ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {file ? (
                      <>
                        <FileSpreadsheet className="h-8 w-8 text-green-600 mb-1" />
                        <div>
                          <p className="text-sm font-bold text-green-700">{file.name}</p>
                          <p className="text-xs text-green-600/70">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-slate-400 mb-1" />
                        <div>
                          <p className="text-sm font-bold text-slate-700">Pilih file atau drag & drop ke sini</p>
                          <p className="mt-1 text-xs text-slate-500">Mendukung .xlsx, .xls</p>
                        </div>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f) }} />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={onClose} 
                disabled={uploading} 
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleSubmit}
                disabled={uploading || !file}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>
                ) : (
                  <>Mulai Import</>
                )}
              </button>
            </div>
          </div>
          <LogoLoader isOpen={uploading} message="Memproses Data Siswa..." />
        </>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              {result.gagal === 0 ? (
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
              )}
              <h3 className="text-lg font-bold text-slate-800">Ringkasan Import</h3>
              <p className="mt-1 text-sm text-slate-600">Total baris diproses: <span className="font-bold text-slate-800">{result.total_baris}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-widest">Berhasil</p>
                <p className="mt-1 text-2xl font-bold text-green-700">{result.berhasil}</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-widest">Gagal</p>
                <p className="mt-1 text-2xl font-bold text-rose-700">{result.gagal}</p>
              </div>
            </div>

            {result.detail_gagal && result.detail_gagal.length > 0 && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <p className="text-xs font-bold text-slate-600">Detail Error</p>
                </div>
                <div className="max-h-40 overflow-y-auto p-2">
                  <ul className="space-y-1">
                    {result.detail_gagal.map((err: any, i: number) => (
                      <li key={i} className="flex gap-3 px-2 py-1 text-sm">
                        <span className="font-medium text-slate-500 whitespace-nowrap">Baris {err.baris}:</span>
                        <span className="text-rose-600">{err.alasan}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <button 
              onClick={onClose} 
              className="w-full rounded-xl bg-slate-800 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
