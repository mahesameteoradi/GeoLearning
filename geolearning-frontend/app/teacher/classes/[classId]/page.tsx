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
        materials(id, module_id, title, type, content_url, content_text, order, created_at)
      )
    `)
    .eq('id', classId)
    .eq('teacher_id', user.id)
    .single()

  if (error || !cls) redirect('/teacher/classes')

  // Sort materials by created_at descending (newest first)
  const sortedCls = {
    ...cls,
    modules: (cls.modules ?? []).map((mod: {
      id: string
      class_id: string
      title: string
      order: number
      materials: {
        id: string
        module_id: string
        title: string
        type: string
        content_url: string | null
        content_text: string | null
        order: number
        created_at: string
      }[]
    }) => ({
      ...mod,
      materials: [...(mod.materials ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    })),
  }

  return <ClassDetailClient cls={sortedCls as Parameters<typeof ClassDetailClient>[0]['cls']} teacherId={user.id} />
}
