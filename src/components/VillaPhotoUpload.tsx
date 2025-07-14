'use client'

import React, { useState, useCallback } from 'react'
import { Upload, Trash2, Download, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

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
  path: string
}

export function VillaPhotoUpload({ userId, villaId, disabled = false, onPhotosChange }: VillaPhotoUploadProps) {
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Generate storage path for Firebase
  const getStoragePath = useCallback((fileName: string) => {
    const safeUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '_')
    const safeVillaId = villaId ? villaId.replace(/[^a-zA-Z0-9-_]/g, '_') : 'temp'
    return `villa-photos/${safeUserId}/${safeVillaId}/${fileName}`
  }, [userId, villaId])

  // Note: For Cloudinary, we don't pre-load existing photos since we don't have a direct way
  // to list files in a folder. Instead, we rely on the parent component to provide
  // existing photo URLs if needed, or we track uploads in this session only.

  // Initialize with empty photos array
  React.useEffect(() => {
    // Notify parent of initial empty state
    if (onPhotosChange) {
      onPhotosChange([])
    }
  }, [onPhotosChange])

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    if (!storage || !userId || disabled) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      
      if (!isValidType) {
        toast.error(`${file.name} is not a valid image file`)
        return false
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setIsUploading(true)
    const uploadPromises = validFiles.map(async (file) => {
      try {
        // Generate unique filename
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split('.').pop() || 'jpg'
        const uniqueFileName = `photo_${timestamp}_${randomId}.${fileExtension}`
        
        if (!storage) throw new Error('Storage not available')

        const storagePath = getStoragePath(uniqueFileName)
        const storageRef = ref(storage, storagePath)

        // Upload file
        const snapshot = await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(snapshot.ref)

        const newPhoto: UploadedPhoto = {
          id: uniqueFileName,
          name: file.name,
          url: downloadURL,
          path: storagePath,
          publicId: uniqueFileName, // Use filename as publicId for Firebase
          size: file.size,
          uploadedAt: new Date()
        }

        setUploadedPhotos(prev => {
          const updated = [newPhoto, ...prev]
          // Notify parent component of photo URLs
          if (onPhotosChange) {
            onPhotosChange(updated.map(photo => photo.url))
          }
          return updated
        })
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
  }, [userId, disabled, getStoragePath, onPhotosChange])

  // Handle file deletion
  const handleDeletePhoto = useCallback(async (photo: UploadedPhoto) => {
    if (!storage || disabled) return

    try {
      if (!storage) throw new Error('Storage not available')
      const storageRef = ref(storage, photo.path)
      await deleteObject(storageRef)
      
      setUploadedPhotos(prev => {
        const updated = prev.filter(p => p.id !== photo.id)
        // Notify parent component of photo URLs
        if (onPhotosChange) {
          onPhotosChange(updated.map(photo => photo.url))
        }
        return updated
      })
      toast.success('Photo deleted successfully')
    } catch (error) {
      console.error('Failed to delete photo:', error)
      toast.error('Failed to delete photo')
    }
  }, [disabled, onPhotosChange])

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [handleFileUpload])

  // Generate download URL for admin access
  const generateDownloadBundle = useCallback(async () => {
    if (uploadedPhotos.length === 0) {
      toast.error('No photos to download')
      return
    }

    try {
      // Create a simple text file with all photo URLs for admin download
      const photoList = uploadedPhotos.map(photo => 
        `${photo.name}: ${photo.url}`
      ).join('\n')
      
      const blob = new Blob([photoList], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `villa-photos-${userId}-${villaId || 'temp'}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Photo list downloaded. Admins can use these URLs to download individual photos.')
    } catch (error) {
      console.error('Failed to generate download bundle:', error)
      toast.error('Failed to generate download bundle')
    }
  }, [uploadedPhotos, userId, villaId])

  if (!storage) {
    return (
      <div className="p-6 border-2 border-dashed border-red-500/30 rounded-lg bg-red-500/5">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Firebase Storage Not Available</span>
        </div>
        <p className="text-sm text-red-300">
          Firebase Storage is not configured. Please check your Firebase configuration.
        </p>
      </div>
    )
  }

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
          <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Upload Villa Photos
          </h3>
          <p className="text-sm text-neutral-400 mb-4">
            Drag and drop photos here, or click to select files
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isUploading}
            onClick={(e) => {
              e.stopPropagation()
              document.getElementById('villa-photo-input')?.click()
            }}
          >
            {isUploading ? 'Uploading...' : 'Select Photos'}
          </Button>
          <p className="text-xs text-neutral-500 mt-2">
            Supports: JPG, PNG, WebP (max 10MB each)
          </p>
        </div>
      </div>

      {/* Uploaded Photos Grid */}
      {uploadedPhotos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-white">
              Uploaded Photos ({uploadedPhotos.length})
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateDownloadBundle}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download List
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700"
              >
                <div className="aspect-square relative">
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  
                  {/* Delete button */}
                  {!disabled && (
                    <button
                      onClick={() => handleDeletePhoto(photo)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
                
                <div className="p-3">
                  <p className="text-sm text-white truncate" title={photo.name}>
                    {photo.name}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {(photo.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Download Instructions */}
      {uploadedPhotos.length > 0 && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <ImageIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-blue-300 mb-1">
                Admin Access
              </h5>
              <p className="text-xs text-blue-200">
                Admins can download the photo list above to access all uploaded villa photos. 
                Each photo is stored securely and can be accessed using the provided URLs.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
