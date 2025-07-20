'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Brain,
    FileText,
    GraduationCap,
    MapPin,
    Menu,
    RefreshCw,
    Settings,
    Shield,
    TestTube,
    X
} from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

// Auth imports
import { useAuthGuard } from '@/lib/auth/useAuthGuard'

// Configuration imports

// AI Dashboard Components
import ActivityFeed from '@/components/ai/ActivityFeed'
import AIAPIMonitor from '@/components/ai/AIAPIMonitor'
import AIDecisionLog from '@/components/ai/AIDecisionLog'
import AISettingsPanel from '@/components/ai/AISettingsPanel'
import AISummaryPanel from '@/components/ai/AISummaryPanel'
import EscalationReviewDialog from '@/components/ai/EscalationReviewDialog'
import SimulationTester from '@/components/ai/SimulationTester'

// Missing Components from Original Dashboard

// Additional AI Components from old dashboard
import AIEscalationQueue from '@/components/admin/AIEscalationQueue'

// Missing Components - Added for feature parity
import AIAnalyticsSidebar from '@/components/admin/AIAnalyticsSidebar'
import MonthlyFinancialReport from '@/components/ai/MonthlyFinancialReport'
import RulesManager from '@/components/ai/RulesManager'
import StaffScheduleMap from '@/components/ai/StaffScheduleMap'
import TrainingLogViewer from '@/components/ai/TrainingLogViewer'

// AI Logging System
import { AILogEntry } from '@/lib/ai/aiLogger'

interface EscalatedDecision {
  id: string
  agent: 'COO' | 'CFO'
  decision: string
  rule: string
  confidence: number
  timestamp: string
  context?: any
}

