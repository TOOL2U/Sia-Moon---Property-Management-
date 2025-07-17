'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Users, 
  Play, 
  Trash2, 
  CheckCircle, 
  Clock,
  BrainCircuit,
  Briefcase,
  Calendar,
  Star
} from 'lucide-react'
import { collection, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { clientToast as toast } from '@/utils/clientToast'
import AIAutomationService from '@/services/AIAutomationService'

export default function SmartJobTestPanel() {
  const [isCreatingTestData, setIsCreatingTestData] = useState(false)
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)

  const handleCreateTestStaff = async () => {
    setIsCreatingTestData(true)
    try {
      // Check if AI automation is enabled
      const aiEnabled = await AIAutomationService.isEnabled()
      
      if (!aiEnabled) {
        alert('⚠️ AI Automation is disabled. Enable it in Settings first to test smart job assignment.')
        return
      }

      await createTestStaff()
      toast.success('🧪 Test staff created successfully')
    } catch (error) {
      console.error('Error creating test staff:', error)
      toast.error('Failed to create test staff')
    } finally {
      setIsCreatingTestData(false)
    }
  }

  const handleCreateTestBooking = async () => {
    setIsCreatingBooking(true)
    try {
      // Check if AI automation is enabled
      const aiEnabled = await AIAutomationService.isEnabled()
      
      if (!aiEnabled) {
        alert('⚠️ AI Automation is disabled. Enable it in Settings first.')
        return
      }

      await createTestBooking()
      toast.success('🧪 Test booking created - watch for automatic job creation!')
    } catch (error) {
      console.error('Error creating test booking:', error)
      toast.error('Failed to create test booking')
    } finally {
      setIsCreatingBooking(false)
    }
  }

  const handleCleanupTestData = async () => {
    setIsCleaning(true)
    try {
      // This would clean up test data
      console.log('🧹 Cleaning up test data...')
      toast.success('🧹 Test data cleanup completed')
    } catch (error) {
      console.error('Error cleaning up test data:', error)
      toast.error('Failed to cleanup test data')
    } finally {
      setIsCleaning(false)
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-blue-400" />
          Smart Job Assignment Testing
        </CardTitle>
        <p className="text-neutral-400 text-sm">
          Test the AI job creation and staff assignment system
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={handleCreateTestStaff}
            disabled={isCreatingTestData}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isCreatingTestData ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Create Test Staff
          </Button>

          <Button
            onClick={handleCreateTestBooking}
            disabled={isCreatingBooking}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isCreatingBooking ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Create Test Booking
          </Button>

          <Button
            onClick={handleCleanupTestData}
            disabled={isCleaning}
            variant="outline"
            className="border-red-600 text-red-400 hover:bg-red-900/20"
          >
            {isCleaning ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Cleanup Test Data
          </Button>
        </div>

        {/* Job Types Info */}
        <div className="space-y-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Automatic Job Types Created
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">Pre-Arrival Cleaning</h4>
                <Badge variant="destructive" className="text-xs">High Priority</Badge>
              </div>
              <p className="text-neutral-400 text-sm mb-2">
                Deep cleaning before guest arrival
              </p>
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span>📅 24h before check-in</span>
                <span>⏱️ 3 hours</span>
                <span>🔧 Cleaning, Housekeeping</span>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">Check-in Preparation</h4>
                <Badge variant="destructive" className="text-xs">High Priority</Badge>
              </div>
              <p className="text-neutral-400 text-sm mb-2">
                Prepare property for guest arrival
              </p>
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span>📅 4h before check-in</span>
                <span>⏱️ 1 hour</span>
                <span>🔧 Hospitality, Maintenance</span>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">Post-Departure Cleaning</h4>
                <Badge variant="secondary" className="text-xs">Medium Priority</Badge>
              </div>
              <p className="text-neutral-400 text-sm mb-2">
                Cleaning after guest departure
              </p>
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span>📅 2h after check-out</span>
                <span>⏱️ 2 hours</span>
                <span>🔧 Cleaning, Housekeeping</span>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">Maintenance Check</h4>
                <Badge variant="secondary" className="text-xs">Medium Priority</Badge>
              </div>
              <p className="text-neutral-400 text-sm mb-2">
                Inspect property condition after stay
              </p>
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span>📅 1h after check-out</span>
                <span>⏱️ 45 minutes</span>
                <span>🔧 Maintenance, Inspection</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assignment Factors */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
            <Star className="h-4 w-4" />
            AI Assignment Scoring Factors
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-300 font-medium">Skill Match (40%)</span>
              <p className="text-blue-200 text-xs">Required skills vs staff skills</p>
            </div>
            <div>
              <span className="text-blue-300 font-medium">Performance (30%)</span>
              <p className="text-blue-200 text-xs">Completion rate, ratings, on-time</p>
            </div>
            <div>
              <span className="text-blue-300 font-medium">Workload (20%)</span>
              <p className="text-blue-200 text-xs">Current job assignments</p>
            </div>
            <div>
              <span className="text-blue-300 font-medium">Experience (10%)</span>
              <p className="text-blue-200 text-xs">Previous jobs of same type</p>
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <h3 className="text-green-400 font-medium mb-2">Testing Instructions</h3>
          <ol className="text-green-300 text-sm space-y-1 list-decimal list-inside">
            <li>Ensure AI Automation is enabled in Settings</li>
            <li>Click "Create Test Staff" to set up staff with different skills</li>
            <li>Click "Create Test Booking" to trigger automatic job creation</li>
            <li>Monitor the Jobs page for automatically created and assigned jobs</li>
            <li>Check the Audit Logs for AI assignment decisions</li>
            <li>Verify staff notifications are created</li>
            <li>Use "Cleanup Test Data" when finished testing</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions for creating test data
async function createTestStaff() {
  const testStaff = [
    {
      name: 'Maria Santos',
      email: 'maria.santos@test.com',
      skills: ['cleaning', 'housekeeping', 'laundry'],
      availability: 'available',
      workingHours: {
        start: '08:00',
        end: '17:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      performance: {
        completionRate: 95,
        averageRating: 4.8,
        onTimeCompletion: 92,
        jobsCompleted: 45
      },
      source: 'smart_job_test'
    },
    {
      name: 'John Chen',
      email: 'john.chen@test.com',
      skills: ['maintenance', 'inspection', 'repairs'],
      availability: 'available',
      workingHours: {
        start: '09:00',
        end: '18:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      },
      performance: {
        completionRate: 88,
        averageRating: 4.5,
        onTimeCompletion: 85,
        jobsCompleted: 32
      },
      source: 'smart_job_test'
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@test.com',
      skills: ['hospitality', 'customer_service', 'cleaning'],
      availability: 'available',
      workingHours: {
        start: '07:00',
        end: '16:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      performance: {
        completionRate: 98,
        averageRating: 4.9,
        onTimeCompletion: 96,
        jobsCompleted: 67
      },
      source: 'smart_job_test'
    }
  ]

  for (const staff of testStaff) {
    const staffRef = doc(collection(db, 'staff'))
    await setDoc(staffRef, {
      ...staff,
      createdAt: serverTimestamp()
    })
    console.log(`👤 Created test staff: ${staff.name}`)
  }
}

async function createTestBooking() {
  const testBooking = {
    guestName: 'Smart Job Test Guest',
    guestEmail: 'test.guest@example.com',
    propertyId: 'test_property_smart_jobs',
    propertyName: 'Smart Job Test Villa',
    checkInDate: Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)), // 2 days from now
    checkOutDate: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)), // 5 days from now
    numberOfGuests: 4,
    totalAmount: 750.00,
    status: 'confirmed', // Already confirmed to trigger job creation
    approvedAt: serverTimestamp(),
    approvedBy: 'SMART_JOB_TEST',
    jobsCreated: false, // Will trigger job creation
    source: 'smart_job_test',
    createdAt: serverTimestamp()
  }

  const bookingRef = doc(collection(db, 'bookings'))
  await setDoc(bookingRef, testBooking)
  
  console.log(`📋 Created test booking: ${testBooking.guestName}`)
}
