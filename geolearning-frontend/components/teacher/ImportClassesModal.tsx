'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ImportClassesModalProps {
  onClose: () => void
  teacherId: string
}

export function ImportClassesModal({ onClose, teacherId }: ImportClassesModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [result, setResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast.error('Format file harus .xlsx atau .xls')
        return
      }
      setFile(selectedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      if (!droppedFile.name.match(/\.(xlsx|xls)$/)) {
        toast.error('Format file harus .xlsx atau .xls')
        return
      }
      setFile(droppedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setProgress(0)
    setProgressText('Mengunggah file Excel...')

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 30) {
          setProgressText('Membaca data kelas dan siswa...')
          return prev + 5
        } else if (prev < 85) {
          setProgressText('Memproses ke database (Mungkin memakan waktu)...')
          return prev + 2
        }
        return prev
      })
    }, 500)

    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('teacherId', teacherId)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/kelas/import-batch`, {
        method: 'POST',
        headers: {
          ...(sessionData.session?.access_token && { 'Authorization': `Bearer ${sessionData.session.access_token}` })
        },
        body: formData
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Gagal mengimpor file')
      }

      setProgress(100)
      setProgressText('Selesai!')
      const data = await res.json()
      setTimeout(() => {
        setResult(data)
        toast.success('Proses import selesai!')
      }, 500)
    } catch (err: any) {
      clearInterval(progressInterval)
      toast.error(err.message)
      setLoading(false)
      setProgress(0)
    }
  }

  const downloadErrorLog = () => {
    if (!result || !result.errors || result.errors.length === 0) return

    const logContent = result.errors
      .map((e: any) => `Sheet: ${e.sheet} | Baris: ${e.baris} | Alasan: ${e.alasan}`)
      .join('\n')
    
    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Error_Log_Import_${new Date().getTime()}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Import Selesai!</h2>
          <p className="text-sm text-slate-500 mb-6">Ringkasan hasil proses import absensi excel.</p>
          
          <div className="w-full bg-slate-50 rounded-2xl p-4 text-left space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
              <span className="text-slate-600 font-medium">Kelas Baru Dibuat</span>
              <span className="font-bold text-emerald-600">{result.classesCreated}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
              <span className="text-slate-600 font-medium">Kelas Sudah Ada (Reused)</span>
              <span className="font-bold text-blue-600">{result.classesReused}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
              <span className="text-slate-600 font-medium">Siswa Berhasil Diimport</span>
              <span className="font-bold text-emerald-600">{result.studentsSuccess || result.studentsAdded || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">Siswa Gagal/Dilewati</span>
              <span className="font-bold text-rose-500">{result.studentsFailed}</span>
            </div>
          </div>

          {result.errors.length > 0 && (
            <button
              onClick={downloadErrorLog}
              className="flex items-center gap-2 text-sm text-rose-600 font-medium bg-rose-50 px-4 py-2 rounded-xl hover:bg-rose-100 transition-colors w-full justify-center mb-3"
            >
              <Download className="w-4 h-4" /> Unduh Log Error ({result.errors.length} masalah)
            </button>
          )}

          <button 
            type="button"
            onClick={() => {
              onClose()
              router.refresh()
            }}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Selesai & Kembali
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 py-8 md:py-12 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Import Excel Batch</h2>
              <p className="text-xs text-slate-500">Buat kelas & siswa otomatis dari absensi</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div 
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors mb-4 cursor-pointer ${
            file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          {file ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">{file.name}</p>
              <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button 
                type="button"
                className="mt-3 text-xs text-emerald-600 font-semibold hover:underline"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
              >
                Ganti File
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center cursor-pointer">
              <div className="w-12 h-12 bg-white text-slate-400 rounded-full flex items-center justify-center shadow-sm mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 mb-1">Pilih atau seret file Excel ke sini</p>
              <p className="text-xs text-slate-500">Mendukung file .xlsx dan .xls</p>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-bold mb-1">Panduan Import:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>1 Sheet = 1 Kelas. Sheet bernama "TOTAL" / "REKAP" akan diabaikan.</li>
                <li>Baris berawalan "Kelas : " akan dijadikan nama kelas.</li>
                <li>Tabel siswa wajib memiliki header <strong>NIPD</strong> dan <strong>NAMA</strong>.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {loading ? (
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center">
              <div className="w-full bg-slate-200 rounded-full h-3 mb-4 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden rounded-full">
                    <div className="w-full h-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-slate-600 animate-pulse">{progressText}</span>
                <span className="text-xs font-black text-emerald-600">{progress}%</span>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!file}
                onClick={handleUpload}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Proses Import
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
