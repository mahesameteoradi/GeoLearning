import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentLayoutClient } from './StudentLayoutClient'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, name, role, avatar_url')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    // If the user's Auth account is older than 5 minutes, they were likely hard-deleted from public.users
    // but their Auth account was left behind due to a previous bug. We should not recreate their profile.
    const createdAt = new Date(user.created_at).getTime()
    if (Date.now() - createdAt > 5 * 60 * 1000) {
      // User is an orphan Auth account. Force logout.
      await supabase.auth.signOut()
      redirect('/login?error=orphan_account')
    }

    // Profile missing — attempt to create it (handles race condition after registration)
    const displayName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split('@')[0] ??
      'Student'

    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      name: displayName,
      email: user.email ?? '',
      role: 'STUDENT',
      xp: 0,
      level: 1,
      updated_at: new Date().toISOString(),
    })

    if (!insertError) {
      // Profile created successfully — refresh to pick up the new profile
      redirect('/student/dashboard')
    }

    // If error code is "23505" (unique_violation), profile was just created
    // by a concurrent request — just redirect back to let it retry
    if (insertError.code === '23505') {
      redirect('/student/dashboard')
    }

    // For RLS errors or other failures, log and show error
    console.error('[StudentLayout] Could not create profile:', insertError?.message, insertError?.code)

    // Don't sign out the user — instead show an informative redirect
    // They may still be able to access the app after Supabase RLS is configured
    redirect('/login?error=profile_not_found')
  }

  // Redirect teachers/admins to their dashboard
  if (profile.role === 'TEACHER' || profile.role === 'ADMIN') {
    redirect('/teacher/dashboard')
  }

  return (
    <StudentLayoutClient userId={profile.id} userName={profile.name} avatarUrl={profile.avatar_url}>
      {children}
    </StudentLayoutClient>
  )
}
