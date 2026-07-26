'use client'

import dynamic from 'next/dynamic'
import { InteractiveMapData } from './InteractiveMapEditorClient'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useState } from 'react'

const InteractiveMapEditorClient = dynamic(
  () => import('./InteractiveMapEditorClient'),
  { ssr: false, loading: () => <div className="h-[80vh] w-[90vw] max-w-6xl bg-white rounded-2xl flex items-center justify-center animate-pulse"><p className="text-slate-500 font-semibold">Memuat Editor Peta...</p></div> }
)

interface Props {
  moduleId: string
  title: string
  description?: string
  onClose: () => void
  onSuccess: (mat: any) => void
}

export function InteractiveMapEditorModal({ moduleId, title, description, onClose, onSuccess }: Props) {
  const [saving, setSaving] = useState(false)

  async function handleSave(data: InteractiveMapData) {
    setSaving(true)
    const supabase = createClient()
    
    // Save to database
    const { data: mat, error } = await supabase.from('materials').insert({
      id: crypto.randomUUID(),
      module_id: moduleId,
      title: title,
      type: 'INTERACTIVE_MAP',
      content_url: null,
      content_text: JSON.stringify(data),
      order: 0,
      updated_at: new Date().toISOString(),
    }).select().single()

    setSaving(false)

    if (error) {
      toast.error(`Gagal menyimpan: ${error.message || 'Unknown error'}`)
      console.error('[MapEditor] Save error:', error.message, error.details, error.hint, error)
      return
    }

    toast.success('Peta Interaktif berhasil disimpan! 🎉')
    onSuccess(mat)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="relative">
        <InteractiveMapEditorClient onSave={handleSave} onCancel={onClose} />
        
        {saving && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-[500] flex items-center justify-center rounded-2xl">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
              <p className="text-sm font-bold text-slate-700">Menyimpan Peta...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
