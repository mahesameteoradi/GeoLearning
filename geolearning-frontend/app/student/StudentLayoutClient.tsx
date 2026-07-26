'use client'

import { Sidebar } from '@/components/ui/Sidebar'
import { useGamificationRealtime } from '@/hooks/useGamificationRealtime'

interface StudentLayoutClientProps {
  userId: string
  userName: string
  avatarUrl?: string | null
  children: React.ReactNode
}

export function StudentLayoutClient({ userId, userName, avatarUrl, children }: StudentLayoutClientProps) {
  // Subscribe to real-time XP/badge changes
  useGamificationRealtime(userId)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar role="STUDENT" userName={userName} avatarUrl={avatarUrl} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
