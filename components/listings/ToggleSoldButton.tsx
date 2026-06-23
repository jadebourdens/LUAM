'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ToggleSoldButton({
  listingId,
  currentStatus,
}: {
  listingId: string
  currentStatus?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isSold = currentStatus === 'sold'

  const handleToggle = async () => {
    setLoading(true)
    const res = await fetch('/api/listings/toggle-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    })
    setLoading(false)
    if (res.ok) {
      router.refresh() // reloads the page data so the SOLD badge updates instantly
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to update')
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="w-full py-2.5 rounded-lg border text-sm font-medium"
    >
      {loading ? 'Updating…' : isSold ? 'Mark as available' : 'Mark as sold'}
    </button>
  )
}