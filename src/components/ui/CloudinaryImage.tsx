'use client'

import Image from 'next/image'
import { cn } from '@/utils/cn'

interface CloudinaryImageProps {
  publicId: string
  alt: string
  width?: number
  height?: number
  className?: string
  quality?: string | number
  format?: string
  crop?: string
  gravity?: string
  opacity?: number
  overlay?: string
  transformation?: string[]
  priority?: boolean
  fill?: boolean
  sizes?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

function CloudinaryImage({
  publicId,
  alt,
  width,
  height,
  className,
  quality = 90,
  format = 'webp',
  crop = 'fill',
  gravity = 'center',
  opacity,
  overlay,
  transformation = [],
  priority = false,
  fill = false,
  sizes,
  placeholder = 'blur',
  blurDataURL,
  ...props
}: CloudinaryImageProps & Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) {
  
  // Use environment variable with fallback
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'doez7m1hy'

  // Early return if no publicId
  if (!publicId) {
    return (
      <div className={cn('bg-neutral-800 flex items-center justify-center text-neutral-400 text-sm', className)}>
        <span>No image ID provided</span>
      </div>
    )
  }

  if (!cloudName) {
    return (
      <div className={cn('bg-neutral-800 flex items-center justify-center text-neutral-400 text-sm', className)}>
        <span>Image configuration missing</span>
      </div>
    )
  }

  // Simple Cloudinary URL generation
  const transformations = []
  if (width && !fill) transformations.push(`w_${width}`)
  if (height && !fill) transformations.push(`h_${height}`)
  if (crop) transformations.push(`c_${crop}`)
  if (gravity) transformations.push(`g_${gravity}`)
  if (quality) transformations.push(`q_${quality}`)
  if (format) transformations.push(`f_${format}`)
  if (opacity) transformations.push(`o_${opacity}`)

  const transformationString = transformations.length > 0 ? `${transformations.join(',')}/` : ''
  const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}${publicId}`

  // Generate blur placeholder if needed
  const blurPlaceholder = placeholder === 'blur' && !blurDataURL
    ? `https://res.cloudinary.com/${cloudName}/image/upload/w_10,h_10,c_fill,f_webp,q_1,e_blur:1000/${publicId}`
    : blurDataURL

  if (fill) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className={cn(className)}
        priority={priority}
        sizes={sizes || '100vw'}
        placeholder={placeholder}
        blurDataURL={blurPlaceholder}
        {...props}
      />
    )
  }

  if (!width || !height) {
    return (
      <div className={cn('bg-neutral-800 flex items-center justify-center text-neutral-400 text-sm', className)}>
        <span>Image dimensions required</span>
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={cn(className)}
      priority={priority}
      sizes={sizes}
      placeholder={placeholder}
      blurDataURL={blurPlaceholder}
      {...props}
    />
  )
}

export default CloudinaryImage
