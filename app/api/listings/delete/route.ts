import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    // Soft delete: set status='deleted'. RLS already restricts UPDATE to seller_id = auth.uid().
    const { error } = await supabase
      .from('listings')
      .update({ status: 'deleted' })
      .eq('id', listingId)
      .eq('seller_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    revalidatePath('/profile')
    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete listing' }, { status: 500 })
  }
}
