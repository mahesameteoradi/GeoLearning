import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/student/dashboard'

  const supabase = await createClient()

  // Case: register without email confirmation (session already exists)
  // We skip the code exchange and just check the existing session.
  if (code !== 'already_signed_in') {
    if (!code) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
    }
  }

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  // Check if profile already exists in the `users` table
  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  // ── New user: profile doesn't exist yet ──────────────────────────────────
  if (!profile) {
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

    if (insertError) {
      // If it's a "duplicate key" error, the profile already exists (race condition)
      // In that case, just redirect normally
      if (!insertError.code?.includes('23505')) {
        console.error('[auth/callback] Failed to create user profile:', insertError)
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=profile_create_failed`)
      }
    }

    // New user → redirect to student dashboard
    return NextResponse.redirect(`${origin}/student/dashboard`)
  }

  // ── Existing user: redirect based on role ────────────────────────────────
  if (profile.role === 'TEACHER' || profile.role === 'ADMIN') {
    return NextResponse.redirect(`${origin}/teacher/dashboard`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
