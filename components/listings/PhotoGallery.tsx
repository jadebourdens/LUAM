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

  const sortedImages = [...(images || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

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

  const SoldOverlay = ({ large = false }: { large?: boolean }) => (
    isSold ? (
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
        <span className={`text-white font-bold ${large ? 'text-4xl' : 'text-sm'}`}>SOLD</span>
      </div>
    ) : null
  )

  // Reusable tile: wrapper handles sizing, Image uses fill (no conflicting styles)
  const ImageTile = ({
    src,
    alt,
    index,
    sizes,
    large = false,
    overlay,
    priority = false,
  }: {
    src: string
    alt: string
    index: number
    sizes: string
    large?: boolean
    overlay?: React.ReactNode
    priority?: boolean
  }) => (
    <div
      className="relative w-full h-full bg-gray-200 overflow-hidden cursor-pointer hover:opacity-90 transition rounded-xl"
      onClick={() => handleImageClick(index)}
    >
      <SoldOverlay large={large} />
      {/* position:relative on wrapper + fill on Image is the correct Next.js pattern */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        priority={priority}
      />
      {overlay}
    </div>
  )

  // ─── Single image ────────────────────────────────────────────────────────────
  if (sortedImages.length === 1) {
    return (
      <>
        <div className="w-full h-[500px]">
          <ImageTile
            src={sortedImages[0].image_url}
            alt={`${title} - Primary`}
            index={0}
            sizes="100vw"
            large
            priority
          />
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

  // ─── Multi-image: collage layout ─────────────────────────────────────────────
  // Hero (~65% wide, full height) + right column with up to 2 stacked thumbnails
  const heroImage = sortedImages[0]
  const rest = sortedImages.slice(1)
  const maxRight = 2
  const displayRight = rest.slice(0, maxRight)
  const hiddenCount = rest.length - maxRight

  return (
    <>
      <div className="flex gap-2 h-[500px]">

        {/* Hero */}
        <div className="relative flex-[2]">
          <ImageTile
            src={heroImage.image_url}
            alt={`${title} - Primary`}
            index={0}
            sizes="65vw"
            large
            priority
          />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-2 flex-1">
          {displayRight.map((img, idx) => {
            const globalIndex = idx + 1
            const isLast = idx === displayRight.length - 1
            const showPlusOverlay = isLast && hiddenCount > 0

            return (
              <div key={img.image_url + idx} className="relative flex-1">
                <ImageTile
                  src={img.image_url}
                  alt={`${title} - Photo ${globalIndex + 1}`}
                  index={globalIndex}
                  sizes="35vw"
                  priority={idx === 0}
                  overlay={
                    showPlusOverlay ? (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center z-10">
                        <span className="text-white font-bold text-2xl">+{hiddenCount}</span>
                      </div>
                    ) : undefined
                  }
                />
              </div>
            )
          })}
        </div>
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