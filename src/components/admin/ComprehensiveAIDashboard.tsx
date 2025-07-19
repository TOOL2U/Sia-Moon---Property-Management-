'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Brain,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  Crown,
  Database,
  Eye,
  FileText,
  Gauge,
  Loader2,
  MessageSquare,
  RefreshCw,
  Settings,
  Smartphone,
  Target,
  TestTube,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

// Import all AI Dashboard components
import { motion } from 'framer-motion'
import AIAuditLogViewer from './AIAuditLogViewer'
import AIAutomationToggle from './AIAutomationToggle'
import AIBookingTestPanel from './AIBookingTestPanel'
import AICOODashboard from './AICOODashboard'
import AIDisabledWarning from './AIDisabledWarning'
import AIJobCreationPanel from './AIJobCreationPanel'
import AIOperationsTestingAgent from './AIOperationsTestingAgent'
import AIPerformanceDashboard from './AIPerformanceDashboard'
import AISettingsModal from './AISettingsModal'
import AIWizardJobPanel from './AIWizardJobPanel'
import SmartJobAnalyticsDashboard from './SmartJobAnalyticsDashboard'
import SmartJobTestPanel from './SmartJobTestPanel'

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

export default function ComprehensiveAIDashboard() {
  const [activeTab, setActiveTab] = useState('command-center')
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* AI Dashboard Header */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-700/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    AI Command Center
                    <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
                      ACTIVE
                    </Badge>
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border-purple-500/30">
                      v2.1.0
                    </Badge>
                  </CardTitle>
                  <p className="text-purple-200 mt-1">
                    Comprehensive AI operations monitoring, testing, and
                    administration
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
                <Button
                  onClick={() => setSettingsModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  AI Settings
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* AI Dashboard Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50">
            <TabsTrigger
              value="command-center"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Command Center
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="testing"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Testing
            </TabsTrigger>
            <TabsTrigger
              value="operations"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              Operations
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-rose-600 data-[state=active]:text-white"
            >
              <Target className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger
              value="automation"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
            >
              <Bot className="w-4 h-4 mr-2" />
              Automation
            </TabsTrigger>
            <TabsTrigger
              value="monitoring"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          {/* Command Center Tab */}
          <TabsContent value="command-center" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI COO Dashboard */}
              <div className="lg:col-span-2">
                <AICOODashboard />
              </div>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6 mt-6">
            <AIPerformanceDashboard />
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6 mt-6">
            {/* AI Operations Testing Agent - Main Testing Suite */}
            <div className="mb-8">
              <AIOperationsTestingAgent />
            </div>

            {/* Individual Test Panels */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-6">
                <AIBookingTestPanel />
                <SmartJobTestPanel />
              </div>
              <div className="space-y-6">
                <AIWizardJobPanel />
                <AIJobCreationPanel />
              </div>
            </div>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 gap-6">
              {/* AI Automation Control */}
              <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    AI Automation Control Center
                    <Badge className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-400 border-teal-500/30">
                      Master Control
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AIAutomationToggle />
                </CardContent>
              </Card>

              {/* AI Disabled Warning */}
              <AIDisabledWarning />

              {/* Mobile Integration Status */}
              <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    Mobile Integration Status
                    <Badge className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30">
                      Real-time
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <div className="text-lg font-bold text-green-400">
                        Connected
                      </div>
                      <div className="text-sm text-green-300">
                        Mobile App Sync
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                      <Bell className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <div className="text-lg font-bold text-blue-400">
                        Active
                      </div>
                      <div className="text-sm text-blue-300">
                        Push Notifications
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Acceptance Panel */}
              <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-white" />
                    </div>
                    Job Acceptance Monitoring
                    <Badge className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30">
                      Live
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-yellow-400">3</div>
                      <div className="text-xs text-yellow-300">
                        Pending Jobs
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-green-400">12</div>
                      <div className="text-xs text-green-300">
                        Accepted Today
                      </div>
                    </div>
                    <div className="text-center p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-red-400">1</div>
                      <div className="text-xs text-red-300">Overdue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-6">
                <SmartJobAnalyticsDashboard />

                {/* Job Completion Analytics */}
                <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      Job Completion Analytics
                      <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
                        Real-time
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                        <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-400">
                          94.2%
                        </div>
                        <div className="text-sm text-green-300">
                          Completion Rate
                        </div>
                      </div>
                      <div className="text-center p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                        <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-400">
                          2.3h
                        </div>
                        <div className="text-sm text-blue-300">Avg Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Notification Dashboard */}
                <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Bell className="w-4 h-4 text-white" />
                      </div>
                      Notification Analytics
                      <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30">
                        Live
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="text-center p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                        <MessageSquare className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-purple-400">
                          156
                        </div>
                        <div className="text-sm text-purple-300">
                          Notifications Sent Today
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                        <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-400">
                          89.3%
                        </div>
                        <div className="text-sm text-green-300">
                          Delivery Success Rate
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calendar Sync Analytics */}
                <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      Calendar Sync Status
                      <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30">
                        Synchronized
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-cyan-900/20 border border-cyan-700/30 rounded-lg">
                        <Activity className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-cyan-400">
                          24
                        </div>
                        <div className="text-sm text-cyan-300">
                          Events Synced
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                        <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-400">
                          100%
                        </div>
                        <div className="text-sm text-green-300">
                          Sync Success
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-6 mt-6">
            <AIAuditLogViewer />
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Automation Status */}
              <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    Automation Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <div className="text-lg font-bold text-green-400">
                        Active
                      </div>
                      <div className="text-sm text-green-300">
                        Booking Approval
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                      <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <div className="text-lg font-bold text-blue-400">
                        Active
                      </div>
                      <div className="text-sm text-blue-300">
                        Staff Assignment
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                      <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <div className="text-lg font-bold text-purple-400">
                        Active
                      </div>
                      <div className="text-sm text-purple-300">
                        Calendar Sync
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-900/20 border border-orange-700/30 rounded-lg">
                      <Bell className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                      <div className="text-lg font-bold text-orange-400">
                        Active
                      </div>
                      <div className="text-sm text-orange-300">
                        Notifications
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={() => setSettingsModalOpen(true)}
                      className="w-full justify-start bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure AI Settings
                    </Button>
                    <Button
                      onClick={() => setActiveTab('testing')}
                      className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Run AI Tests
                    </Button>
                    <Button
                      onClick={() => setActiveTab('audit')}
                      className="w-full justify-start bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Audit Logs
                    </Button>
                    <Button
                      onClick={() => setActiveTab('performance')}
                      className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Performance Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI System Health */}
              <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    AI System Health
                    <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
                      Healthy
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-white">AI Decision Engine</span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Online
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-white">Booking Processor</span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-white">Staff Assignment AI</span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Running
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Gauge className="w-4 h-4 text-white" />
                    </div>
                    Performance Metrics
                    <Badge className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30">
                      Real-time
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                      <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-400">
                        1.2s
                      </div>
                      <div className="text-sm text-blue-300">
                        Avg Response Time
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-400">
                        99.8%
                      </div>
                      <div className="text-sm text-purple-300">Uptime</div>
                    </div>
                    <div className="text-center p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                      <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-400">
                        96.4%
                      </div>
                      <div className="text-sm text-green-300">Accuracy</div>
                    </div>
                    <div className="text-center p-4 bg-orange-900/20 border border-orange-700/30 rounded-lg">
                      <Database className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-400">
                        2.1GB
                      </div>
                      <div className="text-sm text-orange-300">
                        Memory Usage
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent AI Activities */}
              <Card className="lg:col-span-2 bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    Recent AI Activities
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30">
                      Live Feed
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          Booking Approved
                        </div>
                        <div className="text-sm text-green-300">
                          Villa Sunset Paradise - Guest: John Smith - ฿15,000
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">2 min ago</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                      <Users className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          Staff Assigned
                        </div>
                        <div className="text-sm text-blue-300">
                          Maria Santos assigned to cleaning job - Confidence:
                          94%
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">5 min ago</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                      <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          Calendar Updated
                        </div>
                        <div className="text-sm text-purple-300">
                          3 events synchronized with mobile app
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">8 min ago</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-900/20 border border-orange-700/30 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          Escalation Triggered
                        </div>
                        <div className="text-sm text-orange-300">
                          Job unaccepted for 30+ minutes - Admin notified
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">12 min ago</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </motion.div>
  )
}
