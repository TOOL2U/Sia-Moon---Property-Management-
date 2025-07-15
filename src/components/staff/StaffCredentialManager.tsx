'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Mail,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  Send
} from 'lucide-react'
import { FirebaseAuthService } from '@/lib/services/firebaseAuthService'

interface StaffCredentialManagerProps {
  isOpen: boolean
  onClose: () => void
  staffMember: {
    id: string
    name: string
    email: string
    role: string
    status: string
  }
  onCredentialsUpdated?: () => void
}

interface CredentialForm {
  newEmail: string
  newPassword: string
  confirmPassword: string
  sendResetEmail: boolean
}

export default function StaffCredentialManager({
  isOpen,
  onClose,
  staffMember,
  onCredentialsUpdated
}: StaffCredentialManagerProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'update' | 'reset'>('view')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [formData, setFormData] = useState<CredentialForm>({
    newEmail: staffMember.email,
    newPassword: '',
    confirmPassword: '',
    sendResetEmail: false
  })

  const generateSecurePassword = () => {
    const password = FirebaseAuthService.generateTemporaryPassword(12)
    setGeneratedPassword(password)
    setFormData(prev => ({
      ...prev,
      newPassword: password,
      confirmPassword: password
    }))
    toast.success('Secure password generated')
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const validateForm = (): string | null => {
    if (activeTab === 'update') {
      if (!formData.newEmail.trim()) return 'Email is required'
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.newEmail)) {
        return 'Please enter a valid email address'
      }

      if (formData.newPassword && formData.newPassword.length < 8) {
        return 'Password must be at least 8 characters long'
      }

      if (formData.newPassword !== formData.confirmPassword) {
        return 'Passwords do not match'
      }
    }
    
    return null
  }

  const handleUpdateCredentials = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setLoading(true)
    try {
      console.log('🔐 Updating staff credentials...')

      const updates: any = {}

      if (formData.newEmail !== staffMember.email) {
        updates.email = formData.newEmail
      }

      if (formData.newPassword) {
        updates.password = formData.newPassword
      }

      if (Object.keys(updates).length === 0) {
        toast.error('No changes to update')
        return
      }

      // Use the staff accounts API endpoint instead of FirebaseAuthService
      const response = await fetch(`/api/admin/staff-accounts/${staffMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Credentials updated successfully')
        onCredentialsUpdated?.()
        onClose()
      } else {
        toast.error(result.error || 'Failed to update credentials')
      }

    } catch (error) {
      console.error('❌ Error updating credentials:', error)
      toast.error('Failed to update credentials')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setLoading(true)
    try {
      console.log('📧 Sending password reset email...')

      const result = await FirebaseAuthService.sendStaffPasswordReset(staffMember.email)

      if (result.success) {
        toast.success('Password reset email sent successfully')
        onClose()
      } else {
        toast.error(result.error || 'Failed to send password reset email')
      }

    } catch (error) {
      console.error('❌ Error sending password reset:', error)
      toast.error('Failed to send password reset email')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-500/20 text-gray-400 border-gray-500/30'

    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'inactive': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'suspended': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getRoleColor = (role: string | undefined) => {
    if (!role) return 'bg-gray-500/20 text-gray-400 border-gray-500/30'

    switch (role.toLowerCase()) {
      case 'manager': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'housekeeper': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'maintenance': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'concierge': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Key className="h-5 w-5" />
            Manage Staff Credentials
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Staff Information */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{staffMember.name}</h3>
                  <p className="text-neutral-400 text-sm">{staffMember.email}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getRoleColor(staffMember.role)}>
                    {staffMember.role || 'No Role'}
                  </Badge>
                  <Badge className={getStatusColor(staffMember.status)}>
                    {staffMember.status || 'No Status'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-neutral-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('view')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'view'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
              }`}
            >
              View Credentials
            </button>
            <button
              onClick={() => setActiveTab('update')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'update'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
              }`}
            >
              Update Credentials
            </button>
            <button
              onClick={() => setActiveTab('reset')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'reset'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
              }`}
            >
              Password Reset
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'view' && (
            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Current Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-neutral-300">Email Address</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={staffMember.email}
                      readOnly
                      className="bg-neutral-700 border-neutral-600 text-white"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(staffMember.email, 'Email')}
                      className="border-neutral-600"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
                    <div className="text-blue-400 text-sm">
                      <p className="font-medium">Mobile App Access</p>
                      <p>This staff member can log into the mobile application using their email and password.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'update' && (
            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Update Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">Email Address</Label>
                  <Input
                    type="email"
                    value={formData.newEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, newEmail: e.target.value }))}
                    placeholder="Enter new email address"
                    className="bg-neutral-700 border-neutral-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">New Password (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      className="bg-neutral-700 border-neutral-600 text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="border-neutral-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateSecurePassword}
                      className="border-neutral-600"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {formData.newPassword && (
                  <div>
                    <Label className="text-white">Confirm Password</Label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      className="bg-neutral-700 border-neutral-600 text-white"
                    />
                  </div>
                )}

                {generatedPassword && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Secure password generated and ready to use
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'reset' && (
            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Password Reset
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <div className="text-yellow-400 text-sm">
                      <p className="font-medium">Password Reset Email</p>
                      <p>This will send a password reset email to <strong>{staffMember.email}</strong>. The staff member will receive instructions to create a new password.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-white font-medium">What happens next:</p>
                  <ul className="text-neutral-400 text-sm space-y-1 ml-4">
                    <li>• Staff member receives password reset email</li>
                    <li>• They click the reset link in the email</li>
                    <li>• They create a new password</li>
                    <li>• They can log into the mobile app with the new password</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
          >
            Cancel
          </Button>
          
          {activeTab === 'update' && (
            <Button
              onClick={handleUpdateCredentials}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Credentials
                </>
              )}
            </Button>
          )}
          
          {activeTab === 'reset' && (
            <Button
              onClick={handlePasswordReset}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reset Email
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
