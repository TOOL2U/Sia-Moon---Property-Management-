'use client'

import { useState, useEffect } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { Bell, Search, Calendar, ChevronDown, Menu } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { format } from 'date-fns'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function DashboardLayout({ 
  children, 
  title = "Dashboard",
  subtitle,
  actions 
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Auto-collapse sidebar on mobile, but preserve user preference on desktop
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [sidebarCollapsed])

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <DashboardSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={handleSidebarToggle}
      />

      {/* Mobile Overlay */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out min-h-screen
        ${isMobile
          ? 'ml-0'
          : sidebarCollapsed
            ? 'ml-16'
            : 'ml-64'
        }
      `}>
        {/* Top Header */}
        <header className="bg-neutral-950 border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Mobile Menu + Title */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-neutral-400 hover:text-white p-2 md:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              )}

              <div>
                <h1 className="text-xl font-semibold text-white">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-neutral-400 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Right Side - Actions & Notifications */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 min-w-[300px]">
                <Search className="w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search properties, bookings, guests..."
                  className="bg-transparent text-white placeholder-neutral-400 text-sm flex-1 outline-none"
                />
              </div>

              {/* Date Selector */}
              <div className="hidden lg:flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span className="text-white text-sm">
                  {format(new Date(), 'MMM yyyy')}
                </span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </div>

              {/* Notifications */}
              <NotificationBell className="text-neutral-400 hover:text-white p-2" />

              {/* Custom Actions */}
              {actions}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
