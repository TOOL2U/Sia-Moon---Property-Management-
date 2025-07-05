'use client'

import Image from 'next/image'
import { cn } from '@/utils/cn'

// Client-side only Cloudinary URL generation (no server dependencies)
const getCloudinaryUrl = (
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: string | number
    format?: string
    crop?: string
    gravity?: string
    opacity?: number
    overlay?: string
    transformation?: string[]
  } = {}
) => {
  const {
    width,
    height,
    quality = 'auto',
    format = 'webp',
    crop = 'fill',
    gravity = 'center',
    opacity,
    overlay,
    transformation = []
  } = options

  let transformations = []

  // Add basic transformations
  if (width || height) {
    transformations.push(`c_${crop}`)
    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
    if (gravity) transformations.push(`g_${gravity}`)
  }

  // Add quality
  transformations.push(`q_${quality}`)

  // Add format
  transformations.push(`f_${format}`)

  // Add opacity if specified
  if (opacity !== undefined) {
    transformations.push(`o_${opacity}`)
  }

  // Add overlay if specified
  if (overlay) {
    transformations.push(`l_${overlay}`)
  }

  // Add custom transformations
  transformations.push(...transformation)

  const transformationString = transformations.join(',')

  // Use environment variable or fallback to demo cloud
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo'

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}/${publicId}`
}

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

export default function CloudinaryImage({
  publicId,
  alt,
  width,
  height,
  className,
  quality = 'auto',
  format = 'webp',
  crop = 'fill',
  gravity = 'center',
  opacity,
  overlay,
  transformation = [],
  priority = false,
  fill = false,
  sizes,
  placeholder,
  blurDataURL,
  ...props
}: CloudinaryImageProps) {
  const imageUrl = getCloudinaryUrl(publicId, {
    width,
    height,
    quality,
    format,
    crop,
    gravity,
    opacity,
    overlay,
    transformation
  })

  // Generate a low-quality placeholder if blur is requested
  const placeholderUrl = placeholder === 'blur' && !blurDataURL
    ? getCloudinaryUrl(publicId, {
        width: 20,
        height: 20,
        quality: 1,
        format: 'webp',
        crop,
        gravity,
        opacity,
        transformation: [...transformation, 'e_blur:1000']
      })
    : blurDataURL

  if (fill) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className={cn(className)}
        priority={priority}
        sizes={sizes}
        placeholder={placeholder}
        blurDataURL={placeholderUrl}
        {...props}
      />
    )
  }

  if (!width || !height) {
    throw new Error('CloudinaryImage requires width and height when not using fill prop')
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
      blurDataURL={placeholderUrl}
      {...props}
    />
  )
}
