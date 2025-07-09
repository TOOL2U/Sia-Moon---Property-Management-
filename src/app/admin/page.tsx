'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { OnboardingService, OnboardingSubmission } from '@/lib/services/onboardingService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Users,
  FileText,
  Calendar,
  Settings,
  Eye,
  Filter,
  Search,
  BarChart3,
  Image as ImageIcon
} from 'lucide-react'
import { AdminVillaPhotoDownload } from '@/components/AdminVillaPhotoDownload'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<OnboardingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Route protection - admin only
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('❌ No user found, redirecting to login')
        router.push('/auth/login')
        return
      }
      if (user.role !== 'admin') {
        console.log('❌ User is not admin, redirecting to client dashboard')
        router.push('/dashboard/client')
        return
      }
      console.log('✅ Admin user verified, loading admin dashboard')
    }
  }, [user, authLoading, router])

  // Fetch onboarding submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (user?.role === 'admin') {
        try {
          setLoading(true)
          const data = await OnboardingService.getAllSubmissions()
          setSubmissions(data)
        } catch (error) {
          console.error('Error fetching submissions:', error)
          toast.error('Failed to load onboarding submissions')
        } finally {
          setLoading(false)
        }
      }
    }

    fetchSubmissions()
  }, [user])

  // Filter submissions based on search and status
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch =
      submission.ownerFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleViewSubmission = (id: string) => {
    router.push(`/admin/onboarding/${id}`)
  }

  const handleStatusUpdate = async (id: string, newStatus: 'pending' | 'reviewed' | 'approved' | 'rejected') => {
    try {
      await OnboardingService.updateSubmissionStatus(id, newStatus)
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === id ? { ...sub, status: newStatus } : sub
        )
      )
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-neutral-400">Manage onboarding submissions, bookings, and system settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{submissions.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {submissions.filter(s => s.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {submissions.filter(s => s.status === 'approved').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {submissions.filter(s => {
                  const submissionDate = s.createdAt.toDate()
                  const now = new Date()
                  return submissionDate.getMonth() === now.getMonth() &&
                         submissionDate.getFullYear() === now.getFullYear()
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Villa Photo Management */}
        <Card className="bg-neutral-900 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Villa Photo Management
            </CardTitle>
            <CardDescription>
              Download and manage villa photos uploaded by property owners during onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminVillaPhotoDownload />
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card className="bg-neutral-900 border-neutral-800 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, property..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-neutral-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Submissions */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Onboarding Submissions</CardTitle>
            <CardDescription>
              Review and manage villa onboarding submissions from property owners
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400">No submissions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">{submission.ownerFullName}</h3>
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status || 'pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-400 mb-1">{submission.ownerEmail}</p>
                        <p className="text-sm text-neutral-400 mb-1">
                          <strong>Property:</strong> {submission.propertyName}
                        </p>
                        <p className="text-sm text-neutral-400 mb-3">
                          <strong>Address:</strong> {submission.propertyAddress}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Submitted: {submission.createdAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSubmission(submission.id)}
                          className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Future Sections Placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Bookings Management
              </CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 text-sm">
                Manage property bookings and reservations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Maintenance Jobs
              </CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 text-sm">
                Track and assign maintenance tasks
              </p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 text-sm">
                View performance metrics and reports
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
