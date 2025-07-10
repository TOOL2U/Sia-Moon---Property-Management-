'use client'

import React, { useState, useCallback } from 'react'
import { uploadToCloudinary, validateImageFile, deleteFromCloudinary } from '@/lib/cloudinary-upload'
import { Upload, Trash2, Download, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface VillaPhotoUploadProps {
  userId: string
  villaId?: string
  disabled?: boolean
  onPhotosChange?: (photoUrls: string[]) => void
}

interface UploadedPhoto {
  id: string
  name: string
  url: string
  publicId: string
  size: number
  uploadedAt: Date
}

export function VillaPhotoUploadCloudinary({ userId, villaId, disabled = false, onPhotosChange }: VillaPhotoUploadProps) {
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Generate folder path for Cloudinary uploads
  const getCloudinaryFolder = useCallback(() => {
    const safeUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '_')
    const safeVillaId = villaId ? villaId.replace(/[^a-zA-Z0-9-_]/g, '_') : 'temp'
    return `villa-photos/${safeUserId}/${safeVillaId}`
  }, [userId, villaId])

  // Notify parent when photos change
  React.useEffect(() => {
    if (onPhotosChange) {
      onPhotosChange(uploadedPhotos.map(photo => photo.url))
    }
  }, [uploadedPhotos, onPhotosChange])

  // Handle file upload using Cloudinary
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    if (!userId || disabled) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setIsUploading(true)
    const uploadPromises = validFiles.map(async (file) => {
      try {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, {
          folder: getCloudinaryFolder(),
          quality: 'auto',
          format: 'webp',
          crop: 'limit',
          width: 2000,
          height: 2000,
          tags: ['villa-management', 'villa-photos', userId, villaId || 'temp']
        })

        const newPhoto: UploadedPhoto = {
          id: result.public_id,
          name: file.name,
          url: result.secure_url,
          publicId: result.public_id,
          size: file.size,
          uploadedAt: new Date()
        }

        setUploadedPhotos(prev => [newPhoto, ...prev])
        toast.success(`${file.name} uploaded successfully`)
        
        return newPhoto
      } catch (error) {
        console.error('Upload failed:', error)
        toast.error(`Failed to upload ${file.name}`)
        throw error
      }
    })

    try {
      await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Some uploads failed:', error)
    } finally {
      setIsUploading(false)
    }
  }, [userId, disabled, getCloudinaryFolder, onPhotosChange, villaId])

  // Handle file deletion
  const handleDeletePhoto = useCallback(async (photo: UploadedPhoto) => {
    if (disabled) return

    try {
      // Delete from Cloudinary (this will call the API route)
      await deleteFromCloudinary(photo.publicId)
      
      setUploadedPhotos(prev => prev.filter(p => p.id !== photo.id))
      toast.success('Photo deleted successfully')
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete photo')
    }
  }, [disabled, onPhotosChange])

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [handleFileUpload])

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
          dragActive
            ? 'border-purple-400 bg-purple-500/10'
            : 'border-neutral-600 hover:border-purple-500 bg-neutral-800/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('villa-photo-input')?.click()}
      >
        <input
          id="villa-photo-input"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          disabled={disabled || isUploading}
        />

        <div className="text-center">
          <Upload className={`mx-auto h-12 w-12 mb-4 ${dragActive ? 'text-purple-400' : 'text-neutral-400'}`} />
          <h3 className="text-lg font-medium text-white mb-2">
            {isUploading ? 'Uploading...' : 'Upload Villa Photos'}
          </h3>
          <p className="text-neutral-400 mb-4">
            Drag and drop photos here, or click to select files
          </p>
          <p className="text-sm text-neutral-500">
            Supports: JPEG, PNG, WebP, GIF (max 10MB each)
          </p>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p>Uploading photos...</p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Photos Grid */}
      {uploadedPhotos.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-4">
            Uploaded Photos ({uploadedPhotos.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedPhotos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-square bg-neutral-800 rounded-lg overflow-hidden">
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => window.open(photo.url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30"
                      onClick={() => handleDeletePhoto(photo)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-neutral-300 truncate">{photo.name}</p>
                  <p className="text-xs text-neutral-500">
                    {(photo.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      {uploadedPhotos.length === 0 && !isUploading && (
        <div className="text-center py-8">
          <ImageIcon className="mx-auto h-16 w-16 text-neutral-600 mb-4" />
          <p className="text-neutral-400 mb-2">No photos uploaded yet</p>
          <p className="text-sm text-neutral-500">
            Upload high-quality photos of your villa to attract more guests
          </p>
        </div>
      )}
    </div>
  )
}
