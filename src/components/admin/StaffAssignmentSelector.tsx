'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from 'sonner'
import {
  User,
  Users,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Star,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Zap,
  Brain,
  UserCheck,
  AlertTriangle,
  Sparkles,
  Target
} from 'lucide-react'
import JobAssignmentService, { JobType, JobPriority } from '@/services/JobAssignmentService'

interface StaffMember {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  skills: string[]
  isActive: boolean
  availability?: 'available' | 'busy' | 'off_duty' | 'unavailable'
  currentLocation?: {
    latitude: number
    longitude: number
    lastUpdated: string
  }
  completedJobs?: number
  averageRating?: number
  profilePhoto?: string
}

interface StaffAssignmentSelectorProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (staffId: string, jobData: any) => void
  bookingData: any
  jobType?: JobType
  requiredSkills?: string[]
  priority?: JobPriority
  scheduledDate?: string
  autoAssignEnabled?: boolean
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

const cardHoverVariants = {
  hover: {
    y: -2,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

export function StaffAssignmentSelector({
  isOpen,
  onClose,
  onAssign,
  bookingData,
  jobType = 'cleaning',
  requiredSkills = [],
  priority = 'medium',
  scheduledDate,
  autoAssignEnabled = false
}: StaffAssignmentSelectorProps) {
  // State management
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([])
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [skillFilter, setSkillFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'distance' | 'workload'>('rating')

  // Auto-assignment state
  const [autoAssignSuggestion, setAutoAssignSuggestion] = useState<StaffMember | null>(null)
  const [showAutoAssignDialog, setShowAutoAssignDialog] = useState(false)

  // Load available staff
  const loadAvailableStaff = useCallback(async () => {
    try {
      setLoading(true)
      console.log('👥 Loading available staff for assignment...')

      const result = await JobAssignmentService.getAvailableStaff({
        skills: requiredSkills.length > 0 ? requiredSkills : undefined,
        date: scheduledDate
      })

      if (result.success && result.staff) {
        setAvailableStaff(result.staff)
        setFilteredStaff(result.staff)
        console.log(`✅ Loaded ${result.staff.length} available staff members`)

        // Auto-assign suggestion if enabled
        if (autoAssignEnabled && result.staff.length > 0) {
          const suggestion = await generateAutoAssignSuggestion(result.staff)
          if (suggestion) {
            setAutoAssignSuggestion(suggestion)
            setShowAutoAssignDialog(true)
          }
        }
      } else {
        console.error('❌ Failed to load staff:', result.error)
        toast.error('Failed to load available staff')
      }
    } catch (error) {
      console.error('❌ Error loading staff:', error)
      toast.error('Error loading staff members')
    } finally {
      setLoading(false)
    }
  }, [requiredSkills, scheduledDate, autoAssignEnabled])

  // Generate auto-assignment suggestion
  const generateAutoAssignSuggestion = async (staff: StaffMember[]): Promise<StaffMember | null> => {
    try {
      // Simple scoring algorithm (can be enhanced with AI)
      const scoredStaff = staff.map(member => {
        let score = 0

        // Skill matching (40% weight)
        if (requiredSkills.length > 0) {
          const matchingSkills = member.skills.filter(skill => 
            requiredSkills.includes(skill)
          ).length
          score += (matchingSkills / requiredSkills.length) * 40
        } else {
          score += 40 // No specific skills required
        }

        // Availability (30% weight)
        if (member.availability === 'available') score += 30
        else if (member.availability === 'busy') score += 15

        // Rating (20% weight)
        if (member.averageRating) {
          score += (member.averageRating / 5) * 20
        } else {
          score += 16 // Default rating assumption
        }

        // Workload (10% weight) - fewer current jobs is better
        const currentJobs = member.completedJobs || 0
        score += Math.max(0, 10 - (currentJobs * 0.1))

        return { ...member, score }
      })

      // Sort by score and return top candidate
      scoredStaff.sort((a, b) => b.score - a.score)
      return scoredStaff[0] || null

    } catch (error) {
      console.error('❌ Error generating auto-assign suggestion:', error)
      return null
    }
  }

  // Filter and sort staff
  useEffect(() => {
    let filtered = [...availableStaff]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(staff =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply skill filter
    if (skillFilter !== 'all') {
      filtered = filtered.filter(staff =>
        staff.skills.includes(skillFilter)
      )
    }

    // Apply availability filter
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(staff =>
        staff.availability === availabilityFilter
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0)
        case 'workload':
          return (a.completedJobs || 0) - (b.completedJobs || 0)
        default:
          return 0
      }
    })

    setFilteredStaff(filtered)
  }, [availableStaff, searchTerm, skillFilter, availabilityFilter, sortBy])

  // Handle staff assignment
  const handleAssignStaff = async (staffId: string) => {
    if (!staffId) {
      toast.error('Please select a staff member')
      return
    }

    try {
      setAssigning(true)
      const selectedStaff = availableStaff.find(s => s.id === staffId)
      
      if (!selectedStaff) {
        toast.error('Selected staff member not found')
        return
      }

      console.log('🎯 Assigning job to staff:', selectedStaff.name)

      // Prepare job data
      const jobData = {
        jobType,
        title: `${jobType.charAt(0).toUpperCase() + jobType.slice(1)} - ${bookingData.propertyName || bookingData.property}`,
        description: `${jobType} job for ${bookingData.guestName || bookingData.guest_name} at ${bookingData.propertyName || bookingData.property}`,
        priority,
        estimatedDuration: getEstimatedDuration(jobType),
        requiredSkills,
        specialInstructions: bookingData.specialRequests || bookingData.special_requests || '',
        scheduledDate: scheduledDate || bookingData.checkInDate || bookingData.checkIn || bookingData.check_in,
        deadline: bookingData.checkInDate || bookingData.checkIn || bookingData.check_in
      }

      // Create job via service
      const result = await JobAssignmentService.createJobFromBooking(
        bookingData,
        jobData,
        staffId,
        {
          id: 'admin_current', // TODO: Get from auth context
          name: 'Admin User'
        }
      )

      if (result.success) {
        toast.success(`Job assigned to ${selectedStaff.name} successfully!`, {
          description: 'Staff member has been notified via mobile app'
        })

        // Trigger callback
        onAssign(staffId, { ...jobData, jobId: result.jobId })
        onClose()
      } else {
        toast.error(result.error || 'Failed to assign job')
      }

    } catch (error) {
      console.error('❌ Error assigning staff:', error)
      toast.error('Failed to assign staff member')
    } finally {
      setAssigning(false)
    }
  }

  // Get estimated duration based on job type
  const getEstimatedDuration = (type: JobType): number => {
    const durations: Record<JobType, number> = {
      cleaning: 240,      // 4 hours
      maintenance: 180,   // 3 hours
      inspection: 60,     // 1 hour
      setup: 120,         // 2 hours
      checkout: 90,       // 1.5 hours
      emergency: 120      // 2 hours
    }
    return durations[type] || 180
  }

  // Get availability color
  const getAvailabilityColor = (availability?: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'busy':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'off_duty':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'unavailable':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  // Get unique skills for filter
  const uniqueSkills = Array.from(new Set(availableStaff.flatMap(staff => staff.skills)))

  // Load staff when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableStaff()
    }
  }, [isOpen, loadAvailableStaff])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-hidden">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <DialogHeader className="border-b border-gray-700/50 pb-4">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                Assign Staff Member
              </DialogTitle>
              <DialogDescription className="text-gray-300 mt-2">
                Select a staff member to assign this {jobType} job for{' '}
                <span className="text-white font-medium">
                  {bookingData.guestName || bookingData.guest_name}
                </span>{' '}
                at{' '}
                <span className="text-white font-medium">
                  {bookingData.propertyName || bookingData.property}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              {/* Filters and Search */}
              <motion.div
                className="p-6 border-b border-gray-700/30"
                variants={itemVariants}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-64">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search staff by name, role, or skills..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-purple-500/50"
                    />
                  </div>

                  <Select value={skillFilter} onValueChange={setSkillFilter}>
                    <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600/50 text-white">
                      <SelectValue placeholder="Filter by skill" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="all">All Skills</SelectItem>
                      {uniqueSkills.map(skill => (
                        <SelectItem key={skill} value={skill}>
                          {skill.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600/50 text-white">
                      <SelectValue placeholder="Filter by availability" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="all">All Availability</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="off_duty">Off Duty</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600/50 text-white">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="workload">Workload</SelectItem>
                    </SelectContent>
                  </Select>

                  {autoAssignEnabled && (
                    <Button
                      onClick={() => setShowAutoAssignDialog(true)}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      AI Suggest
                    </Button>
                  )}
                </div>

                {/* Required Skills Display */}
                {requiredSkills.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-300">Required Skills</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {requiredSkills.map(skill => (
                        <Badge key={skill} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {skill.replace('_', ' ').toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Staff List */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    <span className="ml-3 text-gray-400">Loading available staff...</span>
                  </div>
                ) : filteredStaff.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400 mb-2">No Staff Available</h3>
                    <p className="text-gray-500">
                      {searchTerm || skillFilter !== 'all' || availabilityFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'No active staff members found'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {filteredStaff.map((staff, index) => (
                        <motion.div
                          key={`staff-${staff.id || index}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={{ y: -2, scale: 1.02 }}
                          className="group"
                        >
                          <Card
                            className={`cursor-pointer transition-all duration-300 ${
                              selectedStaffId === staff.id
                                ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/50 shadow-purple-500/20'
                                : 'bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/50 hover:border-gray-600/70'
                            }`}
                            onClick={() => setSelectedStaffId(staff.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  selectedStaffId === staff.id
                                    ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                                    : 'bg-gradient-to-r from-gray-600 to-slate-600'
                                } group-hover:scale-110 transition-transform duration-300`}>
                                  <User className="w-6 h-6 text-white" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-white truncate">
                                      {staff.name}
                                    </h4>
                                    {selectedStaffId === staff.id && (
                                      <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                    )}
                                  </div>

                                  <p className="text-sm text-gray-400 mb-2 capitalize">
                                    {staff.role}
                                  </p>

                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge className={getAvailabilityColor(staff.availability)}>
                                      {staff.availability || 'unknown'}
                                    </Badge>

                                    {staff.averageRating && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                        <span className="text-xs text-gray-400">
                                          {staff.averageRating.toFixed(1)}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Skills */}
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {staff.skills.slice(0, 3).map((skill, skillIndex) => (
                                      <Badge
                                        key={`${staff.id}-skill-${skill}-${skillIndex}`}
                                        className={`text-xs ${
                                          requiredSkills.includes(skill)
                                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                        }`}
                                      >
                                        {skill.replace('_', ' ')}
                                      </Badge>
                                    ))}
                                    {staff.skills.length > 3 && (
                                      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                                        +{staff.skills.length - 3}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Contact Info */}
                                  <div className="space-y-1">
                                    {staff.phone && (
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Phone className="w-3 h-3" />
                                        {staff.phone}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <Mail className="w-3 h-3" />
                                      {staff.email}
                                    </div>
                                  </div>

                                  {/* Performance Stats */}
                                  {staff.completedJobs && (
                                    <div className="mt-2 pt-2 border-t border-gray-700/30">
                                      <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span>Completed Jobs</span>
                                        <span className="font-medium">{staff.completedJobs}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <DialogFooter className="border-t border-gray-700/50 p-6">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {selectedStaffId && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>
                        {availableStaff.find(s => s.id === selectedStaffId)?.name} selected
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={() => handleAssignStaff(selectedStaffId)}
                    disabled={!selectedStaffId || assigning}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white min-w-32"
                  >
                    {assigning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Assign Staff
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Auto-Assignment Suggestion Dialog */}
      <Dialog open={showAutoAssignDialog} onOpenChange={setShowAutoAssignDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-purple-400 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Assignment Suggestion
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Based on skills, availability, and performance, we recommend this staff member for the job.
            </DialogDescription>
          </DialogHeader>

          {autoAssignSuggestion && (
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4 my-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{autoAssignSuggestion.name}</h4>
                  <p className="text-sm text-gray-400 capitalize">{autoAssignSuggestion.role}</p>
                </div>
                <div className="ml-auto">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Availability:</span>
                  <Badge className={`ml-2 ${getAvailabilityColor(autoAssignSuggestion.availability)}`}>
                    {autoAssignSuggestion.availability || 'unknown'}
                  </Badge>
                </div>

                {autoAssignSuggestion.averageRating && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Rating:</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-current ml-1" />
                    <span className="text-white">{autoAssignSuggestion.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <span className="text-gray-400 text-sm">Matching Skills:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {autoAssignSuggestion.skills
                    .filter(skill => requiredSkills.includes(skill))
                    .map((skill, skillIndex) => (
                      <Badge key={`auto-assign-skill-${skill}-${skillIndex}`} className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        {skill.replace('_', ' ')}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3">
            <Button
              onClick={() => setShowAutoAssignDialog(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              View All Staff
            </Button>
            <Button
              onClick={() => {
                if (autoAssignSuggestion) {
                  setSelectedStaffId(autoAssignSuggestion.id)
                  setShowAutoAssignDialog(false)
                  handleAssignStaff(autoAssignSuggestion.id)
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Auto-Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  )
}
