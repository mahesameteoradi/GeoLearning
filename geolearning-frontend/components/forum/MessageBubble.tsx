'use client'

import { cn } from '@/lib/utils/cn'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Reply, Trash2 } from 'lucide-react'

export interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  body: string
  reply_to_id: string | null
  created_at: string
  user: { name: string; role?: string } | null
  reply_to?: {
    id: string
    body: string
    user: { name: string } | null
  } | null
}

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  onReply: (msg: ChatMessage) => void
  onDelete: (id: string) => void
}

export function MessageBubble({ message, isOwn, onReply, onDelete }: MessageBubbleProps) {
  const displayName = message.user?.name ?? 'Pengguna'
  const isTeacher = message.user?.role === 'TEACHER'

  return (
    <div className={cn('group flex gap-2 items-end', isOwn ? 'flex-row-reverse' : 'flex-row')}>

      {/* Avatar */}
      {!isOwn && (
        <div className={cn(
          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold mb-0.5',
          isTeacher
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
            : 'bg-gradient-to-br from-blue-600 to-sky-500 text-white'
        )}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Bubble container */}
      <div className={cn('flex max-w-[72%] flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender name */}
        {!isOwn && (
          <span className={cn('px-1 text-[10px] font-semibold', isTeacher ? 'text-amber-600' : 'text-blue-600')}>
            {displayName}
            {isTeacher && <span className="ml-1 text-[9px] font-normal text-amber-600">(Guru)</span>}
          </span>
        )}

        {/* Quoted message */}
        {message.reply_to && (
          <div className={cn(
            'rounded-t-xl px-3 py-1.5 border-l-2 text-[11px] max-w-full truncate',
            isOwn
              ? 'bg-blue-100 border-blue-400 text-blue-700'
              : 'bg-slate-100 border-slate-400 text-slate-600'
          )}>
            <span className="font-semibold text-slate-700">
              {message.reply_to.user?.name ?? 'Pengguna'}:
            </span>{' '}
            <span className="truncate">{message.reply_to.body}</span>
          </div>
        )}

        {/* Main bubble */}
        <div className={cn(
          'relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words',
          message.reply_to
            ? (isOwn ? 'rounded-tr-none' : 'rounded-tl-none')
            : '',
          isOwn
            ? 'bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-600/20'
            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
        )}>
          {message.body}
        </div>

        {/* Timestamp */}
        <span className="px-1 text-[9px] text-slate-600">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: idLocale })}
        </span>
      </div>

      {/* Action buttons (appear on hover) */}
      <div className={cn(
        'mb-6 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}>
        <button
          onClick={() => onReply(message)}
          title="Balas pesan ini"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
        >
          <Reply className="h-3 w-3" />
        </button>
        {/* Only show delete for own messages */}
        {isOwn && (
          <button
            onClick={() => onDelete(message.id)}
            title="Hapus pesan"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}
