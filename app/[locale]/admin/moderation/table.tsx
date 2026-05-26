'use client'

import Link from 'next/link'

export default function ModerationTable({ reports }: { reports: any[] }) {
  const update = async (reportId: string, status: string) => {
    await fetch('/api/admin/moderation/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status }),
    })
    window.location.reload()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Moderation Queue</h1>
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="bg-white rounded border p-4">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">{r.reason}</p>
                <p className="text-sm text-gray-600">{r.details || 'No details'}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(r.created_at).toLocaleString()} • status: {r.status}</p>
                {r.listing_id && <Link className="text-sm text-[#FF5722]" href={`/listings/${r.listing_id}`}>View listing</Link>}
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <button className="border rounded px-2 py-1" onClick={() => update(r.id, 'reviewed')}>Mark reviewed</button>
                <button className="border rounded px-2 py-1" onClick={() => update(r.id, 'dismissed')}>Dismiss</button>
                <button className="border rounded px-2 py-1" onClick={() => update(r.id, 'action_taken')}>Action taken</button>
              </div>
            </div>
          </div>
        ))}
        {reports.length === 0 && <p className="text-gray-500">No reports yet.</p>}
      </div>
    </div>
  )
}
