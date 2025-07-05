'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

import { User, Mail, Phone, MapPin, Calendar, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const auth = useAuth()
  const user = auth.profile
  const authLoading = auth.loading

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  })

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-neutral-400 text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400">Please sign in to view your profile</p>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await auth.updateProfile(formData)
      if (success) {
        setIsEditing(false)
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    })
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-6 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/client"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-semibold text-white">Profile Settings</h1>
          <p className="text-neutral-400 mt-1">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <div className="lg:col-span-2">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-neutral-300 mb-1">
                      Full Name
                    </label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      disabled={!isEditing}
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-neutral-300 mb-1">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      className="bg-neutral-800 border-neutral-700 text-white"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-neutral-300 mb-1">
                      Account Type
                    </label>
                    <Input
                      id="role"
                      value={user.role}
                      disabled
                      className="bg-neutral-800 border-neutral-700 text-neutral-500 capitalize"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-neutral-300 mb-1">
                    Address
                  </label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="Enter your address"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Summary */}
          <div>
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-neutral-500" />
                  <div>
                    <p className="text-neutral-300">Email</p>
                    <p className="text-neutral-500">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-neutral-500" />
                  <div>
                    <p className="text-neutral-300">Role</p>
                    <p className="text-neutral-500 capitalize">{user.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-neutral-500" />
                  <div>
                    <p className="text-neutral-300">Member Since</p>
                    <p className="text-neutral-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
