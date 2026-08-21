'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface TabOption<T extends string> {
  id: T
  label: string
}

interface AnimatedFilterTabsProps<T extends string> {
  options: TabOption<T>[]
  activeTab: T
  onChange: (tabId: T) => void
  layoutId?: string
}

export function AnimatedFilterTabs<T extends string>({
  options,
  activeTab,
  onChange,
  layoutId = 'filter-tab-active-pill'
}: AnimatedFilterTabsProps<T>) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm scrollbar-hide">
      {options.map((option) => {
        const isActive = activeTab === option.id
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors duration-300",
              isActive ? "text-blue-700" : "text-slate-600 hover:text-slate-900"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 z-0 rounded-lg bg-blue-50"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                  mass: 0.8
                }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
