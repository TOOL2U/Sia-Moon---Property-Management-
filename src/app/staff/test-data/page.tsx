'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import StaffService from '@/lib/staffService'
import { CreateStaffData } from '@/types/staff'

export default function StaffTestDataPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const sampleStaff: CreateStaffData[] = [
    {
      name: 'Maria Santos',
      email: 'maria.santos@siamoon.com',
      phone: '+62 812 3456 7890',
      role: 'cleaner',
      status: 'active'
    },
    {
      name: 'Ahmad Wijaya',
      email: 'ahmad.wijaya@siamoon.com',
      phone: '+62 813 4567 8901',
      role: 'maintenance',
      status: 'active'
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@siamoon.com',
      phone: '+62 814 5678 9012',
      role: 'admin',
      status: 'active'
    },
    {
      name: 'Ketut Bali',
      email: 'ketut.bali@siamoon.com',
      phone: '+62 815 6789 0123',
      role: 'supervisor',
      status: 'active'
    },
    {
      name: 'Lisa Chen',
      email: 'lisa.chen@siamoon.com',
      phone: '+62 816 7890 1234',
      role: 'cleaner',
      status: 'inactive'
    },
    {
      name: 'Wayan Putra',
      email: 'wayan.putra@siamoon.com',
      phone: '+62 817 8901 2345',
      role: 'maintenance',
      status: 'active'
    }
  ]

  const createSampleData = async () => {
    setLoading(true)
    setMessage(null)

    try {
      let successCount = 0
      let errorCount = 0

      for (const staff of sampleStaff) {
        const response = await StaffService.createStaff(staff)
        if (response.success) {
          successCount++
        } else {
          errorCount++
          console.error(`Failed to create ${staff.name}:`, response.error)
        }
      }

      setMessage(`✅ Created ${successCount} staff members successfully. ${errorCount} errors.`)
    } catch (error) {
      setMessage('❌ Failed to create sample data')
      console.error('Error creating sample data:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearAllData = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // Get all staff
      const response = await StaffService.getAllStaff()
      if (response.success) {
        let deleteCount = 0
        for (const staff of response.data) {
          const deleteResponse = await StaffService.deleteStaff(staff.id)
          if (deleteResponse.success) {
            deleteCount++
          }
        }
        setMessage(`🗑️ Deleted ${deleteCount} staff members`)
      }
    } catch (error) {
      setMessage('❌ Failed to clear data')
      console.error('Error clearing data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Staff Test Data</h1>
          <p className="text-gray-400">Create sample staff data for testing the staff management system</p>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Sample Data Management</CardTitle>
            <CardDescription className="text-gray-400">
              Create or clear sample staff data for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <div className="p-4 bg-neutral-800 rounded-lg">
                <p className="text-white">{message}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={createSampleData}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Creating...' : 'Create Sample Staff Data'}
              </Button>

              <Button
                onClick={clearAllData}
                disabled={loading}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                {loading ? 'Clearing...' : 'Clear All Staff Data'}
              </Button>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">Sample Staff Data Preview</h3>
              <div className="space-y-3">
                {sampleStaff.map((staff, index) => (
                  <div key={index} className="p-3 bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{staff.name}</p>
                        <p className="text-sm text-gray-400">{staff.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-300 capitalize">{staff.role}</p>
                        <p className="text-xs text-gray-500 capitalize">{staff.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
