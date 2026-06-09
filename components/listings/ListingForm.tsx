'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Currency, ListingCondition } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

interface Category { 
  id: string
  name: string
  slug: string
  children?: Category[]
}

const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Beige', 'Brown', 'Grey', 'Pink', 'Purple', 'Orange', 'Navy', 'Cream', 'Silver', 'Gold', 'Multi']

const CATEGORY_ICONS: Record<string, string> = {
  women: '👗',
  men: '👔',
  kids: '🧸',
  home: '🏠',
  'art-collectibles': '🎨',
}

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
  'home': ['One size'],
  'home-textiles': ['One size'],
  'home-furniture': ['One size'],
  'home-lighting': ['One size'],
  'home-kitchen': ['One size'],
  'home-decor': ['One size'],
  'art-collectibles': ['One size'],
}

const STATIC_CATEGORIES = [
  {
    slug: 'women',
    label: { en: 'Women', vi: 'Nữ' },
    children: [
      { slug: 'women-clothes', label: { en: 'Clothes', vi: 'Quần áo' } },
      { slug: 'women-shoes', label: { en: 'Shoes', vi: 'Giày dép' } },
      { slug: 'women-bags', label: { en: 'Bags', vi: 'Túi xách' } },
      { slug: 'women-accessories', label: { en: 'Accessories / Watches / Jewelry', vi: 'Phụ kiện / Đồng hồ / Trang sức' } },
    ],
  },
  {
    slug: 'men',
    label: { en: 'Men', vi: 'Nam' },
    children: [
      { slug: 'men-clothes', label: { en: 'Clothes', vi: 'Quần áo' } },
      { slug: 'men-shoes', label: { en: 'Shoes', vi: 'Giày dép' } },
      { slug: 'men-bags', label: { en: 'Bags', vi: 'Túi xách' } },
      { slug: 'men-accessories', label: { en: 'Accessories / Watches / Jewelry', vi: 'Phụ kiện / Đồng hồ / Trang sức' } },
    ],
  },
  {
    slug: 'kids',
    label: { en: 'Kids', vi: 'Trẻ em' },
    children: [
      { slug: 'kids-clothes', label: { en: 'Clothes', vi: 'Quần áo' } },
      { slug: 'kids-shoes', label: { en: 'Shoes', vi: 'Giày dép' } },
      { slug: 'kids-bags', label: { en: 'Bags', vi: 'Túi xách' } },
      { slug: 'kids-games', label: { en: 'Games', vi: 'Đồ chơi' } },
    ],
  },
  {
    slug: 'home',
    label: { en: 'Home', vi: 'Nhà cửa' },
    children: [
      { slug: 'home-textiles', label: { en: 'Textiles & Bedding', vi: 'Vải & Chăn ga' } },
      { slug: 'home-furniture', label: { en: 'Furniture', vi: 'Nội thất' } },
      { slug: 'home-lighting', label: { en: 'Lighting', vi: 'Đèn' } },
      { slug: 'home-kitchen', label: { en: 'Kitchen & Dining', vi: 'Bếp & Ăn uống' } },
      { slug: 'home-decor', label: { en: 'Decor', vi: 'Trang trí' } },
    ],
  },
  {
    slug: 'art-collectibles',
    label: { en: 'Art & Collectibles', vi: 'Nghệ thuật & Sưu tầm' },
    children: [],
  },
]

interface ListingFormProps {
  locale: string
  initialData?: any
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function ListingForm({ locale, initialData, isOpen = true, onOpenChange }: ListingFormProps) {
  const t = useTranslations('EditListing')
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [brandInput, setBrandInput] = useState(initialData?.brand || '')
  const [selectedBrand, setSelectedBrand] = useState(initialData?.brand || '')
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false)
  const [brandIsFromSuggestions, setBrandIsFromSuggestions] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<string[]>(initialData?.images?.map((img: any) => img.image_url) || [])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(initialData?.images?.map((img: any) => img.image_url) || [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [priceDisplay, setPriceDisplay] = useState(
  initialData?.price_vnd
    ? initialData.price_vnd.toLocaleString('vi-VN')
    : initialData?.price_usd
    ? initialData.price_usd.toLocaleString('en-US')
    : ''
)

  // ✅ FIXED: moved here from inside handleSubmit
  const [exchangeRate, setExchangeRate] = useState(26300)

  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: (initialData?.price_usd || initialData?.price_vnd || '').toString(),
    currency: initialData?.currency || 'VND' as Currency,
    category_id: initialData?.category_id || '',
    condition: initialData?.condition || 'good' as ListingCondition,
    sizes: (initialData?.sizes ?? []) as string[],
    color: initialData?.color || '',
  })

