'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { OnboardingService, OnboardingSubmission } from '@/lib/services/onboardingService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  Copy,
  Check,
  X,
  Eye,
  MapPin,
  User,
  Home,
  DollarSign,
  Phone,
  Mail,
  Globe,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function OnboardingSubmissionDetail() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [submission, setSubmission] = useState<OnboardingSubmission | null>(null)
  const [loading, setLoading] = useState(true)

  const submissionId = params.id as string

  // Route protection - admin only
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login')
        return
      }
      if (user.role !== 'admin') {
        router.push('/dashboard/client')
        return
      }
    }
  }, [user, authLoading, router])

  // Fetch submission details
  useEffect(() => {
    const fetchSubmission = async () => {
      if (user?.role === 'admin' && submissionId) {
        try {
          setLoading(true)
          const data = await OnboardingService.getSubmissionById(submissionId)
          setSubmission(data)
        } catch (error) {
          console.error('Error fetching submission:', error)
          toast.error('Failed to load submission details')
        } finally {
          setLoading(false)
        }
      }
    }

    fetchSubmission()
  }, [user, submissionId])

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleStatusUpdate = async (newStatus: 'pending' | 'reviewed' | 'approved' | 'rejected') => {
    if (!submission) return
    
    try {
      await OnboardingService.updateSubmissionStatus(submission.id, newStatus)
      setSubmission(prev => prev ? { ...prev, status: newStatus } : null)
      toast.success(`Status updated to ${newStatus}`)
    } catch {
      console.error('Error updating status')
      toast.error('Failed to update status')
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'reviewed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const CopyableField = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => {
    if (!value) return null
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {icon}
          <label className="text-sm font-medium text-neutral-300">{label}</label>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white">
            {value}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopyToClipboard(value, label)}
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Submission Not Found</h2>
          <p className="text-neutral-400 mb-4">The requested onboarding submission could not be found.</p>
          <Button onClick={() => router.push('/admin')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin')}
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Onboarding Submission</h1>
              <p className="text-neutral-400">Review property details and owner information</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(submission.status)}>
              {submission.status || 'pending'}
            </Badge>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleStatusUpdate('approved')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                onClick={() => handleStatusUpdate('rejected')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Copy for Booking.com */}
        <Card className="bg-blue-500/10 border-blue-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Quick Copy for Booking.com
            </CardTitle>
            <CardDescription className="text-blue-300">
              Copy formatted property information for easy pasting into booking platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                const bookingComText = `Property Name: ${submission.propertyName}
Address: ${submission.propertyAddress}
Bedrooms: ${submission.bedrooms || 'N/A'}
Bathrooms: ${submission.bathrooms || 'N/A'}
Land Size: ${submission.landSizeSqm ? `${submission.landSizeSqm} sqm` : 'N/A'}
Villa Size: ${submission.villaSizeSqm ? `${submission.villaSizeSqm} sqm` : 'N/A'}
Year Built: ${submission.yearBuilt || 'N/A'}

Amenities:
${submission.hasPool ? '✓ Swimming Pool' : '✗ No Pool'}
${submission.hasGarden ? '✓ Garden' : '✗ No Garden'}
${submission.hasAirConditioning ? '✓ Air Conditioning' : '✗ No A/C'}
${submission.hasParking ? '✓ Parking' : '✗ No Parking'}
${submission.hasLaundry ? '✓ Laundry Facilities' : '✗ No Laundry'}
${submission.hasBackupPower ? '✓ Backup Power' : '✗ No Backup Power'}

Utilities:
Electricity: ${submission.electricityProvider || 'N/A'}
Water Source: ${submission.waterSource || 'N/A'}
Internet: ${submission.internetProvider || 'N/A'} (${submission.internetPackage || 'N/A'})

House Rules:
Pets: ${submission.petsAllowed ? 'Allowed' : 'Not Allowed'}
Parties: ${submission.partiesAllowed ? 'Allowed' : 'Not Allowed'}
Smoking: ${submission.smokingAllowed ? 'Allowed' : 'Not Allowed'}

Current Rates: ${submission.rentalRates || 'Not specified'}
Minimum Stay: ${submission.minimumStayRequirements || 'Not specified'}
Target Guests: ${submission.targetGuests || 'Not specified'}

Owner Contact:
Name: ${submission.ownerFullName}
Email: ${submission.ownerEmail}
Phone: ${submission.ownerContactNumber}
Preferred Contact: ${submission.preferredContactMethod || 'N/A'}

Emergency Contact:
Name: ${submission.emergencyContactName || 'N/A'}
Phone: ${submission.emergencyContactPhone || 'N/A'}

Additional Notes: ${submission.notes || submission.repairsNeeded || 'None'}`
                
                handleCopyToClipboard(bookingComText, 'Booking.com formatted text')
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy All Property Info for Booking.com
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Owner Information */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CopyableField
                label="Full Name"
                value={submission.ownerFullName}
                icon={<User className="h-4 w-4 text-neutral-400" />}
              />
              <CopyableField
                label="Email"
                value={submission.ownerEmail}
                icon={<Mail className="h-4 w-4 text-neutral-400" />}
              />
              <CopyableField
                label="Contact Number"
                value={submission.ownerContactNumber}
                icon={<Phone className="h-4 w-4 text-neutral-400" />}
              />
              {submission.ownerNationality && (
                <CopyableField
                  label="Nationality"
                  value={submission.ownerNationality}
                  icon={<Globe className="h-4 w-4 text-neutral-400" />}
                />
              )}
              {submission.preferredContactMethod && (
                <CopyableField
                  label="Preferred Contact Method"
                  value={submission.preferredContactMethod}
                />
              )}
              {submission.bankDetails && (
                <CopyableField
                  label="Bank Details"
                  value={submission.bankDetails}
                  icon={<DollarSign className="h-4 w-4 text-neutral-400" />}
                />
              )}
            </CardContent>
          </Card>

          {/* Property Information */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CopyableField
                label="Property Name"
                value={submission.propertyName}
                icon={<Home className="h-4 w-4 text-neutral-400" />}
              />
              <CopyableField
                label="Address"
                value={submission.propertyAddress}
                icon={<MapPin className="h-4 w-4 text-neutral-400" />}
              />
              {submission.googleMapsUrl && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Google Maps URL</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white">
                      <a
                        href={submission.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        View on Google Maps
                      </a>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyToClipboard(submission.googleMapsUrl!, 'Google Maps URL')}
                      className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Property Details Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {submission.bedrooms && (
                  <div className="text-center p-3 bg-neutral-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">{submission.bedrooms}</div>
                    <div className="text-sm text-neutral-400">Bedrooms</div>
                  </div>
                )}
                {submission.bathrooms && (
                  <div className="text-center p-3 bg-neutral-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">{submission.bathrooms}</div>
                    <div className="text-sm text-neutral-400">Bathrooms</div>
                  </div>
                )}
                {submission.landSizeSqm && (
                  <div className="text-center p-3 bg-neutral-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">{submission.landSizeSqm}</div>
                    <div className="text-sm text-neutral-400">Land Size (sqm)</div>
                  </div>
                )}
                {submission.villaSizeSqm && (
                  <div className="text-center p-3 bg-neutral-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">{submission.villaSizeSqm}</div>
                    <div className="text-sm text-neutral-400">Villa Size (sqm)</div>
                  </div>
                )}
                {submission.yearBuilt && (
                  <div className="text-center p-3 bg-neutral-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">{submission.yearBuilt}</div>
                    <div className="text-sm text-neutral-400">Year Built</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Amenities and Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Amenities & Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${submission.hasPool ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className="text-sm font-medium">{submission.hasPool ? '✓' : '✗'} Swimming Pool</div>
                </div>
                <div className={`p-3 rounded-lg ${submission.hasGarden ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className="text-sm font-medium">{submission.hasGarden ? '✓' : '✗'} Garden</div>
                </div>
                <div className={`p-3 rounded-lg ${submission.hasAirConditioning ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className="text-sm font-medium">{submission.hasAirConditioning ? '✓' : '✗'} Air Conditioning</div>
                </div>
                <div className={`p-3 rounded-lg ${submission.hasParking ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className="text-sm font-medium">{submission.hasParking ? '✓' : '✗'} Parking</div>
                </div>
                <div className={`p-3 rounded-lg ${submission.hasLaundry ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className="text-sm font-medium">{submission.hasLaundry ? '✓' : '✗'} Laundry</div>
                </div>
                <div className={`p-3 rounded-lg ${submission.hasBackupPower ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className="text-sm font-medium">{submission.hasBackupPower ? '✓' : '✗'} Backup Power</div>
                </div>
              </div>
              
              {submission.internetProvider && (
                <CopyableField
                  label="Internet Provider"
                  value={submission.internetProvider}
                />
              )}
              {submission.internetPackage && (
                <CopyableField
                  label="Internet Package"
                  value={submission.internetPackage}
                />
              )}
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Utilities & Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.electricityProvider && (
                <CopyableField
                  label="Electricity Provider"
                  value={submission.electricityProvider}
                />
              )}
              {submission.waterSource && (
                <CopyableField
                  label="Water Source"
                  value={submission.waterSource}
                />
              )}
              {submission.accessDetails && (
                <CopyableField
                  label="Access Details"
                  value={submission.accessDetails}
                />
              )}
              {submission.hasSmartLock !== undefined && (
                <div className={`p-3 rounded-lg ${submission.hasSmartLock ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className="text-sm font-medium">{submission.hasSmartLock ? '✓' : '✗'} Smart Lock</div>
                </div>
              )}
              {submission.gateRemoteDetails && (
                <CopyableField
                  label="Gate Remote Details"
                  value={submission.gateRemoteDetails}
                />
              )}
              {submission.onsiteStaff && (
                <CopyableField
                  label="Onsite Staff"
                  value={submission.onsiteStaff}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rental & Marketing Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Rental & Marketing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.rentalRates && (
                <CopyableField
                  label="Rental Rates"
                  value={submission.rentalRates}
                />
              )}
              {submission.platformsListed && submission.platformsListed.length > 0 && (
                <CopyableField
                  label="Platforms Listed"
                  value={submission.platformsListed.join(', ')}
                />
              )}
              {submission.averageOccupancyRate && (
                <CopyableField
                  label="Average Occupancy Rate"
                  value={submission.averageOccupancyRate + '%'}
                />
              )}
              {submission.minimumStayRequirements && (
                <CopyableField
                  label="Minimum Stay Requirements"
                  value={submission.minimumStayRequirements}
                />
              )}
              {submission.targetGuests && (
                <CopyableField
                  label="Target Guests"
                  value={submission.targetGuests}
                />
              )}
              {submission.ownerBlackoutDates && (
                <CopyableField
                  label="Owner Blackout Dates"
                  value={submission.ownerBlackoutDates}
                />
              )}
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">House Rules & Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className={`p-3 rounded-lg ${submission.petsAllowed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className="text-sm font-medium">{submission.petsAllowed ? '✓' : '✗'} Pets Allowed</div>
                </div>
                <div className={`p-3 rounded-lg ${submission.partiesAllowed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className="text-sm font-medium">{submission.partiesAllowed ? '✓' : '✗'} Parties Allowed</div>
                </div>
                <div className={`p-3 rounded-lg ${submission.smokingAllowed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className="text-sm font-medium">{submission.smokingAllowed ? '✓' : '✗'} Smoking Allowed</div>
                </div>
              </div>
              
              {submission.maintenanceAutoApprovalLimit && (
                <CopyableField
                  label="Maintenance Auto-Approval Limit"
                  value={`฿${submission.maintenanceAutoApprovalLimit}`}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Condition & Emergency Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Current Condition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.repairsNeeded && (
                <CopyableField
                  label="Repairs Needed"
                  value={submission.repairsNeeded}
                />
              )}
              {submission.lastSepticService && (
                <CopyableField
                  label="Last Septic Service"
                  value={submission.lastSepticService}
                />
              )}
              {submission.pestControlSchedule && (
                <CopyableField
                  label="Pest Control Schedule"
                  value={submission.pestControlSchedule}
                />
              )}
              {submission.professionalPhotosStatus && (
                <CopyableField
                  label="Professional Photos Status"
                  value={submission.professionalPhotosStatus}
                />
              )}
              {submission.floorPlanImagesAvailable !== undefined && (
                <div className={`p-3 rounded-lg ${submission.floorPlanImagesAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className="text-sm font-medium">{submission.floorPlanImagesAvailable ? '✓' : '✗'} Floor Plan Images Available</div>
                </div>
              )}
              {submission.videoWalkthroughAvailable !== undefined && (
                <div className={`p-3 rounded-lg ${submission.videoWalkthroughAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className="text-sm font-medium">{submission.videoWalkthroughAvailable ? '✓' : '✗'} Video Walkthrough Available</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.emergencyContactName && (
                <CopyableField
                  label="Emergency Contact Name"
                  value={submission.emergencyContactName}
                  icon={<User className="h-4 w-4 text-neutral-400" />}
                />
              )}
              {submission.emergencyContactPhone && (
                <CopyableField
                  label="Emergency Contact Phone"
                  value={submission.emergencyContactPhone}
                  icon={<Phone className="h-4 w-4 text-neutral-400" />}
                />
              )}
              {submission.notes && (
                <CopyableField
                  label="Additional Notes"
                  value={submission.notes}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Uploaded Photos Section */}
        {submission.uploadedPhotos && submission.uploadedPhotos.length > 0 && (
          <Card className="bg-neutral-900 border-neutral-800 mt-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Uploaded Photos ({submission.uploadedPhotos.length})
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Photos uploaded by the property owner during onboarding
              </CardDescription>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={async () => {
                    try {
                      // Create a downloadable text file with all photo URLs
                      const photoList = submission.uploadedPhotos!.map((url, index) => 
                        `Photo ${index + 1}: ${url}`
                      ).join('\n')
                      
                      const blob = new Blob([photoList], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${submission.propertyName.replace(/[^a-zA-Z0-9-_]/g, '_')}-photos-urls.txt`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                      
                      toast.success('Photo URLs list downloaded successfully')
                    } catch {
                      toast.error('Failed to download photo URLs')
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Download All URLs
                </Button>
                <Button
                  onClick={() => {
                    const allUrls = submission.uploadedPhotos!.join('\n')
                    handleCopyToClipboard(allUrls, 'All photo URLs')
                  }}
                  variant="outline"
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                >
                  Copy All URLs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {submission.uploadedPhotos.map((photoUrl, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-neutral-800 rounded-lg overflow-hidden">
                      <Image
                        src={photoUrl}
                        alt={`Property photo ${index + 1}`}
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
                          onClick={() => window.open(photoUrl, '_blank')}
                          className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                          title="View full size"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyToClipboard(photoUrl, `Photo ${index + 1} URL`)}
                          className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                          title="Copy URL"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const response = await fetch(photoUrl)
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${submission.propertyName.replace(/[^a-zA-Z0-9-_]/g, '_')}-photo-${index + 1}.jpg`
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              window.URL.revokeObjectURL(url)
                              toast.success(`Photo ${index + 1} downloaded`)
                            } catch {
                              toast.error(`Failed to download photo ${index + 1}`)
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700"
                          title="Download image"
                        >
                          📥
                        </Button>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      Photo {index + 1}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Photo Management Instructions */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2">Photo Management Instructions</h4>
                <ul className="text-sm text-blue-300 space-y-1">
                  <li>• Click &ldquo;View&rdquo; to open photos in full size</li>
                  <li>• Click &ldquo;Copy URL&rdquo; to copy individual photo links</li>
                  <li>• Click &ldquo;📥&rdquo; to download individual photos</li>
                  <li>• Use &ldquo;Download All URLs&rdquo; for a text file with all photo links</li>
                  <li>• Use &ldquo;Copy All URLs&rdquo; to copy all photo URLs to clipboard</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
