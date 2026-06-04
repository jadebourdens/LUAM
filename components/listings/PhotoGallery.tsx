'use client'

import { useState } from 'react'
import Image from 'next/image'
import ImageModal from './ImageModal'

interface Photo {
  image_url: string
  position: number
}

interface PhotoGalleryProps {
  images: Photo[]
  title: string
  isSold: boolean
}

export default function PhotoGallery({ images, title, isSold }: PhotoGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const sortedImages = [...(images || [])].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))

  if (sortedImages.length === 0) {
    return (
      <div className="relative w-full h-[500px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
        No image
      </div>
    )
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setIsModalOpen(true)
  }

  const handleNextImage = () => {
    setSelectedImageIndex((selectedImageIndex + 1) % sortedImages.length)
  }

  const handlePrevImage = () => {
    setSelectedImageIndex((selectedImageIndex - 1 + sortedImages.length) % sortedImages.length)
  }

  // Multi-image: hero (left) + thumbnails (right) filling space
  const heroImage = sortedImages[0]
  const thumbnails = sortedImages.slice(1)
  const maxThumbnails = 4
  const showOverlay = thumbnails.length > maxThumbnails
  const displayThumbnails = thumbnails.slice(0, maxThumbnails)
  const remainingCount = thumbnails.length - maxThumbnails

  const renderThumbnailGrid = () => {
    if (displayThumbnails.length === 0) return null

    if (displayThumbnails.length === 1) {
      return (
        <div className="h-full">
          <div
            className="relative h-full bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition"
            onClick={() => handleImageClick(1)}
          >
            {isSold && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><span className="text-white text-sm font-bold">SOLD</span></div>}
            <Image src={displayThumbnails[0].image_url} alt={`${title} - Thumbnail 1`} fill sizes="25vw" className="object-cover" priority />
          </div>
        </div>
      )
    }

    if (displayThumbnails.length === 2) {
      return (
        <div className="grid grid-rows-2 gap-2 h-full">
          {displayThumbnails.map((img, idx) => (
            <div key={idx} className="relative bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition" onClick={() => handleImageClick(idx + 1)}>
              {isSold && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><span className="text-white text-xs font-bold">SOLD</span></div>}
              <Image src={img.image_url} alt={`${title} - Thumbnail ${idx + 2}`} fill sizes="25vw" className="object-cover" priority={idx === 0} />
            </div>
          ))}
        </div>
      )
    }

    if (displayThumbnails.length === 3) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
          <div className="row-span-2 col-span-1 relative bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition" onClick={() => handleImageClick(1)}>
            {isSold && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><span className="text-white text-xs font-bold">SOLD</span></div>}
            <Image src={displayThumbnails[0].image_url} alt={`${title} - Thumbnail 1`} fill sizes="12vw" className="object-cover" priority />
          </div>
          {displayThumbnails.slice(1).map((img, idx) => (
            <div key={idx + 1} className="relative bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition" onClick={() => handleImageClick(idx + 2)}>
              {isSold && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><span className="text-white text-xs font-bold">SOLD</span></div>}
              <Image src={img.image_url} alt={`${title} - Thumbnail ${idx + 2}`} fill sizes="12vw" className="object-cover" priority={idx === 0} />
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
        {displayThumbnails.map((img, idx) => (
          <div key={idx} className="relative bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition" onClick={() => handleImageClick(idx + 1)}>
            {isSold && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><span className="text-white text-xs font-bold">SOLD</span></div>}
            <Image src={img.image_url} alt={`${title} - Thumbnail ${idx + 2}`} fill sizes="12vw" className="object-cover" priority={idx === 0} />
            {showOverlay && idx === displayThumbnails.length - 1 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-lg">+{remainingCount}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className={`grid ${sortedImages.length > 1 ? 'grid-cols-3' : 'grid-cols-1'} gap-4 h-[500px]`}>
        {/* Hero Image */}
        <div className={sortedImages.length > 1 ? 'col-span-2' : 'col-span-1'}>
          <div
            className="relative w-full h-full bg-gray-200 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition"
            onClick={() => handleImageClick(0)}
          >
            {isSold && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <span className="text-white text-4xl font-bold">SOLD</span>
              </div>
            )}
            <Image
              src={heroImage.image_url}
              alt={`${title} - Primary`}
              fill
              sizes={sortedImages.length > 1 ? "66vw" : "100vw"}
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Thumbnail Grid */}
        {sortedImages.length > 1 && (
          <div className="col-span-1">
            {renderThumbnailGrid()}
          </div>
        )}
      </div>

      <ImageModal
        image={sortedImages[selectedImageIndex]}
        title={title}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
        currentIndex={selectedImageIndex}
        totalImages={sortedImages.length}
      />
    </>
  )
}
