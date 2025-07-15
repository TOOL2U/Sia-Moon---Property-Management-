/**
 * Staff Monitoring Dashboard
 * Real-time staff monitoring with job progress, communication, and scheduling
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  User,
  MessageSquare,
  Camera,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  Activity,
  Send,
  Image,
  FileText,
  MoreHorizontal,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react'
import {
  StaffMember,
  StaffStatus,
  StaffMessage,
  JobAssignment,
  StaffPerformance
} from '@/types/enhancedJobAssignment'

interface StaffMonitoringDashboardProps {
  onMessageStaff?: (staffId: string, message: string) => void
  onViewJobDetails?: (jobId: string) => void
}

export default function StaffMonitoringDashboard({ 
  onMessageStaff, 
  onViewJobDetails 
}: StaffMonitoringDashboardProps) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [messages, setMessages] = useState<StaffMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StaffStatus | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Load staff data
  useEffect(() => {
    loadStaffData()
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadStaffData()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const loadStaffData = async () => {
    try {
      setIsLoading(true)
      
      // Mock staff data with comprehensive information
      const mockStaff: StaffMember[] = [
        {
          id: 'staff-001',
          name: 'Maria Santos',
          email: 'maria@siamoon.com',
          phone: '+62 812 3456 7890',
          role: 'cleaner',
          status: 'on_job',
          avatar: '/avatars/maria.jpg',
          currentLocation: {
            latitude: -8.6705,
            longitude: 115.2126,
            accuracy: 'high',
            timestamp: new Date(),
            address: 'Alesia House, Canggu'
          },
          lastSeen: new Date(Date.now() - 5 * 60000),
          isOnline: true,
          currentJobs: ['job-001'],
          completedJobsToday: 3,
          totalJobsAssigned: 45,
          rating: 4.8,
          completionRate: 95,
          averageJobTime: 120,
          skills: ['deep_cleaning', 'laundry', 'organization'],
          availability: {
            isAvailable: false,
            maxConcurrentJobs: 2,
            currentJobCount: 1
          },
          workingHours: {
            monday: { isWorkingDay: true, startTime: '08:00', endTime: '17:00' },
            tuesday: { isWorkingDay: true, startTime: '08:00', endTime: '17:00' },
            wednesday: { isWorkingDay: true, startTime: '08:00', endTime: '17:00' },
            thursday: { isWorkingDay: true, startTime: '08:00', endTime: '17:00' },
            friday: { isWorkingDay: true, startTime: '08:00', endTime: '17:00' },
            saturday: { isWorkingDay: true, startTime: '09:00', endTime: '15:00' },
            sunday: { isWorkingDay: false, startTime: '', endTime: '' }
          },
          assignedEquipment: ['vacuum_cleaner', 'cleaning_supplies'],
          currentSupplies: ['detergent', 'towels', 'gloves'],
          lastMessage: new Date(Date.now() - 30 * 60000),
          unreadMessages: 2,
          hiredDate: new Date('2023-01-15'),
          isActive: true
        },
        {
          id: 'staff-002',
          name: 'Carlos Rodriguez',
          email: 'carlos@siamoon.com',
          phone: '+62 813 4567 8901',
          role: 'maintenance',
          status: 'available',
          avatar: '/avatars/carlos.jpg',
          currentLocation: {
            latitude: -8.6500,
            longitude: 115.2200,
            accuracy: 'medium',
            timestamp: new Date(),
            address: 'Villa Serenity, Seminyak'
          },
          lastSeen: new Date(Date.now() - 10 * 60000),
          isOnline: true,
          currentJobs: [],
          completedJobsToday: 2,
          totalJobsAssigned: 38,
          rating: 4.6,
          completionRate: 88,
          averageJobTime: 180,
          skills: ['plumbing', 'electrical', 'pool_maintenance'],
          availability: {
            isAvailable: true,
            maxConcurrentJobs: 3,
            currentJobCount: 0
          },
          workingHours: {
            monday: { isWorkingDay: true, startTime: '07:00', endTime: '16:00' },
            tuesday: { isWorkingDay: true, startTime: '07:00', endTime: '16:00' },
            wednesday: { isWorkingDay: true, startTime: '07:00', endTime: '16:00' },
            thursday: { isWorkingDay: true, startTime: '07:00', endTime: '16:00' },
            friday: { isWorkingDay: true, startTime: '07:00', endTime: '16:00' },
            saturday: { isWorkingDay: false, startTime: '', endTime: '' },
            sunday: { isWorkingDay: false, startTime: '', endTime: '' }
          },
          assignedEquipment: ['toolbox', 'ladder', 'pool_equipment'],
          currentSupplies: ['screws', 'pipes', 'chemicals'],
          lastMessage: new Date(Date.now() - 2 * 60 * 60000),
          unreadMessages: 0,
          hiredDate: new Date('2023-03-20'),
          isActive: true
        },
        {
          id: 'staff-003',
          name: 'Ana Silva',
          email: 'ana@siamoon.com',
          phone: '+62 814 5678 9012',
          role: 'cleaner',
          status: 'break',
          avatar: '/avatars/ana.jpg',
          currentLocation: {
            latitude: -8.6800,
            longitude: 115.2000,
            accuracy: 'high',
            timestamp: new Date(),
            address: 'Ocean View Villa, Uluwatu'
          },
          lastSeen: new Date(Date.now() - 15 * 60000),
          isOnline: true,
          currentJobs: ['job-003'],
          completedJobsToday: 1,
          totalJobsAssigned: 32,
          rating: 4.9,
          completionRate: 97,
          averageJobTime: 110,
          skills: ['inspection', 'quality_control', 'guest_preparation'],
          availability: {
            isAvailable: false,
            availableUntil: new Date(Date.now() + 30 * 60000),
            unavailableReason: 'lunch_break',
            maxConcurrentJobs: 2,
            currentJobCount: 1
          },
          workingHours: {
            monday: { isWorkingDay: true, startTime: '08:30', endTime: '17:30' },
            tuesday: { isWorkingDay: true, startTime: '08:30', endTime: '17:30' },
            wednesday: { isWorkingDay: true, startTime: '08:30', endTime: '17:30' },
            thursday: { isWorkingDay: true, startTime: '08:30', endTime: '17:30' },
            friday: { isWorkingDay: true, startTime: '08:30', endTime: '17:30' },
            saturday: { isWorkingDay: true, startTime: '10:00', endTime: '16:00' },
            sunday: { isWorkingDay: false, startTime: '', endTime: '' }
          },
          assignedEquipment: ['inspection_checklist', 'camera', 'measuring_tools'],
          currentSupplies: ['forms', 'pens', 'labels'],
          lastMessage: new Date(Date.now() - 45 * 60000),
          unreadMessages: 1,
          hiredDate: new Date('2023-02-10'),
          isActive: true
        }
      ]
      
      setStaffMembers(mockStaff)
      
      // Set first staff as selected by default
      if (!selectedStaff && mockStaff.length > 0) {
        setSelectedStaff(mockStaff[0])
        loadMessages(mockStaff[0].id)
      }
      
    } catch (error) {
      console.error('Error loading staff data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (staffId: string) => {
    // Mock messages for the selected staff member
    const mockMessages: StaffMessage[] = [
      {
        id: 'msg-001',
        fromStaffId: 'admin',
        toStaffId: staffId,
        message: 'Please prioritize the bathroom cleaning in Villa A',
        timestamp: new Date(Date.now() - 2 * 60 * 60000),
        type: 'job_related',
        isRead: true
      },
      {
        id: 'msg-002',
        fromStaffId: staffId,
        message: 'Bathroom cleaning completed. Found minor plumbing issue.',
        timestamp: new Date(Date.now() - 90 * 60000),
        type: 'job_related',
        isRead: true,
        attachments: [
          {
            id: 'att-001',
            type: 'photo',
            url: '/job-photos/plumbing-issue.jpg',
            filename: 'plumbing-issue.jpg',
            size: 245760
          }
        ]
      },
      {
        id: 'msg-003',
        fromStaffId: 'admin',
        toStaffId: staffId,
        message: 'Great work! I\'ll assign maintenance to fix the plumbing.',
        timestamp: new Date(Date.now() - 30 * 60000),
        type: 'job_related',
        isRead: false
      }
    ]
    
    setMessages(mockMessages)
  }

  const getStatusColor = (status: StaffStatus): string => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'on_job': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'offline': return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      case 'break': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'emergency': return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'traveling': return 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getStatusText = (status: StaffStatus): string => {
    switch (status) {
      case 'available': return 'Available'
      case 'on_job': return 'On Job'
      case 'offline': return 'Offline'
      case 'break': return 'On Break'
      case 'emergency': return 'Emergency'
      case 'traveling': return 'Traveling'
      default: return 'Unknown'
    }
  }

  const formatLastSeen = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedStaff) return

    try {
      // Add message to local state immediately for better UX
      const message: StaffMessage = {
        id: `msg-${Date.now()}`,
        fromStaffId: 'admin',
        toStaffId: selectedStaff.id,
        message: newMessage,
        timestamp: new Date(),
        type: 'direct',
        isRead: false
      }
      
      setMessages(prev => [...prev, message])
      setNewMessage('')
      
      // Call the callback if provided
      onMessageStaff?.(selectedStaff.id, newMessage)
      
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || staff.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Staff Monitoring</h2>
          <p className="text-gray-400">Real-time staff tracking and communication</p>
        </div>
        <Button
          onClick={loadStaffData}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="border-gray-600"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Staff Members ({filteredStaff.length})
            </CardTitle>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StaffStatus | 'all')}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="on_job">On Job</option>
                <option value="break">On Break</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  onClick={() => {
                    setSelectedStaff(staff)
                    loadMessages(staff.id)
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStaff?.id === staff.id
                      ? 'bg-blue-900/30 border-blue-500'
                      : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-300" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
                        staff.isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white truncate">{staff.name}</span>
                        {staff.unreadMessages > 0 && (
                          <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5">
                            {staff.unreadMessages}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(staff.status)}>
                          {getStatusText(staff.status)}
                        </Badge>
                        <span className="text-xs text-gray-400 capitalize">{staff.role}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {staff.completedJobsToday} today
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {staff.rating}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatLastSeen(staff.lastSeen)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredStaff.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No staff members found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Staff Details */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {selectedStaff ? `${selectedStaff.name} Details` : 'Select Staff Member'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStaff ? (
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{selectedStaff.name}</h3>
                      <p className="text-gray-400 capitalize">{selectedStaff.role}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(selectedStaff.status)}>
                          {getStatusText(selectedStaff.status)}
                        </Badge>
                        {selectedStaff.isOnline && (
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            Online
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 p-3 bg-gray-700/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Contact Information</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Mail className="w-4 h-4" />
                    <span>{selectedStaff.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Phone className="w-4 h-4" />
                    <span>{selectedStaff.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedStaff.currentLocation?.address || 'Location unknown'}</span>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-2 p-3 bg-gray-700/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Performance</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-white font-medium">{selectedStaff.rating}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400">Completion Rate</p>
                      <span className="text-white font-medium">{selectedStaff.completionRate}%</span>
                    </div>
                    <div>
                      <p className="text-gray-400">Jobs Today</p>
                      <span className="text-white font-medium">{selectedStaff.completedJobsToday}</span>
                    </div>
                    <div>
                      <p className="text-gray-400">Avg. Time</p>
                      <span className="text-white font-medium">{selectedStaff.averageJobTime}m</span>
                    </div>
                  </div>
                </div>

                {/* Current Jobs */}
                <div className="space-y-2 p-3 bg-gray-700/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Current Jobs</h4>
                  {selectedStaff.currentJobs.length > 0 ? (
                    <div className="space-y-2">
                      {selectedStaff.currentJobs.map((jobId) => (
                        <div
                          key={jobId}
                          onClick={() => onViewJobDetails?.(jobId)}
                          className="p-2 bg-blue-900/20 border border-blue-500/50 rounded cursor-pointer hover:bg-blue-900/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-blue-400 font-medium">Job #{jobId}</span>
                            <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No active jobs</p>
                  )}
                </div>

                {/* Skills */}
                <div className="space-y-2 p-3 bg-gray-700/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedStaff.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="space-y-2 p-3 bg-gray-700/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Availability</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={selectedStaff.availability.isAvailable ? 'text-green-400' : 'text-red-400'}>
                        {selectedStaff.availability.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Jobs:</span>
                      <span className="text-white">
                        {selectedStaff.availability.currentJobCount}/{selectedStaff.availability.maxConcurrentJobs}
                      </span>
                    </div>
                    {selectedStaff.availability.unavailableReason && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Reason:</span>
                        <span className="text-white capitalize">
                          {selectedStaff.availability.unavailableReason.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a staff member to view details</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Communication Panel */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {selectedStaff ? `Chat with ${selectedStaff.name}` : 'Communication'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStaff ? (
              <div className="space-y-4">
                {/* Messages */}
                <div className="h-64 overflow-y-auto space-y-3 p-3 bg-gray-700/30 rounded-lg">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.fromStaffId === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg ${
                          message.fromStaffId === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-2 text-xs">
                                {attachment.type === 'photo' ? (
                                  <Camera className="w-3 h-3" />
                                ) : (
                                  <FileText className="w-3 h-3" />
                                )}
                                <span className="truncate">{attachment.filename}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs opacity-75 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No messages yet</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-gray-700 border-gray-600 text-white resize-none"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600"
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-600">
                  <Button size="sm" variant="outline" className="flex-1 border-green-500 text-green-400">
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-blue-500 text-blue-400">
                    <MapPin className="w-3 h-3 mr-1" />
                    Locate
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-yellow-500 text-yellow-400">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Alert
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a staff member to start chatting</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
