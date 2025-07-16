'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  MessageSquare,
  Search,
  Send
} from 'lucide-react'

// Types
interface StaffLocation {
  latitude: number
  longitude: number
  accuracy: 'high' | 'medium' | 'low'
  timestamp: Date
  address?: string
}

type StaffStatus = 'available' | 'on_job' | 'offline' | 'break' | 'emergency' | 'traveling'

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: StaffStatus
  avatar?: string
  currentLocation?: StaffLocation
  lastSeen: Date
  isOnline: boolean
  currentJobs: string[]
  completedJobsToday: number
  totalJobsAssigned: number
  rating: number
  completionRate: number
  averageJobTime: number
  skills: string[]
  availability: {
    isAvailable: boolean
    maxConcurrentJobs: number
    currentJobCount: number
  }
  unreadMessages: number
  hiredDate: Date
  isActive: boolean
}

interface StaffMessage {
  id: string
  fromStaffId: string
  toStaffId?: string
  message: string
  timestamp: Date
  type: 'job_related' | 'direct' | 'admin_message' | 'status_update'
  isRead: boolean
  attachments?: Array<{
    id: string
    type: 'photo' | 'document'
    url: string
    filename: string
    size: number
  }>
}

interface StaffMonitoringDashboardProps {
  onMessageStaff?: (staffId: string, message: string) => void
}

export default function StaffMonitoringDashboard({
  onMessageStaff
}: StaffMonitoringDashboardProps) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [messages, setMessages] = useState<StaffMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | StaffStatus>('all')
  const [isLoading, setIsLoading] = useState(true)

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
      
      // Load from staff_accounts collection and enhance with monitoring data
      const response = await fetch('/api/admin/staff-accounts')
      if (!response.ok) {
        throw new Error('Failed to fetch staff accounts')
      }
      
      const { staffAccounts } = await response.json()
      
      // Transform staff accounts to monitoring format
      const staffData: StaffMember[] = staffAccounts
        .filter((staff: any) => staff.status === 'active')
        .map((staff: any) => ({
          id: staff.id,
          name: staff.name,
          email: staff.email,
          phone: staff.phone || 'Not provided',
          role: staff.role,
          status: 'available' as StaffStatus, // TODO: Track actual status
          avatar: '/avatars/default.jpg', // TODO: Store actual avatars
          currentLocation: {
            latitude: -8.6705 + (Math.random() - 0.5) * 0.1, // TODO: Track actual location
            longitude: 115.2126 + (Math.random() - 0.5) * 0.1, // TODO: Track actual location
            accuracy: 'medium' as const,
            timestamp: new Date(),
            address: 'Location tracking not implemented' // TODO: Reverse geocode
          },
          lastSeen: new Date(Date.now() - Math.random() * 60 * 60000),
          isOnline: Math.random() > 0.2, // TODO: Track actual online status
          currentJobs: [], // TODO: Load actual current jobs
          completedJobsToday: Math.floor(Math.random() * 5), // TODO: Calculate from actual data
          totalJobsAssigned: Math.floor(Math.random() * 100), // TODO: Calculate from actual data
          rating: 4.0 + Math.random(), // TODO: Calculate from actual ratings
          completionRate: 80 + Math.random() * 20, // TODO: Calculate from actual data
          averageJobTime: 60 + Math.random() * 120, // TODO: Calculate from actual data
          skills: staff.skills || [], // Use actual skills if available
          availability: {
            isAvailable: Math.random() > 0.5,
            maxConcurrentJobs: 2,
            currentJobCount: Math.floor(Math.random() * 3)
          },
          unreadMessages: Math.floor(Math.random() * 5),
          hiredDate: new Date(staff.createdAt || '2023-01-01'),
          isActive: staff.status === 'active'
        }))
      
      setStaffMembers(staffData)
      
      // Set first staff as selected by default
      if (!selectedStaff && staffData.length > 0) {
        setSelectedStaff(staffData[0])
        loadMessages(staffData[0].id)
      }
      
    } catch (error) {
      console.error('Error loading staff data:', error)
      setStaffMembers([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (staffId: string) => {
    // TODO: Load real messages from Firebase when messaging system is implemented
    // For now, no messages since messaging system is not yet implemented
    const realMessages: StaffMessage[] = []
    setMessages(realMessages)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedStaff) return
    
    try {
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

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || staff.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading staff data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Staff Monitoring</h2>
          <p className="text-gray-400">Real-time staff location and status tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {staffMembers.filter(s => s.isOnline).length} online
          </span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | StaffStatus)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="on_job">On Job</option>
          <option value="break">On Break</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStaff.map((staff) => (
          <div
            key={staff.id}
            onClick={() => {
              setSelectedStaff(staff)
              loadMessages(staff.id)
            }}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
              selectedStaff?.id === staff.id
                ? 'bg-cyan-500/10 border-cyan-500/50'
                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-300" />
                  </div>
                  {staff.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-white">{staff.name}</h3>
                  <p className="text-sm text-gray-400">{staff.role}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(staff.status)}`}>
                {getStatusText(staff.status)}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Jobs Today:</span>
                <span className="text-white">{staff.completedJobsToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Rating:</span>
                <span className="text-white">{staff.rating.toFixed(1)}/5.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Seen:</span>
                <span className="text-white">{formatLastSeen(staff.lastSeen)}</span>
              </div>
            </div>

            {staff.unreadMessages > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400">
                  {staff.unreadMessages} unread message{staff.unreadMessages > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Staff Details */}
      {selectedStaff && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {selectedStaff.name} - Details & Messaging
          </h3>

          {/* Messages */}
          <div className="space-y-4">
            <h4 className="font-medium text-white">Recent Messages</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.fromStaffId === 'admin'
                      ? 'bg-cyan-500/20 ml-8'
                      : 'bg-gray-700/50 mr-8'
                  }`}
                >
                  <p className="text-white text-sm">{message.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Send Message */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
