'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Loader2, Users, Search, Plus, Mail, Phone, Shield, MapPin, Clock,
  Edit, Trash2, Star, MoreVertical, Award, TrendingUp, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import EnhancedAddStaffModal from '@/components/staff/EnhancedAddStaffModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/Dialog'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  createdAt: any
  averageRating?: number
  totalRatings?: number
  completedTasks?: number
  assignedProperties?: string[]
  skills?: string[]
  address?: string
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  
  // Edit form
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    address: ''
  })
  
  // Rating form
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    comment: '',
    category: 'performance'
  })

  useEffect(() => {
    loadStaff()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = staff.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredStaff(filtered)
    } else {
      setFilteredStaff(staff)
    }
  }, [searchTerm, staff])

  const loadStaff = async () => {
    try {
      setLoading(true)
      console.log('📋 Loading staff from staff_accounts collection...')

      if (!db) {
        console.error('❌ Firebase not initialized')
        toast.error('Database connection error')
        return
      }

      const staffQuery = query(
        collection(db, 'staff_accounts'),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(staffQuery)
      
      const staffData: StaffMember[] = []
      snapshot.forEach(doc => {
        staffData.push({
          id: doc.id,
          ...doc.data()
        } as StaffMember)
      })

      console.log(`✅ Loaded ${staffData.length} staff members`)
      setStaff(staffData)
      setFilteredStaff(staffData)
      toast.success(`Loaded ${staffData.length} staff members`)
    } catch (error) {
      console.error('❌ Error loading staff:', error)
      toast.error('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle Add Staff
  const handleAddStaff = () => {
    setShowAddModal(true)
  }
  
  const handleStaffCreated = async (newStaff: any, credentials: any) => {
    setShowAddModal(false)
    await loadStaff() // Reload staff list
    toast.success(`${newStaff.name} added successfully!`)
  }
  
  // Handle Edit Staff
  const handleEditStaff = (member: StaffMember) => {
    setSelectedStaff(member)
    setEditForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      status: member.status,
      address: member.address || ''
    })
    setShowEditModal(true)
  }
  
  const handleSaveEdit = async () => {
    if (!selectedStaff || !db) return
    
    try {
      const staffRef = doc(db, 'staff_accounts', selectedStaff.id)
      await updateDoc(staffRef, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        status: editForm.status,
        address: editForm.address,
        updatedAt: new Date()
      })
      
      setShowEditModal(false)
      await loadStaff()
      toast.success('Staff member updated successfully')
    } catch (error) {
      console.error('Error updating staff:', error)
      toast.error('Failed to update staff member')
    }
  }
  
  // Handle Delete Staff
  const handleDeleteStaff = (member: StaffMember) => {
    setSelectedStaff(member)
    setShowDeleteModal(true)
  }
  
  const confirmDelete = async () => {
    if (!selectedStaff || !db) return
    
    try {
      const staffRef = doc(db, 'staff_accounts', selectedStaff.id)
      await deleteDoc(staffRef)
      
      setShowDeleteModal(false)
      setSelectedStaff(null)
      await loadStaff()
      toast.success('Staff member deleted successfully')
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast.error('Failed to delete staff member')
    }
  }
  
  // Handle Rating Staff
  const handleRateStaff = (member: StaffMember) => {
    setSelectedStaff(member)
    setRatingForm({
      rating: 5,
      comment: '',
      category: 'performance'
    })
    setShowRatingModal(true)
  }
  
  const handleSaveRating = async () => {
    if (!selectedStaff || !db) return
    
    try {
      const staffRef = doc(db, 'staff_accounts', selectedStaff.id)
      
      // Calculate new average rating
      const currentRating = selectedStaff.averageRating || 0
      const currentTotal = selectedStaff.totalRatings || 0
      const newTotal = currentTotal + 1
      const newAverage = ((currentRating * currentTotal) + ratingForm.rating) / newTotal
      
      await updateDoc(staffRef, {
        averageRating: newAverage,
        totalRatings: newTotal,
        lastRating: {
          rating: ratingForm.rating,
          comment: ratingForm.comment,
          category: ratingForm.category,
          date: new Date()
        },
        updatedAt: new Date()
      })
      
      setShowRatingModal(false)
      await loadStaff()
      toast.success(`Rating submitted for ${selectedStaff.name}`)
    } catch (error) {
      console.error('Error saving rating:', error)
      toast.error('Failed to save rating')
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      manager: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      staff: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      cleaner: 'bg-green-500/20 text-green-400 border-green-500/30',
      housekeeper: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      maintenance: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      concierge: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    }
    return colors[role.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-green-500/20 text-green-400 border-green-500/30'
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return 'N/A'
    }
  }

  const roleStats = staff.reduce((acc, member) => {
    const role = member.role || 'unknown'
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const activeStaff = staff.filter(m => m.status === 'active').length

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-blue-400/20 rounded-full animate-ping"></div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-white">Loading Staff</h3>
              <p className="text-neutral-400">Fetching staff members from database...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-400" />
                Staff Management
              </h1>
              <p className="text-gray-400 mt-2">
                Manage all staff members • {staff.length} total staff
              </p>
            </div>
            <Button onClick={handleAddStaff} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-400">{staff.length}</div>
              <p className="text-sm text-blue-300">Total Staff</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-600/20 to-green-800/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-400">{activeStaff}</div>
              <p className="text-sm text-green-300">Active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border-purple-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-400">{roleStats.cleaner || 0}</div>
              <p className="text-sm text-purple-300">Cleaners</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600/20 to-orange-800/20 border-orange-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-400">{roleStats.maintenance || 0}</div>
              <p className="text-sm text-orange-300">Maintenance</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search staff by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-800 text-white h-12 text-lg"
            />
          </div>
        </motion.div>

        {/* Staff List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Staff Members
                <Badge variant="secondary" className="bg-neutral-700 text-neutral-300">
                  {filteredStaff.length} members
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStaff.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 rounded-xl border bg-neutral-800/50 border-neutral-700 hover:border-neutral-600 transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Staff Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                            <Badge className={getRoleColor(member.role)}>
                              <Shield className="w-3 h-3 mr-1" />
                              {member.role}
                            </Badge>
                            {member.status && (
                              <Badge className={getStatusColor(member.status)}>
                                {member.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4 text-sm text-neutral-400">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{member.email}</span>
                            </div>
                            {member.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{member.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>Joined {formatDate(member.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Performance & Rating */}
                      <div className="flex flex-col items-end gap-2">
                        {member.averageRating !== undefined && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.round(member.averageRating || 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-neutral-600'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-neutral-400 ml-1">
                              {member.averageRating?.toFixed(1)} ({member.totalRatings || 0})
                            </span>
                          </div>
                        )}
                        {member.completedTasks !== undefined && (
                          <div className="flex items-center gap-1 text-sm text-neutral-400">
                            <Award className="w-4 h-4 text-green-400" />
                            <span>{member.completedTasks} tasks completed</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleRateStaff(member)}
                          variant="outline"
                          size="sm"
                          className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Rate
                        </Button>
                        <Button
                          onClick={() => handleEditStaff(member)}
                          variant="outline"
                          size="sm"
                          className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="border-neutral-600 text-neutral-400">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-neutral-800 border-neutral-700">
                            <DropdownMenuItem
                              onClick={() => handleDeleteStaff(member)}
                              className="text-red-400 hover:bg-red-600/10 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Staff
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Staff ID for mobile app */}
                    <div className="mt-4 pt-4 border-t border-neutral-700">
                      <div className="text-xs text-neutral-500">
                        <span className="font-mono bg-neutral-800 px-2 py-1 rounded">
                          Staff ID: {member.id}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredStaff.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-neutral-300 mb-2">
                    No staff members found
                  </h3>
                  <p className="text-neutral-400">
                    Try adjusting your search term
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Add Staff Modal */}
      <EnhancedAddStaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onStaffCreated={handleStaffCreated}
      />
      
      {/* Edit Staff Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Edit className="w-6 h-6 text-blue-400" />
              Edit Staff Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({...editForm, role: value})}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="cleaner">Cleaner</SelectItem>
                    <SelectItem value="housekeeper">Housekeeper</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="concierge">Concierge</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="border-neutral-700">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2 text-red-400">
              <AlertCircle className="w-6 h-6" />
              Delete Staff Member
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              This action cannot be undone. This will permanently delete the staff member account.
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="py-4">
              <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <p className="text-white font-semibold mb-1">{selectedStaff.name}</p>
                <p className="text-sm text-neutral-400">{selectedStaff.email}</p>
                <p className="text-sm text-neutral-500 mt-2">Role: {selectedStaff.role}</p>
              </div>
              <p className="text-sm text-neutral-400 mt-4">
                Are you sure you want to delete this staff member? All associated data will be removed.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="border-neutral-700">
              Cancel
            </Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rate Staff Modal */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" />
              Rate Staff Performance
            </DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <p className="text-white font-semibold mb-1">{selectedStaff.name}</p>
                <p className="text-sm text-neutral-400">{selectedStaff.role}</p>
                {selectedStaff.averageRating !== undefined && (
                  <p className="text-sm text-neutral-500 mt-2">
                    Current Rating: {selectedStaff.averageRating.toFixed(1)} ⭐ ({selectedStaff.totalRatings} ratings)
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Rating (1-5 stars)</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingForm({...ratingForm, rating: star})}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= ratingForm.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-neutral-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-lg font-semibold text-yellow-400">
                    {ratingForm.rating} / 5
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={ratingForm.category} onValueChange={(value) => setRatingForm({...ratingForm, category: value})}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="performance">Overall Performance</SelectItem>
                    <SelectItem value="quality">Quality of Work</SelectItem>
                    <SelectItem value="punctuality">Punctuality</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="teamwork">Teamwork</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Comments (optional)</Label>
                <Textarea
                  value={ratingForm.comment}
                  onChange={(e) => setRatingForm({...ratingForm, comment: e.target.value})}
                  placeholder="Add any comments about this rating..."
                  className="bg-neutral-800 border-neutral-700"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRatingModal(false)} className="border-neutral-700">
              Cancel
            </Button>
            <Button onClick={handleSaveRating} className="bg-yellow-600 hover:bg-yellow-700">
              <Star className="w-4 h-4 mr-2" />
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
