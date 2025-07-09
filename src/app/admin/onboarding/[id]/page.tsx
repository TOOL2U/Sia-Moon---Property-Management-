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
  MapPin,
  User,
  Home,
  DollarSign,
  Phone,
  Mail,
  Globe
} from 'lucide-react'
import toast from 'react-hot-toast'

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
    } catch (error) {
      console.error('Error updating status:', error)
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
