import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ModerationTable from './table'

export default async function ModerationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminUserId = process.env.ADMIN_USER_ID
  if (!adminUserId || user.id !== adminUserId) {
    return <div className="p-8">Forbidden</div>
  }

  const { data: reports } = await supabase
    .from('reports')
    .select('id, reason, details, status, created_at, listing_id, reporter_user_id, reported_user_id')
    .order('created_at', { ascending: false })

  return <ModerationTable reports={reports || []} />
}
