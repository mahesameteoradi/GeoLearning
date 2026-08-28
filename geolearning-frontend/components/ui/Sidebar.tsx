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
  Loader2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTour } from '@/components/providers/TourProvider'

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
  { label: 'Bank Materi', href: '/teacher/resources',  icon: BookMarked,      emoji: '🗂️' },
  { label: 'Siswa',       href: '/teacher/students',   icon: Users,           emoji: '👩‍🎓' },
  { label: 'Analitik',    href: '/teacher/analytics',  icon: BarChart3,       emoji: '📊' },
  { label: 'Profil Saya', href: '/teacher/profile',    icon: User,            emoji: '👤' },
]

interface SidebarProps {
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  userName: string
  avatarUrl?: string | null
  onNavClick?: () => void
}

export function Sidebar({ role, userName, avatarUrl, onNavClick }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const { startTour } = useTour()

  const isTeacher = role === 'TEACHER'
  const navItems = isTeacher ? teacherNav : studentNav

  // Theme variables
  const sidebarBg = 'bg-[#0B1120]' // Deeper, richer navy for solid contrast
  const sidebarBorder = '1px solid rgba(255,255,255,0.04)'
  const dividerBorder = '1px solid rgba(255,255,255,0.04)'
  const logoText = 'text-white'
  const logoSubText = isTeacher ? 'text-amber-400' : 'text-blue-400'
  
  const activeBg = isTeacher 
    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_4px_16px_-4px_rgba(245,158,11,0.4)] border border-amber-400/20' 
    : 'bg-gradient-to-r from-blue-600 to-blue-600 text-white shadow-[0_4px_16px_-4px_rgba(37,99,235,0.4)] border border-blue-400/20'
  const inactiveBg = 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 border border-transparent'
  const iconActiveText = 'text-white drop-shadow-sm'
  const iconHoverText = isTeacher ? 'group-hover:text-amber-300' : 'group-hover:text-blue-300'
  const activeDotBg = 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]'
  
  const helpBtnText = 'text-slate-400'
  const helpBtnHoverBg = 'hover:bg-slate-800/50 hover:text-slate-100'
  const helpBtnBorder = 'border-slate-500'
  
  const avatarGradient = isTeacher ? 'linear-gradient(135deg, #F59E0B, #EA580C)' : 'linear-gradient(135deg, #3B82F6, #6366F1)'
  const userBg = 'bg-slate-800/30 border border-slate-700/50 shadow-inner backdrop-blur-md'
  const userNameColor = 'text-slate-100'
  
  const logoutText = 'text-slate-400 hover:bg-rose-500/15 hover:text-rose-400'
  
  const collapseBg = 'bg-[#1e293b]'
  const collapseText = 'text-slate-400 hover:text-white'
  const collapseBorderColor = '#334155'
  const collapseShadow = 'rgba(0,0,0,0.5)'

  useEffect(() => {
    const supabase = createClient()
    
    // Initial fetch
    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        
      if (count !== null) setUnreadCount(count)
    }
    
    fetchCount()

    // Realtime subscription
    let isMounted = true
    let channel: any
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !isMounted) return
      channel = supabase
        .channel(`sidebar_notifications_${Math.random()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => {
            fetchCount() // refetch on any insert/update/delete
          }
        )
        .subscribe()
    })

    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col transition-[width] duration-200',
        sidebarBg,
        collapsed ? 'w-[60px]' : 'w-60'
      )}
      style={{ borderRight: sidebarBorder }}
    >
      {/* ── Logo ── */}
      <div className="flex h-14 items-center gap-2.5 overflow-hidden px-3.5" style={{ borderBottom: dividerBorder }}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl shadow-sm overflow-hidden"
          style={{ backgroundColor: 'white', border: sidebarBorder }}>
          <img src="/logo.png" alt="GeoLearning Logo" className="h-full w-full object-cover" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className={cn(logoText, "whitespace-nowrap text-sm font-extrabold leading-none")}>
              GeoLearning
            </span>
            <span className={cn(logoSubText, "text-[9px] font-medium leading-tight")}>
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
              id={'tour-nav-' + href.split('/').pop()}
              onClick={onNavClick}
              title={collapsed ? label : undefined}
              className={cn(
                'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95',
                active ? activeBg : inactiveBg
              )}
            >
              {collapsed ? (
                <span className="text-base leading-none transition-transform duration-200 group-hover:scale-110">{emoji}</span>
              ) : (
                <>
                  <Icon className={cn('h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110', active ? iconActiveText : `text-slate-400 ${iconHoverText}`)} />
                  <span className="truncate">{label}</span>
                  {active && (
                    <div className={`ml-auto h-1.5 w-1.5 rounded-full flex-shrink-0 ${activeDotBg}`} />
                  )}
                  {label === 'Notifikasi' && unreadCount > 0 && !active && (
                    <div className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white flex-shrink-0">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── User + Logout ── */}
      <div className="px-2 py-3 space-y-1" style={{ borderTop: dividerBorder }}>
        {!collapsed && (
          <div className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-slate-800/40 cursor-pointer active:scale-[0.98]", userBg)}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white shadow-md ring-2 ring-slate-700/50"
              style={{ background: avatarGradient }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
              ) : (
                userName?.charAt(0)?.toUpperCase() ?? '?'
              )}
            </div>
            <p className={cn("flex-1 min-w-0 truncate text-xs font-semibold", userNameColor)}>{userName}</p>
          </div>
        )}

        <button
          onClick={() => {
            let key = `dashboard_${role.toLowerCase()}`
            if (pathname.match(/\/classes\/[a-zA-Z0-9_-]+/)) {
              key = `class_detail_${role.toLowerCase()}_v3`
            } else if (pathname.includes('/classes')) {
              key = `classes_${role.toLowerCase()}`
            } else if (pathname.includes('/quizzes')) {
              key = `quizzes_${role.toLowerCase()}`
            } else if (pathname.includes('/projects')) {
              key = `projects_${role.toLowerCase()}`
            } else if (pathname.includes('/students')) {
              key = `students_${role.toLowerCase()}`
            } else if (pathname.includes('/analytics')) {
              key = `analytics_${role.toLowerCase()}`
            }
            
            startTour(key)
          }}
          title="Bantuan Tutorial"
          className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all id-tour-help", helpBtnText, helpBtnHoverBg)}
        >
          <span className={cn("flex items-center justify-center h-4 w-4 rounded-full border text-[10px] font-bold", helpBtnBorder)}>?</span>
          {!collapsed && <span>Bantuan Tutorial</span>}
        </button>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Keluar"
          className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all", logoutText, isLoggingOut && "opacity-70 cursor-not-allowed")}
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 flex-shrink-0" />
          )}
          {!collapsed && <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>}
        </button>
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn("absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full transition-all hover:scale-110", collapseBg, collapseText)}
        style={{ border: `1.5px solid ${collapseBorderColor}`, boxShadow: `0 1px 4px ${collapseShadow}` }}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  )
}
