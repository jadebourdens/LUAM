// components/sellers/seller-review-card.tsx

import Image from 'next/image'
import { Star } from 'lucide-react'
import { Review } from '@/types/database'

interface Props {
  review: Review
}

export default function SellerReviewCard({ review }: Props) {
  const reviewer = review.reviewer
  const displayName = reviewer?.full_name || reviewer?.username || 'Anonymous'
  const date = new Date(review.created_at).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-100">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-stone-100 shrink-0">
          {reviewer?.avatar_url ? (
            <Image src={reviewer.avatar_url} alt={displayName} width={36} height={36} className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm font-semibold">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-stone-800 truncate">{displayName}</p>
            <span className="text-xs text-stone-400 shrink-0 ml-2">{date}</span>
          </div>
          <div className="flex mt-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`}
              />
            ))}
          </div>
        </div>
      </div>
      {review.comment && (
        <p className="mt-3 text-sm text-stone-600 leading-relaxed line-clamp-3">
          {review.comment}
        </p>
      )}
    </div>
  )
}