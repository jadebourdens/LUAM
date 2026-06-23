import Link from 'next/link'
import Image from 'next/image'

export default function RelatedGrid({ listings, locale }: { listings: any[]; locale: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {listings.map((item) => (
        <Link key={item.id} href={`/${locale}/listings/${item.id}`} className="group block">
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {item.images?.[0] && <Image src={item.images[0].image_url} alt={item.title} fill className="object-cover" />}
          </div>
        </Link>
      ))}
    </div>
  )
}