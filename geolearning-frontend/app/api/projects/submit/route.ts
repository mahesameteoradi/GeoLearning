import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { submissionId, isEditing, assignmentId, userId, fileUrl, notes, groupMembersData } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (submissionId && isEditing) {
      // UPDATE existing submission
      const { error } = await supabase
        .from('project_submissions')
        .update({
          file_url: fileUrl,
          notes: notes,
          group_members: groupMembersData,
          submitted_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .eq('user_id', userId) // Ensure they own it

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }
    } else {
      // CREATE new submission
      const { error } = await supabase.from('project_submissions').insert({
        assignment_id: assignmentId,
        user_id: userId,
        file_url: fileUrl,
        notes: notes,
        group_members: groupMembersData,
      })
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API /api/projects/submit error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const submissionId = searchParams.get('submissionId')
    const userId = searchParams.get('userId')

    if (!submissionId || !userId) {
      return NextResponse.json({ success: false, error: 'Missing IDs' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Delete submission ensuring user owns it
    const { error } = await supabase
      .from('project_submissions')
      .delete()
      .eq('id', submissionId)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API /api/projects/delete error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
