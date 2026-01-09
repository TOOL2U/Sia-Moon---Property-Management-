'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Calendar,
  ClipboardList,
  ChevronRight,
  Users,
  User,
  Home,
  Building2,
  BarChart3,
  CheckSquare
} from 'lucide-react'

interface AdminSidebarLayoutProps {
  children: React.ReactNode
}

export default function AdminSidebarLayout({ children }: AdminSidebarLayoutProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Clean, essential navigation - only what's needed to run the business
  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/admin',
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: ClipboardList,
      href: '/admin/bookings',
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      href: '/admin/calendar',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      href: '/admin/tasks',
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: Users,
      href: '/admin/staff',
    },
    {
      id: 'properties',
      label: 'Properties',
      icon: Building2,
      href: '/admin/properties',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      href: '/admin/reports',
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Fixed Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-neutral-950 border-r border-neutral-800 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-white">Admin Panel</h2>
                <p className="text-xs text-neutral-400">Management Hub</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-white"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`}
              />
            </Button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.full_name || 'Admin'}
                </p>
                <p className="text-xs text-neutral-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        {children}
      </div>
    </div>
  )
}
