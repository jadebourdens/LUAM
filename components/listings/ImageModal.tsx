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
  image,
  title,
  isOpen,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  totalImages,
}: ImageModalProps) {
  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
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
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold z-10"
      >
        ✕
      </button>

      {/* Main image container */}
      <div className="relative w-full h-full flex items-center justify-center max-w-4xl">
        <div
          className="relative w-full aspect-square cursor-zoom-in"
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <Image
            src={image.image_url}
            alt={`${title} - Full size`}
            fill
            sizes="90vw"
            className={`object-contain transition-transform ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            priority
          />
        </div>
      </div>

      {/* Navigation arrows */}
      {totalImages > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 text-4xl font-bold z-10 p-2"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 text-4xl font-bold z-10 p-2"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}

      {/* Image counter */}
      {totalImages > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
          {currentIndex + 1} / {totalImages}
        </div>
      )}

      {/* Zoom hint */}
      <div className="absolute bottom-4 right-4 text-white text-xs bg-black/60 px-3 py-2 rounded">
        Click to {isZoomed ? 'zoom out' : 'zoom in'}
      </div>
    </div>
  )
}
