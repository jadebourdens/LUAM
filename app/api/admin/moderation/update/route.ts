import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminUserId = process.env.ADMIN_USER_ID
    if (!adminUserId || user.id !== adminUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { reportId, status } = await req.json()
    if (!reportId || !['open','reviewed','dismissed','action_taken'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { error } = await supabase
      .from('reports')
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', reportId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update report' }, { status: 500 })
  }
}
