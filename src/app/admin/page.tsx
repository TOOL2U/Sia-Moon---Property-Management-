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
  AlertCircle,
  Bot,
  Shield,
  TrendingUp,
  AlertTriangle,
  Brain
} from 'lucide-react'
import BookingApprovalPanel from '@/components/admin/BookingApprovalPanel'
import { clientToast as toast } from '@/utils/clientToast'

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
                  let submissionDate: Date
                  if (s.createdAt && typeof s.createdAt.toDate === 'function') {
                    submissionDate = s.createdAt.toDate()
                  } else if (s.createdAt) {
                    submissionDate = new Date(s.createdAt as unknown as string)
                  } else {
                    submissionDate = new Date()
                  }
                  const now = new Date()
                  return submissionDate.getMonth() === now.getMonth() &&
                         submissionDate.getFullYear() === now.getFullYear()
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

    
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
                          Submitted: {
                            (() => {
                              if (submission.createdAt && typeof submission.createdAt.toDate === 'function') {
                                return submission.createdAt.toDate().toLocaleDateString()
                              } else if (submission.createdAt) {
                                return new Date(submission.createdAt as unknown as string).toLocaleDateString()
                              } else {
                                return new Date().toLocaleDateString()
                              }
                            })()
                          }
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

        {/* Enhanced Booking Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Ultimate Booking Management
              </CardTitle>
              <CardDescription>AI-powered booking automation and intelligent management</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-300 mb-4">
                Experience world-class booking management with real-time automation, smart client matching, and conflict resolution.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-neutral-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  AI-powered client matching
                </div>
                <div className="flex items-center text-sm text-neutral-400">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Real-time conflict detection
                </div>
                <div className="flex items-center text-sm text-neutral-400">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Automated task creation
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => router.push('/admin/bookings')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Open Booking Manager
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Analytics
              </CardTitle>
              <CardDescription>Data-driven insights and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-300 mb-4">
                Comprehensive analytics with revenue tracking, automation efficiency, and business intelligence.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-neutral-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Revenue optimization insights
                </div>
                <div className="flex items-center text-sm text-neutral-400">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Automation performance metrics
                </div>
                <div className="flex items-center text-sm text-neutral-400">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Predictive analytics
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={() => router.push('/admin/analytics')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Automation & Intelligence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Automation Rules
              </CardTitle>
              <CardDescription>Configure intelligent automation workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Active Rules</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">9 Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Success Rate</span>
                  <span className="text-green-400 font-medium">98.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Automation Efficiency</span>
                  <span className="text-blue-400 font-medium">95.2%</span>
                </div>
              </div>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => router.push('/admin/automation')}
              >
                <Bot className="h-4 w-4 mr-2" />
                Manage Rules
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Conflict Resolution
              </CardTitle>
              <CardDescription>Smart conflict detection and resolution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Active Conflicts</span>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">2 Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Auto-Resolved</span>
                  <span className="text-green-400 font-medium">147</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Conflict Rate</span>
                  <span className="text-orange-400 font-medium">2.1%</span>
                </div>
              </div>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                onClick={() => router.push('/admin/conflicts')}
              >
                <Shield className="h-4 w-4 mr-2" />
                View Conflicts
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Smart Recommendations
              </CardTitle>
              <CardDescription>AI-powered optimization suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">New Recommendations</span>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">5 New</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Revenue Impact</span>
                  <span className="text-green-400 font-medium">+$47K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Implementation</span>
                  <span className="text-blue-400 font-medium">12 Pending</span>
                </div>
              </div>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                onClick={() => router.push('/admin/recommendations')}
              >
                <Brain className="h-4 w-4 mr-2" />
                View Recommendations
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Original Booking Management (Legacy) */}
        <Card className="bg-neutral-900 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Legacy Booking Management
            </CardTitle>
            <CardDescription>Manage guest bookings from Make.com (Basic Version)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-300 mb-4">
              View, approve, and manage all guest bookings from the automation pipeline
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push('/admin/bookings-legacy')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Manage Bookings (Legacy)
            </Button>
          </CardContent>
        </Card>

        {/* Future Sections Placeholders */}
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Management
              </CardTitle>
              <CardDescription>Manage guest bookings from Make.com</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 text-sm mb-4">
                View, approve, and manage all guest bookings from the automation pipeline
              </p>
              <Button
                onClick={() => router.push('/admin/bookings')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Manage Bookings
              </Button>
            </CardContent>
          </Card>



          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Pending Approvals
              </CardTitle>
              <CardDescription>Quick approval panel</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingApprovalPanel />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Property Agent
              </CardTitle>
              <CardDescription>AI-powered booking analysis and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 text-sm mb-4">
                Review AI analysis of booking-property matching, provide feedback, and monitor automation performance
              </p>
              <Button
                onClick={() => router.push('/admin/ai-log')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                View AI Analysis Log
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Staff Task Management
              </CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 text-sm">
                Assign and track cleaning, maintenance, and preparation tasks
              </p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Financial Analytics
              </CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 text-sm">
                View booking revenue, occupancy rates, and performance metrics
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
