'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/ui/Sidebar'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AppLayoutClientProps {
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  userName: string
  avatarUrl?: string | null
  children: React.ReactNode
}

export function AppLayoutClient({ role, userName, avatarUrl, children }: AppLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-800/50 md:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}
      
      {/* Sidebar with dynamic mobile classes */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar 
          role={role} 
          userName={userName} 
          avatarUrl={avatarUrl} 
          onNavClick={() => setMobileOpen(false)} 
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex h-14 flex-shrink-0 items-center justify-between px-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-1 -ml-1 text-slate-600 rounded-md hover:bg-slate-50">
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-bold text-sm text-gradient-primary">GeoLearning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
              {role === 'TEACHER' ? 'Guru' : 'Siswa'}
            </span>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white shadow-sm ring-2 ring-white/50"
              style={{ background: role === 'TEACHER' ? 'linear-gradient(135deg, #F59E0B, #EA580C)' : 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-white">{userName?.charAt(0)?.toUpperCase() ?? '?'}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content Scroll Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
