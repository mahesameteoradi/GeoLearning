'use client'

import { useState } from 'react'
import {
  MessageSquare, Pin, Clock, Reply, ChevronDown, ChevronUp,
  Plus, Send, Loader2, Trash2, Globe, BookOpen, User,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { CreatePostModal } from '@/components/teacher/CreatePostModal'
import toast from 'react-hot-toast'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { AnimatedFilterTabs } from '@/components/ui/AnimatedFilterTabs'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ForumReply {
  id: string
  body: string
  created_at: string
  user_id: string
  user: { name: string } | null
}

interface ForumPost {
  id: string
  title: string
  body: string
  is_pinned: boolean
  created_at: string
  user_id: string
  user: { name: string } | null
  class: { id: string; name: string } | null
  replies: ForumReply[]
}

interface ClassOption {
  id: string
  name: string
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  userId,
  onDelete,
  onReplyAdded,
  onReplyDeleted,
}: {
  post: ForumPost
  userId: string
  onDelete: (id: string) => void
  onReplyAdded: (postId: string, reply: ForumReply) => void
  onReplyDeleted: (postId: string, replyId: string) => void
}) {
  const { confirm } = useConfirm()
  const [expanded, setExpanded] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [deletingPost, setDeletingPost] = useState(false)
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null)

  const userName = (post.user as { name: string } | null)?.name ?? 'Guru'
  const cls = post.class as { id: string; name: string } | null

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('forum_replies')
        .insert({ post_id: post.id, user_id: user.id, body: replyText.trim() })
        .select('id, body, created_at, user_id, user:users!forum_replies_user_id_fkey(name)')
        .single()

      if (error) throw new Error(error.message)
      toast.success('Balasan terkirim!')
      setReplyText('')
      onReplyAdded(post.id, data as unknown as ForumReply)
    } catch (err) {
      toast.error('Gagal mengirim balasan')
      console.error(err)
    } finally {
      setSendingReply(false)
    }
  }

  const handleDeletePost = async () => {
    const isConfirmed = await confirm({
      title: 'Hapus Diskusi',
      message: `Hapus post "${post.title}"?`,
      confirmText: 'Ya, Hapus',
      variant: 'danger'
    })
    if (!isConfirmed) return
    setDeletingPost(true)
    const supabase = createClient()
    const { error } = await supabase.from('forum_posts').delete().eq('id', post.id)
    if (!error) {
      toast.success('Post dihapus')
      onDelete(post.id)
    } else {
      toast.error('Gagal menghapus post')
      setDeletingPost(false)
    }
  }

  const handleDeleteReply = async (replyId: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Balasan',
      message: 'Hapus balasan ini?',
      confirmText: 'Ya, Hapus',
      variant: 'danger'
    })
    if (!isConfirmed) return
    setDeletingReplyId(replyId)
    const supabase = createClient()
    const { error } = await supabase.from('forum_replies').delete().eq('id', replyId)
    if (!error) {
      toast.success('Balasan dihapus')
      onReplyDeleted(post.id, replyId)
    } else {
      toast.error('Gagal menghapus balasan')
    }
    setDeletingReplyId(null)
  }

  return (
    <div className={cn(
      'rounded-2xl border transition-all',
      post.is_pinned
        ? 'border-amber-200 bg-amber-50'
        : 'border-slate-200 bg-white'
    )}>
      {/* Post header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {post.is_pinned && (
                <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                  <Pin className="h-2.5 w-2.5" /> Pinned
                </span>
              )}
              {cls ? (
                <span className="flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                  <BookOpen className="h-2.5 w-2.5" /> {cls.name}
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                  <Globe className="h-2.5 w-2.5" /> Semua Kelas
                </span>
              )}
            </div>

            <h3 className="font-semibold text-slate-800">{post.title}</h3>
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{post.body}</p>
          </div>

          {/* Delete post (only post author / teacher) */}
          {post.user_id === userId && (
            <button
              onClick={handleDeletePost}
              disabled={deletingPost}
              title="Hapus post"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deletingPost ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {/* Meta */}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-600">
          <span className="flex items-center gap-1 font-medium text-slate-500">
            <User className="h-3 w-3" /> {userName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: idLocale })}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            <Reply className="h-3 w-3" />
            {post.replies.length} balasan
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Replies section */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
          {/* Existing replies */}
          {post.replies.length > 0 ? (
            <div className="space-y-3">
              {post.replies.map((reply) => {
                const replyUser = (reply.user as { name: string } | null)?.name ?? 'User'
                const isMyReply = reply.user_id === userId
                return (
                  <div key={reply.id} className="flex gap-3 group">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/30 to-blue-500/30 border border-blue-300 text-xs font-bold text-blue-700">
                      {replyUser.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700">{replyUser}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-600">
                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: idLocale })}
                          </span>
                          {isMyReply && (
                            <button
                              onClick={() => handleDeleteReply(reply.id)}
                              disabled={deletingReplyId === reply.id}
                              className="flex h-5 w-5 items-center justify-center rounded text-red-500/50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              {deletingReplyId === reply.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Trash2 className="h-3 w-3" />
                              }
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{reply.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-xs text-slate-600 py-2">Belum ada balasan</p>
          )}

          {/* Reply input */}
          <form onSubmit={handleReply} className="flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tulis balasan..."
              maxLength={1000}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={sendingReply || !replyText.trim()}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TeacherForumClient({
  posts: initialPosts,
  classes,
  userId,
}: {
  posts: ForumPost[]
  classes: ClassOption[]
  userId: string
}) {
  const [posts, setPosts] = useState<ForumPost[]>(initialPosts)
  const [showModal, setShowModal] = useState(false)
  const [filterClassId, setFilterClassId] = useState<string>('all')

  const filteredPosts = posts.filter((p) => {
    if (filterClassId === 'all') return true
    if (filterClassId === 'global') return p.class === null
    return (p.class as { id: string } | null)?.id === filterClassId
  })

  function handlePostCreated(newPost: ForumPost) {
    setPosts((prev) => [newPost, ...prev])
  }

  function handleDeletePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  function handleReplyAdded(postId: string, reply: ForumReply) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, replies: [...p.replies, reply] } : p
      )
    )
  }

  function handleReplyDeleted(postId: string, replyId: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, replies: p.replies.filter((r) => r.id !== replyId) }
          : p
      )
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Class filter */}
        <div className="flex flex-1 min-w-0 overflow-hidden">
          <AnimatedFilterTabs
            activeTab={filterClassId}
            onChange={(tab) => setFilterClassId(tab)}
            options={[
              { id: 'all', label: 'Semua' },
              { id: 'global', label: '🌐 Global' },
              ...classes.map((c) => ({ id: c.id, label: c.name })),
            ]}
            layoutId="forum-class-filter"
          />
        </div>

        {/* New post button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Buat Post
        </button>
      </div>

      {/* Posts list */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
          <MessageSquare className="h-10 w-10 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-500">Belum ada post</p>
          <p className="mt-1 text-xs text-slate-600">Klik "Buat Post" untuk memulai diskusi</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PostCard
                  post={post}
                  userId={userId}
                  onDelete={handleDeletePost}
                  onReplyAdded={handleReplyAdded}
                  onReplyDeleted={handleReplyDeleted}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Post Modal */}
      {showModal && (
        <CreatePostModal
          classes={classes}
          onClose={() => setShowModal(false)}
          onCreated={handlePostCreated as (post: unknown) => void}
          userId={userId}
        />
      )}
    </div>
  )
}
