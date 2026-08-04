'use client'

import React from 'react'
import { TooltipRenderProps } from 'react-joyride'
import { motion } from 'framer-motion'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

export function CustomTooltip({
  continuous,
  index,
  isLastStep,
  size,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative z-50 flex w-[350px] max-w-full flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl"
      {...tooltipProps}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            {index + 1}
          </span>
          dari {size}
        </div>
        <button
          {...closeProps}
          className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {step.title && (
          <h3 className="mb-2 text-lg font-bold text-slate-900">{step.title}</h3>
        )}
        <div className="text-sm leading-relaxed text-slate-600">
          {step.content}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
        {!isLastStep ? (
          <button
            {...skipProps}
            className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700"
          >
            Lewati
          </button>
        ) : (
          <div /> // Placeholder for spacing
        )}

        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="flex items-center justify-center rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <button
            {...primaryProps}
            className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30"
          >
            {continuous && !isLastStep ? 'Lanjut' : 'Selesai'}
            {continuous && !isLastStep && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
