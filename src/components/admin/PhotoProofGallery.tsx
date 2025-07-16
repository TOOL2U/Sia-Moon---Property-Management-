'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { toast } from 'sonner'
import {
  Camera,
  Image,
  Download,
  Eye,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Share2,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Filter,
  Search,
  Loader2
} from 'lucide-react'
import { JobData } from '@/services/JobAssignmentService'

interface PhotoProofGalleryProps {
  isOpen: boolean
  onClose: () => void
  job: JobData | null
  className?: string
}

interface PhotoProof {
  id: string
  url: string
  thumbnailUrl?: string
  filename: string
  uploadedAt: string
  uploadedBy: string
  fileSize: number
  dimensions?: {
    width: number
    height: number
  }
  location?: {
    latitude: number
    longitude: number
  }
  notes?: string
  verified: boolean
  verifiedAt?: string
  verifiedBy?: string
}

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
}

const imageVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3
    }
  }
}

export function PhotoProofGallery({ isOpen, onClose, job, className }: PhotoProofGalleryProps) {
  // State management
  const [photos, setPhotos] = useState<PhotoProof[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoProof | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  // Load photos when job changes
  useEffect(() => {
    if (job && isOpen) {
      loadPhotos()
    }
  }, [job, isOpen])

  // Load photo proofs
  const loadPhotos = async () => {
    if (!job?.completionPhotos) {
      setPhotos([])
      return
    }

    try {
      setLoading(true)
      
      // Transform job completion photos to PhotoProof format
      const photoProofs: PhotoProof[] = job.completionPhotos.map((photo, index) => ({
        id: photo.id || `photo_${index}`,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl || photo.url,
        filename: photo.filename || `photo_${index + 1}.jpg`,
        uploadedAt: photo.uploadedAt || job.completedAt || new Date().toISOString(),
        uploadedBy: job.assignedStaffRef?.name || 'Unknown Staff',
        fileSize: photo.fileSize || 0,
        dimensions: photo.dimensions,
        location: photo.location,
        notes: photo.notes,
        verified: photo.verified || false,
        verifiedAt: photo.verifiedAt,
        verifiedBy: photo.verifiedBy
      }))

      setPhotos(photoProofs)
      console.log(`✅ Loaded ${photoProofs.length} photo proofs for job ${job.id}`)

    } catch (error) {
      console.error('❌ Error loading photos:', error)
      toast.error('Failed to load photo proofs')
    } finally {
      setLoading(false)
    }
  }

  // Handle photo selection
  const handlePhotoSelect = (photo: PhotoProof, index: number) => {
    setSelectedPhoto(photo)
    setCurrentIndex(index)
    setZoom(1)
    setRotation(0)
  }

  // Navigate photos
  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (photos.length === 0) return

    let newIndex = currentIndex
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1
    } else {
      newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0
    }

    setCurrentIndex(newIndex)
    setSelectedPhoto(photos[newIndex])
    setZoom(1)
    setRotation(0)
  }

  // Download photo
  const downloadPhoto = async (photo: PhotoProof) => {
    try {
      const response = await fetch(photo.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = photo.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)
      toast.success('Photo downloaded successfully')

    } catch (error) {
      console.error('❌ Error downloading photo:', error)
      toast.error('Failed to download photo')
    }
  }

  // Verify photo
  const verifyPhoto = async (photo: PhotoProof) => {
    try {
      // TODO: Implement photo verification API call
      const updatedPhoto = {
        ...photo,
        verified: true,
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'Admin User' // TODO: Get from auth context
      }

      setPhotos(prev => prev.map(p => p.id === photo.id ? updatedPhoto : p))
      
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto(updatedPhoto)
      }

      toast.success('Photo verified successfully')

    } catch (error) {
      console.error('❌ Error verifying photo:', error)
      toast.error('Failed to verify photo')
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen || !selectedPhoto) return

      switch (event.key) {
        case 'ArrowLeft':
          navigatePhoto('prev')
          break
        case 'ArrowRight':
          navigatePhoto('next')
          break
        case 'Escape':
          setSelectedPhoto(null)
          break
        case '+':
        case '=':
          setZoom(prev => Math.min(prev + 0.25, 3))
          break
        case '-':
          setZoom(prev => Math.max(prev - 0.25, 0.25))
          break
        case 'r':
          setRotation(prev => (prev + 90) % 360)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, selectedPhoto, currentIndex])

  if (!isOpen || !job) return null

  return (
    <AnimatePresence>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-7xl max-h-[95vh] overflow-hidden">
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="h-full flex flex-col"
          >
            <DialogHeader className="border-b border-gray-700/50 pb-4 flex-shrink-0">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                Photo Proof Gallery
              </DialogTitle>
              <DialogDescription className="text-gray-300 mt-2">
                <div className="flex items-center gap-4 text-sm">
                  <span>Job: <span className="text-white font-medium">{job.title}</span></span>
                  <span>Property: <span className="text-white font-medium">{job.propertyRef.name}</span></span>
                  <span>Staff: <span className="text-white font-medium">{job.assignedStaffRef?.name}</span></span>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {photos.length} Photos
                  </Badge>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700/30 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setViewMode('grid')}
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    className={viewMode === 'grid' ? 'bg-purple-600' : 'border-gray-600 text-gray-300'}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode('list')}
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    className={viewMode === 'list' ? 'bg-purple-600' : 'border-gray-600 text-gray-300'}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {photos.filter(p => p.verified).length} of {photos.length} verified
                  </span>
                </div>
              </div>

              {/* Photo Grid/List */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    <span className="ml-3 text-gray-400">Loading photos...</span>
                  </div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-16">
                    <Camera className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400 mb-2">No Photos Available</h3>
                    <p className="text-gray-500">No photo proofs have been uploaded for this job</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <AnimatePresence>
                      {photos.map((photo, index) => (
                        <motion.div
                          key={photo.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="group cursor-pointer"
                          onClick={() => handlePhotoSelect(photo, index)}
                        >
                          <Card className="bg-gray-800/50 border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 overflow-hidden">
                            <div className="relative aspect-square">
                              <img
                                src={photo.thumbnailUrl || photo.url}
                                alt={photo.filename}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                              {photo.verified && (
                                <div className="absolute top-2 right-2">
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                </div>
                              )}
                            </div>
                            <CardContent className="p-3">
                              <p className="text-xs text-gray-400 truncate">{photo.filename}</p>
                              <p className="text-xs text-gray-500">{formatDate(photo.uploadedAt)}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {photos.map((photo, index) => (
                        <motion.div
                          key={photo.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card className="bg-gray-800/50 border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div 
                                  className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                                  onClick={() => handlePhotoSelect(photo, index)}
                                >
                                  <img
                                    src={photo.thumbnailUrl || photo.url}
                                    alt={photo.filename}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                  />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium text-white truncate">{photo.filename}</h4>
                                    {photo.verified ? (
                                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Verified
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Pending
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {formatDate(photo.uploadedAt)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {photo.uploadedBy}
                                    </div>
                                    <div>Size: {formatFileSize(photo.fileSize)}</div>
                                    {photo.dimensions && (
                                      <div>{photo.dimensions.width}×{photo.dimensions.height}</div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePhotoSelect(photo, index)}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadPhoto(photo)}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                  {!photo.verified && (
                                    <Button
                                      size="sm"
                                      onClick={() => verifyPhoto(photo)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="bg-black/95 border-gray-700 text-white max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
            <div className="relative h-[95vh] flex flex-col">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">{selectedPhoto.filename}</h3>
                    <Badge className={selectedPhoto.verified 
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    }>
                      {selectedPhoto.verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {currentIndex + 1} of {photos.length}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedPhoto(null)}
                      className="text-white hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Image */}
              <div className="flex-1 flex items-center justify-center p-4">
                <motion.img
                  key={selectedPhoto.id}
                  variants={imageVariants}
                  initial="hidden"
                  animate="visible"
                  src={selectedPhoto.url}
                  alt={selectedPhoto.filename}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                />
              </div>

              {/* Navigation */}
              {photos.length > 1 && (
                <>
                  <Button
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-none"
                    onClick={() => navigatePhoto('prev')}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-none"
                    onClick={() => navigatePhoto('next')}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
                      className="text-white hover:bg-white/10"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-400 min-w-16 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                      className="text-white hover:bg-white/10"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="text-white hover:bg-white/10"
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadPhoto(selectedPhoto)}
                      className="text-white hover:bg-white/10"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    {!selectedPhoto.verified && (
                      <Button
                        size="sm"
                        onClick={() => verifyPhoto(selectedPhoto)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Photo Info */}
                <div className="mt-3 text-sm text-gray-400 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>Uploaded: {formatDate(selectedPhoto.uploadedAt)}</div>
                  <div>By: {selectedPhoto.uploadedBy}</div>
                  <div>Size: {formatFileSize(selectedPhoto.fileSize)}</div>
                  {selectedPhoto.dimensions && (
                    <div>Dimensions: {selectedPhoto.dimensions.width}×{selectedPhoto.dimensions.height}</div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
