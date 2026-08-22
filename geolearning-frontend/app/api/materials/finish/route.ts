import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateLevel } from '@/lib/utils/level'

export async function POST(req: Request) {
  try {
    const { userId, materialId, materialTitle, materialType } = await req.json()

    // Using service role key to bypass RLS and perform admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if already completed to prevent farming XP
    const { data: existing } = await supabase
      .from('material_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('material_id', materialId)
      .single()

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already completed' })
    }

    // Insert completion
    const { error: completionError } = await supabase
      .from('material_completions')
      .insert({
        user_id: userId,
        material_id: materialId,
      })

    if (completionError) {
      if (completionError.code === '23505') {
        // Unique constraint violation (23505) means a concurrent request already inserted it
        return NextResponse.json({ success: true, message: 'Already completed (concurrent)' })
      }
      return NextResponse.json({ success: false, error: completionError }, { status: 400 })
    }

    // Fetch material's XP reward from database (set by teacher)
    const { data: materialData } = await supabase
      .from('materials')
      .select('xp_reward')
      .eq('id', materialId)
      .single()

    const xpAmount = materialData?.xp_reward ?? 0
    let earnedBadges: any[] = []
    
    if (xpAmount > 0) {
      await supabase.from('xp_logs').insert({
        user_id: userId,
        amount: xpAmount,
        source: 'MATERIAL_READ',
        reference_id: materialId
      })

      // Update User XP
      const { data: userData } = await supabase
        .from('users')
        .select('xp, current_streak')
        .eq('id', userId)
        .single()

      if (userData) {
        const newXp = userData.xp + xpAmount
        const newLevel = calculateLevel(newXp)
        await supabase
          .from('users')
          .update({ 
            xp: newXp,
            level: newLevel
          })
          .eq('id', userId)

        // Evaluate Badges Synchrously
        const { checkAndAwardBadges } = await import('@/lib/utils/badges')
        earnedBadges = await checkAndAwardBadges(supabase, userId, {
          xp: newXp,
          level: newLevel,
          currentStreak: userData.current_streak || 0
        })
      }
    }

    return NextResponse.json({ success: true, xpEarned: xpAmount, earnedBadges })
  } catch (error: any) {
    console.error('API /api/materials/finish error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
