'use client'

import React, { useState, useCallback } from 'react'
import { storage } from '@/lib/firebase'
import { ref, listAll, getDownloadURL } from 'firebase/storage'
import { Download, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface AdminVillaPhotoDownloadProps {
  className?: string
}

interface VillaPhotoInfo {
  id: string
  name: string
  url: string
  path: string
  ownerFolder: string
  villaFolder: string
}

export function AdminVillaPhotoDownload({ className = '' }: AdminVillaPhotoDownloadProps) {
  const [userId, setUserId] = useState('')
  const [villaId, setVillaId] = useState('')
  const [photos, setPhotos] = useState<VillaPhotoInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [allFolders, setAllFolders] = useState<{ownerFolder: string, villaFolders: string[]}[]>([])

  // Load all villa photo folders for admin overview
  const loadAllVillaFolders = useCallback(async () => {
    if (!storage) return

    try {
      setLoading(true)
      const villaPhotosRef = ref(storage, 'villa-photos')
      const ownersList = await listAll(villaPhotosRef)
      
      const foldersData = []
      for (const ownerRef of ownersList.prefixes) {
        const ownerName = ownerRef.name
        const villasList = await listAll(ownerRef)
        const villaNames = villasList.prefixes.map(villaRef => villaRef.name)
        
        if (villaNames.length > 0) {
          foldersData.push({
            ownerFolder: ownerName,
            villaFolders: villaNames
          })
        }
      }
      
      setAllFolders(foldersData)
      console.log('Available villa photo folders:', foldersData)
      
      if (foldersData.length === 0) {
        toast('No villa photo folders found')
      } else {
        toast.success(`Found ${foldersData.length} owner folders with villa photos`)
      }
    } catch (error) {
      console.error('Failed to load villa folders:', error)
      toast.error('Failed to load villa folders')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load photos for specific user/villa
  const loadVillaPhotos = useCallback(async () => {
    if (!storage || !userId) {
      toast.error('Please enter a User ID')
      return
    }

    try {
      setLoading(true)
      const safeUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '_')
      const safeVillaId = villaId ? villaId.replace(/[^a-zA-Z0-9-_]/g, '_') : 'temp'
      
      const folderPath = `villa-photos/${safeUserId}/${safeVillaId}`
      const folderRef = ref(storage, folderPath)
      
      const listResult = await listAll(folderRef)
      const photosList: VillaPhotoInfo[] = []

      for (const itemRef of listResult.items) {
        try {
          const url = await getDownloadURL(itemRef)
          
          photosList.push({
            id: itemRef.name,
            name: itemRef.name,
            url,
            path: itemRef.fullPath,
            ownerFolder: safeUserId,
            villaFolder: safeVillaId
          })
        } catch (error) {
          console.warn('Failed to load photo:', error)
        }
      }

      setPhotos(photosList)
      
      if (photosList.length === 0) {
        toast(`No photos found for ${safeUserId}/${safeVillaId}`)
      } else {
        toast.success(`Found ${photosList.length} photos`)
      }
    } catch (error) {
      console.error('Failed to load villa photos:', error)
      toast.error('Failed to load villa photos')
    } finally {
      setLoading(false)
    }
  }, [userId, villaId])

  // Download all photos as URLs list
  const downloadPhotosList = useCallback(() => {
    if (photos.length === 0) {
      toast.error('No photos to download')
      return
    }

    try {
      const photoList = photos.map((photo, index) => 
        `${index + 1}. ${photo.name}\n   URL: ${photo.url}\n   Path: ${photo.path}\n`
      ).join('\n')
      
      const content = `Villa Photos Download List
Owner: ${userId}
Villa: ${villaId || 'temp'}
Generated: ${new Date().toLocaleString()}
Total Photos: ${photos.length}

Photos:
${photoList}

Instructions:
- Right-click on any URL and select "Save link as..." to download individual photos
- Or copy the URL and open in a new tab to view/download
- All photos are stored securely in Firebase Storage
`
      
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `villa-photos-${userId}-${villaId || 'temp'}-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Photo list downloaded successfully')
    } catch (error) {
      console.error('Failed to download photos list:', error)
      toast.error('Failed to download photos list')
    }
  }, [photos, userId, villaId])

  // Download individual photo
  const downloadPhoto = useCallback(async (photo: VillaPhotoInfo) => {
    try {
      const response = await fetch(photo.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = photo.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success(`Downloaded ${photo.name}`)
    } catch (error) {
      console.error('Failed to download photo:', error)
      toast.error(`Failed to download ${photo.name}`)
    }
  }, [])

  if (!storage) {
    return (
      <div className={`p-6 border-2 border-dashed border-red-500/30 rounded-lg bg-red-500/5 ${className}`}>
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
    <div className={`space-y-6 ${className}`}>
      <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Admin: Villa Photos Download
        </h3>
        
        {/* Browse All Folders */}
        <div className="mb-6">
          <Button
            onClick={loadAllVillaFolders}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            Browse All Villa Folders
          </Button>
        </div>

        {/* Available Folders Display */}
        {allFolders.length > 0 && (
          <div className="mb-6 p-4 bg-neutral-900 rounded-lg border border-neutral-600">
            <h4 className="text-sm font-medium text-white mb-3">Available Villa Photo Folders:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {allFolders.map((folder, index) => (
                <div key={index} className="text-sm">
                  <div className="text-blue-400 font-medium">Owner: {folder.ownerFolder}</div>
                  <div className="text-neutral-300 ml-4">
                    Villas: {folder.villaFolders.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            label="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="user123"
            helperText="Owner's user ID"
          />
          <Input
            label="Villa ID (optional)"
            value={villaId}
            onChange={(e) => setVillaId(e.target.value)}
            placeholder="villa_name or leave empty for 'temp'"
            helperText="Leave empty for 'temp' folder"
          />
          <div className="flex items-end">
            <Button
              onClick={loadVillaPhotos}
              disabled={loading || !userId}
              className="w-full"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Load Photos
            </Button>
          </div>
        </div>

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-white">
                Photos ({photos.length})
              </h4>
              <Button
                onClick={downloadPhotosList}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download List
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group bg-neutral-900 rounded-lg overflow-hidden border border-neutral-600"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={photo.url}
                      alt={photo.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    
                    {/* Download button */}
                    <button
                      onClick={() => downloadPhoto(photo)}
                      className="absolute top-2 right-2 p-1.5 bg-blue-500 hover:bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Download photo"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  
                  <div className="p-3">
                    <p className="text-sm text-white truncate" title={photo.name}>
                      {photo.name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {photo.ownerFolder}/{photo.villaFolder}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
