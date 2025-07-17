'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import CloudinaryImage from '@/components/ui/CloudinaryImage'
import { uploadToCloudinary, validateImageFile, CloudinaryUploadResult } from '@/lib/cloudinary-upload'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/utils/cn'
import { clientToast as toast } from '@/utils/clientToast'

interface ImageUploadProps {
  onUpload: (result: CloudinaryUploadResult) => void
  onRemove?: () => void
  currentImage?: string
  folder?: string
  className?: string
  maxFiles?: number
  accept?: string
  disabled?: boolean
  placeholder?: string
}

export default function ImageUpload({
  onUpload,
  onRemove,
  currentImage,
  folder = 'villa-management',
  className,
  maxFiles = 1,
  accept = 'image/*',
  disabled = false,
  placeholder = 'Click to upload or drag and drop'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const validation = validateImageFile(file)
    
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file')
      return
    }

    setUploading(true)
    try {
      const result = await uploadToCloudinary(file, {
        folder,
        quality: 'auto',
        format: 'webp',
        crop: 'limit',
        width: 2000,
        height: 2000,
        tags: ['villa-management', folder]
      })

      onUpload(result)
      toast.success('Image uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (disabled || uploading) return
    
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !uploading) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleClick = () => {
    if (disabled || uploading) return
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove()
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Image Display */}
      {currentImage && (
        <div className="relative group">
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800">
            <CloudinaryImage
              publicId={currentImage}
              alt="Uploaded image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          {onRemove && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 border-red-600 text-white"
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer',
          dragOver
            ? 'border-primary-500 bg-primary-500/5'
            : 'border-neutral-700 hover:border-neutral-600',
          disabled || uploading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-neutral-900/50',
          className
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled || uploading}
          multiple={maxFiles > 1}
        />

        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-neutral-800 mb-4">
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
            ) : (
              <ImageIcon className="h-6 w-6 text-neutral-400" />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-white">
              {uploading ? 'Uploading...' : placeholder}
            </p>
            <p className="text-xs text-neutral-400">
              PNG, JPG, WebP up to 10MB
            </p>
          </div>

          {!uploading && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={disabled}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
