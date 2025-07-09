'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  Bell, 
  Mail, 
  Shield, 
  Globe, 
  DollarSign, 
  Calendar, 
  Users, 
  Home,
  Settings as SettingsIcon,
  Save,
  Smartphone
} from 'lucide-react'
import toast from 'react-hot-toast'

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    bookingUpdates: boolean
    paymentAlerts: boolean
    maintenanceReminders: boolean
    marketingEmails: boolean
  }
  preferences: {
    currency: string
    timezone: string
    language: string
    dateFormat: string
    defaultView: string
  }
  privacy: {
    profileVisibility: string
    dataSharing: boolean
    analyticsOptIn: boolean
  }
  business: {
    companyName: string
    businessType: string
    taxId: string
    defaultCheckInTime: string
    defaultCheckOutTime: string
    cleaningBuffer: number
  }
}

const defaultSettings: UserSettings = {
  notifications: {
    email: true,
    push: true,
    sms: false,
    bookingUpdates: true,
    paymentAlerts: true,
    maintenanceReminders: true,
    marketingEmails: false
  },
  preferences: {
    currency: 'USD',
    timezone: 'UTC',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    defaultView: 'calendar'
  },
  privacy: {
    profileVisibility: 'private',
    dataSharing: false,
    analyticsOptIn: true
  },
  business: {
    companyName: '',
    businessType: 'individual',
    taxId: '',
    defaultCheckInTime: '15:00',
    defaultCheckOutTime: '11:00',
    cleaningBuffer: 2
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserSettings()
    }
  }, [user])

  const loadUserSettings = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      if (!db) {
        throw new Error('Database not initialized')
      }
      const userDoc = await getDoc(doc(db, 'users', user.id))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (userData.settings) {
          setSettings({ ...defaultSettings, ...userData.settings })
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!user) return

    try {
      setIsSaving(true)
      
      if (!db) {
        throw new Error('Database not initialized')
      }
      await updateDoc(doc(db, 'users', user.id), {
        settings: settings,
        updatedAt: new Date().toISOString()
      })

      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const updateNotificationSetting = (key: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const updatePreferenceSetting = (key: keyof UserSettings['preferences'], value: string) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }))
  }

  const updatePrivacySetting = (key: keyof UserSettings['privacy'], value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }))
  }

  const updateBusinessSetting = (key: keyof UserSettings['business'], value: string | number) => {
    setSettings(prev => ({
      ...prev,
      business: {
        ...prev.business,
        [key]: value
      }
    }))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <SettingsIcon className="w-8 h-8" />
              Settings
            </h1>
            <p className="text-gray-400">Manage your account preferences and business settings</p>
          </div>
          <Button
            onClick={saveSettings}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Notifications */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription className="text-gray-400">
                Choose how you want to be notified about important updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Email Notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => updateNotificationSetting('email', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Push Notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.push}
                    onChange={(e) => updateNotificationSetting('push', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Booking Updates</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.bookingUpdates}
                    onChange={(e) => updateNotificationSetting('bookingUpdates', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Payment Alerts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.paymentAlerts}
                    onChange={(e) => updateNotificationSetting('paymentAlerts', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Maintenance Reminders</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.maintenanceReminders}
                    onChange={(e) => updateNotificationSetting('maintenanceReminders', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Preferences
              </CardTitle>
              <CardDescription className="text-gray-400">
                Customize your app experience and regional settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                <select
                  value={settings.preferences.currency}
                  onChange={(e) => updatePreferenceSetting('currency', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="THB">THB (฿)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                <select
                  value={settings.preferences.timezone}
                  onChange={(e) => updatePreferenceSetting('timezone', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date Format</label>
                <select
                  value={settings.preferences.dateFormat}
                  onChange={(e) => updatePreferenceSetting('dateFormat', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Default Dashboard View</label>
                <select
                  value={settings.preferences.defaultView}
                  onChange={(e) => updatePreferenceSetting('defaultView', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="calendar">Calendar View</option>
                  <option value="list">List View</option>
                  <option value="grid">Grid View</option>
                  <option value="analytics">Analytics View</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Business Settings */}
          <Card className="bg-neutral-900 border-neutral-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Business Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure your property management business details and operational preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                  <Input
                    value={settings.business.companyName}
                    onChange={(e) => updateBusinessSetting('companyName', e.target.value)}
                    placeholder="Enter your company name"
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Type</label>
                  <select
                    value={settings.business.businessType}
                    onChange={(e) => updateBusinessSetting('businessType', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="individual">Individual</option>
                    <option value="llc">LLC</option>
                    <option value="corporation">Corporation</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Check-in Time</label>
                  <Input
                    type="time"
                    value={settings.business.defaultCheckInTime}
                    onChange={(e) => updateBusinessSetting('defaultCheckInTime', e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Check-out Time</label>
                  <Input
                    type="time"
                    value={settings.business.defaultCheckOutTime}
                    onChange={(e) => updateBusinessSetting('defaultCheckOutTime', e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cleaning Buffer Time (hours)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  value={settings.business.cleaningBuffer}
                  onChange={(e) => updateBusinessSetting('cleaningBuffer', parseInt(e.target.value) || 0)}
                  placeholder="Hours between bookings for cleaning"
                  className="bg-neutral-800 border-neutral-700 text-white max-w-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Time buffer between check-out and next check-in for cleaning
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="bg-neutral-900 border-neutral-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription className="text-gray-400">
                Control your privacy settings and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Profile Visibility</h4>
                  <p className="text-gray-400 text-sm">Control who can see your profile information</p>
                </div>
                <select
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => updatePrivacySetting('profileVisibility', e.target.value)}
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">Private</option>
                  <option value="contacts">Contacts Only</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Data Sharing</h4>
                  <p className="text-gray-400 text-sm">Allow sharing anonymized data for service improvement</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.dataSharing}
                  onChange={(e) => updatePrivacySetting('dataSharing', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Analytics Opt-in</h4>
                  <p className="text-gray-400 text-sm">Help us improve by sharing usage analytics</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.analyticsOptIn}
                  onChange={(e) => updatePrivacySetting('analyticsOptIn', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
