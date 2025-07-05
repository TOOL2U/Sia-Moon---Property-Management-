'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import SupabaseService from '@/lib/supabaseService'
import { useTaskNotifications } from '@/hooks/useTaskNotifications'
import { Task, User, Property, Booking } from '@/types/supabase'
import { CheckCircle, XCircle, Loader2, ClipboardList, Users, Building, Calendar } from 'lucide-react'

export default function TestTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [staffMembers, setStaffMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  
  const { 
    sendTaskAssignmentNotification, 
    isLoading: notificationLoading, 
    isSuccess: notificationSuccess,
    error: notificationError,
    reset: resetNotification
  } = useTaskNotifications()

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksResult, bookingsResult, propertiesResult, usersResult] = await Promise.all([
        DatabaseService.getAllTasks(),
        DatabaseService.getAllBookings(),
        DatabaseService.getAllProperties(),
        DatabaseService.getAllUsers()
      ])

      setTasks(tasksResult.data || [])
      setBookings(bookingsResult.data || [])
      setProperties(propertiesResult.data || [])
      setStaffMembers((usersResult.data || []).filter(u => u.role === 'staff'))
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const testCreateManualTask = async () => {
    try {
      const staffMember = staffMembers[0]
      const property = properties[0]
      
      if (!staffMember) {
        setTestResults(prev => [...prev, {
          test: 'Manual Task Creation',
          success: false,
          message: 'No staff members available for testing'
        }])
        return
      }

      const { data: newTask, error } = await DatabaseService.createTask({
        title: 'Test Manual Task',
        description: 'This is a test task created manually for testing purposes',
        type: 'maintenance',
        priority: 'medium',
        status: 'pending',
        assigned_to: staffMember.id,
        property_id: property?.id || '',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Due tomorrow
        created_by: 'test-admin'
      })

      if (error || !newTask) {
        setTestResults(prev => [...prev, {
          test: 'Manual Task Creation',
          success: false,
          message: error?.message || 'Failed to create task'
        }])
        return
      }

      setTestResults(prev => [...prev, {
        test: 'Manual Task Creation',
        success: true,
        message: `Task created successfully: ${newTask.title}`,
        data: newTask
      }])

      await loadData() // Refresh data
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Manual Task Creation',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }])
    }
  }

  const testAutoCleaningTask = async () => {
    try {
      const booking = bookings[0]
      
      if (!booking) {
        setTestResults(prev => [...prev, {
          test: 'Auto Cleaning Task',
          success: false,
          message: 'No bookings available for testing'
        }])
        return
      }

      const { data: cleaningTask, error } = await DatabaseService.createCleaningTaskForBooking(booking.id)

      if (error || !cleaningTask) {
        setTestResults(prev => [...prev, {
          test: 'Auto Cleaning Task',
          success: false,
          message: error?.message || 'Failed to create cleaning task'
        }])
        return
      }

      setTestResults(prev => [...prev, {
        test: 'Auto Cleaning Task',
        success: true,
        message: `Cleaning task created for booking: ${booking.guest_name}`,
        data: cleaningTask
      }])

      await loadData() // Refresh data
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Auto Cleaning Task',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }])
    }
  }

  const testEmailNotification = async () => {
    try {
      resetNotification()
      
      const task = tasks[0]
      const staffMember = staffMembers[0]
      const property = properties[0]
      
      if (!task || !staffMember) {
        setTestResults(prev => [...prev, {
          test: 'Email Notification',
          success: false,
          message: 'No task or staff member available for testing'
        }])
        return
      }

      await sendTaskAssignmentNotification({
        task,
        assignee: staffMember,
        property: property ? {
          id: property.id,
          name: property.name,
          location: property.location
        } : undefined
      })

      setTestResults(prev => [...prev, {
        test: 'Email Notification',
        success: true,
        message: `Notification sent to ${staffMember.name} for task: ${task.title}`
      }])

    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Email Notification',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }])
    }
  }

  const testCheckoutAPI = async () => {
    try {
      const booking = bookings[0]
      
      if (!booking) {
        setTestResults(prev => [...prev, {
          test: 'Checkout API',
          success: false,
          message: 'No bookings available for testing'
        }])
        return
      }

      const response = await fetch('/api/bookings/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          actualCheckout: new Date().toISOString()
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setTestResults(prev => [...prev, {
          test: 'Checkout API',
          success: false,
          message: result.message || 'API call failed'
        }])
        return
      }

      setTestResults(prev => [...prev, {
        test: 'Checkout API',
        success: true,
        message: `Checkout processed successfully. Cleaning task: ${result.cleaningTask ? 'Created' : 'Not created'}`,
        data: result
      }])

      await loadData() // Refresh data
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Checkout API',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }])
    }
  }

  const testBookingSync = async () => {
    try {
      const property = properties[0]

      if (!property) {
        setTestResults(prev => [...prev, {
          test: 'Booking Sync',
          success: false,
          message: 'No properties available for testing'
        }])
        return
      }

      // Test the booking sync API
      const response = await fetch(`/api/booking-sync/property/${property.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          airbnbICalUrl: 'https://example.com/test.ics',
          bookingComICalUrl: 'https://example.com/test2.ics',
          enableAutoCleaningTasks: true
        })
      })

      const result = await response.json()

      setTestResults(prev => [...prev, {
        test: 'Booking Sync',
        success: result.success,
        message: result.success
          ? `Sync test completed: ${result.message}`
          : `Sync test failed: ${result.error}`,
        data: result
      }])

    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Booking Sync',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }])
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Task Management System Test
          </h1>
          <p className="text-neutral-400">
            Test all aspects of the task management system including automatic cleaning task creation and email notifications.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Test Controls</CardTitle>
              <CardDescription className="text-neutral-400">
                Run tests for different task management features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testCreateManualTask}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                Test Manual Task Creation
              </Button>

              <Button
                onClick={testAutoCleaningTask}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Test Auto Cleaning Task
              </Button>

              <Button
                onClick={testEmailNotification}
                disabled={loading || notificationLoading}
                variant="outline"
                className="w-full"
              >
                {notificationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                Test Email Notification
              </Button>

              <Button
                onClick={testCheckoutAPI}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Test Checkout API
              </Button>

              <Button
                onClick={testBookingSync}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Test Booking Sync
              </Button>

              <Button
                onClick={clearResults}
                variant="outline"
                className="w-full text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
              >
                Clear Test Results
              </Button>

              <Button
                onClick={loadData}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Refresh Data
              </Button>
            </CardContent>
          </Card>

          {/* Current Data Stats */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Current Data</CardTitle>
              <CardDescription className="text-neutral-400">
                Overview of current system data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-400">Tasks</p>
                      <p className="text-xl font-bold">{tasks.length}</p>
                    </div>
                    <ClipboardList className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-400">Staff</p>
                      <p className="text-xl font-bold">{staffMembers.length}</p>
                    </div>
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-400">Properties</p>
                      <p className="text-xl font-bold">{properties.length}</p>
                    </div>
                    <Building className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
                
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-400">Bookings</p>
                      <p className="text-xl font-bold">{bookings.length}</p>
                    </div>
                    <Calendar className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card className="bg-neutral-900 border-neutral-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Test Results</CardTitle>
              <CardDescription className="text-neutral-400">
                Results from running task management tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">No tests run yet</p>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="bg-neutral-800 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {result.success ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <h4 className="font-medium text-white">{result.test}</h4>
                          </div>
                          <p className="text-sm text-neutral-400">{result.message}</p>
                          {result.data && (
                            <details className="mt-2">
                              <summary className="text-xs text-neutral-500 cursor-pointer">
                                View Details
                              </summary>
                              <pre className="text-xs text-neutral-300 mt-1 bg-neutral-900 p-2 rounded overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-neutral-900 border-neutral-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-neutral-300">
              <p>
                <strong>1. Manual Task Creation:</strong> Tests creating a task manually through the database service.
              </p>
              <p>
                <strong>2. Auto Cleaning Task:</strong> Tests automatic cleaning task creation for existing bookings.
              </p>
              <p>
                <strong>3. Email Notification:</strong> Tests sending task assignment notifications via Make.com webhook.
              </p>
              <p>
                <strong>4. Checkout API:</strong> Tests the API endpoint that handles booking checkout and creates cleaning tasks.
              </p>
              <p>
                <strong>5. Booking Sync:</strong> Tests the booking synchronization API that integrates with Airbnb and Booking.com.
              </p>
              <p>
                <strong>Note:</strong> Make sure you have staff members and bookings in the system before running tests.
                You can create these through the signup page and booking forms.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
