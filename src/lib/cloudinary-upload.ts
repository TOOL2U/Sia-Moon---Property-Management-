'use client'

// Client-side Cloudinary upload utilities
export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  bytes: number
  url: string
  version: number
}

export interface CloudinaryUploadOptions {
  folder?: string
  transformation?: string
  quality?: string
  format?: string
  crop?: string
  gravity?: string
  width?: number
  height?: number
  tags?: string[]
  context?: Record<string, string>
}

// Upload image to Cloudinary using unsigned upload
export const uploadToCloudinary = async (
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  const {
    folder = 'villa-management',
    transformation,
    quality = 'auto',
    format = 'webp',
    crop = 'limit',
    gravity = 'center',
    width,
    height,
    tags = [],
    context = {}
  } = options

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'villa_management_unsigned') // You'll need to create this preset
  formData.append('folder', folder)
  formData.append('quality', quality)
  formData.append('format', format)

  // Add transformation if specified
  if (transformation) {
    formData.append('transformation', transformation)
  } else {
    // Build transformation from individual options
    const transformations = []
    if (crop) transformations.push(`c_${crop}`)
    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
    if (gravity) transformations.push(`g_${gravity}`)
    transformations.push(`q_${quality}`)
    transformations.push(`f_${format}`)
    
    if (transformations.length > 0) {
      formData.append('transformation', transformations.join(','))
    }
  }

  // Add tags
  if (tags.length > 0) {
    formData.append('tags', tags.join(','))
  }

  // Add context
  if (Object.keys(context).length > 0) {
    formData.append('context', Object.entries(context).map(([key, value]) => `${key}=${value}`).join('|'))
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`)
    }

    const result = await response.json()
    return result as CloudinaryUploadResult
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw error
  }
}

// Upload multiple images
export const uploadMultipleToCloudinary = async (
  files: File[],
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult[]> => {
  const uploadPromises = files.map(file => uploadToCloudinary(file, options))
  return Promise.all(uploadPromises)
}

// Delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  // Note: This requires server-side implementation for security
  // Client-side deletion is not recommended for production
  console.warn('Delete operation should be implemented server-side for security')
  
  try {
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    })

    if (!response.ok) {
      throw new Error('Failed to delete image')
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw error
  }
}

// Validate file before upload
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.'
    }
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Please upload images smaller than 10MB.'
    }
  }

  return { valid: true }
}

// Generate responsive image URLs for different screen sizes
export const generateResponsiveUrls = (publicId: string, opacity?: number) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your_cloud_name_here'

  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`
  const opacityParam = opacity !== undefined ? `o_${opacity},` : ''

  return {
    mobile: `${baseUrl}/${opacityParam}w_640,h_360,c_fill,q_auto,f_webp/${publicId}`,
    tablet: `${baseUrl}/${opacityParam}w_1024,h_576,c_fill,q_auto,f_webp/${publicId}`,
    desktop: `${baseUrl}/${opacityParam}w_1920,h_1080,c_fill,q_auto,f_webp/${publicId}`,
    large: `${baseUrl}/${opacityParam}w_2560,h_1440,c_fill,q_auto,f_webp/${publicId}`,
  }
}
