'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Home,
  Building2,
  Calendar,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  ClipboardList,
  CheckSquare,
  Target,
  Activity,
  User,
  Command,
  Briefcase
} from 'lucide-react'

interface DashboardSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [notifications] = useState(3) // Mock notification count

  // Define navigation items based on user role
  const getNavigationItems = () => {
    console.log('🔍 Sidebar - User role:', user?.role)
    console.log('🔍 Sidebar - User object:', user)
    
    const baseItems = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        badge: null
      }
    ]

    // Admin-specific navigation - Clean and essential only
    if (user?.role === 'admin') {
      console.log('✅ Showing ADMIN navigation')
      return [
        ...baseItems,
        {
          name: 'Command Center',
          href: '/admin/backoffice',
          icon: Command,
          badge: null
        },
        {
          name: 'Bookings',
          href: '/admin/bookings',
          icon: ClipboardList,
          badge: null
        },
        {
          name: 'Calendar',
          href: '/admin/calendar',
          icon: Calendar,
          badge: null
        },
        {
          name: 'Tasks',
          href: '/admin/tasks',
          icon: CheckSquare,
          badge: null
        },
        {
          name: 'Staff',
          href: '/admin/staff',
          icon: Users,
          badge: null
        },
        {
          name: 'Properties',
          href: '/admin/properties',
          icon: Building2,
          badge: null
        },
        {
          name: 'Reports',
          href: '/admin/reports',
          icon: BarChart3,
          badge: null
        },
        {
          name: 'Settings',
          href: '/dashboard/settings',
          icon: Settings,
          badge: null
        }
      ]
    }

    // Staff-specific navigation
    if (user?.role === 'staff') {
      console.log('✅ Showing STAFF navigation')
      return [
        {
          name: 'My Tasks',
          href: '/staff',
          icon: ClipboardList,
          badge: null
        },
        {
          name: 'Schedule',
          href: '/staff/schedule',
          icon: Calendar,
          badge: null
        },
        {
          name: 'Performance',
          href: '/staff/performance',
          icon: Target,
          badge: null
        },
        {
          name: 'Settings',
          href: '/staff/settings',
          icon: Settings,
          badge: null
        }
      ]
    }

    // Client-specific navigation (removed bookings for clients)
    console.log('✅ Showing CLIENT navigation (default)')
    return [
      ...baseItems,
      {
        name: 'Command Center',
        href: '/dashboard/command-center',
        icon: Command,
        badge: null
      },
      {
        name: 'Job Assignment',
        href: '/dashboard/client',
        icon: Briefcase,
        badge: null
      },
      {
        name: 'My Properties',
        href: '/dashboard/properties',
        icon: Building2,
        badge: null
      },
      {
        name: 'Reports',
        href: '/dashboard/client/reports',
        icon: BarChart3,
        badge: null
      },
      {
        name: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        badge: null
      }
    ]
  }

  const navigationItems = getNavigationItems()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-neutral-950 border-r border-neutral-800 z-50
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div>
                <h2 className="text-lg font-semibold text-white">SiaMoon</h2>
                <p className="text-xs text-neutral-400">Property Management</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-neutral-400 hover:text-white p-2"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.full_name || user?.email}
                </p>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      user?.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                      user?.role === 'staff' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-green-500/20 text-green-300'
                    }`}
                  >
                    {user?.role === 'admin' ? 'Admin' : 
                     user?.role === 'staff' ? 'Staff' : 'Client'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="bg-red-500/20 text-red-300 border-red-500/30"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800">
          {!collapsed && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Activity className="w-3 h-3" />
                <span>System Status: Online</span>
              </div>
            </div>
          )}
          
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className={`
              w-full text-neutral-400 hover:text-white hover:bg-neutral-800
              ${collapsed ? 'px-2' : 'justify-start'}
            `}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </>
  )
}