  const getAvailableSizes = () => {
    if (!form.category_id) return []
    const matchedCategory = categories.find((c) => c.id === form.category_id)
    if (!matchedCategory) return []
    return SIZE_OPTIONS_BY_CATEGORY[matchedCategory.slug] || []
  }

  const availableSizes = getAvailableSizes()

  useEffect(() => {
    supabase.from('categories').select('id, name, slug').then(({ data }) => {
      if (data) setCategories(data)
    })
    supabase.from('brands').select('name').order('usage_count', { ascending: false }).limit(50).then(({ data }) => {
      if (data) setBrands(data.map((b) => b.name))
    })
  }, [])

  // ✅ FIXED: moved here from inside handleSubmit
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data?.rates?.VND) setExchangeRate(data.rates.VND)
      })
      .catch(() => {})
  }, [])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    const newPreviewUrls: string[] = []
    const newUploadedUrls: string[] = []

    for (const file of files) {
      const preview = URL.createObjectURL(file)
      newPreviewUrls.push(preview)

      const fileName = `${Date.now()}-${file.name}`
      const { data, error: uploadError } = await supabase.storage
        .from('listings')
        .upload(fileName, file)

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`)
        setUploading(false)
        return
      }

      const { data: publicData } = supabase.storage.from('listings').getPublicUrl(fileName)
      newUploadedUrls.push(publicData.publicUrl)
    }

    setPreviewUrls([...previewUrls, ...newPreviewUrls])
    setUploadedUrls([...uploadedUrls, ...newUploadedUrls])
    setUploading(false)
  }

  const removeImage = (index: number) => {
    setPreviewUrls(previewUrls.filter((_, i) => i !== index))
    setUploadedUrls(uploadedUrls.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer?.files || [])
    if (files.length === 0) return
    
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      setError('Please drop image files only')
      return
    }
    
    const input = fileInputRef.current
    if (input) {
      const dataTransfer = new DataTransfer()
      imageFiles.forEach(file => dataTransfer.items.add(file))
      input.files = dataTransfer.files
      
      const event = new Event('change', { bubbles: true })
      input.dispatchEvent(event)
    }
  }

  const handleBrandInput = (value: string) => {
    setBrandInput(value)
    setSelectedBrand(value)
    setBrandIsFromSuggestions(false)
    setShowBrandSuggestions(value.length > 0)
  }

  const selectBrand = (brand: string) => {
    setSelectedBrand(brand)
    setBrandInput(brand)
    setBrandIsFromSuggestions(true)
    setShowBrandSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const priceNum = parseFloat(form.price)
      
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error('Price must be a positive number')
      }

      // ✅ exchangeRate is now from component state — no hooks needed here
      const payload = {
        title: form.title,
        description: form.description,
        currency: form.currency,
        condition: form.condition,
        category_id: form.category_id || null,
        color: form.color || null,
        brand: selectedBrand || null,
        price_usd: form.currency === 'USD' ? priceNum : priceNum / exchangeRate,
        price_vnd: form.currency === 'VND' ? priceNum : priceNum * exchangeRate,
      }

      if (initialData) {
        const { error } = await supabase
          .from('listings')
          .update(payload)
          .eq('id', initialData.id)

        if (error) throw error

        if (uploadedUrls.length > 0) {
          const existingImageIds = initialData.images?.map((img: any) => img.id) || []
          
          if (existingImageIds.length > 0) {
            const { error: deleteError } = await supabase
              .from('listing_images')
              .delete()
              .in('id', existingImageIds)
            
            if (deleteError) {
              throw new Error(`Failed to remove old images: ${deleteError.message}`)
            }
          }

          for (let i = 0; i < uploadedUrls.length; i++) {
            const { error: insertError } = await supabase
              .from('listing_images')
              .insert({
                listing_id: initialData.id,
                image_url: uploadedUrls[i],
                position: i,
              })
            
            if (insertError) {
              throw new Error(`Failed to save image ${i + 1}: ${insertError.message}`)
            }
          }
        }

        router.push(`/${locale}/listings/${initialData.id}`)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not found')

        const { data, error } = await supabase
          .from('listings')
          .insert([{ ...payload, seller_id: user.id }])
          .select()
          .single()

        if (error) throw error

        if (uploadedUrls.length > 0) {
          for (let i = 0; i < uploadedUrls.length; i++) {
            const { error: insertError } = await supabase
              .from('listing_images')
              .insert({
                listing_id: data.id,
                image_url: uploadedUrls[i],
                position: i,
              })
            
            if (insertError) {
              throw new Error(`Failed to save image ${i + 1}: ${insertError.message}`)
            }
          }
        }

        router.push(`/${locale}/listings/${data.id}`)
      }
      
      if (onOpenChange) onOpenChange(false)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            Complete all fields marked with * to list your item
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
            <span className="mr-3 text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Core Details Section */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">Core Details</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Vintage Leather Jacket"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your item in detail..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price *</label>
                  <input
  type="text"
  required
  value={priceDisplay}
  onChange={(e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    const num = raw === '' ? '' : parseInt(raw, 10)
    setPriceDisplay(num === '' ? '' : Number(num).toLocaleString('vi-VN'))
    setForm({ ...form, price: num.toString() })
  }}
  placeholder="0"
  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Currency *</label>
                  
<select
  value={form.currency}
  onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}
  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors cursor-pointer"
>
  <option value="VND">VND</option>
  <option value="USD">USD</option>
</select>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">Specifications</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {STATIC_CATEGORIES.map((parent) => {
                    const matchedParent = categories.find((c) => c.slug === parent.slug)
                    
                    if (!parent.children || parent.children.length === 0) {
                      return (
                        <option key={parent.slug} value={matchedParent?.id || parent.slug}>
                          {CATEGORY_ICONS[parent.slug] || '📦'} {parent.label.en}
                        </option>
                      )
                    }
                    
                    return (
                      <optgroup key={parent.slug} label={`${CATEGORY_ICONS[parent.slug] || '📦'} ${parent.label.en}`}>
                        {parent.children.map((child) => {
                          const matchedCategory = categories.find((c) => c.slug === child.slug)
                          return (
                            <option key={child.slug} value={matchedCategory?.id || child.slug}>
                              → {child.label.en}
                            </option>
                          )
                        })}
                      </optgroup>
                    )
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
                  <select
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors cursor-pointer"
                  >
                    <option value="">Select color</option>
                    {COLORS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Sizes available
                    {!form.category_id && <span className="text-gray-400 font-normal ml-1">(select a category first)</span>}
                  </label>
                  {availableSizes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((s) => {
                        const selected = form.sizes.includes(s)
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setForm(prev => ({
                              ...prev,
                              sizes: selected
                                ? prev.sizes.filter(x => x !== s)
                                : [...prev.sizes, s]
                            }))}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              selected
                                ? 'bg-[#FF5722] text-white border-[#FF5722]'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-[#FF5722]'
                            }`}
                          >
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 py-2">—</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand</label>
                <div className="relative">
                  <input
                    type="text"
                    value={brandInput}
                    onChange={(e) => handleBrandInput(e.target.value)}
                    onFocus={() => brandInput.length > 0 && setShowBrandSuggestions(true)}
                    placeholder="Search or type brand name"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                  />
                  {selectedBrand && !brandIsFromSuggestions && (
                    <div className="mt-2 text-xs text-amber-600 flex items-center">
                      <span className="mr-1">ⓘ</span> Brand not in our list (will be saved as new)
                    </div>
                  )}
                  {showBrandSuggestions && brandInput.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-md z-10 max-h-48 overflow-y-auto">
                      {brands
                        .filter((b) => b.toLowerCase().includes(brandInput.toLowerCase()))
                        .slice(0, 10)
                        .map((brand) => (
                          <div
                            key={brand}
                            onClick={() => selectBrand(brand)}
                            className="px-4 py-2.5 hover:bg-orange-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            {brand}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Condition</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value as ListingCondition })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors cursor-pointer"
                >
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="worn">Worn</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visuals Section */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">Visuals</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Images</label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-white hover:bg-gray-50 hover:border-orange-400 transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {uploading ? 'Uploading images...' : 'Drag & drop images here or click to select'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                </div>
              </div>

              {previewUrls.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">{previewUrls.length} image(s) selected</p>
                  <div className="grid grid-cols-4 gap-3">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative group">
                        <img 
                          src={url} 
                          alt={`Preview ${i}`} 
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:border-orange-400 transition-colors" 
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className="pt-4 border-t border-gray-200">
          <DialogClose asChild>
            <button
              type="button"
              className="flex-1 px-6 py-3 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </DialogClose>
          <button
            type="submit"
            disabled={saving || uploading}
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-[#FF5722] text-white font-semibold rounded-lg hover:bg-[#E64A19] disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
          >
            {saving ? 'Saving...' : 'Save Listing'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}