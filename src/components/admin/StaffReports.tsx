'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { type AuditReport } from '@/services/AIAuditService'
import { JobSessionService, type JobSessionData, type StaffAuditReport } from '@/services/JobSessionService'
import { motion } from 'framer-motion'
import {
    BarChart3,
    Brain,
    Calendar,
    CheckCircle,
    Clock,
    Loader2,
    Star,
    TrendingUp,
    User,
    Users
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  status?: string
  firebaseUid?: string
}

export function StaffReports() {
  const [loading, setLoading] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30)
  const [auditReport, setAuditReport] = useState<StaffAuditReport | null>(null)
  const [aiAuditReport, setAiAuditReport] = useState<AuditReport | null>(null)
  const [recentSessions, setRecentSessions] = useState<JobSessionData[]>([])
  const [reportType, setReportType] = useState<'legacy' | 'ai'>('ai')
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [staffLoading, setStaffLoading] = useState(false)

  // Load real staff data from the same API used by backoffice
  const loadStaffData = useCallback(async () => {
    try {
      setStaffLoading(true)
      console.log('📋 Loading staff data for AI audit reports...')

      const response = await fetch('/api/admin/staff-accounts')
      const data = await response.json()

      if (data.success && data.data) {
        // Filter only active staff members and map to our interface
        const activeStaff: StaffMember[] = data.data
          .filter((staff: any) => staff.status === 'active' || staff.isActive)
          .map((staff: any) => ({
            id: staff.firebaseUid || staff.id, // Use Firebase UID for job session matching
            name: staff.name,
            email: staff.email,
            role: staff.role,
            status: staff.status,
            firebaseUid: staff.firebaseUid
          }))

        setStaffMembers(activeStaff)
        console.log(`✅ Loaded ${activeStaff.length} active staff members for AI audit`)
      } else {
        console.error('❌ Failed to load staff data:', data.error)
        toast.error('Failed to load staff data')
        setStaffMembers([])
      }
    } catch (error) {
      console.error('❌ Error loading staff data:', error)
      toast.error('Error loading staff data')
      setStaffMembers([])
    } finally {
      setStaffLoading(false)
    }
  }, [])

  // Load staff data on component mount
  useEffect(() => {
    loadStaffData()
  }, [])

  const generateReport = useCallback(async () => {
    if (!selectedStaff) {
      toast.error('Please select a staff member')
      return
    }

    try {
      setLoading(true)
      console.log(`📊 Generating ${reportType} audit report for staff: ${selectedStaff}`)

      const staffMember = staffMembers.find(s => s.id === selectedStaff)
      if (!staffMember) {
        toast.error('Staff member not found')
        return
      }

      if (reportType === 'ai') {
        // Use Firebase UID for job session matching
        const staffId = staffMember.firebaseUid || staffMember.id

        console.log(`🤖 Generating AI audit for staff: ${staffMember.name} (ID: ${staffId})`)

        // Generate AI-powered audit report (using simplified API for now)
        const response = await fetch(`/api/ai-audit/simple-report/${staffId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffName: staffMember.name
          })
        })

        const result = await response.json()
        if (result.success) {
          setAiAuditReport(result.report)
          setAuditReport(null) // Clear legacy report
          toast.success(`🤖 AI audit report generated for ${staffMember.name}`)

          console.log(`✅ AI audit completed with score: ${result.report.performanceScore}`)
        } else {
          console.error('❌ AI audit failed:', result)
          throw new Error(result.message || 'Failed to generate AI audit report')
        }
      } else {
        // Use Firebase UID for job session matching
        const staffId = staffMember.firebaseUid || staffMember.id

        console.log(`📊 Generating legacy audit for staff: ${staffMember.name} (ID: ${staffId})`)

        // Generate legacy audit report
        const report = await JobSessionService.generateStaffAuditReport(
          staffId,
          staffMember.name,
          selectedPeriod
        )

        setAuditReport(report)
        setAiAuditReport(null) // Clear AI report
        setRecentSessions(report.recentSessions)
        toast.success(`✅ Legacy audit report generated for ${staffMember.name}`)
      }
    } catch (error) {
      console.error('❌ Error generating audit report:', error)
      toast.error('Failed to generate audit report')
    } finally {
      setLoading(false)
    }
  }, [selectedStaff, selectedPeriod, reportType])

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDate = (date: Date | any): string => {
    if (!date) return 'N/A'
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getScoreColor = (score: number): string => {
    if (score >= 8.5) return 'text-green-400'
    if (score >= 7.0) return 'text-yellow-400'
    if (score >= 5.0) return 'text-orange-400'
    return 'text-red-400'
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            Staff Reports & AI Audits
          </h2>
          <p className="text-gray-400 mt-1">AI-powered performance analysis from mobile job sessions</p>
          <p className="text-sm text-blue-400 mt-1">
            {staffMembers.length} active staff members available for analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={loadStaffData}
            disabled={staffLoading}
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {staffLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
            Live Mobile Data
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Generate Staff Audit Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Staff Member</label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff} disabled={staffLoading}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder={staffLoading ? "Loading staff..." : "Select staff member"} />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.length === 0 && !staffLoading ? (
                    <SelectItem value="no-staff" disabled>
                      <div className="flex items-center gap-2 text-gray-400">
                        <User className="w-4 h-4" />
                        <span>No active staff found</span>
                      </div>
                    </SelectItem>
                  ) : (
                    staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{staff.name}</span>
                          <span className="text-gray-400">({staff.role})</span>
                          {staff.firebaseUid && (
                            <span className="text-xs text-blue-400">✓</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {staffLoading && (
                <p className="text-xs text-gray-400 mt-1">Loading staff members from Firestore...</p>
              )}
              {!staffLoading && staffMembers.length === 0 && (
                <p className="text-xs text-red-400 mt-1">No active staff members found. Please add staff in the Staff tab.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Report Type</label>
              <Select value={reportType} onValueChange={(value: 'legacy' | 'ai') => setReportType(value)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      <span>AI Audit</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="legacy">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Legacy</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === 'legacy' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Period</label>
                <Select value={selectedPeriod.toString()} onValueChange={(value) => setSelectedPeriod(parseInt(value))}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={generateReport}
              disabled={loading || !selectedStaff}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Audit Report */}
      {aiAuditReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* AI Performance Score */}
          <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm font-medium">AI Performance Score</p>
                  <p className={`text-4xl font-bold ${getScoreColor(aiAuditReport.performanceScore)}`}>
                    {aiAuditReport.performanceScore}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Generated: {formatDate(new Date(aiAuditReport.generatedAt))}
                  </p>
                </div>
                <div className="text-center">
                  <Brain className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                  <Badge className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border-purple-500/30">
                    AI Analysis
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Summary */}
          <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Executive Summary</h4>
                  <p className="text-gray-300">{aiAuditReport.analysis.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                    <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {aiAuditReport.analysis.strengths.map((strength, index) => (
                        <li key={index} className="text-gray-300 text-sm">• {strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                    <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Improvements
                    </h4>
                    <ul className="space-y-1">
                      {aiAuditReport.analysis.improvements.map((improvement, index) => (
                        <li key={index} className="text-gray-300 text-sm">• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="w-5 h-5" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiAuditReport.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-300">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Trends */}
          {aiAuditReport.trends.length > 0 && (
            <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiAuditReport.trends.map((trend, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-gray-300">{trend}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anomalies Detection */}
          {aiAuditReport.anomalies.length > 0 && (
            <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Anomalies Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiAuditReport.anomalies.map((anomaly, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-red-900/20 rounded-lg">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-gray-300">{anomaly}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Legacy Audit Report */}
      {auditReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm font-medium">Total Jobs</p>
                    <p className="text-2xl font-bold text-white">{auditReport.metrics.totalJobs}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold text-white">{auditReport.metrics.completedJobs}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border-yellow-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">Avg Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(auditReport.metrics.averageAuditScore)}`}>
                      {auditReport.metrics.averageAuditScore.toFixed(1)}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-sm font-medium">Avg Time</p>
                    <p className="text-2xl font-bold text-white">
                      {formatDuration(auditReport.metrics.averageCompletionTime)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditReport.aiInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-300">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditReport.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-300">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Job Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSessions.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No recent job sessions found</p>
                ) : (
                  recentSessions.map((session, index) => (
                    <div key={session.jobId} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">Job {session.jobId}</p>
                          <p className="text-gray-400 text-sm">{formatDate(session.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                        {session.auditScore && (
                          <div className={`text-sm font-medium ${getScoreColor(session.auditScore)}`}>
                            Score: {session.auditScore.toFixed(1)}
                          </div>
                        )}
                        {session.completionData?.timeSpent && (
                          <div className="text-sm text-gray-400">
                            {formatDuration(session.completionData.timeSpent)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
