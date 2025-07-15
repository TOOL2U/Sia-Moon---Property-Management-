import { NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '@/lib/env'

// Server-side only Cloudinary configuration
let cloudinary: any = null

// Only import and configure Cloudinary on the server side
if (typeof window === 'undefined') {
  try {
    const { v2 } = require('cloudinary')
    cloudinary = v2

    cloudinary.config({
      cloud_name: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    })
  } catch (error) {
    console.warn('Cloudinary not available on server side')
  }
}

export default cloudinary

// Helper function to generate Cloudinary URLs
export const getCloudinaryUrl = (
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

  const transformations = []

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
  
  return `https://res.cloudinary.com/${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/${publicId}`
}

// Predefined image sizes for responsive images
export const imageSizes = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 200 },
  medium: { width: 600, height: 400 },
  large: { width: 1200, height: 800 },
  hero: { width: 1920, height: 1080 },
  fullscreen: { width: 2560, height: 1440 }
}

// Helper for responsive image sets
export const getResponsiveImageSet = (publicId: string, opacity?: number) => {
  const baseOptions = opacity !== undefined ? { opacity } : {}
  
  return {
    thumbnail: getCloudinaryUrl(publicId, { ...imageSizes.thumbnail, ...baseOptions }),
    small: getCloudinaryUrl(publicId, { ...imageSizes.small, ...baseOptions }),
    medium: getCloudinaryUrl(publicId, { ...imageSizes.medium, ...baseOptions }),
    large: getCloudinaryUrl(publicId, { ...imageSizes.large, ...baseOptions }),
    hero: getCloudinaryUrl(publicId, { ...imageSizes.hero, ...baseOptions }),
    fullscreen: getCloudinaryUrl(publicId, { ...imageSizes.fullscreen, ...baseOptions })
  }
}
