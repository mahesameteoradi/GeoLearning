'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  MessageSquare,
  Bell,
  Users,
  BookMarked,
  BarChart3,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  emoji?: string
}

const studentNav: NavItem[] = [
  { label: 'Dashboard',    href: '/student/dashboard',    icon: LayoutDashboard, emoji: '🏠' },
  { label: 'Kelas Saya',   href: '/student/classes',      icon: BookOpen,        emoji: '📚' },
  { label: 'Kuis',         href: '/student/quizzes',      icon: ClipboardList,   emoji: '✏️' },
  { label: 'Tugas Proyek', href: '/student/projects',     icon: BookMarked,      emoji: '📁' },
  { label: 'Notifikasi',   href: '/student/notifications',icon: Bell,            emoji: '🔔' },
  { label: 'Profil Saya',  href: '/student/profile',      icon: User,            emoji: '👤' },
]

const teacherNav: NavItem[] = [
  { label: 'Dashboard',   href: '/teacher/dashboard',  icon: LayoutDashboard, emoji: '🏠' },
  { label: 'Kelas Saya',  href: '/teacher/classes',    icon: BookMarked,      emoji: '📖' },
  { label: 'Kuis',        href: '/teacher/quizzes',    icon: ClipboardList,   emoji: '📝' },
  { label: 'Tugas Proyek',href: '/teacher/projects',   icon: BookMarked,      emoji: '📁' },
  { label: 'Siswa',       href: '/teacher/students',   icon: Users,           emoji: '👩‍🎓' },
  { label: 'Analitik',    href: '/teacher/analytics',  icon: BarChart3,       emoji: '📊' },
  { label: 'Profil Saya', href: '/teacher/profile',    icon: User,            emoji: '👤' },
]

interface SidebarProps {
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  userName: string
  avatarUrl?: string | null
}

export function Sidebar({ role, userName, avatarUrl }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  const navItems = role === 'TEACHER' ? teacherNav : studentNav

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col transition-[width] duration-200 bg-white',
        collapsed ? 'w-[60px]' : 'w-60'
      )}
      style={{ borderRight: '1px solid #E2E8F0' }}
    >
      {/* ── Logo ── */}
      <div className="flex h-14 items-center gap-2.5 overflow-hidden px-3.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="whitespace-nowrap text-sm font-extrabold text-gradient-primary leading-none">
              GeoLearning
            </span>
            <span className="text-[9px] font-medium text-blue-400 leading-tight">
              Platform Belajar Geografi
            </span>
          </div>
        )}
      </div>

      {/* ── Role chip ── */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest',
            role === 'TEACHER'
              ? 'bg-amber-50 border border-amber-200 text-amber-700'
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          )}>
            {role === 'TEACHER' ? '👨‍🏫 Guru' : '🎓 Siswa'}
          </span>
        </div>
      )}

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon, emoji }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              {collapsed ? (
                <span className="text-base leading-none">{emoji}</span>
              ) : (
                <>
                  <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-600')} />
                  <span className="truncate">{label}</span>
                  {active && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-200 flex-shrink-0" />
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── User + Logout ── */}
      <div className="px-2 py-3 space-y-1" style={{ borderTop: '1px solid #F1F5F9' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 bg-slate-50 border border-slate-200">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-slate-800"
              style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
              ) : (
                userName?.charAt(0)?.toUpperCase() ?? '?'
              )}
            </div>
            <p className="flex-1 min-w-0 truncate text-xs font-semibold text-slate-700">{userName}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          title="Keluar"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-600 transition-all hover:scale-110"
        style={{ border: '1.5px solid #BFDBFE', boxShadow: '0 1px 4px rgba(37,99,235,0.15)' }}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  )
}
