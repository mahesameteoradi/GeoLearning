'use client'

import { Sidebar } from '@/components/ui/Sidebar'
import { useGamificationRealtime } from '@/hooks/useGamificationRealtime'

interface StudentLayoutClientProps {
  userId: string
  userName: string
  avatarUrl?: string | null
  children: React.ReactNode
}

import { AppLayoutClient } from '@/components/layout/AppLayoutClient'

export function StudentLayoutClient({ userId, userName, avatarUrl, children }: StudentLayoutClientProps) {
  // Subscribe to real-time XP/badge changes
  useGamificationRealtime(userId)

  return (
    <AppLayoutClient role="STUDENT" userName={userName} avatarUrl={avatarUrl}>
      {children}
    </AppLayoutClient>
  )
}
