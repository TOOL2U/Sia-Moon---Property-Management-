'use client'

import { EnhancedBookingManagement } from '@/components/admin/EnhancedBookingManagement'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BookingService } from '@/lib/services/bookingService'
import { clientToast as toast } from '@/utils/clientToast'
import {
  Calendar,
  RefreshCw,
  Zap,
  Users,
  CheckCircle
} from 'lucide-react'
import { useState } from 'react'

export default function AdminBookingsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Refresh booking data
      await BookingService.getAllBookings()
      toast.success('Bookings refreshed successfully')
    } catch (error) {
      console.error('Error refreshing bookings:', error)
      toast.error('Failed to refresh bookings')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleBookingApproved = (bookingId: string) => {
    console.log(`✅ Booking ${bookingId} approved and jobs created`)
    toast.success('Booking approved! Jobs created for staff.')
  }

  const handleStaffAssigned = (bookingId: string, staffIds: string[]) => {
    console.log(`👥 Staff assigned to booking ${bookingId}:`, staffIds)
    toast.success(`Assigned ${staffIds.length} staff member(s) to booking`)
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <div className="relative">
                  <Calendar className="w-10 h-10 text-blue-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                Booking Management
              </h1>
              <p className="text-neutral-400 text-lg">
                Professional booking workflow with automatic job creation and mobile app integration
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-base">
                <Zap className="w-5 h-5 text-blue-400" />
                Automatic Job Creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-blue-200">
                Approved bookings automatically create 7 standard jobs for staff
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-base">
                <Users className="w-5 h-5 text-purple-400" />
                Mobile App Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-purple-200">
                Jobs are instantly sent to staff mobile app for acceptance
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-900/30 to-green-800/30 border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-base">
                <CheckCircle className="w-5 h-5 text-green-400" />
                AI-Powered Matching
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-green-200">
                Smart client matching and property assignment with AI
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Booking Management Component */}
        <EnhancedBookingManagement
          onBookingApproved={handleBookingApproved}
          onStaffAssigned={handleStaffAssigned}
        />
      </div>
    </div>
  )
}
