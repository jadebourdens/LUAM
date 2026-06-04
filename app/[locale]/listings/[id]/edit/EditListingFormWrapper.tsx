'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ListingForm from '@/components/listings/ListingForm'

export default function EditListingFormWrapper({ 
  locale, 
  initialData 
}: { 
  locale: string
  initialData: any 
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      router.back()
    }
  }

  return (
    <ListingForm 
      locale={locale} 
      initialData={initialData}
      isOpen={isOpen} 
      onOpenChange={handleOpenChange}
    />
  )
}
