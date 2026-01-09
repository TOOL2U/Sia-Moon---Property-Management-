'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react'
import { PropertyImage } from '@/types/property'

interface PropertyImageGalleryProps {
  images: PropertyImage[]
  propertyName: string
  open: boolean
  onClose: () => void
  initialIndex?: number
}

export function PropertyImageGallery({
  images,
  propertyName,
  open,
  onClose,
  initialIndex = 0
}: PropertyImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const currentImage = images[currentIndex]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] bg-neutral-950 border-neutral-800 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white text-xl">
                {propertyName}
              </DialogTitle>
              <p className="text-neutral-400 text-sm mt-1">
                {currentImage?.caption || `Photo ${currentIndex + 1}`}
                {currentImage?.room && ` - ${currentImage.room.replace('_', ' ')}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-sm">
                {currentIndex + 1} / {images.length}
              </span>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Main Image */}
        <div className="relative flex-1 px-6 pb-6">
          <div className="relative h-full bg-neutral-900 rounded-lg overflow-hidden">
            <Image
              src={currentImage?.url || ''}
              alt={currentImage?.caption || `${propertyName} - Photo ${currentIndex + 1}`}
              fill
              className="object-contain"
              priority
            />

            {/* Navigation Buttons */}
            <div className="absolute inset-0 flex items-center justify-between p-4">
              <Button
                onClick={handlePrevious}
                variant="outline"
                size="icon"
                className="bg-black/60 border-white/20 text-white hover:bg-black/80 backdrop-blur-sm"
                disabled={images.length <= 1}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                onClick={handleNext}
                variant="outline"
                size="icon"
                className="bg-black/60 border-white/20 text-white hover:bg-black/80 backdrop-blur-sm"
                disabled={images.length <= 1}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            {/* Open in New Tab */}
            <div className="absolute top-4 right-4">
              <Button
                onClick={() => window.open(currentImage?.url, '_blank')}
                variant="outline"
                size="sm"
                className="bg-black/60 border-white/20 text-white hover:bg-black/80 backdrop-blur-sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Full Size
              </Button>
            </div>
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="px-6 pb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-blue-500 ring-2 ring-blue-500/50'
                    : 'border-neutral-700 hover:border-neutral-500'
                }`}
              >
                <Image
                  src={image.thumbnailUrl || image.url}
                  alt={image.caption || `Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
