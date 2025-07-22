'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { db } from '@/lib/firebase'
import { clientToast as toast } from '@/utils/clientToast'
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    where
} from 'firebase/firestore'
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Minus,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    User,
    Users
} from 'lucide-react'
import { useEffect, useState } from 'react'

// Staff Audit Report interface based on the documentation
interface StaffAuditReport {
  staffId: string
  weekStart: string
  weekEnd: string
  trustScore: number
  qualityScore: number
  metrics: {
    jobsCompleted: number
    jobsAccepted: number
    averageCompletionTime: number
    onTimeCompletionRate: number
    photoComplianceRate: number
    gpsAccuracy: number
    aiUsageCount: number
    responseTime: number
  }
  insights: {
    strengths: string[]
    concerns: string[]
    recommendations: string[]
    behavioralPatterns: string[]
  }
  trends: {
    trustScoreTrend: 'improving' | 'declining' | 'stable'
    qualityTrend: 'improving' | 'declining' | 'stable'
    productivityTrend: 'improving' | 'declining' | 'stable'
  }
  aiAnalysis: string
  createdAt: string
  weekNumber: number
  year: number
}

interface StaffAuditReportsProps {
  staffList?: any[]
}

export default function StaffAuditReports({ staffList = [] }: StaffAuditReportsProps) {
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState<StaffAuditReport[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [selectedReport, setSelectedReport] = useState<StaffAuditReport | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTrend, setFilterTrend] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [realtimeEnabled, setRealtimeEnabled] = useState(true)
  const [unsubscribers, setUnsubscribers] = useState<(() => void)[]>([])

  // Load latest reports for all staff
  const loadLatestReports = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading latest staff audit reports...')

      const auditCollection = collection(db, 'ai_audits')
      const auditDocs = await getDocs(auditCollection)

      const reportPromises = []

      for (const auditDoc of auditDocs.docs) {
        const staffId = auditDoc.id
        if (staffId === 'metadata') continue // Skip metadata doc

        // Get latest report for this staff member
        const staffReportsRef = collection(db, 'ai_audits', staffId, 'reports')
        const q = query(staffReportsRef, orderBy('createdAt', 'desc'), limit(1))
        reportPromises.push(getDocs(q).then(snapshot => {
          if (!snapshot.empty) {
            const reportData = snapshot.docs[0].data() as StaffAuditReport
            return {
              ...reportData,
              staffId
            }
          }
          return null
        }))
      }

      const reportResults = await Promise.all(reportPromises)
      const validReports = reportResults.filter(report => report !== null) as StaffAuditReport[]

      setReports(validReports)
      setLastUpdate(new Date())
      console.log(`✅ Loaded ${validReports.length} staff audit reports`)

    } catch (error) {
      console.error('❌ Error loading staff audit reports:', error)
      toast.error('Failed to load staff audit reports')
    } finally {
      setLoading(false)
    }
  }

  // Load all reports for a specific staff member
  const loadStaffReports = async (staffId: string) => {
    try {
      setLoading(true)
      console.log(`🔄 Loading audit reports for staff ${staffId}...`)

      const staffReportsRef = collection(db, 'ai_audits', staffId, 'reports')
      const q = query(staffReportsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)

      const staffReports = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        staffId
      })) as StaffAuditReport[]

      setReports(staffReports)
      setSelectedStaffId(staffId)
      setLastUpdate(new Date())
      console.log(`✅ Loaded ${staffReports.length} reports for staff ${staffId}`)

    } catch (error) {
      console.error(`❌ Error loading reports for staff ${staffId}:`, error)
      toast.error('Failed to load staff reports')
    } finally {
      setLoading(false)
    }
  }

  // Load specific report
  const loadReport = async (staffId: string, reportId: string) => {
    try {
      setLoading(true)
      console.log(`🔄 Loading report ${reportId} for staff ${staffId}...`)

      const reportRef = doc(db, 'ai_audits', staffId, 'reports', reportId)
      const reportDoc = await getDoc(reportRef)

      if (reportDoc.exists()) {
        const reportData = reportDoc.data() as StaffAuditReport
        setSelectedReport({
          ...reportData,
          staffId
        })
        console.log(`✅ Loaded report ${reportId}`)
      } else {
        console.error(`❌ Report ${reportId} not found`)
        toast.error('Report not found')
      }

    } catch (error) {
      console.error(`❌ Error loading report ${reportId}:`, error)
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  // Set up real-time listeners for live audit reports from mobile app
  const setupRealtimeListeners = () => {
    if (!realtimeEnabled) return

    console.log('🔄 Setting up real-time audit report listeners...')

    // Clean up existing listeners
    unsubscribers.forEach(unsub => unsub())
    setUnsubscribers([])

    const newUnsubscribers: (() => void)[] = []

    try {
      // Listen for new audit reports across all staff
      const auditCollection = collection(db, 'ai_audits')

      // We'll listen to each staff's reports subcollection
      // First get all staff IDs
      getDocs(auditCollection).then(auditDocs => {
        auditDocs.docs.forEach(auditDoc => {
          const staffId = auditDoc.id
          if (staffId === 'metadata') return

          // Set up listener for this staff's reports
          const staffReportsRef = collection(db, 'ai_audits', staffId, 'reports')
          const q = query(staffReportsRef, orderBy('createdAt', 'desc'), limit(5))

          const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const newReport = {
                  ...change.doc.data(),
                  staffId
                } as StaffAuditReport

                console.log('🔔 New audit report received:', {
                  staffId: newReport.staffId,
                  weekStart: newReport.weekStart,
                  trustScore: newReport.trustScore
                })

                // Update reports state with new report
                setReports(prevReports => {
                  // Remove any existing report for this staff/week
                  const filtered = prevReports.filter(r =>
                    !(r.staffId === newReport.staffId && r.weekStart === newReport.weekStart)
                  )
                  // Add the new report
                  return [newReport, ...filtered]
                })

                setLastUpdate(new Date())
                toast.success(`New audit report received for ${getStaffName(newReport.staffId)}`)
              }
            })
          }, (error) => {
            console.error(`❌ Real-time listener error for staff ${staffId}:`, error)
          })

          newUnsubscribers.push(unsubscribe)
        })
      })

      // Listen for audit notifications
      const notificationsRef = collection(db, 'audit_notifications')
      const notificationsQuery = query(
        notificationsRef,
        where('read', '==', false),
        orderBy('timestamp', 'desc'),
        limit(10)
      )

      const notificationsUnsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = change.doc.data()
            console.log('🔔 Audit notification:', notification)

            if (notification.type === 'new_audit_report') {
              // Refresh data to get the latest reports
              loadLatestReports()
            }
          }
        })
      })

      newUnsubscribers.push(notificationsUnsubscribe)
      setUnsubscribers(newUnsubscribers)

      console.log(`✅ Set up ${newUnsubscribers.length} real-time listeners`)

    } catch (error) {
      console.error('❌ Error setting up real-time listeners:', error)
    }
  }

  // Cleanup real-time listeners
  const cleanupRealtimeListeners = () => {
    unsubscribers.forEach(unsub => unsub())
    setUnsubscribers([])
    console.log('🧹 Cleaned up real-time listeners')
  }

  // Export report to CSV
  const exportReportToCSV = (report: StaffAuditReport) => {
    try {
      const headers = [
        'Staff ID', 'Week Start', 'Week End', 'Trust Score', 'Quality Score',
        'Jobs Completed', 'Jobs Accepted', 'Avg Completion Time', 'On-Time Rate',
        'Photo Compliance', 'GPS Accuracy', 'AI Usage', 'Response Time',
        'Trust Trend', 'Quality Trend', 'Productivity Trend'
      ]

      const data = [
        report.staffId,
        report.weekStart,
        report.weekEnd,
        report.trustScore,
        report.qualityScore,
        report.metrics.jobsCompleted,
        report.metrics.jobsAccepted,
        report.metrics.averageCompletionTime,
        report.metrics.onTimeCompletionRate,
        report.metrics.photoComplianceRate,
        report.metrics.gpsAccuracy,
        report.metrics.aiUsageCount,
        report.metrics.responseTime,
        report.trends.trustScoreTrend,
        report.trends.qualityTrend,
        report.trends.productivityTrend
      ]

      const csvContent = [
        headers.join(','),
        data.join(',')
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `staff_audit_${report.staffId}_${report.weekStart}.csv`
      a.click()

      URL.revokeObjectURL(url)
      toast.success('Report exported successfully')

    } catch (error) {
      console.error('❌ Error exporting report:', error)
      toast.error('Failed to export report')
    }
  }

  // Load initial data and set up real-time listeners
  useEffect(() => {
    loadLatestReports()

    if (realtimeEnabled) {
      setupRealtimeListeners()
    }

    // Cleanup on unmount
    return () => {
      cleanupRealtimeListeners()
    }
  }, [realtimeEnabled])

  // Set up real-time listeners when realtime is enabled
  useEffect(() => {
    if (realtimeEnabled && reports.length > 0) {
      setupRealtimeListeners()
    }

    return () => {
      if (!realtimeEnabled) {
        cleanupRealtimeListeners()
      }
    }
  }, [realtimeEnabled])

  // Filter and sort reports
  const filteredReports = reports.filter(report => {
    const matchesSearch =
      report.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getStaffName(report.staffId).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTrend =
      filterTrend === 'all' ||
      report.trends.trustScoreTrend === filterTrend ||
      report.trends.qualityTrend === filterTrend ||
      report.trends.productivityTrend === filterTrend

    return matchesSearch && matchesTrend
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'desc'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    } else if (sortBy === 'trust') {
      return sortOrder === 'desc'
        ? b.trustScore - a.trustScore
        : a.trustScore - b.trustScore
    } else if (sortBy === 'quality') {
      return sortOrder === 'desc'
        ? b.qualityScore - a.qualityScore
        : a.qualityScore - b.qualityScore
    }
    return 0
  })

  // Helper function to get staff name from ID
  const getStaffName = (staffId: string): string => {
    const staff = staffList.find(s => s.id === staffId)
    return staff ? staff.name : staffId
  }

  // Helper function to get trend icon
  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-400" />
      case 'stable':
        return <Minus className="h-4 w-4 text-blue-400" />
    }
  }

  // Helper function to get score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Audit Reports
            </CardTitle>
            <CardDescription>
              AI-generated weekly staff performance reports
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm">
              <div className={`w-2 h-2 rounded-full ${realtimeEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-neutral-400">
                {realtimeEnabled ? 'Live' : 'Manual'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRealtimeEnabled(!realtimeEnabled)}
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              {realtimeEnabled ? 'Disable Live' : 'Enable Live'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadLatestReports()}
              disabled={loading}
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedReport ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReport(null)}
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                Back to Reports
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReportToCSV(selectedReport)}
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-neutral-800 border-neutral-700">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center">
                    <User className="h-6 w-6 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{getStaffName(selectedReport.staffId)}</h3>
                    <p className="text-sm text-neutral-400">
                      Week {selectedReport.weekNumber}, {selectedReport.year} • {selectedReport.weekStart} to {selectedReport.weekEnd}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <div className="text-sm text-neutral-400 mb-1">Trust Score</div>
                    <div className="flex items-center justify-between">
                      <div className={`text-2xl font-bold ${getScoreColor(selectedReport.trustScore)}`}>
                        {selectedReport.trustScore}
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(selectedReport.trends.trustScoreTrend)}
                        <span className="text-sm capitalize">{selectedReport.trends.trustScoreTrend}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-800 rounded-lg p-4">
                    <div className="text-sm text-neutral-400 mb-1">Quality Score</div>
                    <div className="flex items-center justify-between">
                      <div className={`text-2xl font-bold ${getScoreColor(selectedReport.qualityScore)}`}>
                        {selectedReport.qualityScore}
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(selectedReport.trends.qualityTrend)}
                        <span className="text-sm capitalize">{selectedReport.trends.qualityTrend}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-800 rounded-lg p-4">
                    <div className="text-sm text-neutral-400 mb-1">Productivity</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-white">
                        {selectedReport.metrics.jobsCompleted}/{selectedReport.metrics.jobsAccepted}
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(selectedReport.trends.productivityTrend)}
                        <span className="text-sm capitalize">{selectedReport.trends.productivityTrend}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <div className="text-sm text-neutral-400 mb-2">Jobs</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">Completed</span>
                        <span className="text-white">{selectedReport.metrics.jobsCompleted}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">Accepted</span>
                        <span className="text-white">{selectedReport.metrics.jobsAccepted}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">Completion Rate</span>
                        <span className="text-white">
                          {Math.round(selectedReport.metrics.jobsCompleted / selectedReport.metrics.jobsAccepted * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-800 rounded-lg p-4">
                    <div className="text-sm text-neutral-400 mb-2">Time Metrics</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">Avg. Completion Time</span>
                        <span className="text-white">{selectedReport.metrics.averageCompletionTime} min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">On-Time Rate</span>
                        <span className="text-white">
                          {Math.round(selectedReport.metrics.onTimeCompletionRate * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">Response Time</span>
                        <span className="text-white">{selectedReport.metrics.responseTime} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-800 rounded-lg p-4">
                    <div className="text-sm text-neutral-400 mb-2">Compliance</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">Photo Compliance</span>
                        <span className="text-white">
                          {Math.round(selectedReport.metrics.photoComplianceRate * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">GPS Accuracy</span>
                        <span className="text-white">
                          {Math.round(selectedReport.metrics.gpsAccuracy * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-800 rounded-lg p-4">
                    <div className="text-sm text-neutral-400 mb-2">AI Usage</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">AI Interactions</span>
                        <span className="text-white">{selectedReport.metrics.aiUsageCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="insights" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <div className="text-sm text-neutral-400 mb-2 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Strengths
                    </div>
                    <ul className="space-y-2">
                      {selectedReport.insights.strengths.map((strength, index) => (
                        <li key={index} className="text-white text-sm">• {strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-neutral-800 rounded-lg p-4">
                    <div className="text-sm text-neutral-400 mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      Concerns
                    </div>
                    <ul className="space-y-2">
                      {selectedReport.insights.concerns.map((concern, index) => (
                        <li key={index} className="text-white text-sm">• {concern}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-neutral-800 rounded-lg p-4 md:col-span-2">
                    <div className="text-sm text-neutral-400 mb-2">Recommendations</div>
                    <ul className="space-y-2">
                      {selectedReport.insights.recommendations.map((recommendation, index) => (
                        <li key={index} className="text-white text-sm">• {recommendation}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-neutral-800 rounded-lg p-4 md:col-span-2">
                    <div className="text-sm text-neutral-400 mb-2">Behavioral Patterns</div>
                    <ul className="space-y-2">
                      {selectedReport.insights.behavioralPatterns.map((pattern, index) => (
                        <li key={index} className="text-white text-sm">• {pattern}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="mt-4">
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="text-sm text-neutral-400 mb-2">AI Analysis</div>
                  <div className="text-white whitespace-pre-line">
                    {selectedReport.aiAnalysis}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterTrend} onValueChange={setFilterTrend}>
                  <SelectTrigger className="w-[140px] bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Filter trend" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trends</SelectItem>
                    <SelectItem value="improving">Improving</SelectItem>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="declining">Declining</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="trust">Trust Score</SelectItem>
                    <SelectItem value="quality">Quality Score</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-neutral-400" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit reports found</p>
                <p className="text-sm">Staff performance reports will appear here when available</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-neutral-400">
                  {lastUpdate && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last updated: {lastUpdate.toLocaleTimeString()}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {filteredReports.map((report, index) => (
                    <div
                      key={index}
                      className="bg-neutral-800 rounded-lg p-4 hover:bg-neutral-750 cursor-pointer transition-colors"
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-neutral-700 flex items-center justify-center">
                            <User className="h-5 w-5 text-neutral-300" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{getStaffName(report.staffId)}</div>
                            <div className="text-sm text-neutral-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Week {report.weekNumber}, {report.year}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-xs text-neutral-400">Trust</div>
                            <div className={`font-medium ${getScoreColor(report.trustScore)}`}>
                              {report.trustScore}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-neutral-400">Quality</div>
                            <div className={`font-medium ${getScoreColor(report.qualityScore)}`}>
                              {report.qualityScore}
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="text-xs text-neutral-400">Trend</div>
                            <div className="flex items-center">
                              {getTrendIcon(report.trends.trustScoreTrend)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
