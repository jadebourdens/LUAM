import type { Listing } from '@/types/database'

export function formatPrice(listing: Pick<Listing, 'currency' | 'price_vnd' | 'price_usd'>): string {
  switch (listing.currency) {
    case 'VND':
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(listing.price_vnd ?? 0)
    
    case 'USD':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(listing.price_usd ?? 0)
      
    default:
      return '—'
  }
}