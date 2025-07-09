'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
// TODO: Replace with new auth system when implemented
import { 
  BarChart3,
  Home,
  Calendar,
  FileText,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Wrench,
  Bell,
  User,
  CreditCard,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function DashboardSidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isCollapsing, setIsCollapsing] = useState(false)

  const handleToggle = () => {
    setIsCollapsing(true)
    onToggle?.()
    setTimeout(() => setIsCollapsing(false), 300)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/dashboard/client',
      icon: BarChart3,
      active: pathname === '/dashboard/client'
    },
    {
      label: 'Properties',
      href: '/properties',
      icon: Building2,
      active: pathname.startsWith('/properties')
    },
    {
      label: 'Bookings',
      href: '/bookings',
      icon: Calendar,
      active: pathname.startsWith('/bookings')
    },
    {
      label: 'Reports',
      href: '/dashboard/client/reports',
      icon: FileText,
      active: pathname.startsWith('/dashboard/client/reports')
    },
    {
      label: 'Maintenance',
      href: '/maintenance',
      icon: Wrench,
      active: pathname.startsWith('/maintenance'),
      badge: '2' // Example notification badge
    },
    {
      label: 'Payments',
      href: '/payments',
      icon: CreditCard,
      active: pathname.startsWith('/payments')
    }
  ]

  const bottomItems = [
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings')
    },
    {
      label: 'Support',
      href: '/support',
      icon: HelpCircle,
      active: pathname.startsWith('/support')
    }
  ]

  return (
    <div className={`
      fixed left-0 top-0 h-full bg-neutral-900 border-r border-neutral-800 z-50
      transition-all duration-300 ease-in-out
      ${collapsed ? 'w-16' : 'w-64'}
      ${isCollapsing ? 'transition-none' : ''}
      md:translate-x-0 ${collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">Villa Manager</h1>
              <p className="text-neutral-400 text-xs">Property Management</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="text-neutral-400 hover:text-white p-1 h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* User Profile */}
      {!collapsed && (
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {user?.full_name || 'User'}
              </p>
              <p className="text-neutral-400 text-xs truncate">
                {user?.email}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Shield className="w-3 h-3 text-primary-400" />
                <span className="text-primary-400 text-xs capitalize">
                  {user?.role || 'client'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 group relative
                ${item.active 
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon className={`w-5 h-5 ${item.active ? 'text-primary-400' : ''}`} />
              
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge 
                      variant="secondary" 
                      className="bg-red-500/20 text-red-400 border-red-500/30 text-xs px-1.5 py-0.5 h-5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                  {item.badge && (
                    <span className="ml-1 text-red-400">({item.badge})</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-neutral-800">
        <div className="space-y-1 mb-3">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 group relative
                ${item.active 
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon className={`w-5 h-5 ${item.active ? 'text-primary-400' : ''}`} />
              
              {!collapsed && <span className="flex-1">{item.label}</span>}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Sign Out Button */}
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className={`
            w-full text-neutral-400 hover:text-red-400 hover:bg-red-500/10
            ${collapsed ? 'px-0' : 'justify-start'}
          `}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </div>
  )
}
