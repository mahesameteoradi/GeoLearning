import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { attemptId, userId, score, xpEarned, finalAnswers, accessToken } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First, fetch the current attempt to get the quiz_id
    const { data: currentAttempt, error: fetchError } = await supabase
      .from('quiz_attempts')
      .select('quiz_id')
      .eq('id', attemptId)
      .single()
      
    if (fetchError || !currentAttempt) {
      return NextResponse.json({ success: false, error: 'Attempt not found' }, { status: 404 })
    }
    
    // Find previous max XP for this quiz by this user
    const { data: previousAttempts } = await supabase
      .from('quiz_attempts')
      .select('xp_earned')
      .eq('quiz_id', currentAttempt.quiz_id)
      .eq('user_id', userId)
      .not('id', 'eq', attemptId)
      .not('completed_at', 'is', null)
      
    let maxPreviousXp = 0
    if (previousAttempts && previousAttempts.length > 0) {
      maxPreviousXp = Math.max(...previousAttempts.map(a => a.xp_earned || 0))
    }

    // Calculate how much NEW xp should be awarded
    const newXpToAward = Math.max(0, xpEarned - maxPreviousXp)

    // Update the attempt record
    const { error: updateError } = await supabase
      .from('quiz_attempts')
      .update({
        score,
        xp_earned: xpEarned,
        answers: finalAnswers,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .eq('user_id', userId)

    if (updateError) {
      console.error("Supabase update error:", updateError)
      return NextResponse.json({ success: false, error: updateError.message || updateError }, { status: 400 })
    }

    // Call gamification backend to award XP and unlock badges
    if (newXpToAward > 0 && accessToken) {
      try {
        const { count } = await supabase
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('completed_at', 'is', null)

        await fetch(process.env.NEXT_PUBLIC_API_URL + '/gamification/award-xp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            userId,
            xpAmount: newXpToAward,
            quizAttemptId: attemptId,
            quizScore: score,
            isFirstQuiz: count === 1
          })
        })
      } catch (err) {
        console.error('Failed to trigger gamification:', err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API /api/quizzes/submit error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
