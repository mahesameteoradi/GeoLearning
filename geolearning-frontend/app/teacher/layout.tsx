import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/ui/Sidebar'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, role, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'STUDENT') {
    redirect(profile?.role === 'STUDENT' ? '/student/dashboard' : '/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar role={profile.role} userName={profile.name} avatarUrl={profile.avatar_url} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
