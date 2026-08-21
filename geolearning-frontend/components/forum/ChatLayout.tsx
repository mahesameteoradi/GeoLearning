'use client'

import { useState } from 'react'
import { Globe, BookOpen, MessageSquare, Hash } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ChatPanel } from './ChatPanel'

interface Room {
  id: string
  name: string
  type: 'global' | 'class'
}

interface ChatLayoutProps {
  rooms: Room[]
  userId: string
}

export function ChatLayout({ rooms, userId }: ChatLayoutProps) {
  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0]?.id ?? 'global')

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? rooms[0]

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-white">

      {/* ── Sidebar: Room List ── */}
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-slate-200 bg-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-200">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Forum</span>
        </div>

        {/* Room list */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {rooms.map((room) => {
            const isActive = room.id === activeRoomId
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all',
                  isActive
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                )}
              >
                {room.type === 'global' ? (
                  <Globe className={cn('h-3.5 w-3.5 flex-shrink-0', isActive ? 'text-blue-600' : 'text-slate-600')} />
                ) : (
                  <Hash className={cn('h-3.5 w-3.5 flex-shrink-0', isActive ? 'text-blue-600' : 'text-slate-600')} />
                )}
                <span className="truncate">{room.name}</span>
                {room.type === 'global' && (
                  <span className="ml-auto rounded-full border border-green-200 bg-green-50 px-1.5 text-[8px] font-bold uppercase text-green-600">
                    Umum
                  </span>
                )}
              </button>
            )
          })}

          {rooms.filter(r => r.type === 'class').length === 0 && (
            <div className="mt-2 mx-1 rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center">
              <BookOpen className="mx-auto h-5 w-5 text-slate-700 mb-1.5" />
              <p className="text-[10px] text-slate-600 leading-relaxed">
                Belum ada kelas.<br/>Enrol kelas untuk melihat channel kelas di sini.
              </p>
            </div>
          )}
        </nav>

        {/* Footer hint */}
        <div className="px-3 py-3 border-t border-slate-100">
          <p className="text-[9px] text-slate-700 text-center">
            # channel per kelas · 🌐 umum untuk semua
          </p>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 min-w-0">
        {activeRoom ? (
          <ChatPanel
            key={activeRoom.id}
            roomId={activeRoom.id}
            roomName={activeRoom.name}
            userId={userId}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-600">Pilih channel untuk mulai berdiskusi</p>
          </div>
        )}
      </div>
    </div>
  )
}
