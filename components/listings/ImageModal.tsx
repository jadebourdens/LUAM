'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ImageModalProps {
  image: { image_url: string }
  title: string
  isOpen: boolean
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  currentIndex: number
  totalImages: number
}

export default function ImageModal({
  image, title, isOpen, onClose, onNext, onPrev, currentIndex, totalImages,
}: ImageModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onNext, onPrev])

  if (!isOpen) return null

  return (
<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8 pt-20" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal card */}
      // REPLACE WITH:
<div
 className="relative bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-3xl flex flex-col"
style={{ maxHeight: '85vh' }}
  onClick={(e) => e.stopPropagation()}
>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700 truncate">{title}</p>
          <div className="flex items-center gap-3">
            {totalImages > 1 && (
              <span className="text-xs text-gray-400">{currentIndex + 1} / {totalImages}</span>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold transition-colors">✕</button>
          </div>
        </div>

        {/* Image */}
<div className="relative bg-gray-50" style={{ height: '65vh' }}>
          <Image
            src={image.image_url}
            alt={`${title} - Full size`}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-contain"
            priority
          />
        </div>

        {/* Navigation */}
        {totalImages > 1 && (
          <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-gray-100">
            <button onClick={onPrev} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#FF5722] transition-colors text-lg">‹</button>
            <div className="flex gap-1.5">
              {Array.from({ length: totalImages }).map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? 'bg-[#FF5722]' : 'bg-gray-300'}`} />
              ))}
            </div>
            <button onClick={onNext} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#FF5722] transition-colors text-lg">›</button>
          </div>
        )}
      </div>
    </div>
  )
}