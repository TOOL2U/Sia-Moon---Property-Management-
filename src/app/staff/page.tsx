'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import StaffService from '@/lib/staffService'
import { 
  StaffProfile, 
  StaffFilters, 
  StaffStats,
  STAFF_ROLES,
  STAFF_STATUSES
} from '@/types/staff'
import AddStaffModal from '@/components/staff/AddStaffModal'
import EditStaffModal from '@/components/staff/EditStaffModal'
import DeleteStaffModal from '@/components/staff/DeleteStaffModal'
import StaffStatsCards from '@/components/staff/StaffStatsCards'

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [stats, setStats] = useState<StaffStats>({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: { cleaner: 0, maintenance: 0, admin: 0, supervisor: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<StaffFilters>({
    search: '',
    role: 'all',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  })

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null)

  /**
   * Load staff data
   */
  const loadStaff = async () => {
    setLoading(true)
    try {
      const response = await StaffService.getAllStaff(filters)
      if (response.success) {
        setStaff(response.data)
        setStats(response.stats)
      } else {
        console.error('Failed to load staff:', response.error)
      }
    } catch (error) {
      console.error('Error loading staff:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key: keyof StaffFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  /**
   * Handle staff actions
   */
  const handleEditStaff = (staff: StaffProfile) => {
    setSelectedStaff(staff)
    setShowEditModal(true)
  }

  const handleDeleteStaff = (staff: StaffProfile) => {
    setSelectedStaff(staff)
    setShowDeleteModal(true)
  }

  const handleToggleStatus = async (staff: StaffProfile) => {
    const newStatus = staff.status === 'active' ? 'inactive' : 'active'
    const response = await StaffService.updateStaff(staff.id, { status: newStatus })
    
    if (response.success) {
      loadStaff() // Reload data
    } else {
      console.error('Failed to update staff status:', response.error)
    }
  }

  /**
   * Get role badge color
   */
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'supervisor': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'maintenance': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'cleaner': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  /**
   * Get status badge color
   */
  const getStatusBadgeColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-500/20 text-green-300 border-green-500/30'
      : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  // Load staff on component mount and filter changes
  useEffect(() => {
    loadStaff()
  }, [filters])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="h-8 w-8" />
                Staff Management
              </h1>
              <p className="text-gray-400 mt-2">
                Manage your property management team members
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-black hover:bg-gray-100"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <StaffStatsCards stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search staff by name or email..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10 bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                </div>

                {/* Role Filter */}
                <Select
                  value={filters.role || 'all'}
                  onValueChange={(value) => handleFilterChange('role', value)}
                >
                  <SelectTrigger className="w-[180px] bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="all">All Roles</SelectItem>
                    {STAFF_ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="w-[180px] bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="all">All Status</SelectItem>
                    {STAFF_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Staff Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Team Members ({staff.length})</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your property management staff
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading staff...</p>
                </div>
              ) : staff.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No staff members found</p>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    variant="outline"
                    className="border-neutral-700 text-white hover:bg-neutral-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Staff Member
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-neutral-800">
                      <tr>
                        <th className="text-left p-4 text-gray-400 font-medium">Name</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Role</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Contact</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Created</th>
                        <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {staff.map((member, index) => (
                          <motion.tr
                            key={member.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                          >
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-white">{member.name}</p>
                                <p className="text-sm text-gray-400">{member.email}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={getRoleBadgeColor(member.role)}>
                                {STAFF_ROLES.find(r => r.value === member.role)?.label}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Badge className={getStatusBadgeColor(member.status)}>
                                {member.status === 'active' ? (
                                  <><UserCheck className="h-3 w-3 mr-1" /> Active</>
                                ) : (
                                  <><UserX className="h-3 w-3 mr-1" /> Inactive</>
                                )}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-gray-400">
                                  <Mail className="h-3 w-3 mr-2" />
                                  {member.email}
                                </div>
                                {member.phone && (
                                  <div className="flex items-center text-sm text-gray-400">
                                    <Phone className="h-3 w-3 mr-2" />
                                    {member.phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center text-sm text-gray-400">
                                <Calendar className="h-3 w-3 mr-2" />
                                {new Date(member.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-neutral-800"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                  align="end"
                                  className="bg-neutral-800 border-neutral-700"
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleEditStaff(member)}
                                    className="text-white hover:bg-neutral-700"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(member)}
                                    className="text-white hover:bg-neutral-700"
                                  >
                                    {member.status === 'active' ? (
                                      <>
                                        <UserX className="h-4 w-4 mr-2" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-neutral-700" />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteStaff(member)}
                                    className="text-red-400 hover:bg-red-500/20"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      <AddStaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadStaff}
      />

      <EditStaffModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedStaff(null)
        }}
        staff={selectedStaff}
        onSuccess={loadStaff}
      />

      <DeleteStaffModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedStaff(null)
        }}
        staff={selectedStaff}
        onSuccess={loadStaff}
      />
    </div>
  )
}
