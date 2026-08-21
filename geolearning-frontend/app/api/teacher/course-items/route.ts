import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateLevel } from '@/lib/utils/level'

export async function POST(req: Request) {
  try {
    const { id, type } = await req.json()

    if (!id || !type) {
      return NextResponse.json({ success: false, error: 'Missing id or type' }, { status: 400 })
    }

    // Using service role key to bypass RLS and perform admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let itemIds: string[] = []

    if (type === 'module') {
      // Find all quizzes and materials inside this module
      const [quizzesRes, materialsRes] = await Promise.all([
        supabase.from('quizzes').select('id').eq('module_id', id),
        supabase.from('materials').select('id').eq('module_id', id)
      ])
      
      const qIds = quizzesRes.data?.map(q => q.id) || []
      const mIds = materialsRes.data?.map(m => m.id) || []
      itemIds = [...qIds, ...mIds]
    } else {
      itemIds = [id]
    }

    if (itemIds.length > 0) {
      // Find all XP logs related to these items
      const { data: xpLogs } = await supabase
        .from('xp_logs')
        .select('id, user_id, amount')
        .in('reference_id', itemIds)

      if (xpLogs && xpLogs.length > 0) {
        // Aggregate XP deductions per user
        const userDeductions = xpLogs.reduce((acc, log) => {
          acc[log.user_id] = (acc[log.user_id] || 0) + log.amount
          return acc
        }, {} as Record<string, number>)

        // Update users
        for (const [userId, deductionAmount] of Object.entries(userDeductions)) {
          // Get current XP
          const { data: userData } = await supabase
            .from('users')
            .select('xp')
            .eq('id', userId)
            .single()

          if (userData) {
            const newXp = Math.max(0, userData.xp - deductionAmount)
            await supabase
              .from('users')
              .update({
                xp: newXp,
                level: calculateLevel(newXp)
              })
              .eq('id', userId)
          }
        }

        // Delete XP logs
        const xpLogIds = xpLogs.map(log => log.id)
        await supabase
          .from('xp_logs')
          .delete()
          .in('id', xpLogIds)
      }
    }

    // Delete the actual item
    let tableName = ''
    if (type === 'quiz') tableName = 'quizzes'
    else if (type === 'material') tableName = 'materials'
    else if (type === 'module') tableName = 'modules'
    else return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })

    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API /api/teacher/course-items error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
