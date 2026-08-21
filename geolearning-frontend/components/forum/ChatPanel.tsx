'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageBubble, ChatMessage } from './MessageBubble'
import { Send, Loader2, X, CornerUpLeft, SmilePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { useConfirm } from '@/components/ui/ConfirmProvider'

const PAGE_SIZE = 40

interface ChatPanelProps {
  roomId: string
  roomName: string
  userId: string
}

export function ChatPanel({ roomId, roomName, userId }: ChatPanelProps) {
  const { confirm } = useConfirm()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // ─── Fetch initial messages ────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        id, room_id, user_id, body, reply_to_id, created_at,
        user:users!chat_messages_user_id_fkey ( name, role ),
        reply_to:reply_to_id (
          id, body,
          user:users!chat_messages_user_id_fkey ( name )
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(PAGE_SIZE)

    if (error) {
      console.error('[ChatPanel] fetch error:', error)
    } else {
      setMessages((data as unknown as ChatMessage[]) ?? [])
    }
    setLoading(false)
  }, [roomId, supabase])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // ─── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          // Fetch the full message with joins
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              id, room_id, user_id, body, reply_to_id, created_at,
              user:users!chat_messages_user_id_fkey ( name, role ),
              reply_to:reply_to_id (
                id, body,
                user:users!chat_messages_user_id_fkey ( name )
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data as unknown as ChatMessage])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, supabase])

  // ─── Auto-scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const body = text.trim()
    if (!body || sending) return

    setSending(true)
    setText('')

    const payload: Record<string, unknown> = {
      room_id: roomId,
      user_id: userId,
      body,
    }
    if (replyTo) payload.reply_to_id = replyTo.id
    setReplyTo(null)

    const { error } = await supabase.from('chat_messages').insert(payload)
    if (error) {
      toast.error('Gagal mengirim pesan')
      setText(body)
      console.error(error)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  // ─── Delete message ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Pesan',
      message: 'Hapus pesan ini?',
      confirmText: 'Ya, Hapus',
      variant: 'danger'
    })
    if (!isConfirmed) return
    const { error } = await supabase.from('chat_messages').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus pesan')
  }

  // ─── Enter key to send ─────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Room Header ── */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-xs font-bold text-slate-800 flex-shrink-0">
          {roomName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">{roomName}</h2>
          <p className="text-[10px] text-slate-600">{messages.length} pesan</p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <SmilePlus className="h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500 text-center">Belum ada pesan di sini.<br/>Jadilah yang pertama memulai diskusi! 👋</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.user_id === userId}
                onReply={(m) => {
                  setReplyTo(m)
                  inputRef.current?.focus()
                }}
                onDelete={handleDelete}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* ── Reply Preview Bar ── */}
      {replyTo && (
        <div className="mx-4 mb-2 flex items-center gap-3 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2">
          <CornerUpLeft className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-blue-600">
              Membalas {replyTo.user?.name ?? 'Pengguna'}
            </p>
            <p className="truncate text-[11px] text-slate-500">{replyTo.body}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="flex-shrink-0 text-slate-500 hover:text-red-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Input Box ── */}
      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={replyTo ? `Balas ${replyTo.user?.name ?? 'Pengguna'}…` : 'Kirim pesan… (Enter untuk kirim, Shift+Enter baris baru)'}
            rows={1}
            className={cn(
              'flex-1 max-h-28 resize-none rounded-2xl border bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all',
              replyTo
                ? 'border-blue-500 focus:ring-1 focus:ring-blue-500/30'
                : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
            )}
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-700">Enter kirim · Shift+Enter baris baru</p>
      </div>
    </div>
  )
}
