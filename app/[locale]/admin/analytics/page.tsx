import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AnalyticsDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminUserId = process.env.ADMIN_USER_ID
  if (!adminUserId || user.id !== adminUserId) {
    return <div className="p-8">Forbidden</div>
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  const events = ['listing_view', 'favorite_click', 'message_seller', 'checkout_start', 'checkout_success']

  const counts: Record<string, { day: number; week: number; month: number }> = {}

  for (const ev of events) {
    const { count: dayCount } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', ev)
      .gte('created_at', oneDayAgo)

    const { count: weekCount } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', ev)
      .gte('created_at', sevenDaysAgo)

    const { count: monthCount } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', ev)
      .gte('created_at', thirtyDaysAgo)

    counts[ev] = { day: dayCount || 0, week: weekCount || 0, month: monthCount || 0 }
  }

  const funnelLabels: Record<string, string> = {
    listing_view: 'Listing Views',
    favorite_click: 'Favorite Clicks',
    message_seller: 'Message Seller',
    checkout_start: 'Checkout Started',
    checkout_success: 'Checkout Success',
  }

  const funnelColors: Record<string, string> = {
    listing_view: 'bg-orange-100 text-[#E64A19]',
    favorite_click: 'bg-pink-100 text-pink-800',
    message_seller: 'bg-purple-100 text-purple-800',
    checkout_start: 'bg-orange-100 text-orange-800',
    checkout_success: 'bg-green-100 text-green-800',
  }

  const topViews = counts['listing_view'].month || 1

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {events.map((ev) => (
          <div key={ev} className={`rounded-lg p-4 ${funnelColors[ev]}`}>
            <p className="font-semibold text-lg">{funnelLabels[ev]}</p>
            <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
              <div><p className="font-bold text-xl">{counts[ev].day}</p><p>24h</p></div>
              <div><p className="font-bold text-xl">{counts[ev].week}</p><p>7d</p></div>
              <div><p className="font-bold text-xl">{counts[ev].month}</p><p>30d</p></div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4">Funnel (30 days)</h2>
      <div className="space-y-3">
        {events.map((ev, i) => {
          const pct = Math.round((counts[ev].month / topViews) * 100)
          const prevCount = i > 0 ? counts[events[i - 1]].month : 0
          const dropoff = i > 0 && prevCount > 0 ? Math.round(((prevCount - counts[ev].month) / prevCount) * 100) : null
          return (
            <div key={ev}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{funnelLabels[ev]}</span>
                <span>{counts[ev].month} ({pct}%){dropoff !== null ? ` · ${dropoff}% drop` : ''}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-5">
                <div
                  className={`h-5 rounded-full ${funnelColors[ev].split(' ')[0]}`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 text-xs text-gray-500">
        Data queried live from analytics_events table. Refresh page for latest.
      </div>
    </div>
  )
}
