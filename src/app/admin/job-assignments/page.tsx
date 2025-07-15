/**
 * Enhanced Job Assignments Page
 * Comprehensive professional job assignment management system
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  MapPin,
  Users,
  BarChart3,
  Smartphone,
  Settings,
  Plus,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

// Import the new enhanced components
import StaffLocationTracker from '@/components/job-assignment/StaffLocationTracker'
import JobManagementInterface from '@/components/job-assignment/JobManagementInterface'
import StaffMonitoringDashboard from '@/components/job-assignment/StaffMonitoringDashboard'
import AnalyticsReporting from '@/components/job-assignment/AnalyticsReporting'
import MobileIntegrationLayer from '@/components/job-assignment/MobileIntegrationLayer'
import CreateJobModal from '@/components/job-assignment/CreateJobModal'

import { JobAssignment, JobAnalytics } from '@/types/enhancedJobAssignment'

export default function JobAssignmentsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardStats, setDashboardStats] = useState({
    totalJobs: 0,
    activeStaff: 0,
    completionRate: 0,
    overdueJobs: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateJobModal, setShowCreateJobModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobAssignment | null>(null)

  // Load dashboard overview data
  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true)

      // Mock dashboard stats - replace with actual API calls
      const mockStats = {
        totalJobs: 156,
        activeStaff: 12,
        completionRate: 91.2,
        overdueJobs: 6
      }

      setDashboardStats(mockStats)

    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateJob = () => {
    setShowCreateJobModal(true)
  }

  const handleEditJob = (job: JobAssignment) => {
    setSelectedJob(job)
    // Open edit modal or navigate to edit page
  }

  const handleViewJob = (job: JobAssignment) => {
    setSelectedJob(job)
    // Open job details modal or navigate to details page
  }

  const handleViewJobById = (jobId: string) => {
    console.log(`Viewing job details for ID: ${jobId}`)
    // Implementation to find job by ID and view details
  }

  const handleStaffSelect = (staffId: string) => {
    // Switch to staff monitoring tab and select the staff member
    setActiveTab('staff-monitoring')
  }

  const handleSendNotification = (staffId: string, message: string) => {
    console.log(`Sending notification to ${staffId}: ${message}`)
    // Implement notification sending logic
  }

  const handleMessageStaff = (staffId: string, message: string) => {
    console.log(`Sending message to ${staffId}: ${message}`)
    // Implement messaging logic
  }

  const handleExportReport = (reportType: string) => {
    console.log(`Exporting ${reportType} report`)
    // Implement report export logic
  }

  const handleForceSync = (deviceId: string) => {
    console.log(`Forcing sync for device ${deviceId}`)
    // Implement force sync logic
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Job Assignment Management</h1>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Professional System
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleCreateJob}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Job
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Jobs</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.totalJobs}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Staff</p>
                  <p className="text-2xl font-bold text-green-400">{dashboardStats.activeStaff}</p>
                </div>
                <Users className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-blue-400">{dashboardStats.completionRate}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Overdue Jobs</p>
                  <p className="text-2xl font-bold text-red-400">{dashboardStats.overdueJobs}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 border border-gray-700">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="location-tracking"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Location Tracking
            </TabsTrigger>
            <TabsTrigger
              value="staff-monitoring"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Staff Monitoring
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="mobile-integration"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Mobile Integration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <JobManagementInterface
              onCreateJob={handleCreateJob}
              onEditJob={handleEditJob}
              onViewJob={handleViewJob}
            />
          </TabsContent>

          <TabsContent value="location-tracking" className="space-y-6">
            <StaffLocationTracker
              onStaffSelect={handleStaffSelect}
            />
          </TabsContent>

          <TabsContent value="staff-monitoring" className="space-y-6">
            <StaffMonitoringDashboard
              onMessageStaff={handleMessageStaff}
              onViewJobDetails={handleViewJobById}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsReporting
              onExportReport={handleExportReport}
            />
          </TabsContent>

          <TabsContent value="mobile-integration" className="space-y-6">
            <MobileIntegrationLayer
              onSendNotification={handleSendNotification}
              onForcSync={handleForceSync}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Job Modal */}
      {showCreateJobModal && (
        <CreateJobModal
          isOpen={showCreateJobModal}
          onClose={() => setShowCreateJobModal(false)}
          onJobCreated={(jobId: string) => {
            console.log('Job created with ID:', jobId)
            setShowCreateJobModal(false)
            // Refresh the job list or update UI as needed
          }}
        />
      )}
    </div>
  )
}