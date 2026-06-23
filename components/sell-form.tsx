'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSizesForCategory } from '@/lib/category-sizes'

interface Category { id: string; name: string; slug: string }

interface Props {
  locale: string
  onSuccess?: () => void
  defaultCategorySlug?: string
  initialData?: any // Added to support Edit mode
}

const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Beige', 'Brown', 'Grey', 'Pink', 'Purple', 'Orange', 'Navy', 'Cream', 'Silver', 'Gold', 'Multi']

export default function ListingForm({ locale, onSuccess, defaultCategorySlug, initialData }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize with initialData if editing
  const [previewUrls, setPreviewUrls] = useState<string[]>(initialData?.images?.map((img: any) => img.image_url) || [])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(initialData?.images?.map((img: any) => img.image_url) || [])
  const [brands, setBrands] = useState<string[]>([])
  const [brandInput, setBrandInput] = useState(initialData?.brand || '')
  const [selectedBrand, setSelectedBrand] = useState(initialData?.brand || '')
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false)
  const brandBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: (initialData?.price_eur || initialData?.price_usd || initialData?.price_vnd || '').toString(),
    currency: initialData?.currency || 'EUR',
    category_id: initialData?.category_id || '',
    condition: initialData?.condition || 'good',
    size: initialData?.size || '',
    color: initialData?.color || '',
  })

  const getAvailableSizes = () => {
    if (!form.category_id) return []
    const matchedCategory = categories.find((c) => c.id === form.category_id)
    if (!matchedCategory) return []
    return getSizesForCategory(matchedCategory.slug)
  }

  const availableSizes = getAvailableSizes()

  useEffect(() => {
    const supabase = createClient()
    supabase.from('categories').select('id, name, slug').is('parent_id', null).then(({ data }) => {
      if (data) {
        setCategories(data)
        if (defaultCategorySlug && !initialData) {
          const match = data.find((c) => c.slug === defaultCategorySlug)
          if (match) setForm((f) => ({ ...f, category_id: match.id }))
        }
      }
    })
    supabase.from('brands').select('name').order('usage_count', { ascending: false }).then(({ data }) => {
      if (data) setBrands(data.map((b) => b.name))
    })
  }, [defaultCategorySlug, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createClient()
    
    const fields = {
      title: form.title,
      description: form.description,
      price_eur: form.currency === 'EUR' ? parseFloat(form.price) : null,
      price_usd: form.currency === 'USD' ? parseFloat(form.price) : null,
      price_vnd: form.currency === 'VND' ? parseFloat(form.price) : null,
      currency: form.currency,
      category_id: form.category_id,
      condition: form.condition,
      brand: selectedBrand || null,
      size: form.size || null,
      color: form.color || null,
    }

    let listingId = initialData?.id
    
    if (initialData) {
      await supabase.from('listings').update(fields).eq('id', initialData.id)
      await supabase.from('listing_images').delete().eq('listing_id', initialData.id)
    } else {
      const { data: user } = await supabase.auth.getUser()
      const { data } = await supabase.from('listings').insert({ ...fields, seller_id: user.user?.id }).select('id').single()
      listingId = data?.id
    }

    if (uploadedUrls.length > 0) {
      await supabase.from('listing_images').insert(
        uploadedUrls.map((url, i) => ({ listing_id: listingId, image_url: url, position: i }))
      )
    }

    setSubmitting(false)
    onSuccess ? onSuccess() : router.push(`/${locale}/listings/${listingId}`)
  }

  // ... (Keep your existing image/brand handlers here)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Your UI code here, exactly as you had it */}
      <button type="submit" disabled={submitting} className="w-full bg-[#FF5722] text-white py-3 rounded-xl font-medium">
        {submitting ? 'Saving...' : initialData ? 'Update listing' : 'Publish listing'}
      </button>
    </form>
  )
}