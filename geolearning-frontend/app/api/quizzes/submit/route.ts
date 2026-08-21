import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { attemptId, userId, finalAnswers, accessToken } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch the current attempt and its quiz details
    const { data: currentAttempt, error: fetchError } = await supabase
      .from('quiz_attempts')
      .select('quiz_id, quiz:quizzes(xp_reward, questions(*))')
      .eq('id', attemptId)
      .single()
      
    if (fetchError || !currentAttempt || !currentAttempt.quiz) {
      return NextResponse.json({ success: false, error: 'Attempt or Quiz not found' }, { status: 404 })
    }
    
    // Server-side Score and XP Calculation
    let correct = 0
    let totalXp = 0
    let maxTotalPoints = 0
    
    const quizData = Array.isArray(currentAttempt.quiz) ? currentAttempt.quiz[0] : currentAttempt.quiz;
    const questions = quizData.questions || []
    
    const defaultPointsPerQuestion = questions.length > 0 && quizData.xp_reward 
      ? Math.max(1, Math.round(quizData.xp_reward / questions.length))
      : 100

    for (const q of questions) {
      const qPoints = q.points ?? defaultPointsPerQuestion
      maxTotalPoints += qPoints

      if (q.type === 'MAP_PINPOINT') {
        try {
          const answerObj = JSON.parse(finalAnswers[q.id] || '{}')
          if (answerObj.score > 0) {
            correct++
            totalXp += (answerObj.score || 0)
          }
        } catch (e) {}
      } else {
        if (finalAnswers[q.id] === q.correct_answer) {
          correct++
          totalXp += qPoints
        }
      }
    }
    
    const rawScore = maxTotalPoints > 0 ? (totalXp / maxTotalPoints) * 100 : 0
    const serverScore = Math.round(rawScore)
    const serverXpEarned = Math.round(totalXp)

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
    const newXpToAward = Math.max(0, serverXpEarned - maxPreviousXp)

    // Update the attempt record
    const { error: updateError } = await supabase
      .from('quiz_attempts')
      .update({
        score: serverScore,
        xp_earned: serverXpEarned,
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

        // Await the fetch so that gamification (XP, level up, badges) finishes and real-time events are broadcasted before returning.
        const gamificationRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/gamification/award-xp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            userId,
            xpAmount: newXpToAward,
            quizAttemptId: attemptId,
            quizScore: serverScore,
            isFirstQuiz: count === 1
          })
        });
        
        if (!gamificationRes.ok) {
          console.error('Gamification backend failed:', await gamificationRes.text());
        }
      } catch (err) {
        console.error('Failed to query quiz count for gamification:', err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API /api/quizzes/submit error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
