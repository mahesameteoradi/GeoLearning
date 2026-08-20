import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { ClassDetailClient } from '@/components/teacher/ClassDetailClient'

export const metadata: Metadata = {
  title: 'GeoLearning — Detail Kelas',
  description: 'Kelola materi dan konten kelas',
}

export default async function TeacherClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const { classId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch class with modules and materials — verify ownership
  const { data: cls, error } = await supabase
    .from('classes')
    .select(`
      id, name, description, join_code,
      modules(
        id, class_id, title, order,
        materials(id, module_id, title, type, content_url, content_text, order, is_published, created_at),
        quizzes(id, module_id, title, time_limit, xp_reward, passing_score, order, is_published, created_at, quiz_type, max_attempts)
      )
    `)
    .eq('id', classId)
    .eq('teacher_id', user.id)
    .single()

  if (error || !cls) redirect('/teacher/classes')

  // Sort materials and quizzes by order
  const sortedCls = {
    ...cls,
    modules: (cls.modules ?? []).map((mod: any) => ({
      ...mod,
      materials: [...(mod.materials ?? [])].sort((a, b) => a.order - b.order),
      quizzes: [...(mod.quizzes ?? [])].sort((a, b) => a.order - b.order),
    })),
  }

  return <ClassDetailClient cls={sortedCls as Parameters<typeof ClassDetailClient>[0]['cls']} teacherId={user.id} />
}
