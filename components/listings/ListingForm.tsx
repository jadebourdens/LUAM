'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Currency, ListingCondition } from '@/types/database'

interface Category { id: string; name: string; slug: string }

const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Beige', 'Brown', 'Grey', 'Pink', 'Purple', 'Orange', 'Navy', 'Cream', 'Silver', 'Gold', 'Multi']

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

export default function ListingForm({ locale, initialData }: { locale: string, initialData?: any }) {
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

  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: (initialData?.price_usd || initialData?.price_vnd || '').toString(),
    currency: initialData?.currency || 'USD' as Currency,
    category_id: initialData?.category_id || '',
    condition: initialData?.condition || 'good' as ListingCondition,
    size: initialData?.size || '',
    color: initialData?.color || '',
    is_handcrafted: initialData?.is_handcrafted || false,
    is_artisanal: initialData?.is_artisanal || false,
  })

  const getAvailableSizes = () => {
    if (!form.category_id) return []
    const matchedCategory = categories.find((c) => c.id === form.category_id)
    if (!matchedCategory) return []
    return SIZE_OPTIONS_BY_CATEGORY[matchedCategory.slug] || []
  }

  const availableSizes = getAvailableSizes()

  useEffect(() => {
    supabase.from('categories').select('id, name, slug').is('parent_id', null).then(({ data }) => {
      if (data) setCategories(data)
    })
    supabase.from('brands').select('name').order('usage_count', { ascending: false }).limit(50).then(({ data }) => {
      if (data) setBrands(data.map((b) => b.name))
    })
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
        .from('listing-images')
        .upload(fileName, file)

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`)
        setUploading(false)
        return
      }

      const { data: publicData } = supabase.storage.from('listing-images').getPublicUrl(fileName)
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
      
      // Price validation: must be positive number
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error('Price must be a positive number')
      }
      
      const payload = {
        title: form.title,
        description: form.description,
        currency: form.currency,
        condition: form.condition,
        is_handcrafted: form.is_handcrafted,
        is_artisanal: form.is_artisanal,
        category_id: form.category_id || null,
        size: form.size || null,
        color: form.color || null,
        brand: selectedBrand || null,
        price_usd: form.currency === 'USD' ? priceNum : priceNum / 25000,
        price_vnd: form.currency === 'VND' ? priceNum : priceNum * 25000,
      }

      if (initialData) {
        const { error } = await supabase
          .from('listings')
          .update(payload)
          .eq('id', initialData.id)

        if (error) throw error

        // Handle image updates atomically: verify delete before insert
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

          // Insert new images only after successful delete
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
          .insert([{ ...payload, user_id: user.id }])
          .select()
          .single()

        if (error) throw error

        // Insert images with error handling
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
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 mb-8 text-sm">Complete all fields marked with * to list your item</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
            <span className="mr-3 text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Core Details Section */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200">Core Details</h2>
            
            <div className="space-y-4">
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
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
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
                    <option value="USD">USD</option>
                    <option value="VND">VND</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200">Specifications</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Size</label>
                  <select
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    disabled={!form.category_id}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">Select size</option>
                    {availableSizes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
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

              <div className="space-y-3 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_handcrafted}
                    onChange={(e) => setForm({ ...form, is_handcrafted: e.target.checked })}
                    className="w-4 h-4 rounded border border-gray-300 text-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                  <span className="text-sm font-medium text-gray-700">Handcrafted</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_artisanal}
                    onChange={(e) => setForm({ ...form, is_artisanal: e.target.checked })}
                    className="w-4 h-4 rounded border border-gray-300 text-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                  <span className="text-sm font-medium text-gray-700">Artisanal</span>
                </label>
              </div>
            </div>
          </div>

          {/* Visuals Section */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200">Visuals</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Images</label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-white hover:bg-gray-50 hover:border-orange-400 transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
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

          {/* Action Buttons */}
          <div className="flex justify-between gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 px-6 py-3 bg-[#FF5722] text-white font-semibold rounded-lg hover:bg-[#E64A19] disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
            >
              {saving ? 'Saving...' : 'Save Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
