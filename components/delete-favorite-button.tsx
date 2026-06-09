'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DeleteFavoriteButton({ favoriteId }: { favoriteId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)
    await supabase.from('favorites').delete().eq('id', favoriteId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors disabled:opacity-40"
      title="Remove from wishlist"
    >
      {loading ? '...' : '🗑️'}
    </button>
  )
}