'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Slider } from '@/components/ui/Slider'
import { Switch } from '@/components/ui/Switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { type AISettings } from '@/services/AISettingsService'
import {
  Bot,
  Brain,
  Clock,
  Database,
  Gauge,
  Loader2,
  RefreshCw,
  Save,
  Settings,
  Smartphone,
  Target,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface AISettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AISettingsModal({
  isOpen,
  onClose,
}: AISettingsModalProps) {
  const [settings, setSettings] = useState<AISettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Load settings when modal opens
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai/settings')
      const data = await response.json()

      if (data.success) {
        setSettings(data.settings)
      } else {
        throw new Error(data.error || 'Failed to load settings')
      }
    } catch (error) {
      console.error('Error loading AI settings:', error)
      toast.error('Failed to load AI settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen, loadSettings])

  // Save settings
  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const response = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            automation: settings.automation,
            performance: settings.performance,
            learning: settings.learning,
            integration: settings.integration,
            dashboard: settings.dashboard,
          },
          updatedBy: 'admin', // TODO: Get from auth context
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('AI settings saved successfully!')
        onClose()
      } else {
        throw new Error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving AI settings:', error)
      toast.error('Failed to save AI settings')
    } finally {
      setSaving(false)
    }
  }

  // Reset to defaults
  const handleReset = async () => {
    try {
      setResetting(true)
      const response = await fetch('/api/ai/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedBy: 'admin', // TODO: Get from auth context
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSettings(data.settings)
        toast.success('AI settings reset to defaults!')
      } else {
        throw new Error(data.error || 'Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting AI settings:', error)
      toast.error('Failed to reset AI settings')
    } finally {
      setResetting(false)
    }
  }

  // Update settings helper
  const updateSettings = (path: string, value: any) => {
    if (!settings) return

    const pathArray = path.split('.')
    const newSettings = { ...settings }
    let current: any = newSettings

    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]]
    }
    current[pathArray[pathArray.length - 1]] = value

    setSettings(newSettings)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            AI System Settings
            <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30">
              Advanced Configuration
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure AI automation, performance tuning, and system preferences
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Loading Settings
              </h3>
              <p className="text-gray-400">Fetching AI configuration...</p>
            </div>
          </div>
        ) : settings ? (
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="automation" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-800/50">
                <TabsTrigger
                  value="automation"
                  className="data-[state=active]:bg-purple-600"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Automation
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="data-[state=active]:bg-blue-600"
                >
                  <Gauge className="w-4 h-4 mr-2" />
                  Performance
                </TabsTrigger>
                <TabsTrigger
                  value="learning"
                  className="data-[state=active]:bg-green-600"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Learning
                </TabsTrigger>
                <TabsTrigger
                  value="integration"
                  className="data-[state=active]:bg-orange-600"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Integration
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:bg-indigo-600"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
              </TabsList>

              {/* Automation Tab */}
              <TabsContent value="automation" className="space-y-6 mt-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      AI Automation Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Master Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                      <div>
                        <Label className="text-white font-medium">
                          Master AI Toggle
                        </Label>
                        <p className="text-sm text-gray-400">
                          Enable or disable all AI automation features
                        </p>
                      </div>
                      <Switch
                        checked={settings.automation.masterEnabled}
                        onCheckedChange={(checked) =>
                          updateSettings('automation.masterEnabled', checked)
                        }
                      />
                    </div>

                    {/* Individual Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-white">Booking Approval</Label>
                          <Switch
                            checked={settings.automation.bookingApproval}
                            onCheckedChange={(checked) =>
                              updateSettings(
                                'automation.bookingApproval',
                                checked
                              )
                            }
                            disabled={!settings.automation.masterEnabled}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-white">Job Assignment</Label>
                          <Switch
                            checked={settings.automation.jobAssignment}
                            onCheckedChange={(checked) =>
                              updateSettings(
                                'automation.jobAssignment',
                                checked
                              )
                            }
                            disabled={!settings.automation.masterEnabled}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-white">Calendar Updates</Label>
                          <Switch
                            checked={settings.automation.calendarUpdates}
                            onCheckedChange={(checked) =>
                              updateSettings(
                                'automation.calendarUpdates',
                                checked
                              )
                            }
                            disabled={!settings.automation.masterEnabled}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-white">Notifications</Label>
                          <Switch
                            checked={settings.automation.notifications}
                            onCheckedChange={(checked) =>
                              updateSettings(
                                'automation.notifications',
                                checked
                              )
                            }
                            disabled={!settings.automation.masterEnabled}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Confidence Thresholds */}
                    <div className="space-y-4">
                      <h4 className="text-white font-medium">
                        AI Confidence Thresholds
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-white">
                            Booking Approval:{' '}
                            {Math.round(
                              settings.automation.confidenceThresholds
                                .bookingApproval * 100
                            )}
                            %
                          </Label>
                          <Slider
                            value={[
                              settings.automation.confidenceThresholds
                                .bookingApproval,
                            ]}
                            onValueChange={([value]) =>
                              updateSettings(
                                'automation.confidenceThresholds.bookingApproval',
                                value
                              )
                            }
                            max={1}
                            min={0.5}
                            step={0.05}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">
                            Job Assignment:{' '}
                            {Math.round(
                              settings.automation.confidenceThresholds
                                .jobAssignment * 100
                            )}
                            %
                          </Label>
                          <Slider
                            value={[
                              settings.automation.confidenceThresholds
                                .jobAssignment,
                            ]}
                            onValueChange={([value]) =>
                              updateSettings(
                                'automation.confidenceThresholds.jobAssignment',
                                value
                              )
                            }
                            max={1}
                            min={0.5}
                            step={0.05}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">
                            Calendar Updates:{' '}
                            {Math.round(
                              settings.automation.confidenceThresholds
                                .calendarUpdates * 100
                            )}
                            %
                          </Label>
                          <Slider
                            value={[
                              settings.automation.confidenceThresholds
                                .calendarUpdates,
                            ]}
                            onValueChange={([value]) =>
                              updateSettings(
                                'automation.confidenceThresholds.calendarUpdates',
                                value
                              )
                            }
                            max={1}
                            min={0.5}
                            step={0.05}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">
                            Notifications:{' '}
                            {Math.round(
                              settings.automation.confidenceThresholds
                                .notifications * 100
                            )}
                            %
                          </Label>
                          <Slider
                            value={[
                              settings.automation.confidenceThresholds
                                .notifications,
                            ]}
                            onValueChange={([value]) =>
                              updateSettings(
                                'automation.confidenceThresholds.notifications',
                                value
                              )
                            }
                            max={1}
                            min={0.5}
                            step={0.05}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Job Assignment Algorithm
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Algorithm Type</Label>
                        <Select
                          value={settings.performance.jobAssignmentAlgorithm}
                          onValueChange={(value) =>
                            updateSettings(
                              'performance.jobAssignmentAlgorithm',
                              value
                            )
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skills-based">
                              Skills-Based
                            </SelectItem>
                            <SelectItem value="availability-based">
                              Availability-Based
                            </SelectItem>
                            <SelectItem value="performance-based">
                              Performance-Based
                            </SelectItem>
                            <SelectItem value="balanced">
                              Balanced (Recommended)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Notification Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Frequency</Label>
                        <Select
                          value={settings.performance.notifications.frequency}
                          onValueChange={(value) =>
                            updateSettings(
                              'performance.notifications.frequency',
                              value
                            )
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="batched">Batched</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {settings.performance.notifications.frequency ===
                        'batched' && (
                        <div className="space-y-2">
                          <Label className="text-white">
                            Batch Interval (minutes)
                          </Label>
                          <Input
                            type="number"
                            value={
                              settings.performance.notifications.batchInterval
                            }
                            onChange={(e) =>
                              updateSettings(
                                'performance.notifications.batchInterval',
                                parseInt(e.target.value) || 15
                              )
                            }
                            className="bg-gray-800 border-gray-600 text-white"
                            min="5"
                            max="120"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Label className="text-white">Quiet Hours</Label>
                        <Switch
                          checked={
                            settings.performance.notifications.quietHours
                              .enabled
                          }
                          onCheckedChange={(checked) =>
                            updateSettings(
                              'performance.notifications.quietHours.enabled',
                              checked
                            )
                          }
                        />
                      </div>

                      {settings.performance.notifications.quietHours
                        .enabled && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label className="text-white text-xs">Start</Label>
                            <Input
                              type="time"
                              value={
                                settings.performance.notifications.quietHours
                                  .start
                              }
                              onChange={(e) =>
                                updateSettings(
                                  'performance.notifications.quietHours.start',
                                  e.target.value
                                )
                              }
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white text-xs">End</Label>
                            <Input
                              type="time"
                              value={
                                settings.performance.notifications.quietHours
                                  .end
                              }
                              onChange={(e) =>
                                updateSettings(
                                  'performance.notifications.quietHours.end',
                                  e.target.value
                                )
                              }
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Learning Tab */}
              <TabsContent value="learning" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        Feedback & Learning
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">
                          Admin Feedback Weight:{' '}
                          {Math.round(
                            settings.learning.adminFeedbackWeight * 100
                          )}
                          %
                        </Label>
                        <p className="text-xs text-gray-400">
                          How much admin feedback influences AI decisions
                        </p>
                        <Slider
                          value={[settings.learning.adminFeedbackWeight]}
                          onValueChange={([value]) =>
                            updateSettings(
                              'learning.adminFeedbackWeight',
                              value
                            )
                          }
                          max={1}
                          min={0.1}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Model Retraining</Label>
                        <Select
                          value={settings.learning.modelRetraining.frequency}
                          onValueChange={(value) =>
                            updateSettings(
                              'learning.modelRetraining.frequency',
                              value
                            )
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="manual">Manual Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">
                          Minimum Feedback for Retraining
                        </Label>
                        <Input
                          type="number"
                          value={
                            settings.learning.modelRetraining
                              .minimumFeedbackCount
                          }
                          onChange={(e) =>
                            updateSettings(
                              'learning.modelRetraining.minimumFeedbackCount',
                              parseInt(e.target.value) || 10
                            )
                          }
                          className="bg-gray-800 border-gray-600 text-white"
                          min="5"
                          max="100"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Data Retention
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">
                          AI Logs Retention (days)
                        </Label>
                        <Input
                          type="number"
                          value={settings.learning.dataRetention.aiLogs}
                          onChange={(e) =>
                            updateSettings(
                              'learning.dataRetention.aiLogs',
                              parseInt(e.target.value) || 90
                            )
                          }
                          className="bg-gray-800 border-gray-600 text-white"
                          min="30"
                          max="365"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">
                          Feedback Retention (days)
                        </Label>
                        <Input
                          type="number"
                          value={settings.learning.dataRetention.feedback}
                          onChange={(e) =>
                            updateSettings(
                              'learning.dataRetention.feedback',
                              parseInt(e.target.value) || 365
                            )
                          }
                          className="bg-gray-800 border-gray-600 text-white"
                          min="90"
                          max="1095"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Integration Tab */}
              <TabsContent value="integration" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Mobile App Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Mobile Sync</Label>
                          <p className="text-xs text-gray-400">
                            Enable real-time sync with mobile app
                          </p>
                        </div>
                        <Switch
                          checked={settings.integration.mobileSync.enabled}
                          onCheckedChange={(checked) =>
                            updateSettings(
                              'integration.mobileSync.enabled',
                              checked
                            )
                          }
                        />
                      </div>

                      {settings.integration.mobileSync.enabled && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-white">
                              Sync Interval (minutes)
                            </Label>
                            <Input
                              type="number"
                              value={
                                settings.integration.mobileSync.syncInterval
                              }
                              onChange={(e) =>
                                updateSettings(
                                  'integration.mobileSync.syncInterval',
                                  parseInt(e.target.value) || 5
                                )
                              }
                              className="bg-gray-800 border-gray-600 text-white"
                              min="1"
                              max="60"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label className="text-white">
                              Offline Support
                            </Label>
                            <Switch
                              checked={
                                settings.integration.mobileSync.offlineSupport
                              }
                              onCheckedChange={(checked) =>
                                updateSettings(
                                  'integration.mobileSync.offlineSupport',
                                  checked
                                )
                              }
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Real-time Updates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">
                            Real-time Updates
                          </Label>
                          <p className="text-xs text-gray-400">
                            Enable live data updates
                          </p>
                        </div>
                        <Switch
                          checked={settings.integration.realTimeUpdates.enabled}
                          onCheckedChange={(checked) =>
                            updateSettings(
                              'integration.realTimeUpdates.enabled',
                              checked
                            )
                          }
                        />
                      </div>

                      {settings.integration.realTimeUpdates.enabled && (
                        <div className="space-y-2">
                          <Label className="text-white">
                            Update Interval (seconds)
                          </Label>
                          <Input
                            type="number"
                            value={
                              settings.integration.realTimeUpdates
                                .updateInterval
                            }
                            onChange={(e) =>
                              updateSettings(
                                'integration.realTimeUpdates.updateInterval',
                                parseInt(e.target.value) || 30
                              )
                            }
                            className="bg-gray-800 border-gray-600 text-white"
                            min="10"
                            max="300"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-white">
                          API Rate Limit (requests/min)
                        </Label>
                        <Input
                          type="number"
                          value={
                            settings.integration.apiLimits.requestsPerMinute
                          }
                          onChange={(e) =>
                            updateSettings(
                              'integration.apiLimits.requestsPerMinute',
                              parseInt(e.target.value) || 100
                            )
                          }
                          className="bg-gray-800 border-gray-600 text-white"
                          min="10"
                          max="1000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">
                          Max Concurrent Requests
                        </Label>
                        <Input
                          type="number"
                          value={
                            settings.integration.apiLimits.maxConcurrentRequests
                          }
                          onChange={(e) =>
                            updateSettings(
                              'integration.apiLimits.maxConcurrentRequests',
                              parseInt(e.target.value) || 10
                            )
                          }
                          className="bg-gray-800 border-gray-600 text-white"
                          min="1"
                          max="50"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Dashboard Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Default Time Range</Label>
                        <Select
                          value={settings.dashboard.defaultTimeRange}
                          onValueChange={(value) =>
                            updateSettings('dashboard.defaultTimeRange', value)
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-white">KPI Display</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">
                              Approval Time
                            </span>
                            <Switch
                              checked={
                                settings.dashboard.kpiDisplayPreferences
                                  .showApprovalTime
                              }
                              onCheckedChange={(checked) =>
                                updateSettings(
                                  'dashboard.kpiDisplayPreferences.showApprovalTime',
                                  checked
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">
                              Assignment Accuracy
                            </span>
                            <Switch
                              checked={
                                settings.dashboard.kpiDisplayPreferences
                                  .showAssignmentAccuracy
                              }
                              onCheckedChange={(checked) =>
                                updateSettings(
                                  'dashboard.kpiDisplayPreferences.showAssignmentAccuracy',
                                  checked
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">
                              Jobs per Staff
                            </span>
                            <Switch
                              checked={
                                settings.dashboard.kpiDisplayPreferences
                                  .showJobsPerStaff
                              }
                              onCheckedChange={(checked) =>
                                updateSettings(
                                  'dashboard.kpiDisplayPreferences.showJobsPerStaff',
                                  checked
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">
                              Satisfaction Score
                            </span>
                            <Switch
                              checked={
                                settings.dashboard.kpiDisplayPreferences
                                  .showSatisfaction
                              }
                              onCheckedChange={(checked) =>
                                updateSettings(
                                  'dashboard.kpiDisplayPreferences.showSatisfaction',
                                  checked
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Gauge className="w-5 h-5" />
                        Alert Thresholds
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">
                          Low Accuracy Alert (%)
                        </Label>
                        <Input
                          type="number"
                          value={settings.dashboard.alertThresholds.lowAccuracy}
                          onChange={(e) =>
                            updateSettings(
                              'dashboard.alertThresholds.lowAccuracy',
                              parseInt(e.target.value) || 70
                            )
                          }
                          className="bg-gray-800 border-gray-600 text-white"
                          min="50"
                          max="95"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">
                          High Response Time Alert (seconds)
                        </Label>
                        <Input
                          type="number"
                          value={
                            settings.dashboard.alertThresholds.highResponseTime
                          }
                          onChange={(e) =>
                            updateSettings(
                              'dashboard.alertThresholds.highResponseTime',
                              parseInt(e.target.value) || 300
                            )
                          }
                          className="bg-gray-800 border-gray-600 text-white"
                          min="60"
                          max="1800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">
                          Low Satisfaction Alert (%)
                        </Label>
                        <Input
                          type="number"
                          value={
                            settings.dashboard.alertThresholds.lowSatisfaction
                          }
                          onChange={(e) =>
                            updateSettings(
                              'dashboard.alertThresholds.lowSatisfaction',
                              parseInt(e.target.value) || 60
                            )
                          }
                          className="bg-gray-800 border-gray-600 text-white"
                          min="30"
                          max="90"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400">Failed to load settings</p>
          </div>
        )}

        <DialogFooter className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving || resetting}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {resetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </>
              )}
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving || resetting}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || resetting || !settings}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
