import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { userId, pinId, mapTitle, pinTitle, xpAmount: rawXpAmount } = await req.json()

    // Using service role key to bypass RLS and perform admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if this user already discovered this pin
    const { data: existingLog } = await supabase
      .from('xp_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('source', 'MAP_PIN_DISCOVERY')
      .eq('reference_id', pinId)
      .single()

    if (existingLog) {
      return NextResponse.json({ success: true, isNew: false, message: 'Already discovered' })
    }

    // Insert XP log (skip if xpAmount is 0)
    const xpAmount = typeof rawXpAmount === 'number' ? rawXpAmount : 5

    if (xpAmount <= 0) {
      return NextResponse.json({ success: true, isNew: true, xpEarned: 0 })
    }
    const { error: logError } = await supabase.from('xp_logs').insert({
      user_id: userId,
      amount: xpAmount,
      source: 'MAP_PIN_DISCOVERY',
      reference_id: pinId,
    })

    if (logError) {
      throw logError
    }

    // Note: We need to also add an entry into notifications for the achievement
    const { error: notifError } = await supabase.from('notifications').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      message: `Berhasil menemukan: ${pinTitle} di peta ${mapTitle}`,
      type: 'ACHIEVEMENT',
      metadata: { xp: xpAmount },
      updated_at: new Date().toISOString()
    })
    
    if (notifError) {
      console.warn('Silently fail notification:', notifError)
    }

    // Update User XP in users table
    const { data: userData } = await supabase
      .from('users')
      .select('xp')
      .eq('id', userId)
      .single()

    if (userData) {
      await supabase
        .from('users')
        .update({ xp: userData.xp + xpAmount })
        .eq('id', userId)
    }

    return NextResponse.json({ success: true, isNew: true, xpEarned: xpAmount })
  } catch (error: any) {
    console.error('API /api/maps/discover-pin error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
