'use client'

import { CalendarView } from '@/components/admin/CalendarView'
import AdminSidebarLayout from '@/components/layout/AdminSidebarLayout'

export default function CalendarPage() {
  return (
    <AdminSidebarLayout>
      <div className="min-h-screen bg-black">
        <div className="max-w-[1800px] mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
            <p className="text-neutral-400">
              View all bookings, jobs, and events in calendar format
            </p>
          </div>

          {/* Calendar Component */}
          <CalendarView />
        </div>
      </div>
    </AdminSidebarLayout>
  )
}
