'use client'

import { useState, useEffect } from 'react'
import { OnboardingService, OnboardingSubmission } from '@/lib/services/onboardingService'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building, 
  User, 
  Phone, 
  Mail,
  MapPin,
  FileText,
  Download
} from 'lucide-react'
import { clientToast as toast } from '@/utils/clientToast'

export default function VillaReviewsAdmin() {
  const [submissions, setSubmissions] = useState<OnboardingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<OnboardingSubmission | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    fetchSubmissions()
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSubmissions = async () => {
    try {
      const allSubmissions = await OnboardingService.getAllSubmissions()

      let filteredData = allSubmissions
      if (filter !== 'all') {
        filteredData = allSubmissions.filter(submission => submission.status === filter)
      }

      setSubmissions(filteredData)
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('Failed to load villa submissions')
    } finally {
      setLoading(false)
    }
  }

  const updateSubmissionStatus = async (id: string, status: string) => {
    try {
      await OnboardingService.updateSubmissionStatus(
        id,
        status as 'pending' | 'reviewed' | 'approved' | 'rejected'
      )

      toast.success(`Villa submission ${status} successfully`)
      fetchSubmissions()
      setSelectedSubmission(null)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update submission status')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading villa submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Villa Review Dashboard</h1>
          <p className="mt-2 text-gray-600">Review and manage villa onboarding submissions</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'pending', 'under_review', 'approved', 'rejected'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status as typeof filter)}
              size="sm"
            >
              {status.replace('_', ' ').toUpperCase()}
              {status !== 'all' && (
                <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                  {submissions.filter(s => s.status === status).length}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Submissions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{submission.propertyName}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <User className="h-4 w-4 mr-1" />
                      {submission.ownerFullName}
                    </CardDescription>
                  </div>
                  {getStatusBadge(submission.status || 'pending')}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="truncate">{submission.propertyAddress}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    <span>{submission.bedrooms} bed • {submission.bathrooms} bath</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{formatDate(submission.createdAt.toDate().toISOString())}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {submission.hasPool && <Badge variant="secondary">Pool</Badge>}
                    {submission.hasGarden && <Badge variant="secondary">Garden</Badge>}
                    {submission.hasAirConditioning && <Badge variant="secondary">A/C</Badge>}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSubmission(submission)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    
                    {submission.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {submissions.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No villa submissions have been received yet.' 
                : `No ${filter.replace('_', ' ')} submissions found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Detailed Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{selectedSubmission.propertyName}</h2>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedSubmission.status || 'pending')}
                  <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                    Close
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Owner Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Owner Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Name:</strong> {selectedSubmission.ownerFullName}</div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedSubmission.ownerEmail}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {selectedSubmission.ownerContactNumber}
                    </div>
                  </CardContent>
                </Card>

                {/* Property Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      Property Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Address:</strong> {selectedSubmission.propertyAddress}</div>
                    <div><strong>Bedrooms:</strong> {selectedSubmission.bedrooms}</div>
                    <div><strong>Bathrooms:</strong> {selectedSubmission.bathrooms}</div>
                    <div><strong>Submitted:</strong> {formatDate(selectedSubmission.createdAt.toDate().toISOString())}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Documents section removed - properties not available in interface */}

              {/* Action Buttons */}
              {selectedSubmission.status === 'pending' && (
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={() => updateSubmissionStatus(selectedSubmission.id, 'under_review')}
                    className="flex-1"
                  >
                    Mark Under Review
                  </Button>
                  <Button
                    onClick={() => updateSubmissionStatus(selectedSubmission.id, 'approved')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => updateSubmissionStatus(selectedSubmission.id, 'rejected')}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
