'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { motion } from 'framer-motion'
import {
  Bot,
  Calendar,
  CheckCircle,
  Database,
  Globe,
  Smartphone,
  Sync,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface IntegrationStatus {
  id: string
  name: string
  type: 'calendar' | 'mobile' | 'ai' | 'reporting' | 'sync'
  status: 'connected' | 'disconnected' | 'syncing' | 'error'
  lastSync?: Date
  errorMessage?: string
  metrics?: {
    totalSyncs: number
    successRate: number
    avgSyncTime: number
  }
}

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: string
  action: string
  enabled: boolean
  lastTriggered?: Date
  executionCount: number
}

interface AIRecommendation {
  id: string
  type: 'staffing' | 'maintenance' | 'pricing' | 'guest_service'
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  priority: number
  createdAt: Date
}

interface IntegrationAutomationPanelProps {
  isFullScreen?: boolean
}

export default function IntegrationAutomationPanel({
  isFullScreen = false,
}: IntegrationAutomationPanelProps) {
  const [activeTab, setActiveTab] = useState<
    'integrations' | 'automation' | 'ai' | 'reporting'
  >('integrations')
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([])
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<
    AIRecommendation[]
  >([])
  const [isOnline, setIsOnline] = useState(true)

  // Mock data initialization
  useEffect(() => {
    const mockIntegrations: IntegrationStatus[] = [
      {
        id: '1',
        name: 'Google Calendar',
        type: 'calendar',
        status: 'connected',
        lastSync: new Date(Date.now() - 5 * 60 * 1000),
        metrics: { totalSyncs: 1247, successRate: 98.5, avgSyncTime: 2.3 },
      },
      {
        id: '2',
        name: 'Mobile App',
        type: 'mobile',
        status: 'connected',
        lastSync: new Date(Date.now() - 2 * 60 * 1000),
        metrics: { totalSyncs: 892, successRate: 99.2, avgSyncTime: 1.8 },
      },
      {
        id: '3',
        name: 'AI Assistant',
        type: 'ai',
        status: 'syncing',
        lastSync: new Date(Date.now() - 1 * 60 * 1000),
        metrics: { totalSyncs: 456, successRate: 97.8, avgSyncTime: 3.1 },
      },
      {
        id: '4',
        name: 'Automated Reports',
        type: 'reporting',
        status: 'connected',
        lastSync: new Date(Date.now() - 15 * 60 * 1000),
        metrics: { totalSyncs: 234, successRate: 100, avgSyncTime: 5.2 },
      },
      {
        id: '5',
        name: 'Real-time Sync',
        type: 'sync',
        status: 'error',
        lastSync: new Date(Date.now() - 30 * 60 * 1000),
        errorMessage: 'Connection timeout - retrying...',
        metrics: { totalSyncs: 2341, successRate: 95.2, avgSyncTime: 1.2 },
      },
    ]

    const mockAutomationRules: AutomationRule[] = [
      {
        id: '1',
        name: 'Auto-assign cleaning tasks',
        description:
          'Automatically assign cleaning tasks when guests check out',
        trigger: 'Guest checkout',
        action: 'Create cleaning task',
        enabled: true,
        lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
        executionCount: 156,
      },
      {
        id: '2',
        name: 'Emergency staff notification',
        description: 'Send push notifications to all staff during emergencies',
        trigger: 'Emergency alert created',
        action: 'Send push notifications',
        enabled: true,
        lastTriggered: new Date(Date.now() - 24 * 60 * 60 * 1000),
        executionCount: 3,
      },
      {
        id: '3',
        name: 'Maintenance scheduling',
        description: 'Schedule preventive maintenance based on usage patterns',
        trigger: 'Property usage threshold',
        action: 'Schedule maintenance',
        enabled: false,
        executionCount: 0,
      },
    ]

    const mockAIRecommendations: AIRecommendation[] = [
      {
        id: '1',
        type: 'staffing',
        title: 'Increase weekend staffing',
        description:
          'Based on booking patterns, consider adding 2 more housekeepers for weekends',
        confidence: 87,
        impact: 'high',
        priority: 1,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: '2',
        type: 'maintenance',
        title: 'Pool maintenance optimization',
        description:
          'Schedule pool cleaning every 3 days instead of daily to reduce costs',
        confidence: 92,
        impact: 'medium',
        priority: 2,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        id: '3',
        type: 'pricing',
        title: 'Dynamic pricing adjustment',
        description:
          'Increase rates by 15% for Ocean View Villa during peak season',
        confidence: 78,
        impact: 'high',
        priority: 3,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ]

    setIntegrations(mockIntegrations)
    setAutomationRules(mockAutomationRules)
    setAiRecommendations(mockAIRecommendations)

    // Simulate network status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getStatusIcon = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'syncing':
        return <Sync className="w-4 h-4 text-blue-400 animate-spin" />
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-400" />
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-600'
      case 'syncing':
        return 'bg-blue-600'
      case 'error':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getTypeIcon = (type: IntegrationStatus['type']) => {
    switch (type) {
      case 'calendar':
        return <Calendar className="w-4 h-4" />
      case 'mobile':
        return <Smartphone className="w-4 h-4" />
      case 'ai':
        return <Bot className="w-4 h-4" />
      case 'reporting':
        return <TrendingUp className="w-4 h-4" />
      case 'sync':
        return <Database className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-600'
      case 'medium':
        return 'bg-yellow-600'
      case 'low':
        return 'bg-green-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <Card className="bg-gray-800 border-gray-700 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Integration & Automation
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <Badge
              className={`text-xs ${isOnline ? 'bg-green-600' : 'bg-red-600'} text-white`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="h-full"
        >
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 mx-4">
            <TabsTrigger
              value="integrations"
              className="text-gray-300 data-[state=active]:text-white text-xs"
            >
              Integrations
            </TabsTrigger>
            <TabsTrigger
              value="automation"
              className="text-gray-300 data-[state=active]:text-white text-xs"
            >
              Automation
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="text-gray-300 data-[state=active]:text-white text-xs"
            >
              AI
            </TabsTrigger>
            <TabsTrigger
              value="reporting"
              className="text-gray-300 data-[state=active]:text-white text-xs"
            >
              Reports
            </TabsTrigger>
          </TabsList>

          <div className="p-4 h-96 overflow-y-auto">
            <TabsContent value="integrations" className="space-y-3 mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {integrations.map((integration, index) => (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-gray-700 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(integration.type)}
                        <span className="text-white text-sm font-medium">
                          {integration.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <Badge
                          className={`text-xs ${getStatusColor(integration.status)} text-white`}
                        >
                          {integration.status}
                        </Badge>
                      </div>
                    </div>

                    {integration.lastSync && (
                      <p className="text-gray-400 text-xs mb-2">
                        Last sync: {getTimeAgo(integration.lastSync)}
                      </p>
                    )}

                    {integration.errorMessage && (
                      <p className="text-red-400 text-xs mb-2">
                        {integration.errorMessage}
                      </p>
                    )}

                    {integration.metrics && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-gray-400">Syncs</p>
                          <p className="text-white font-medium">
                            {integration.metrics.totalSyncs}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400">Success</p>
                          <p className="text-white font-medium">
                            {integration.metrics.successRate}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400">Avg Time</p>
                          <p className="text-white font-medium">
                            {integration.metrics.avgSyncTime}s
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-3 mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {automationRules.map((rule, index) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-gray-700 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-white text-sm font-medium">
                          {rule.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs ${rule.enabled ? 'bg-green-600' : 'bg-gray-600'} text-white`}
                        >
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-400 text-xs mb-2">
                      {rule.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <p className="text-gray-400">Trigger:</p>
                        <p className="text-white">{rule.trigger}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Action:</p>
                        <p className="text-white">{rule.action}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        Executed: {rule.executionCount} times
                      </span>
                      {rule.lastTriggered && (
                        <span className="text-gray-400">
                          Last: {getTimeAgo(rule.lastTriggered)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-3 mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {aiRecommendations.map((recommendation, index) => (
                  <motion.div
                    key={recommendation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-gray-700 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-purple-400" />
                        <span className="text-white text-sm font-medium">
                          {recommendation.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs ${getImpactColor(recommendation.impact)} text-white`}
                        >
                          {recommendation.impact}
                        </Badge>
                        <Badge className="bg-blue-600 text-white text-xs">
                          {recommendation.confidence}%
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-400 text-xs mb-2">
                      {recommendation.description}
                    </p>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 capitalize">
                        {recommendation.type.replace('_', ' ')}
                      </span>
                      <span className="text-gray-400">
                        {getTimeAgo(recommendation.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="reporting" className="space-y-3 mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Quick Report Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    onClick={() => console.log('Generate daily report')}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Daily Report
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                    onClick={() => console.log('Generate weekly report')}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Weekly Report
                  </Button>
                </div>

                {/* Report Status */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-300">
                    Recent Reports
                  </h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-gray-700 rounded border border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs">
                          Daily Operations Report
                        </span>
                        <Badge className="bg-green-600 text-white text-xs">
                          Completed
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs">
                        Generated 2 hours ago
                      </p>
                    </div>
                    <div className="p-2 bg-gray-700 rounded border border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs">
                          Weekly Performance Report
                        </span>
                        <Badge className="bg-blue-600 text-white text-xs">
                          Scheduled
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs">
                        Next: Tomorrow 9:00 AM
                      </p>
                    </div>
                    <div className="p-2 bg-gray-700 rounded border border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs">
                          Monthly Financial Report
                        </span>
                        <Badge className="bg-yellow-600 text-white text-xs">
                          Processing
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs">ETA: 15 minutes</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
