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

    const role = user.user_metadata?.role || 'STUDENT'
    const nis = user.user_metadata?.nis_nip || null

    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      name: displayName,
      email: user.email ?? '',
      role: role,
      xp: 0,
      level: 1,
      nis_nip: nis,
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

    // If teacher, record the invitation code usage
    if (role === 'TEACHER' && user.user_metadata?.invitation_code) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/record-invitation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            code: user.user_metadata.invitation_code,
          }),
        });
      } catch (err) {
        console.error('[auth/callback] Failed to record invitation code:', err);
      }
    }

    // New user → redirect to appropriate dashboard
    if (role === 'ADMIN') {
      return NextResponse.redirect(`${origin}/admin`)
    } else if (role === 'TEACHER') {
      return NextResponse.redirect(`${origin}/teacher/dashboard`)
    }
    return NextResponse.redirect(`${origin}/student/dashboard`)
  }

  // ── Existing user: redirect based on role ────────────────────────────────
  if (profile.role === 'ADMIN') {
    return NextResponse.redirect(`${origin}/admin`)
  }
  if (profile.role === 'TEACHER') {
    return NextResponse.redirect(`${origin}/teacher/dashboard`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
