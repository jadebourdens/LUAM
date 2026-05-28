'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

export default function EditProfilePage() {
  const t = useTranslations('Profile')
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) ?? 'en'
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    location: '',
    bio: '',
    phone: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/auth/login`); return }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, username, location, bio, phone, avatar_url, bank_name, bank_account_number, bank_account_name')
        .eq('id', user.id)
        .single()

      if (data) {
        setForm({
          full_name: data.full_name || '',
          username: data.username || '',
          location: data.location || '',
          bio: data.bio || '',
          phone: data.phone || '',
          bank_name: data.bank_name || '',
          bank_account_number: data.bank_account_number || '',
          bank_account_name: data.bank_account_name || '',
        })
        setAvatarUrl(data.avatar_url || null)
      }
      setLoading(false)
    }
    load()
  }, [locale, router, supabase])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('File is too large. Maximum size is 5MB.'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError(null)
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }

    let newAvatarUrl = avatarUrl

    if (avatarFile) {
      try {
        const ext = avatarFile.name.split('.').pop() || 'jpg'
        const fileName = `${user.id}/avatar.${ext}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
        newAvatarUrl = publicUrl
      } catch (err: any) {
        setError('Failed to upload avatar: ' + err.message)
        setSaving(false)
        return
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ...form, avatar_url: newAvatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      alert(t('success'))
      router.push(`/${locale}/profile`)
      router.refresh()
    }

    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center">{t('loading')}</div>

  const displayAvatar = avatarPreview || avatarUrl

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('title')}</h1>

        {error && <p className="text-red-600 mb-4 text-sm bg-red-50 p-3 rounded">{error}</p>}

        <form onSubmit={onSave} className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-all border-2 border-dashed border-orange-300"
            >
              {displayAvatar ? (
                <img src={displayAvatar} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <span className="text-5xl text-[#FF5722]">{form.full_name?.[0] || '👤'}</span>
              )}
            </div>
            <div>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-[#FF5722] hover:underline font-medium">
                {t('change_photo')}
              </button>
              <p className="text-xs text-gray-400 mt-1">{t('photo_hint')}</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          {/* Personal info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('full_name')}</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('username')}</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('location')}</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('bio')}</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>

          {/* Bank account section */}
          <div className="border-t pt-5">
            <h2 className="text-base font-semibold text-gray-900 mb-1">{t('bank_section')}</h2>
            <p className="text-xs text-gray-400 mb-4">{t('bank_hint')}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('bank_name')}</label>
                <select
  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
  value={form.bank_name}
  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
>
  <option value="">-- Select your bank --</option>
  <option value="Vietcombank">Vietcombank (VCB)</option>
  <option value="Techcombank">Techcombank (TCB)</option>
  <option value="MB Bank">MB Bank</option>
  <option value="Agribank">Agribank</option>
  <option value="BIDV">BIDV</option>
  <option value="VietinBank">VietinBank (CTG)</option>
  <option value="ACB">ACB</option>
  <option value="Sacombank">Sacombank</option>
  <option value="VPBank">VPBank</option>
  <option value="TPBank">TPBank</option>
  <option value="SHB">SHB</option>
  <option value="HDBank">HDBank</option>
  <option value="OCB">OCB</option>
  <option value="SeABank">SeABank</option>
  <option value="LienVietPostBank">LienVietPostBank</option>
  <option value="NCB">NCB</option>
  <option value="VIB">VIB</option>
  <option value="Eximbank">Eximbank</option>
  <option value="Nam A Bank">Nam A Bank</option>
  <option value="Bac A Bank">Bac A Bank</option>
  <option value="Cake by VPBank">Cake by VPBank</option>
  <option value="Timo">Timo</option>
  <option value="ZaloPay">ZaloPay</option>
  <option value="MoMo">MoMo</option>
</select>
              </div>

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bank_account_number')}</label>
  <input
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
    placeholder="0123456789"
    value={form.bank_account_number}
    onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
  />
  <p className="text-xs text-orange-500 mt-1">⚠️ Double-check your account number carefully. Buyers will transfer money directly to this account. Wrong numbers cannot be reversed.</p>
</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('bank_account_name')}</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="NGUYEN VAN A"
                  value={form.bank_account_name}
                  onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="bg-[#FF5722] text-white px-6 py-2.5 rounded-lg hover:bg-[#E64A19] disabled:opacity-60 font-medium">
              {saving ? t('saving') : t('save')}
            </button>
            <button type="button" onClick={() => router.push(`/${locale}/profile`)} className="border border-gray-200 px-6 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}