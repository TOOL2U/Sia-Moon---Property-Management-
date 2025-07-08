'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DatabaseService from '@/lib/dbService'
import { VillaOnboarding } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Building, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Bed,
  Bath,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Plus,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ClientOnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [onboardings, setOnboardings] = useState<VillaOnboarding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is client
    if (user && user.role !== 'client') {
      toast.error('Access denied. Client access required.')
      router.push('/dashboard/staff')
      return
    }
    
    if (user) {
      fetchUserOnboardings()
    }
  }, [user, router])

  const fetchUserOnboardings = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await DatabaseService.getVillaOnboardingsByUserId(user.id)
      
      if (error) {
        console.error('Error fetching user onboardings:', error)
        toast.error('Failed to load your villa submissions')
        return
      }

      setOnboardings(data || [])
    } catch (error) {
      console.error('Error fetching user onboardings:', error)
      toast.error('Failed to load your villa submissions')
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
      pending: 'Your villa submission is pending review by our team.',
      under_review: 'Our team is currently reviewing your villa submission.',
      approved: 'Congratulations! Your villa has been approved and is ready for listing.',
      rejected: 'Your villa submission needs some updates. Please review and resubmit.'
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Villa Submissions</h1>
              <p className="text-neutral-400">View and manage your villa onboarding submissions</p>
            </div>
            
            <Link href="/onboard">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Submit New Villa
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading your villa submissions...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && onboardings.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Villa Submissions Yet</h3>
            <p className="text-neutral-400 mb-6">
              You haven't submitted any villas for onboarding yet. Get started by submitting your first villa.
            </p>
            <Link href="/onboard">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Submit Your First Villa
              </Button>
            </Link>
          </div>
        )}

        {/* Onboarding Cards */}
        {!loading && onboardings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {onboardings.map((onboarding) => (
              <Card key={onboarding.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        {onboarding.property_name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {onboarding.property_address}
                      </CardDescription>
                    </div>
                    {getStatusBadge(onboarding.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Property Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Bed className="h-4 w-4 text-neutral-400" />
                        <span>{onboarding.bedrooms || 'N/A'} Bedrooms</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Bath className="h-4 w-4 text-neutral-400" />
                        <span>{onboarding.bathrooms || 'N/A'} Bathrooms</span>
                      </div>
                    </div>

                    {/* Status Message */}
                    <div className="bg-neutral-800 rounded-lg p-3">
                      <p className="text-sm text-neutral-300">
                        {getStatusMessage(onboarding.status)}
                      </p>
                    </div>

                    {/* Submission Date */}
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Submitted {new Date(onboarding.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/dashboard/client/onboarding/${onboarding.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      {(onboarding.status === 'pending' || onboarding.status === 'rejected') && (
                        <Link href={`/onboard?edit=${onboarding.id}`} className="flex-1">
                          <Button size="sm" className="w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
