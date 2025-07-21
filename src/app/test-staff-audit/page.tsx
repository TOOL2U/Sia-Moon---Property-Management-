'use client'

import React from 'react'
import StaffAuditReports from '@/components/admin/StaffAuditReports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

// Mock staff list for testing
const mockStaffList = [
  {
    id: 'staff_001',
    name: 'John Smith',
    role: 'cleaner',
    status: 'active',
    email: 'john@example.com'
  },
  {
    id: 'staff_002',
    name: 'Maria Garcia',
    role: 'maintenance',
    status: 'active',
    email: 'maria@example.com'
  },
  {
    id: 'staff_003',
    name: 'David Chen',
    role: 'manager',
    status: 'active',
    email: 'david@example.com'
  }
]

export default function TestStaffAuditPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Staff Audit Reports Test Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-400 mb-6">
              This page tests the StaffAuditReports component integration with Firestore.
              The component should display staff audit reports from the ai_audits collection.
            </p>
            
            <StaffAuditReports staffList={mockStaffList} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
