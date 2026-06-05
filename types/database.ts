export type Currency = 'EUR' | 'USD' | 'VND'

export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'worn'

export type ListingStatus = 'draft' | 'active' | 'sold' | 'reserved' | 'deleted'

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export interface Profile {
  id: string
  email: string
  username?: string
  full_name?: string
  brand_name?: string | null
  avatar_url?: string
  bio?: string
  location?: string
  phone?: string
  stripe_account_id?: string
  stripe_onboarding_complete: boolean
  rating_average: number
  rating_count: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string
  created_at: string
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description?: string
  price_eur?: number
  price_usd?: number
  price_vnd?: number
  currency: Currency
  category_id?: string
  size?: string
  condition?: ListingCondition
  brand?: string
  color?: string
  is_handcrafted?: boolean
  is_artisanal?: boolean
  status: ListingStatus
  view_count: number
  favorite_count: number
  created_at: string
  updated_at: string
  seller?: Profile
  category?: Category
  images?: ListingImage[]
}

export interface ListingImage {
  id: string
  listing_id: string
  image_url: string
  position: number
  created_at: string
}

export interface Order {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  amount: number
  currency: Currency
  platform_fee: number
  stripe_payment_intent_id?: string
  stripe_transfer_id?: string
  status: OrderStatus
  shipping_address?: {
    name: string
    line1: string
    line2?: string
    city: string
    postal_code: string
    country: string
    phone: string
  }
  tracking_number?: string
  created_at: string
  updated_at: string
  listing?: Listing
  buyer?: Profile
  seller?: Profile
}

export interface Message {
  id: string
  listing_id?: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  sender?: Profile
  receiver?: Profile
}

export interface Conversation {
  id: string
  listing_id?: string
  buyer_id: string
  seller_id: string
  last_message_at: string
  created_at: string
  listing?: Listing
  buyer?: Profile
  seller?: Profile
  last_message?: Message
}

export interface Review {
  id: string
  order_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  created_at: string
  reviewer?: Profile
  order?: Order
}

export interface Favorite {
  id: string
  user_id: string
  listing_id: string
  created_at: string
  listing?: Listing
}
