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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl shadow-black/20 border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                  options.variant === 'danger' ? 'bg-red-100 text-red-600' :
                  options.variant === 'info' ? 'bg-blue-100 text-blue-600' :
                  'bg-amber-100 text-amber-600' // default warning
                )}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="pt-1">
                  <h3 className="text-base font-bold text-slate-900">
                    {options.title || 'Konfirmasi'}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {options.message}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 bg-slate-50 px-6 py-4 border-t border-slate-100">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <X className="h-4 w-4" />
                {options.cancelText || 'Batal'}
              </button>
              <button
                onClick={handleConfirm}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
                  options.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
                  options.variant === 'info' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' :
                  'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                )}
              >
                <Check className="h-4 w-4" />
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
