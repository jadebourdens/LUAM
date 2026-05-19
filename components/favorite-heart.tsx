'use client'

import { useEffect, useState } from 'react'

type Props = {
  listingId: string
  isAuthenticated: boolean
}

const storageKey = 'guest_favorites'

export default function FavoriteHeart({ listingId, isAuthenticated }: Props) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(storageKey)
    const ids: string[] = raw ? JSON.parse(raw) : []
    setActive(ids.includes(listingId))
  }, [listingId])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const raw = localStorage.getItem(storageKey)
    const ids: string[] = raw ? JSON.parse(raw) : []
    const next = ids.includes(listingId) ? ids.filter((id) => id !== listingId) : [...ids, listingId]
    localStorage.setItem(storageKey, JSON.stringify(next))
    setActive(next.includes(listingId))

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName: 'favorite_click', listingId, metadata: { active: next.includes(listingId), guest: !isAuthenticated } }),
    })

    if (isAuthenticated) {
      await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
    }
  }

  return (
    <button
      onClick={toggle}
      className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full w-9 h-9 flex items-center justify-center shadow"
      aria-label="Toggle favorite"
      title={active ? 'Saved' : 'Save'}
    >
      <span className={active ? 'text-red-500' : 'text-gray-500'}>{active ? '♥' : '♡'}</span>
    </button>
  )
}
