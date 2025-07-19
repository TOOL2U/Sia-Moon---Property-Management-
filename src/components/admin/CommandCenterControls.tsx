'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Textarea } from '@/components/ui/Textarea'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  MessageSquare,
  Phone,
  Radio,
  Send,
  Shield,
  Users,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

interface EmergencyAlert {
  id: string
  type: 'fire' | 'medical' | 'security' | 'maintenance' | 'weather'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  propertyId?: string
  staffIds: string[]
  createdAt: Date
  status: 'active' | 'acknowledged' | 'resolved'
}

interface BulkTask {
  id: string
  title: string
  description: string
  type: 'cleaning' | 'maintenance' | 'inspection' | 'guest_service'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedStaffIds: string[]
  propertyIds: string[]
  dueDate: Date
  estimatedDuration: number
}

interface CommunicationMessage {
  id: string
  type: 'broadcast' | 'direct' | 'emergency'
  sender: string
  recipients: string[]
  subject: string
  message: string
  timestamp: Date
  priority: 'normal' | 'high' | 'urgent'
  status: 'sent' | 'delivered' | 'read'
}

interface CommandCenterControlsProps {
  isFullScreen?: boolean
}

export default function CommandCenterControls({ isFullScreen = false }: CommandCenterControlsProps) {
  const [activeTab, setActiveTab] = useState<'emergency' | 'tasks' | 'communication' | 'automation'>('emergency')
  const [emergencyForm, setEmergencyForm] = useState({
    type: 'maintenance' as EmergencyAlert['type'],
    severity: 'medium' as EmergencyAlert['severity'],
    title: '',
    description: '',
    propertyId: '',
  })
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    type: 'cleaning' as BulkTask['type'],
    priority: 'medium' as BulkTask['priority'],
    dueDate: '',
    estimatedDuration: 60,
  })
  const [messageForm, setMessageForm] = useState({
    type: 'broadcast' as CommunicationMessage['type'],
    recipients: [] as string[],
    subject: '',
    message: '',
    priority: 'normal' as CommunicationMessage['priority'],
  })

  const mockStaff = [
    { id: '1', name: 'Maria Santos', role: 'Housekeeper', online: true },
    { id: '2', name: 'Carlos Rodriguez', role: 'Maintenance', online: true },
    { id: '3', name: 'Ana Silva', role: 'Guest Relations', online: true },
    { id: '4', name: 'James Wilson', role: 'Security', online: false },
  ]

  const mockProperties = [
    { id: '1', name: 'Villa Sunset Paradise' },
    { id: '2', name: 'Ocean View Villa' },
    { id: '3', name: 'Mountain Retreat' },
    { id: '4', name: 'Beachfront Luxury' },
  ]

  const handleEmergencyAlert = () => {
    console.log('Creating emergency alert:', emergencyForm)
    // Reset form
    setEmergencyForm({
      type: 'maintenance',
      severity: 'medium',
      title: '',
      description: '',
      propertyId: '',
    })
  }

  const handleBulkTaskCreation = () => {
    console.log('Creating bulk task:', taskForm)
    // Reset form
    setTaskForm({
      title: '',
      description: '',
      type: 'cleaning',
      priority: 'medium',
      dueDate: '',
      estimatedDuration: 60,
    })
  }

  const handleSendMessage = () => {
    console.log('Sending message:', messageForm)
    // Reset form
    setMessageForm({
      type: 'broadcast',
      recipients: [],
      subject: '',
      message: '',
      priority: 'normal',
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-600'
      case 'medium': return 'bg-yellow-600'
      case 'low': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-600'
      case 'medium': return 'bg-yellow-600'
      case 'low': return 'bg-blue-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" />
          Command Center Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 mx-4">
            <TabsTrigger value="emergency" className="text-gray-300 data-[state=active]:text-white text-xs">
              Emergency
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-gray-300 data-[state=active]:text-white text-xs">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="communication" className="text-gray-300 data-[state=active]:text-white text-xs">
              Comms
            </TabsTrigger>
            <TabsTrigger value="automation" className="text-gray-300 data-[state=active]:text-white text-xs">
              Auto
            </TabsTrigger>
          </TabsList>

          <div className="p-4 h-96 overflow-y-auto">
            <TabsContent value="emergency" className="space-y-4 mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="text-white font-medium">Emergency Response System</h3>
                </div>

                {/* Emergency Type */}
                <div className="space-y-2">
                  <label className="text-gray-300 text-xs">Emergency Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['fire', 'medical', 'security', 'maintenance', 'weather'] as const).map((type) => (
                      <Button
                        key={type}
                        variant={emergencyForm.type === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEmergencyForm(prev => ({ ...prev, type }))}
                        className={`text-xs ${
                          emergencyForm.type === type
                            ? 'bg-red-600 text-white'
                            : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Severity Level */}
                <div className="space-y-2">
                  <label className="text-gray-300 text-xs">Severity Level</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['low', 'medium', 'high', 'critical'] as const).map((severity) => (
                      <Button
                        key={severity}
                        variant={emergencyForm.severity === severity ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEmergencyForm(prev => ({ ...prev, severity }))}
                        className={`text-xs ${
                          emergencyForm.severity === severity
                            ? getSeverityColor(severity) + ' text-white'
                            : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {severity}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-gray-300 text-xs">Alert Title</label>
                  <Input
                    placeholder="Brief description of emergency"
                    value={emergencyForm.title}
                    onChange={(e) => setEmergencyForm(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white text-xs"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-gray-300 text-xs">Details</label>
                  <Textarea
                    placeholder="Detailed description and instructions"
                    value={emergencyForm.description}
                    onChange={(e) => setEmergencyForm(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white text-xs h-20"
                  />
                </div>

                {/* Property Selection */}
                <div className="space-y-2">
                  <label className="text-gray-300 text-xs">Property (Optional)</label>
                  <select
                    value={emergencyForm.propertyId}
                    onChange={(e) => setEmergencyForm(prev => ({ ...prev, propertyId: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-xs rounded px-2 py-1"
                  >
                    <option value="">All Properties</option>
                    {mockProperties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    onClick={handleEmergencyAlert}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs"
                    disabled={!emergencyForm.title || !emergencyForm.description}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Send Alert
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Call 911
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4 mt-0">
              {/* Bulk Task Creation content will be added here */}
              <div className="text-center py-8">
                <Zap className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Bulk Task Creation</p>
                <p className="text-gray-500 text-xs">Coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value="communication" className="space-y-4 mt-0">
              {/* Communication Hub content will be added here */}
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Communication Hub</p>
                <p className="text-gray-500 text-xs">Coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-4 mt-0">
              {/* Automation Controls content will be added here */}
              <div className="text-center py-8">
                <Radio className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Automation Controls</p>
                <p className="text-gray-500 text-xs">Coming soon...</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
