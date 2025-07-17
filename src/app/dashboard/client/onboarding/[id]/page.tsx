'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { OnboardingService, OnboardingSubmission } from '@/lib/services/onboardingService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  ArrowLeft,
  Building, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Bed,
  Bath,
  Car,
  Wifi,
  Droplets,
  Zap,
  Shield,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import { clientToast as toast } from '@/utils/clientToast'

export default function ClientOnboardingDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [onboarding, setOnboarding] = useState<OnboardingSubmission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is client
    if (user && user.role !== 'client') {
      toast.error('Access denied. Client access required.')
      router.push('/dashboard/staff')
      return
    }
    
    if (user && id) {
      fetchOnboarding()
    }
  }, [user, router, id])

  const fetchOnboarding = async () => {
    if (!user) return

    try {
      setLoading(true)
      const submission = await OnboardingService.getSubmissionById(id)

      if (!submission) {
        toast.error('Villa submission not found')
        router.push('/dashboard/client/onboarding')
        return
      }

      // Check if this onboarding belongs to the current user
      if (submission.userId !== user.id) {
        toast.error('Access denied. You can only view your own submissions.')
        router.push('/dashboard/client/onboarding')
        return
      }

      setOnboarding(submission)
    } catch (error) {
      console.error('Error fetching onboarding:', error)
      toast.error('Failed to load villa details')
      router.push('/dashboard/client/onboarding')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: VillaOnboarding['status']) => {
    const variants = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      under_review: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      approved: 'bg-green-500/10 text-green-500 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/20'
    }

    const icons = {
      pending: Clock,
      under_review: Edit,
      approved: CheckCircle,
      rejected: XCircle
    }

    const Icon = icons[status]

    return (
      <Badge className={`${variants[status]} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getStatusMessage = (status: VillaOnboarding['status']) => {
    const messages = {
      pending: 'Your villa submission is pending review by our team. We will contact you once the review is complete.',
      under_review: 'Our team is currently reviewing your villa submission. This process typically takes 2-3 business days.',
      approved: 'Congratulations! Your villa has been approved and is ready for listing. Our team will contact you with next steps.',
      rejected: 'Your villa submission needs some updates. Please review the feedback and resubmit with the necessary changes.'
    }
    return messages[status]
  }

  if (!user || user.role !== 'client') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-400">Client access required to view this page.</p>
          <Link href="/dashboard/staff">
            <Button className="mt-4">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading villa details...</p>
        </div>
      </div>
    )
  }

  if (!onboarding) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Villa Not Found</h1>
          <p className="text-neutral-400">The requested villa submission could not be found.</p>
          <Link href="/dashboard/client/onboarding">
            <Button className="mt-4">Back to My Submissions</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/client/onboarding">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Submissions
              </Button>
            </Link>
            {getStatusBadge(onboarding.status)}
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{onboarding.property_name}</h1>
              <p className="text-neutral-400">Villa Submission Details</p>
            </div>
            
            {(onboarding.status === 'pending' || onboarding.status === 'rejected') && (
              <Link href={`/onboard?edit=${onboarding.id}`}>
                <Button className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Submission
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Status Message */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="text-blue-400 font-medium mb-1">Submission Status</h3>
                  <p className="text-neutral-300">
                    {getStatusMessage(onboarding.status)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400">Property Name</label>
                <p className="text-white">{onboarding.property_name}</p>
              </div>
              
              <div>
                <label className="text-sm text-neutral-400">Address</label>
                <p className="text-white">{onboarding.property_address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-neutral-400">Bedrooms</label>
                  <p className="text-white">{onboarding.bedrooms || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm text-neutral-400">Bathrooms</label>
                  <p className="text-white">{onboarding.bathrooms || 'Not specified'}</p>
                </div>
              </div>
              
              {onboarding.year_built && (
                <div>
                  <label className="text-sm text-neutral-400">Year Built</label>
                  <p className="text-white">{onboarding.year_built}</p>
                </div>
              )}
              
              {onboarding.google_maps_url && (
                <div>
                  <label className="text-sm text-neutral-400">Google Maps</label>
                  <a 
                    href={onboarding.google_maps_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    View on Google Maps
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Owner Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400">Full Name</label>
                <p className="text-white">{onboarding.owner_full_name}</p>
              </div>
              
              <div>
                <label className="text-sm text-neutral-400">Email</label>
                <p className="text-white">{onboarding.owner_email}</p>
              </div>
              
              <div>
                <label className="text-sm text-neutral-400">Contact Number</label>
                <p className="text-white">{onboarding.owner_contact_number}</p>
              </div>
              
              {onboarding.owner_nationality && (
                <div>
                  <label className="text-sm text-neutral-400">Nationality</label>
                  <p className="text-white">{onboarding.owner_nationality}</p>
                </div>
              )}
              
              {onboarding.preferred_contact_method && (
                <div>
                  <label className="text-sm text-neutral-400">Preferred Contact</label>
                  <p className="text-white capitalize">{onboarding.preferred_contact_method}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities & Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Droplets className={`h-4 w-4 ${onboarding.has_pool ? 'text-blue-400' : 'text-neutral-600'}`} />
                  <span className={onboarding.has_pool ? 'text-white' : 'text-neutral-400'}>
                    Swimming Pool
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className={`h-4 w-4 ${onboarding.has_parking ? 'text-green-400' : 'text-neutral-600'}`} />
                  <span className={onboarding.has_parking ? 'text-white' : 'text-neutral-400'}>
                    Parking
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className={`h-4 w-4 ${onboarding.has_air_conditioning ? 'text-blue-400' : 'text-neutral-600'}`} />
                  <span className={onboarding.has_air_conditioning ? 'text-white' : 'text-neutral-400'}>
                    Air Conditioning
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${onboarding.has_backup_power ? 'text-yellow-400' : 'text-neutral-600'}`} />
                  <span className={onboarding.has_backup_power ? 'text-white' : 'text-neutral-400'}>
                    Backup Power
                  </span>
                </div>
              </div>

              {onboarding.internet_provider && (
                <div className="mt-4">
                  <label className="text-sm text-neutral-400">Internet Provider</label>
                  <p className="text-white">{onboarding.internet_provider}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {(onboarding.emergency_contact_name || onboarding.emergency_contact_phone) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {onboarding.emergency_contact_name && (
                  <div>
                    <label className="text-sm text-neutral-400">Name</label>
                    <p className="text-white">{onboarding.emergency_contact_name}</p>
                  </div>
                )}
                {onboarding.emergency_contact_phone && (
                  <div>
                    <label className="text-sm text-neutral-400">Phone</label>
                    <p className="text-white">{onboarding.emergency_contact_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* House Rules */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>House Rules & Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Users className={`h-4 w-4 ${onboarding.pets_allowed ? 'text-green-400' : 'text-red-400'}`} />
                  <span className="text-white">
                    Pets {onboarding.pets_allowed ? 'Allowed' : 'Not Allowed'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className={`h-4 w-4 ${onboarding.parties_allowed ? 'text-green-400' : 'text-red-400'}`} />
                  <span className="text-white">
                    Parties {onboarding.parties_allowed ? 'Allowed' : 'Not Allowed'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className={`h-4 w-4 ${onboarding.smoking_allowed ? 'text-yellow-400' : 'text-green-400'}`} />
                  <span className="text-white">
                    {onboarding.smoking_allowed ? 'Smoking Allowed' : 'Non-Smoking'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Submission Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-neutral-400">Submitted</label>
                  <p className="text-white">
                    {new Date(onboarding.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-neutral-400">Last Updated</label>
                  <p className="text-white">
                    {new Date(onboarding.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
