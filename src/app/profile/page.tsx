'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { User, Mail, Calendar, Shield, Edit3, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    bio: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || '',
        email: user.email || '',
        phone: '',
        company: '',
        bio: ''
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      if (!db) {
        throw new Error('Database not initialized')
      }
      await updateDoc(doc(db, 'users', user.id), {
        fullName: formData.fullName,
        phone: formData.phone,
        company: formData.company,
        bio: formData.bio,
        updatedAt: new Date().toISOString()
      })

      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        fullName: user.full_name || '',
        email: user.email || '',
        phone: '',
        company: '',
        bio: ''
      })
    }
    setIsEditing(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">Manage your personal information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Personal Information</CardTitle>
                  <CardDescription className="text-gray-400">
                    Update your personal details and contact information
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      disabled={!isEditing}
                      className="bg-neutral-800 border-neutral-700 text-white disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <Input
                      value={formData.email}
                      disabled
                      className="bg-neutral-800 border-neutral-700 text-white opacity-60"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Enter phone number"
                      className="bg-neutral-800 border-neutral-700 text-white disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company
                    </label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Enter company name"
                      className="bg-neutral-800 border-neutral-700 text-white disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-gray-500 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Summary */}
          <div className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.full_name || 'No name set'}</p>
                    <p className="text-gray-400 text-sm">{user.role}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Member since 2024</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm capitalize">{user.role} Account</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Account Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Properties</span>
                  <span className="text-white font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Bookings</span>
                  <span className="text-white font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Revenue</span>
                  <span className="text-white font-medium">$0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
