import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateLevel } from '@/lib/utils/level'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { attemptId } = await req.json()
    
    if (!attemptId) {
      return NextResponse.json({ success: false, error: 'attemptId is required' }, { status: 400 })
    }

    // Authenticate the user making the request (ensure they are logged in)
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // We use the service role key to bypass RLS for XP deduction and deletion
    // since the teacher might not have direct write access to users.xp
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Fetch the attempt to get user_id and xp_earned
    const { data: attempt, error: fetchError } = await supabase
      .from('quiz_attempts')
      .select('user_id, xp_earned')
      .eq('id', attemptId)
      .single()
      
    if (fetchError || !attempt) {
      return NextResponse.json({ success: false, error: 'Attempt not found' }, { status: 404 })
    }
    
    // 2. Delete the attempt
    const { error: deleteError } = await supabase
      .from('quiz_attempts')
      .delete()
      .eq('id', attemptId)
      
    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 400 })
    }
    
    // 3. Delete the associated xp_log if any
    await supabase.from('xp_logs').delete().eq('reference_id', attemptId)

    // 4. Deduct XP from the user
    if (attempt.xp_earned > 0) {
      // First, get current XP
      const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('xp')
        .eq('id', attempt.user_id)
        .single()
        
      if (!userFetchError && userData) {
        const newXp = Math.max(0, (userData.xp || 0) - attempt.xp_earned)
        await supabase
          .from('users')
          .update({ 
            xp: newXp,
            level: calculateLevel(newXp)
          })
          .eq('id', attempt.user_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API /api/quizzes/reset error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
