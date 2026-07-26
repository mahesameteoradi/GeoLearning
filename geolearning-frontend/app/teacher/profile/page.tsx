import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/profile/ProfileClient'

export const dynamic = 'force-dynamic'

export default async function TeacherProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'TEACHER') {
    redirect('/student/dashboard')
  }

  return <ProfileClient userId={user.id} role="TEACHER" />
}
