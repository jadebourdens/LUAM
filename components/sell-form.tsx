'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Category { id: string; name: string; slug: string }

interface Props {
  locale: string
  onSuccess?: () => void
  defaultCategorySlug?: string
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const COLORS = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow',
  'Beige', 'Brown', 'Grey', 'Pink', 'Purple', 'Orange',
  'Navy', 'Cream', 'Silver', 'Gold', 'Multi',
]

// Size options by category
const SIZE_OPTIONS_BY_CATEGORY: Record<string, string[]> = {
  'women': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'women-clothes': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'women-shoes': ['35', '36', '37', '38', '39', '40', '41', '42'],
  'women-bags': ['One size'],
  'women-accessories': ['One size'],
  'men': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  'men-clothes': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  'men-shoes': ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
  'men-bags': ['One size'],
  'men-accessories': ['One size'],
  'kids': ['2', '3', '4', '5', '6', '7', '8', '9', '10'],
  'kids-clothes': ['2', '3', '4', '5', '6', '7', '8', '9', '10'],
  'kids-shoes': ['24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35'],
  'kids-bags': ['One size'],
  'kids-games': ['One size'],
}

export default function SellForm({ locale, onSuccess, defaultCategorySlug }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])

  // Brand combobox state
  const [brandInput, setBrandInput] = useState('')
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'EUR',
    category_id: '',
    condition: 'good',
    size: '',
    color: '',
  })

  // Get available sizes based on selected category
  const getAvailableSizes = () => {
    if (!form.category_id) return []
    const matchedCategory = categories.find((c) => c.id === form.category_id)
    if (!matchedCategory) return []
    const slug = matchedCategory.slug
    return SIZE_OPTIONS_BY_CATEGORY[slug] || []
  }

  const availableSizes = getAvailableSizes()

  useEffect(() => {
    const supabase = createClient()
    
    // Fetch categories
    supabase.from('categories').select('id, name, slug').is('parent_id', null).order('name').then(({ data }) => {
      if (data) {
        setCategories(data)
        if (defaultCategorySlug) {
          const match = data.find((c) => c.slug === defaultCategorySlug)
          if (match) setForm((f) => ({ ...f, category_id: match.id }))
        }
      }
    })

    // Fetch brands from DB
    supabase.from('brands').select('name').order('usage_count', { ascending: false }).then(({ data }) => {
      if (data) {
        setBrands(data.map((b) => b.name))
      }
    })
  }, [defaultCategorySlug])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be logged in to upload images.'); setUploading(false); return }

    const newUrls: string[] = []
    const newPreviews: string[] = []

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('listings').upload(path, file)
      if (uploadError) { setError('Image upload failed: ' + uploadError.message); continue }
      const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(path)
      newUrls.push(publicUrl)
      newPreviews.push(URL.createObjectURL(file))
    }

    setUploadedUrls((prev) => [...prev, ...newUrls])
    setPreviewUrls((prev) => [...prev, ...newPreviews])
    setUploading(false)
  }

  const removeImage = (index: number) => {
    setUploadedUrls((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand)
    setBrandInput(brand)
    setShowBrandSuggestions(false)
  }

  const handleBrandInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrandInput(e.target.value)
    setShowBrandSuggestions(true)
    if (!e.target.value) setSelectedBrand('')
  }

  const filteredBrands = brandInput
    ? brands.filter((b) => b.toLowerCase().includes(brandInput.toLowerCase()))
    : brands.slice(0, 8)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.price || !form.category_id) {
      setError('Please fill in title, price and category.')
      return
    }
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be logged in.'); setSubmitting(false); return }

    // Auto-save new brand if it's not in DB yet
    if (selectedBrand && !brands.includes(selectedBrand)) {
      const { error: brandError } = await supabase.from('brands').insert({ name: selectedBrand, usage_count: 1 })
      // Ignore conflict if brand already exists (race condition)
      if (brandError && brandError.code !== '23505') {
        console.warn('Brand insert warning:', brandError)
      }
    }

    const priceNum = parseFloat(form.price)
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        title: form.title,
        description: form.description,
        price_eur: form.currency === 'EUR' ? priceNum : null,
        price_usd: form.currency === 'USD' ? priceNum : null,
        price_vnd: form.currency === 'VND' ? priceNum : null,
        currency: form.currency,
        category_id: form.category_id,
        condition: form.condition,
        brand: selectedBrand || null,
        size: form.size || null,
        color: form.color || null,
        status: 'active',
      })
      .select('id')
      .single()

    if (listingError || !listing) {
      setError(listingError?.message || 'Failed to create listing.')
      setSubmitting(false)
      return
    }

    if (uploadedUrls.length > 0) {
      await supabase.from('listing_images').insert(
        uploadedUrls.map((url, i) => ({ listing_id: listing.id, image_url: url, position: i }))
      )
    }

    setSubmitting(false)
    if (onSuccess) {
      onSuccess()
    } else {
      router.push(`/${locale}/listings/${listing.id}`)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">Photos</label>
        <div className="flex flex-wrap gap-3">
          {previewUrls.map((url, i) => (
            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-200">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center text-stone-400 hover:border-[#FF5722] hover:text-[#FF5722] transition-colors text-xs gap-1 disabled:opacity-50"
          >
            {uploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Add photo</span>
              </>
            )}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Title <span className="text-red-400">*</span></label>
        <input value={form.title} onChange={set('title')} placeholder="e.g. Vintage leather jacket" className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]" />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
        <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Describe your item..." className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] resize-none" />
      </div>

      {/* Price + Currency */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-700 mb-1">Price <span className="text-red-400">*</span></label>
          <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]" />
        </div>
        <div className="w-28">
          <label className="block text-sm font-medium text-stone-700 mb-1">Currency</label>
          <select value={form.currency} onChange={set('currency')} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]">
            <option value="EUR">EUR €</option>
            <option value="USD">USD $</option>
            <option value="VND">VND ₫</option>
          </select>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Category <span className="text-red-400">*</span></label>
        <select value={form.category_id} onChange={set('category_id')} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]">
          <option value="">Select a category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Condition</label>
        <select value={form.condition} onChange={set('condition')} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]">
          <option value="new">New</option>
          <option value="like_new">Like new</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="worn">Worn</option>
        </select>
      </div>

      {/* Brand / Size / Color */}
      <div className="grid grid-cols-3 gap-3">
        {/* Brand – Creatable Combobox */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Brand</label>
          <div className="relative">
            <input
              type="text"
              value={brandInput}
              onChange={handleBrandInputChange}
              onFocus={() => setShowBrandSuggestions(true)}
              placeholder="Type brand name..."
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
            />
            {showBrandSuggestions && filteredBrands.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredBrands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => handleBrandSelect(brand)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 border-b border-stone-100 last:border-b-0"
                  >
                    {brand}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Size – Context-aware Dropdown */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Size</label>
          <select value={form.size} onChange={set('size')} disabled={!form.category_id || availableSizes.length === 0} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] disabled:bg-stone-100 disabled:text-stone-500 disabled:cursor-not-allowed">
            <option value="">{form.category_id ? 'Select size' : 'Choose category first'}</option>
            {availableSizes.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>

        {/* Color – Fixed Dropdown */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Color</label>
          <select value={form.color} onChange={set('color')} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]">
            <option value="">Select color</option>
            {COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full bg-[#FF5722] text-white py-3 rounded-xl font-medium hover:bg-[#E64A19] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? 'Publishing...' : 'Publish listing'}
      </button>
    </form>
  )
}
