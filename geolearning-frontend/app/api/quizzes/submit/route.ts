import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { attemptId, userId, score, xpEarned, finalAnswers, accessToken } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
    if (xpEarned > 0 && accessToken) {
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
            xpAmount: xpEarned,
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
