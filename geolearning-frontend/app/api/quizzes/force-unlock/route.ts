import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { quizId, studentId } = await req.json()
    if (!quizId || !studentId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    // Verify teacher owns the class of this quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        id, module_id, class_id,
        classes(teacher_id)
      `)
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 })
    }
    
    // Type assertion for nested join
    const classData = Array.isArray(quiz.classes) ? quiz.classes[0] : quiz.classes as { teacher_id: string } | null
    if (classData?.teacher_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (!quiz.module_id) {
      return NextResponse.json({ success: false, error: 'Kuis ini tidak terikat pada modul manapun' }, { status: 400 })
    }

    // Get current module order
    const { data: currentModule, error: moduleError } = await supabase
      .from('modules')
      .select('order, class_id')
      .eq('id', quiz.module_id)
      .single()

    if (moduleError || !currentModule) {
      return NextResponse.json({ success: false, error: 'Modul tidak ditemukan' }, { status: 404 })
    }

    // Get next module
    const { data: nextModules, error: nextError } = await supabase
      .from('modules')
      .select('id')
      .eq('class_id', currentModule.class_id)
      .gt('order', currentModule.order)
      .order('order', { ascending: true })
      .limit(1)

    if (nextError || !nextModules || nextModules.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada bab selanjutnya' }, { status: 400 })
    }

    const nextModuleId = nextModules[0].id

    // Insert into module_unlocks
    const { error: insertError } = await supabase
      .from('module_unlocks')
      .upsert({
        user_id: studentId,
        module_id: nextModuleId
      }, { onConflict: 'user_id, module_id' })

    if (insertError) {
      console.error('Insert module_unlock error:', insertError)
      return NextResponse.json({ success: false, error: 'Gagal membuka bab selanjutnya' }, { status: 500 })
    }

    return NextResponse.json({ success: true, nextModuleId })

  } catch (error: any) {
    console.error('Force unlock error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
