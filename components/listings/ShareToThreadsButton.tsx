'use client'
type ShareToThreadsButtonProps = {
  listing: {
    id: string
    title: string
  }
  locale: string
}

export default function ShareToThreadsButton({ listing, locale }: ShareToThreadsButtonProps) {
  const handleShare = () => {
    const listingUrl = `https://luam.shop/${locale}/listings/${listing.id}`
    const text = `${listing.title} — found on Luam 🛍️\n${listingUrl}`
    window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`, '_blank')
  }
  return (
    <button onClick={handleShare} className="w-full py-2.5 rounded-lg border text-sm">
      Share on Threads
    </button>
  )
}