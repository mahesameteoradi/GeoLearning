'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Trophy, BookOpen, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { notificationsStudentSteps } from '@/lib/utils/tourSteps'

type NotificationType = 'ACHIEVEMENT' | 'REMINDER' | 'INTERVENTION' | 'SYSTEM' | 'FORUM'

interface Notification {
  id: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
  metadata: Record<string, unknown> | null
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className ?? ''}`} />
}

const typeConfig: Record<NotificationType, {
  icon: React.ComponentType<{ className?: string }>
  bg: string
  border: string
  iconColor: string
  label: string
}> = {
  ACHIEVEMENT: { icon: Trophy,     bg: 'bg-amber-50',   border: 'border-amber-200',  iconColor: 'text-amber-600',   label: 'Pencapaian' },
  REMINDER:    { icon: Bell,       bg: 'bg-blue-50',    border: 'border-blue-200',   iconColor: 'text-blue-400',    label: 'Pengingat' },
  INTERVENTION:{ icon: AlertCircle,bg: 'bg-red-50',     border: 'border-red-200',    iconColor: 'text-red-600',     label: 'Intervensi' },
  SYSTEM:      { icon: Info,       bg: 'bg-slate-50',   border: 'border-slate-200',  iconColor: 'text-slate-500',   label: 'Sistem' },
  FORUM:       { icon: BookOpen,   bg: 'bg-violet-50',  border: 'border-blue-300', iconColor: 'text-blue-600',  label: 'Forum' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('id, message, type, is_read, created_at, metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setNotifications(data as Notification[])
    setLoading(false)
  }

  async function markAllRead() {
    setMarkingAll(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setMarkingAll(false)
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="min-h-full p-5 lg:p-7">
      <OnboardingTour tourKey="notifications_student" steps={notificationsStudentSteps} />
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notifikasi
            {unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-slate-800">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500 hover:text-white hover:border-blue-200 transition disabled:opacity-50"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Tandai semua dibaca
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-2 w-2 rounded-full" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-20 text-center">
          <Bell className="h-10 w-10 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-500">Tidak ada notifikasi</p>
          <p className="mt-1 text-xs text-slate-600">Notifikasi akan muncul setelah kamu menyelesaikan kuis atau meraih badge</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const cfg = typeConfig[notif.type] ?? typeConfig.SYSTEM
            const Icon = cfg.icon
            return (
              <button
                key={notif.id}
                onClick={() => !notif.is_read && markRead(notif.id)}
                className={cn(
                  'w-full flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                  notif.is_read
                    ? 'border-slate-100 bg-transparent opacity-60 hover:opacity-80'
                    : cn('hover:border-opacity-50', cfg.bg, cfg.border)
                )}
              >
                {/* Icon */}
                <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', cfg.bg)}>
                  <Icon className={cn('h-5 w-5', cfg.iconColor)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', notif.is_read ? 'text-slate-500' : 'font-medium text-slate-800')}>
                    {notif.message}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wide', cfg.iconColor)}>
                      {cfg.label}
                    </span>
                    <span className="text-[11px] text-slate-600">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Unread dot */}
                {!notif.is_read && (
                  <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-violet-500" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
