import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Guard: if Supabase env vars are missing, skip auth logic entirely
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[proxy] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Skipping auth middleware.'
    )
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next()

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next()
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session — use getUser for strict validation to avoid infinite redirects
  // between middleware (stale session) and page.tsx (invalid token).
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch (err) {
    console.error('[proxy] supabase.auth.getSession() threw:', err)
    // On error, allow the request through rather than causing a redirect loop
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // ── Auth pages: /login, /register, /auth/* ──────────────────────────────
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/auth')) {
    // If already logged in, redirect away from auth pages to appropriate dashboard
    if (user && (pathname === '/login' || pathname === '/register')) {
      let role = user.user_metadata?.role || 'STUDENT'
      
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role) role = profile.role
      } catch {
        // Ignore errors
      }

      const url = request.nextUrl.clone()
      if (role === 'ADMIN') {
        url.pathname = '/admin'
      } else if (role === 'TEACHER') {
        url.pathname = '/teacher/dashboard'
      } else {
        url.pathname = '/student/dashboard'
      }
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── Root path redirect ─────────────────────────────────────────────────
  if (pathname === '/') {
    if (!user) {
      // Allow root path to render landing page
      return supabaseResponse
    }

    let role = user.user_metadata?.role || 'STUDENT'
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role) role = profile.role
    } catch {
      // Ignore
    }

    const url = request.nextUrl.clone()
    if (role === 'ADMIN') {
      url.pathname = '/admin'
    } else if (role === 'TEACHER') {
      url.pathname = '/teacher/dashboard'
    } else {
      url.pathname = '/student/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // ── Protect /student and /teacher routes ───────────────────────────────
  if (!user && (pathname.startsWith('/student') || pathname.startsWith('/teacher'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
