'use client'

/**
 * Job Calendar View with Drag-and-Drop Reassignment
 * Foundation for interactive job scheduling and reassignment
 * 
 * Future Implementation Features:
 * - Drag-and-drop job reassignment between staff/dates
 * - Visual job scheduling with time slots
 * - Staff availability overlay
 * - Conflict detection and resolution
 * - Bulk operations (multi-select, batch reassign)
 * - Calendar views (day, week, month)
 * - Real-time collaboration
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { toast } from 'sonner'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
  Briefcase,
  Plus,
  Filter,
  Search,
  Grid3X3,
  List,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Zap,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Move,
  Copy,
  RotateCcw,
  Save,
  X,
  Loader2
} from 'lucide-react'
import { JobData, JobStatus, JobType, JobPriority } from '@/services/JobAssignmentService'

interface JobCalendarViewProps {
  className?: string
}

// Calendar view types
type CalendarView = 'day' | 'week' | 'month'

// Calendar job item
interface CalendarJobItem extends JobData {
  calendarPosition: {
    startTime: string
    endTime: string
    duration: number // minutes
    column: number // staff column index
    conflicts: string[] // conflicting job IDs
  }
  dragState?: {
    isDragging: boolean
    dragOffset: { x: number; y: number }
    originalPosition: { x: number; y: number }
    targetStaffId?: string
    targetDate?: string
    targetTime?: string
  }
}

// Staff column data
interface StaffColumn {
  staffId: string
  staffName: string
  staffAvatar?: string
  isAvailable: boolean
  workingHours: {
    start: string
    end: string
  }
  currentJobs: CalendarJobItem[]
  capacity: {
    current: number
    maximum: number
    utilization: number
  }
}

// Time slot configuration
interface TimeSlotConfig {
  startHour: number
  endHour: number
  slotDuration: number // minutes
  showWeekends: boolean
  timeZone: string
}

// Drag and drop context
interface DragDropContext {
  draggedJob: CalendarJobItem | null
  dropTarget: {
    staffId?: string
    date?: string
    timeSlot?: string
  } | null
  isValidDrop: boolean
  conflicts: string[]
}

export function JobCalendarView({ className }: JobCalendarViewProps) {
  // State management
  const [currentView, setCurrentView] = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [jobs, setJobs] = useState<CalendarJobItem[]>([])
  const [staffColumns, setStaffColumns] = useState<StaffColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  
  // Drag and drop state
  const [dragContext, setDragContext] = useState<DragDropContext>({
    draggedJob: null,
    dropTarget: null,
    isValidDrop: false,
    conflicts: []
  })
  
  // Configuration
  const [timeSlotConfig, setTimeSlotConfig] = useState<TimeSlotConfig>({
    startHour: 6,
    endHour: 22,
    slotDuration: 30,
    showWeekends: true,
    timeZone: 'Asia/Bangkok'
  })

  // Refs for drag and drop
  const calendarRef = useRef<HTMLDivElement>(null)
  const dragPreviewRef = useRef<HTMLDivElement>(null)

  // Helper function to calculate end time
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)
    startDate.setMinutes(startDate.getMinutes() + durationMinutes)
    return `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`
  }

  // Load calendar data
  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true)
      console.log('📅 Loading calendar data...')

      // Load real staff data from API
      const staffResponse = await fetch('/api/admin/staff-accounts')
      const staffData = await staffResponse.json()

      const realStaffColumns: StaffColumn[] = staffData.success ? staffData.data.map((staff: any) => ({
        staffId: staff.id,
        staffName: staff.name || 'Unknown Staff',
        staffAvatar: staff.avatar || '/avatars/default.jpg',
        isAvailable: staff.status === 'active',
        workingHours: { start: '08:00', end: '17:00' }, // TODO: Get from staff profile
        currentJobs: [],
        capacity: { current: 0, maximum: 5, utilization: 0 } // TODO: Calculate from real jobs
      })) : []

      // Load real jobs data from API
      const jobsResponse = await fetch('/api/admin/job-assignments')
      const jobsData = await jobsResponse.json()

      const realJobs: CalendarJobItem[] = jobsData.success ? jobsData.data.map((job: any) => ({
        id: job.id,
        title: job.title || 'Untitled Job',
        jobType: job.jobType || 'general',
        priority: job.priority || 'medium',
        status: job.status || 'pending',
        assignedStaffId: job.assignedStaff?.[0] || '',
        scheduledDate: job.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledStartTime: job.scheduledTime || '09:00',
        estimatedDuration: job.estimatedDuration || 120,
        calendarPosition: {
          startTime: job.scheduledTime || '09:00',
          endTime: calculateEndTime(job.scheduledTime || '09:00', job.estimatedDuration || 120),
          duration: job.estimatedDuration || 120,
          column: 0, // TODO: Calculate based on staff assignment
          conflicts: []
        }
      } as CalendarJobItem)) : []

      setStaffColumns(realStaffColumns)
      setJobs(realJobs)

      console.log(`✅ Loaded ${realJobs.length} jobs for ${realStaffColumns.length} staff members`)

    } catch (error) {
      console.error('❌ Error loading calendar data:', error)
      toast.error('Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }, [currentDate, currentView])

  // Handle job drag start
  const handleJobDragStart = useCallback((job: CalendarJobItem, event: React.DragEvent) => {
    console.log('🖱️ Starting job drag:', job.title)
    
    setDragContext(prev => ({
      ...prev,
      draggedJob: job,
      isValidDrop: false,
      conflicts: []
    }))

    // Set drag data
    event.dataTransfer.setData('application/json', JSON.stringify({
      jobId: job.id,
      type: 'job_reassignment'
    }))

    // Create drag preview
    if (dragPreviewRef.current) {
      event.dataTransfer.setDragImage(dragPreviewRef.current, 0, 0)
    }

    // Update job drag state
    setJobs(prev => prev.map(j => 
      j.id === job.id 
        ? { ...j, dragState: { ...j.dragState, isDragging: true } }
        : j
    ))
  }, [])

  // Handle job drag end
  const handleJobDragEnd = useCallback((job: CalendarJobItem) => {
    console.log('🖱️ Ending job drag:', job.title)
    
    // Reset drag context
    setDragContext({
      draggedJob: null,
      dropTarget: null,
      isValidDrop: false,
      conflicts: []
    })

    // Reset job drag state
    setJobs(prev => prev.map(j => 
      j.id === job.id 
        ? { ...j, dragState: undefined }
        : j
    ))
  }, [])

  // Handle drop zone drag over
  const handleDropZoneDragOver = useCallback((
    staffId: string,
    date: string,
    timeSlot: string,
    event: React.DragEvent
  ) => {
    event.preventDefault()
    
    const { draggedJob } = dragContext
    if (!draggedJob) return

    // Check if drop is valid
    const isValidDrop = validateJobDrop(draggedJob, staffId, date, timeSlot)
    const conflicts = findDropConflicts(draggedJob, staffId, date, timeSlot)

    setDragContext(prev => ({
      ...prev,
      dropTarget: { staffId, date, timeSlot },
      isValidDrop,
      conflicts
    }))
  }, [dragContext])

  // Handle job drop
  const handleJobDrop = useCallback(async (
    staffId: string,
    date: string,
    timeSlot: string,
    event: React.DragEvent
  ) => {
    event.preventDefault()
    
    const { draggedJob, isValidDrop } = dragContext
    if (!draggedJob || !isValidDrop) {
      toast.error('Invalid drop location')
      return
    }

    console.log('📍 Dropping job:', draggedJob.title, 'to staff:', staffId, 'at:', date, timeSlot)

    try {
      // TODO: Implement actual job reassignment
      await reassignJob(draggedJob.id!, staffId, date, timeSlot)
      
      toast.success(`Job reassigned to ${getStaffName(staffId)}`)
      
      // Reload calendar data
      await loadCalendarData()

    } catch (error) {
      console.error('❌ Error reassigning job:', error)
      toast.error('Failed to reassign job')
    }
  }, [dragContext, loadCalendarData])

  // Validate job drop
  const validateJobDrop = (
    job: CalendarJobItem,
    targetStaffId: string,
    targetDate: string,
    targetTimeSlot: string
  ): boolean => {
    // TODO: Implement validation logic
    // Check staff availability, skills, capacity, etc.
    
    const targetStaff = staffColumns.find(s => s.staffId === targetStaffId)
    if (!targetStaff?.isAvailable) return false
    
    if (targetStaff.capacity.current >= targetStaff.capacity.maximum) return false
    
    return true
  }

  // Find drop conflicts
  const findDropConflicts = (
    job: CalendarJobItem,
    targetStaffId: string,
    targetDate: string,
    targetTimeSlot: string
  ): string[] => {
    // TODO: Implement conflict detection
    // Check for overlapping jobs, double bookings, etc.
    
    return []
  }

  // Reassign job
  const reassignJob = async (
    jobId: string,
    newStaffId: string,
    newDate: string,
    newTimeSlot: string
  ): Promise<void> => {
    // TODO: Implement actual reassignment API call
    console.log('🔄 Reassigning job:', { jobId, newStaffId, newDate, newTimeSlot })
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Get staff name by ID
  const getStaffName = (staffId: string): string => {
    return staffColumns.find(s => s.staffId === staffId)?.staffName || 'Unknown Staff'
  }

  // Navigate calendar
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
    }
    
    setCurrentDate(newDate)
  }

  // Generate time slots
  const generateTimeSlots = (): string[] => {
    const slots: string[] = []
    const { startHour, endHour, slotDuration } = timeSlotConfig
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }
    
    return slots
  }

  // Get date range for current view
  const getDateRange = (): Date[] => {
    const dates: Date[] = []
    const startDate = new Date(currentDate)
    
    switch (currentView) {
      case 'day':
        dates.push(new Date(startDate))
        break
      case 'week':
        // Get start of week (Monday)
        const dayOfWeek = startDate.getDay()
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        startDate.setDate(startDate.getDate() + mondayOffset)
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate)
          date.setDate(startDate.getDate() + i)
          if (timeSlotConfig.showWeekends || (date.getDay() !== 0 && date.getDay() !== 6)) {
            dates.push(date)
          }
        }
        break
      case 'month':
        // Get all days in month
        const year = startDate.getFullYear()
        const month = startDate.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        
        for (let day = 1; day <= daysInMonth; day++) {
          dates.push(new Date(year, month, day))
        }
        break
    }
    
    return dates
  }

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: currentView === 'month' ? undefined : 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadCalendarData()
  }, [loadCalendarData])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Calendar Header */}
      <Card className="bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border-indigo-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  Job Calendar
                </CardTitle>
                <p className="text-gray-400 mt-1">
                  Drag and drop jobs to reassign staff and schedules
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Selector */}
              <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
                {(['day', 'week', 'month'] as CalendarView[]).map(view => (
                  <Button
                    key={view}
                    onClick={() => setCurrentView(view)}
                    variant={currentView === view ? 'default' : 'ghost'}
                    size="sm"
                    className={currentView === view 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'text-gray-300 hover:text-white'
                    }
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </Button>
                ))}
              </div>
              
              {/* Navigation */}
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => navigateCalendar('prev')}
                  variant="outline"
                  size="sm"
                  className="border-gray-600/50 text-gray-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setCurrentDate(new Date())}
                  variant="outline"
                  size="sm"
                  className="border-gray-600/50 text-gray-300 min-w-20"
                >
                  Today
                </Button>
                <Button
                  onClick={() => navigateCalendar('next')}
                  variant="outline"
                  size="sm"
                  className="border-gray-600/50 text-gray-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                onClick={loadCalendarData}
                variant="outline"
                size="sm"
                disabled={loading}
                className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Current Date Display */}
          <div className="mt-4">
            <h2 className="text-xl font-semibold text-white">
              {currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
                ...(currentView === 'day' && { day: 'numeric', weekday: 'long' })
              })}
            </h2>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card className="bg-gray-900/30 border-gray-700/30">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="ml-3 text-gray-400">Loading calendar...</span>
            </div>
          ) : (
            <div 
              ref={calendarRef}
              className="relative overflow-auto"
              style={{ maxHeight: '70vh' }}
            >
              {/* TODO: Implement calendar grid with drag-and-drop zones */}
              <div className="p-6 text-center">
                <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">Calendar View Coming Soon</h3>
                <p className="text-gray-500 mb-4">
                  Drag-and-drop job scheduling and staff reassignment interface
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>🎯 Features in development:</p>
                  <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                    <li>Visual job scheduling with time slots</li>
                    <li>Drag-and-drop job reassignment</li>
                    <li>Staff availability overlay</li>
                    <li>Conflict detection and resolution</li>
                    <li>Bulk operations and batch reassignment</li>
                    <li>Real-time collaboration</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drag Preview (Hidden) */}
      <div
        ref={dragPreviewRef}
        className="fixed -top-96 left-0 pointer-events-none opacity-0"
      >
        <div className="bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm font-medium">Moving Job...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
