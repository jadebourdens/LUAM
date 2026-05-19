'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PostReview({ sellerId, orderId }: { sellerId: string; orderId: string }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('reviews').insert({
        reviewer_id: user.id,
        seller_id: sellerId,
        order_id: orderId,
        rating,
        comment
      })
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded mt-4">
      <h3 className="font-bold mb-2">Leave a Review</h3>
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full mb-2 p-2 border">
        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
      </select>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Your experience..." className="w-full mb-2 p-2 border" />
      <button disabled={loading} className="bg-[#FF5722] text-white px-4 py-2 rounded">Submit</button>
    </form>
  )
}
