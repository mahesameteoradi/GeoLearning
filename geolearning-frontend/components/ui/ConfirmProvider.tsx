'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AlertTriangle, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolveFn, setResolveFn] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    setIsOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolveFn(() => resolve)
    })
  }, [])

  const handleConfirm = () => {
    if (resolveFn) resolveFn(true)
    setIsOpen(false)
  }

  const handleCancel = () => {
    if (resolveFn) resolveFn(false)
    setIsOpen(false)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {isOpen && options && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-800/60 backdrop-blur-md animate-in fade-in duration-300"
        >
          <div 
            className="relative w-full max-w-sm rounded-[32px] bg-white shadow-md shadow-black/20 overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center"
            role="dialog"
            aria-modal="true"
          >
            <div className={cn(
              "mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] mb-6 rotate-3",
              options.variant === 'danger' ? 'bg-rose-100 text-rose-500' :
              options.variant === 'info' ? 'bg-blue-100 text-blue-500' :
              'bg-amber-100 text-amber-500' 
            )}>
              <div className="-rotate-3">
                <AlertTriangle className="h-10 w-10" />
              </div>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              {options.title || 'Konfirmasi'}
            </h3>
            
            <p className="mt-3 text-[13px] font-medium text-slate-500 leading-relaxed mb-8 px-2">
              {options.message}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-slate-50 px-4 py-3.5 text-[13px] font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              >
                {options.cancelText || 'Batal'}
              </button>
              <button
                onClick={handleConfirm}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3.5 text-[13px] font-bold text-white transition-all shadow-lg hover:-translate-y-0.5",
                  options.variant === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25' :
                  options.variant === 'info' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25' :
                  'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                )}
              >
                {options.confirmText || 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}
