'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'

interface VillaPhotoUploadCloudinaryProps {
  userId: string
  villaId?: string
  disabled?: boolean
  onPhotosChange: (urls: string[]) => void
}

export function VillaPhotoUploadCloudinary({
  userId,
  villaId,
  disabled = false,
  onPhotosChange
}: VillaPhotoUploadCloudinaryProps) {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image`)
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`)
        }

        // Create FormData for upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'villa_photos') // You'll need to configure this in Cloudinary
        formData.append('folder', `villa_management/${userId}/${villaId || 'temp'}`)

        // Upload to Cloudinary
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()
        return data.secure_url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      const newPhotos = [...uploadedPhotos, ...uploadedUrls]
      
      setUploadedPhotos(newPhotos)
      onPhotosChange(newPhotos)
      setUploadProgress(100)
      
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = (indexToRemove: number) => {
    const newPhotos = uploadedPhotos.filter((_, index) => index !== indexToRemove)
    setUploadedPhotos(newPhotos)
    onPhotosChange(newPhotos)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="p-6">
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || isUploading}
            />
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              
              <div>
                <Button
                  onClick={handleUploadClick}
                  disabled={disabled || isUploading}
                  variant="outline"
                  className="mb-2"
                >
                  {isUploading ? 'Uploading...' : 'Upload Villa Photos'}
                </Button>
                
                <p className="text-sm text-gray-500">
                  Click to select multiple images or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, JPEG up to 5MB each
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Photos Grid */}
      {uploadedPhotos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedPhotos.map((url, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <img
                    src={url}
                    alt={`Villa photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={disabled}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Photos Summary */}
      {uploadedPhotos.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              {uploadedPhotos.length} photo{uploadedPhotos.length !== 1 ? 's' : ''} uploaded
            </span>
          </div>
          
          <Button
            onClick={handleUploadClick}
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
          >
            Add More
          </Button>
        </div>
      )}
    </div>
  )
}