export default function AIDashboardPage() {
  // Auth guard - protect AI Dashboard with admin access
  const { isAuthorized, isLoading, user, adminStatus } = useAuthGuard({
    requireAdmin: true,
    requiredFeature: 'overview',
    redirectTo: '/unauthorized',
    bypassInDev: true
  })

  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [escalatedDecisions, setEscalatedDecisions] = useState<EscalatedDecision[]>([])
  const [selectedEscalation, setSelectedEscalation] = useState<EscalatedDecision | null>(null)
  const [showEscalationDialog, setShowEscalationDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  // Additional state for AI logs and decisions
  const [aiLogs, setAiLogs] = useState<AILogEntry[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Mobile detection and sidebar management
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Auto-collapse sidebar on mobile
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [sidebarCollapsed])

  // Load escalated decisions and AI logs
  useEffect(() => {
    loadEscalatedDecisions()
    loadAILogs()

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadEscalatedDecisions()
      loadAILogs()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadEscalatedDecisions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai-log?escalated=true')

      if (response.ok) {
        const data = await response.json()
        setEscalatedDecisions(data.logs || [])
      } else {
        // Mock escalated decisions for development
        setEscalatedDecisions([
          {
            id: 'esc-001',
            agent: 'COO',
            decision: 'Assign staff to Villa Paradise maintenance',
            rule: 'Distance constraint exceeded (18km)',
            confidence: 65,
            timestamp: new Date().toISOString(),
            context: { distance: 18, estimatedTime: 35 }
          },
          {
            id: 'esc-002',
            agent: 'CFO',
            decision: 'Approve ฿12,000 emergency repair expense',
            rule: 'Amount exceeds daily approval limit',
            confidence: 72,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            context: { amount: 12000, dailyLimit: 8000 }
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load escalated decisions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEscalationClick = (escalation: EscalatedDecision) => {
    setSelectedEscalation(escalation)
    setShowEscalationDialog(true)
  }

  const handleEscalationResolved = () => {
    setShowEscalationDialog(false)
    setSelectedEscalation(null)
    loadEscalatedDecisions() // Refresh the list
  }

  // Load AI logs function
  const loadAILogs = async () => {
    setLoading(true)
    try {
      console.log('📊 AI Dashboard: Loading logs from API...')

      const response = await fetch('/api/ai-log?limit=100')

      if (response.ok) {
        const data = await response.json()
        const logs = data.logs || []
        setAiLogs(logs)
        setLastUpdate(new Date())
        console.log('✅ AI Dashboard: Loaded', logs.length, 'AI log entries from API')
      } else {
        console.warn('⚠️ AI Dashboard: API failed, using fallback data')
        // Generate mock data for development
        const mockLogs = generateMockLogs()
        setAiLogs(mockLogs)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('❌ AI Dashboard: Error loading logs:', error)
      // Fallback to mock data
      const mockLogs = generateMockLogs()
      setAiLogs(mockLogs)
      setLastUpdate(new Date())
      console.log('🔄 AI Dashboard: Using fallback mock data')
    } finally {
      setLoading(false)
    }
  }

  // Handle manual refresh
  const handleManualRefresh = () => {
    loadAILogs()
    loadEscalatedDecisions()
  }

  // Handle escalation approval
  const handleApproveEscalation = (log: AILogEntry, notes?: string) => {
    console.log('Approving escalation:', log.decision, 'Notes:', notes)
    // Update the log status
    setAiLogs(logs => logs.map(l =>
      l.timestamp === log.timestamp ? { ...l, escalation: false } : l
    ))
  }

  // Handle escalation rejection
  const handleRejectEscalation = (log: AILogEntry, notes?: string) => {
    console.log('Rejecting escalation:', log.decision, 'Notes:', notes)
    // Update the log status
    setAiLogs(logs => logs.map(l =>
      l.timestamp === log.timestamp ? { ...l, escalation: false } : l
    ))
  }

  // Handle override submission
  const handleOverrideSubmitted = async (overrideData: any) => {
    try {
      console.log('🔄 AI Dashboard: Processing override submission:', overrideData)

      // Log the override action to the centralized logging system
      const response = await fetch('/api/ai-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          agent: overrideData.agent || 'COO',
          decision: `Override: ${overrideData.originalDecision || 'Manual intervention'}`,
          confidence: 100, // Manual overrides have 100% confidence
          rationale: overrideData.reason || 'Manual override by administrator',
          escalate: false,
          source: 'override',
          status: 'completed',
          notes: `Admin override: ${overrideData.reason}`,
          metadata: {
            originalDecision: overrideData.originalDecision,
            adminId: 'current-user', // TODO: Get from auth context
            overrideTimestamp: new Date().toISOString()
          }
        })
      })

      if (response.ok) {
        console.log('✅ AI Dashboard: Override logged successfully')
      } else {
        console.warn('⚠️ AI Dashboard: Failed to log override to API')
      }

      // Refresh the logs to show the new override entry
      await loadAILogs()

    } catch (error) {
      console.error('❌ AI Dashboard: Error processing override:', error)
      // Still refresh logs even if logging failed
      await loadAILogs()
    }
  }

  // Mock data generator for testing
  const generateMockLogs = (): AILogEntry[] => {
    const decisions = [
      'Booking approved for Villa Lotus',
      'Staff assigned to cleaning task',
      'High-value expense flagged for review',
      'Financial analysis completed',
      'Emergency repair request escalated',
      'Monthly budget analysis finished',
      'Booking rejected - insufficient data',
      'Duplicate expense detected'
    ]

    const agents: ('COO' | 'CFO')[] = ['COO', 'CFO']

    return Array.from({ length: 15 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(),
      agent: agents[Math.floor(Math.random() * agents.length)],
      decision: decisions[Math.floor(Math.random() * decisions.length)],
      confidence: Math.floor(Math.random() * 40) + 60, // 60-100
      source: 'auto' as const,
      escalation: Math.random() < 0.3, // 30% escalation rate
      notes: Math.random() < 0.5 ? `Generated at ${new Date().toLocaleTimeString()}` : undefined
    }))
  }

  // Sidebar navigation items - Complete feature parity with original dashboard
  const sidebarItems = React.useMemo(() => [
    {
      id: 'overview',
      label: 'Overview',
      icon: Brain,
      component: (
        <div className="space-y-6">
          <AISummaryPanel />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeed logs={aiLogs} maxHeight="400px" />
            </div>
            <div>
              <AIAnalyticsSidebar logs={aiLogs} />
            </div>
          </div>
          <AIEscalationQueue
            logs={aiLogs.filter(log => log.escalation)}
            onApprove={handleApproveEscalation}
            onReject={handleRejectEscalation}
          />
        </div>
      )
    },
    {
      id: 'decisions',
      label: 'Decision Log',
      icon: FileText,
      component: (
        <div className="space-y-6">
          <AIDecisionLog showTestRunner={true} />
          <AIEscalationQueue
            logs={aiLogs.filter(log => log.escalation)}
            onApprove={handleApproveEscalation}
            onReject={handleRejectEscalation}
          />
        </div>
      )
    },
    {
      id: 'assignments',
      label: 'Staff Assignments',
      icon: MapPin,
      component: <StaffScheduleMap />
    },
    {
      id: 'reports',
      label: 'Financial Reports',
      icon: BarChart3,
      component: <MonthlyFinancialReport maxReports={4} />
    },
    {
      id: 'rules',
      label: 'Rules Engine',
      icon: Shield,
      component: <RulesManager />
    },
    {
      id: 'training',
      label: 'Feedback Loop',
      icon: GraduationCap,
      component: <TrainingLogViewer maxHeight="600px" />
    },
    {
      id: 'monitor',
      label: 'API Monitor',
      icon: Activity,
      component: <AIAPIMonitor maxHeight="600px" />
    },
    {
      id: 'simulation',
      label: 'Simulation',
      icon: TestTube,
      component: <SimulationTester />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      component: <AISettingsPanel />
    }
  ], [aiLogs, handleApproveEscalation, handleRejectEscalation, handleManualRefresh, handleEscalationClick])

  // Filter sidebar items based on user permissions (role-based access control)
  const filteredSidebarItems = sidebarItems.filter(item => {
    // Always show overview and decisions for any admin
    if (item.id === 'overview' || item.id === 'decisions') return true

    // Check specific feature access
    const featureMap: Record<string, string> = {
      'assignments': 'staff-map',
      'reports': 'reports',
      'rules': 'rules',
      'training': 'feedback',
      'simulation': 'simulation',
      'monitor': 'monitor',
      'settings': 'settings'
    }

    const requiredFeature = featureMap[item.id]
    if (requiredFeature) {
      return adminStatus.accessibleFeatures.includes(requiredFeature)
    }

    return true // Default to showing item if no specific requirement
  })

  // Helper function to toggle sidebar
  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Get current section component
  const getCurrentComponent = () => {
    const currentItem = filteredSidebarItems.find(item => item.id === activeSection)
    return currentItem?.component || filteredSidebarItems[0]?.component
  }

  // Show loading state while checking authorization
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading AI Dashboard...</p>
          <p className="text-gray-400 text-sm mt-2">Checking authorization...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized state (this shouldn't normally be reached due to redirect)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">🚫 Access Denied</h1>
          <p className="text-gray-400 mb-4">You do not have permission to view the AI Dashboard.</p>
          <Button asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-neutral-950 border-r border-neutral-800 z-50
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-blue-500" />
                <div>
                  <h2 className="text-lg font-semibold text-white">AI Dashboard</h2>
                  <p className="text-xs text-neutral-400">Operations Center</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <Brain className="h-8 w-8 text-blue-500 mx-auto" />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSidebarToggle}
              className="text-neutral-400 hover:text-white p-2"
            >
              {sidebarCollapsed ? (
                <Menu className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {filteredSidebarItems.map((item) => {
              const isActive = activeSection === item.id
              const Icon = item.icon

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Sidebar Footer - Quick Stats */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-neutral-800">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Escalations</span>
                <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  {aiLogs.filter(log => log.escalation).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Total Logs</span>
                <span className="text-white">{aiLogs.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out min-h-screen
        ${isMobile
          ? 'ml-0'
          : sidebarCollapsed
            ? 'ml-16'
            : 'ml-64'
        }
      `}>
        {/* Top Header */}
        <header className="bg-neutral-950 border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Mobile Menu + Title */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-neutral-400 hover:text-white p-2 md:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              )}

              <div>
                <h1 className="text-xl font-semibold text-white">
                  {filteredSidebarItems.find(item => item.id === activeSection)?.label || 'AI Dashboard'}
                </h1>
                <p className="text-sm text-neutral-400 mt-0.5">
                  Centralized AI management and monitoring
                </p>
              </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center gap-4">
              {/* Escalation Alerts */}
              {aiLogs.filter(log => log.escalation).length > 0 && (
                <div className="hidden md:flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-neutral-400">
                    {aiLogs.filter(log => log.escalation).length} decision{aiLogs.filter(log => log.escalation).length !== 1 ? 's' : ''} need review
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const firstEscalated = aiLogs.find(log => log.escalation)
                      if (firstEscalated) {
                        handleEscalationClick({
                          id: `esc-${firstEscalated.timestamp}-0`,
                          agent: firstEscalated.agent,
                          decision: firstEscalated.decision,
                          rule: firstEscalated.notes || 'Requires manual review',
                          confidence: firstEscalated.confidence,
                          timestamp: firstEscalated.timestamp,
                          context: {}
                        })
                      }
                    }}
                    className="border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                  >
                    Review
                  </Button>
                </div>
              )}

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={loading}
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Simulation Mode Banner */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-3">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 text-yellow-800">
                <span className="text-lg">🧪</span>
                <span className="font-medium">Simulation Mode is Active</span>
                <span className="text-sm">— No live changes are being made.</span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Escalation Alert */}
        {aiLogs.filter(log => log.escalation).length > 0 && (
          <div className="md:hidden bg-orange-500/20 border-b border-orange-500/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-400">
                  {aiLogs.filter(log => log.escalation).length} decision{aiLogs.filter(log => log.escalation).length !== 1 ? 's' : ''} need review
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const firstEscalated = aiLogs.find(log => log.escalation)
                  if (firstEscalated) {
                    handleEscalationClick({
                      id: `esc-${firstEscalated.timestamp}-0`,
                      agent: firstEscalated.agent,
                      decision: firstEscalated.decision,
                      rule: firstEscalated.notes || 'Requires manual review',
                      confidence: firstEscalated.confidence,
                      timestamp: firstEscalated.timestamp,
                      context: {}
                    })
                  }
                }}
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
              >
                Review
              </Button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="p-6">
          <div className="min-h-[600px]">
            {getCurrentComponent()}
          </div>
        </main>
      </div>

      {/* Escalation Review Dialog */}
      <EscalationReviewDialog
        escalation={selectedEscalation}
        open={showEscalationDialog}
        onClose={() => setShowEscalationDialog(false)}
        onResolved={handleEscalationResolved}
      />
    </div>
  )
}
