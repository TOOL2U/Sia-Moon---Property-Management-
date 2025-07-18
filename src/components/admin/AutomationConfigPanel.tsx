'use client'

/**
 * Automation Configuration Panel
 * Central control panel for all automation features and future enhancements
 *
 * Manages:
 * - Auto-assignment rules and settings
 * - Job escalation configurations
 * - AI staff suggestion preferences
 * - Calendar and scheduling automation
 * - KPI dashboard and analytics settings
 */

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Loader2,
  RefreshCw,
  Settings,
  Target,
  Users,
  Zap,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface AutomationConfigPanelProps {
  className?: string
}

// Automation feature status
interface AutomationFeature {
  id: string
  name: string
  description: string
  category: 'assignment' | 'escalation' | 'ai' | 'calendar' | 'analytics'
  status: 'enabled' | 'disabled' | 'development' | 'planned'
  priority: 'high' | 'medium' | 'low'
  estimatedCompletion?: string
  dependencies: string[]
  benefits: string[]
  icon: React.ReactNode
}

// Configuration section
interface ConfigSection {
  id: string
  title: string
  description: string
  features: AutomationFeature[]
  isExpanded: boolean
}

export function AutomationConfigPanel({
  className,
}: AutomationConfigPanelProps) {
  // State management
  const [configSections, setConfigSections] = useState<ConfigSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedFeature, setSelectedFeature] =
    useState<AutomationFeature | null>(null)

  // Load automation configuration
  useEffect(() => {
    loadAutomationConfig()
  }, [])

  const loadAutomationConfig = async () => {
    try {
      setLoading(true)
      console.log('⚙️ Loading automation configuration...')

      // Define automation features and their current status
      const automationFeatures: AutomationFeature[] = [
        // Auto-Assignment Features
        {
          id: 'workload_assignment',
          name: 'Workload-Based Assignment',
          description:
            'Automatically assign jobs to staff with lowest current workload',
          category: 'assignment',
          status: 'development',
          priority: 'high',
          estimatedCompletion: 'Next Sprint',
          dependencies: ['staff_data', 'job_queue'],
          benefits: [
            'Balanced workload',
            'Improved efficiency',
            'Reduced burnout',
          ],
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: 'zone_assignment',
          name: 'Zone-Based Assignment',
          description: 'Assign jobs to staff in the same geographical zone',
          category: 'assignment',
          status: 'development',
          priority: 'high',
          estimatedCompletion: 'Next Sprint',
          dependencies: ['location_data', 'zone_mapping'],
          benefits: ['Reduced travel time', 'Lower costs', 'Faster response'],
          icon: <Target className="w-4 h-4" />,
        },
        {
          id: 'skill_matching',
          name: 'Skill-Based Matching',
          description:
            'Match jobs to staff based on required skills and expertise',
          category: 'assignment',
          status: 'development',
          priority: 'medium',
          estimatedCompletion: 'Sprint 2',
          dependencies: ['skill_database', 'job_requirements'],
          benefits: ['Higher quality', 'Better outcomes', 'Staff satisfaction'],
          icon: <CheckCircle className="w-4 h-4" />,
        },

        // Escalation Features
        {
          id: 'time_escalation',
          name: '15-Minute Escalation',
          description:
            'Automatically escalate jobs not accepted within 15 minutes',
          category: 'escalation',
          status: 'development',
          priority: 'high',
          estimatedCompletion: 'Next Sprint',
          dependencies: ['notification_system', 'timer_service'],
          benefits: ['Faster response', 'No missed jobs', 'Better SLA'],
          icon: <Clock className="w-4 h-4" />,
        },
        {
          id: 'multi_level_escalation',
          name: 'Multi-Level Escalation',
          description: 'Escalate through staff → supervisor → admin hierarchy',
          category: 'escalation',
          status: 'development',
          priority: 'medium',
          estimatedCompletion: 'Sprint 2',
          dependencies: ['org_hierarchy', 'notification_system'],
          benefits: [
            'Clear escalation path',
            'Accountability',
            'Issue resolution',
          ],
          icon: <AlertTriangle className="w-4 h-4" />,
        },

        // AI Features
        {
          id: 'ai_staff_suggestions',
          name: 'AI Staff Suggestions',
          description: 'Use OpenAI/Claude to suggest optimal staff assignments',
          category: 'ai',
          status: 'development',
          priority: 'medium',
          estimatedCompletion: 'Sprint 3',
          dependencies: ['ai_api', 'historical_data', 'performance_metrics'],
          benefits: [
            'Intelligent decisions',
            'Learning system',
            'Optimization',
          ],
          icon: <Brain className="w-4 h-4" />,
        },
        {
          id: 'predictive_analytics',
          name: 'Predictive Analytics',
          description: 'Predict job demand and optimize staff scheduling',
          category: 'ai',
          status: 'planned',
          priority: 'low',
          estimatedCompletion: 'Sprint 4',
          dependencies: ['ai_api', 'historical_data', 'external_data'],
          benefits: [
            'Proactive planning',
            'Resource optimization',
            'Cost savings',
          ],
          icon: <BarChart3 className="w-4 h-4" />,
        },

        // Calendar Features
        {
          id: 'drag_drop_calendar',
          name: 'Drag-and-Drop Calendar',
          description: 'Visual job scheduling with drag-and-drop reassignment',
          category: 'calendar',
          status: 'development',
          priority: 'high',
          estimatedCompletion: 'Sprint 2',
          dependencies: ['calendar_ui', 'job_data', 'staff_schedules'],
          benefits: [
            'Visual scheduling',
            'Easy reassignment',
            'Better planning',
          ],
          icon: <Calendar className="w-4 h-4" />,
        },
        {
          id: 'conflict_detection',
          name: 'Schedule Conflict Detection',
          description: 'Automatically detect and resolve scheduling conflicts',
          category: 'calendar',
          status: 'planned',
          priority: 'medium',
          estimatedCompletion: 'Sprint 3',
          dependencies: ['calendar_system', 'availability_data'],
          benefits: [
            'No double booking',
            'Optimal scheduling',
            'Error prevention',
          ],
          icon: <AlertTriangle className="w-4 h-4" />,
        },

        // Analytics Features
        {
          id: 'kpi_dashboard',
          name: 'KPI Dashboard',
          description: 'Comprehensive job metrics and performance analytics',
          category: 'analytics',
          status: 'development',
          priority: 'high',
          estimatedCompletion: 'Next Sprint',
          dependencies: ['job_data', 'performance_metrics', 'dashboard_ui'],
          benefits: [
            'Data insights',
            'Performance tracking',
            'Decision support',
          ],
          icon: <BarChart3 className="w-4 h-4" />,
        },
        {
          id: 'automated_reporting',
          name: 'Automated Reporting',
          description:
            'Generate and distribute performance reports automatically',
          category: 'analytics',
          status: 'planned',
          priority: 'low',
          estimatedCompletion: 'Sprint 4',
          dependencies: ['kpi_system', 'email_service', 'report_templates'],
          benefits: ['Time savings', 'Regular insights', 'Stakeholder updates'],
          icon: <Download className="w-4 h-4" />,
        },
      ]

      // Group features by category
      const sections: ConfigSection[] = [
        {
          id: 'assignment',
          title: 'Auto-Assignment Rules',
          description:
            'Intelligent staff assignment based on workload, skills, and location',
          features: automationFeatures.filter(
            (f) => f.category === 'assignment'
          ),
          isExpanded: true,
        },
        {
          id: 'escalation',
          title: 'Job Escalation System',
          description: 'Automatic escalation and reassignment workflows',
          features: automationFeatures.filter(
            (f) => f.category === 'escalation'
          ),
          isExpanded: true,
        },
        {
          id: 'ai',
          title: 'AI-Powered Features',
          description: 'Machine learning and AI-driven optimizations',
          features: automationFeatures.filter((f) => f.category === 'ai'),
          isExpanded: false,
        },
        {
          id: 'calendar',
          title: 'Calendar & Scheduling',
          description: 'Visual scheduling and drag-and-drop job management',
          features: automationFeatures.filter((f) => f.category === 'calendar'),
          isExpanded: false,
        },
        {
          id: 'analytics',
          title: 'KPI & Analytics',
          description: 'Performance metrics and business intelligence',
          features: automationFeatures.filter(
            (f) => f.category === 'analytics'
          ),
          isExpanded: false,
        },
      ]

      setConfigSections(sections)
      console.log(`✅ Loaded ${automationFeatures.length} automation features`)
    } catch (error) {
      console.error('❌ Error loading automation config:', error)
      toast.error('Failed to load automation configuration')
    } finally {
      setLoading(false)
    }
  }

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setConfigSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, isExpanded: !section.isExpanded }
          : section
      )
    )
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enabled':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'development':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'planned':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'disabled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // Get section icon
  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case 'assignment':
        return <Users className="w-5 h-5" />
      case 'escalation':
        return <Clock className="w-5 h-5" />
      case 'ai':
        return <Brain className="w-5 h-5" />
      case 'calendar':
        return <Calendar className="w-5 h-5" />
      case 'analytics':
        return <BarChart3 className="w-5 h-5" />
      default:
        return <Settings className="w-5 h-5" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border-indigo-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  Automation Configuration
                </CardTitle>
                <p className="text-gray-400 mt-1">
                  Configure and monitor automated job management features
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                Development Mode
              </Badge>
              <Button
                onClick={loadAutomationConfig}
                variant="outline"
                size="sm"
                disabled={loading}
                className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Configuration Sections */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-gray-400">
            Loading automation configuration...
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {configSections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/30 border-gray-700/30">
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-800/30 transition-colors duration-200"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                          {getSectionIcon(section.id)}
                        </div>
                        <div>
                          <CardTitle className="text-white">
                            {section.title}
                          </CardTitle>
                          <p className="text-gray-400 text-sm mt-1">
                            {section.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                          {section.features.length} features
                        </Badge>
                        <motion.div
                          animate={{ rotate: section.isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <RefreshCw className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      </div>
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {section.isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {section.features.map((feature) => (
                              <Card
                                key={feature.id}
                                className="bg-gray-800/50 border-gray-700/50 hover:border-gray-600/70 transition-all duration-300 cursor-pointer"
                                onClick={() => setSelectedFeature(feature)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-indigo-500/20 rounded flex items-center justify-center">
                                        {feature.icon}
                                      </div>
                                      <h4 className="font-semibold text-white text-sm">
                                        {feature.name}
                                      </h4>
                                    </div>
                                    <Badge
                                      className={`${getStatusColor(feature.status)} text-xs`}
                                    >
                                      {feature.status}
                                    </Badge>
                                  </div>

                                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                                    {feature.description}
                                  </p>

                                  <div className="flex items-center justify-between">
                                    <Badge
                                      className={`${getPriorityColor(feature.priority)} text-xs`}
                                    >
                                      {feature.priority} priority
                                    </Badge>
                                    {feature.estimatedCompletion && (
                                      <span className="text-xs text-gray-500">
                                        {feature.estimatedCompletion}
                                      </span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  {selectedFeature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedFeature.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(selectedFeature.status)}>
                      {selectedFeature.status}
                    </Badge>
                    <Badge
                      className={getPriorityColor(selectedFeature.priority)}
                    >
                      {selectedFeature.priority} priority
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setSelectedFeature(null)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Description</h4>
                <p className="text-gray-300">{selectedFeature.description}</p>
              </div>

              {selectedFeature.estimatedCompletion && (
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    Estimated Completion
                  </h4>
                  <p className="text-gray-300">
                    {selectedFeature.estimatedCompletion}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-white mb-2">Dependencies</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFeature.dependencies.map((dep) => (
                    <Badge
                      key={dep}
                      className="bg-gray-700/50 text-gray-300 border-gray-600/50"
                    >
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Benefits</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  {selectedFeature.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
