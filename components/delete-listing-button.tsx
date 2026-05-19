'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteListingButton({
  listingId,
  title,
  redirectTo,
  className,
}: {
  listingId: string
  title: string
  redirectTo?: string
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Delete "${title}"? This hides it from buyers. You can't undo from the UI.`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/listings/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error || 'Failed to delete')
        setLoading(false)
        return
      }
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.refresh()
      }
    } catch (e: any) {
      alert(e.message || 'Failed to delete')
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className={
        className ??
        'text-xs text-stone-500 hover:text-red-600 disabled:opacity-50'
      }
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  )
}
