'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
// TODO: Replace with Firebase service
// import FirebaseService from '@/lib/firebaseService'
import { VillaOnboarding } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
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
  Edit,
  Save,
  X
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function OnboardingDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [onboarding, setOnboarding] = useState<VillaOnboarding | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<VillaOnboarding>>({})

  useEffect(() => {
    // Check if user is staff/admin
    if (user && user.role !== 'staff') {
      toast.error('Access denied. Admin privileges required.')
      router.push('/dashboard/client')
      return
    }
    
    if (user && id) {
      fetchOnboarding()
    }
  }, [user, router, id])

  const fetchOnboarding = async () => {
    try {
      setLoading(true)
      const { data, error } = await SupabaseService.getVillaOnboarding(id)
      
      if (error) {
        console.error('Error fetching onboarding:', error)
        toast.error('Failed to load villa onboarding')
        router.push('/admin')
        return
      }

      setOnboarding(data)
      setEditData(data || {})
    } catch (error) {
      console.error('Error fetching onboarding:', error)
      toast.error('Failed to load villa onboarding')
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: VillaOnboarding['status']) => {
    if (!onboarding) return

    try {
      const { error } = await SupabaseService.updateVillaOnboarding(onboarding.id, { status: newStatus })
      
      if (error) {
        toast.error('Failed to update status')
        return
      }

      setOnboarding(prev => prev ? { ...prev, status: newStatus } : null)
      toast.success(`Status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const saveChanges = async () => {
    if (!onboarding) return

    try {
      const { error } = await SupabaseService.updateVillaOnboarding(onboarding.id, editData)
      
      if (error) {
        toast.error('Failed to save changes')
        return
      }

      setOnboarding(prev => prev ? { ...prev, ...editData } : null)
      setEditing(false)
      toast.success('Changes saved successfully')
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error('Failed to save changes')
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

  if (!user || user.role !== 'staff') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-400">Admin privileges required to access this page.</p>
          <Link href="/dashboard/client">
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
          <p className="text-neutral-400">The requested villa onboarding could not be found.</p>
          <Link href="/admin">
            <Button className="mt-4">Back to Admin</Button>
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
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            {getStatusBadge(onboarding.status)}
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{onboarding.property_name}</h1>
              <p className="text-neutral-400">Villa Onboarding Details</p>
            </div>
            
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button onClick={saveChanges} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={() => setEditing(false)} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status Actions */}
        {onboarding.status === 'pending' && (
          <div className="mb-6 flex gap-4">
            <Button
              onClick={() => updateStatus('under_review')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Mark Under Review
            </Button>
            <Button
              onClick={() => updateStatus('approved')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => updateStatus('rejected')}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Owner Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Owner Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400">Full Name</label>
                {editing ? (
                  <Input
                    value={editData.owner_full_name || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, owner_full_name: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-white">{onboarding.owner_full_name}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm text-neutral-400">Email</label>
                {editing ? (
                  <Input
                    value={editData.owner_email || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, owner_email: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-white">{onboarding.owner_email}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm text-neutral-400">Contact Number</label>
                {editing ? (
                  <Input
                    value={editData.owner_contact_number || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, owner_contact_number: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-white">{onboarding.owner_contact_number}</p>
                )}
              </div>
              
              {onboarding.owner_nationality && (
                <div>
                  <label className="text-sm text-neutral-400">Nationality</label>
                  {editing ? (
                    <Input
                      value={editData.owner_nationality || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, owner_nationality: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-white">{onboarding.owner_nationality}</p>
                  )}
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

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400">Property Name</label>
                {editing ? (
                  <Input
                    value={editData.property_name || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, property_name: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-white">{onboarding.property_name}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm text-neutral-400">Address</label>
                {editing ? (
                  <Input
                    value={editData.property_address || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, property_address: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-white">{onboarding.property_address}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-neutral-400">Bedrooms</label>
                  {editing ? (
                    <Input
                      type="number"
                      value={editData.bedrooms || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || undefined }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-white">{onboarding.bedrooms || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-neutral-400">Bathrooms</label>
                  {editing ? (
                    <Input
                      type="number"
                      value={editData.bathrooms || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || undefined }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-white">{onboarding.bathrooms || 'Not specified'}</p>
                  )}
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

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
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

          {/* Rental Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Rental & Marketing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {onboarding.rental_rates && (
                  <div>
                    <label className="text-sm text-neutral-400">Rental Rates</label>
                    <p className="text-white">{onboarding.rental_rates}</p>
                  </div>
                )}
                {onboarding.minimum_stay_requirements && (
                  <div>
                    <label className="text-sm text-neutral-400">Minimum Stay</label>
                    <p className="text-white">{onboarding.minimum_stay_requirements}</p>
                  </div>
                )}
                {onboarding.average_occupancy_rate && (
                  <div>
                    <label className="text-sm text-neutral-400">Average Occupancy Rate</label>
                    <p className="text-white">{onboarding.average_occupancy_rate}</p>
                  </div>
                )}
                {onboarding.target_guests && (
                  <div>
                    <label className="text-sm text-neutral-400">Target Guests</label>
                    <p className="text-white">{onboarding.target_guests}</p>
                  </div>
                )}
              </div>

              {onboarding.platforms_listed && onboarding.platforms_listed.length > 0 && (
                <div>
                  <label className="text-sm text-neutral-400">Listed Platforms</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {onboarding.platforms_listed.map((platform, index) => (
                      <Badge key={index} variant="outline">{platform}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
