'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ListingForm from '@/components/listings/ListingForm'

export default function ListingFormWrapper({ locale }: { locale: string }) {
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
      isOpen={isOpen} 
      onOpenChange={handleOpenChange}
    />
  )
}
