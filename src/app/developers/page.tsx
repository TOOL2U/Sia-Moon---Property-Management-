'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Code, 
  Database, 
  Shield, 
  Users, 
  Building, 
  Calendar, 
  BarChart3, 
  Settings, 
  TestTube,
  Bug,
  Zap,
  Globe,
  Terminal,
  FileText,
  Eye,
  Plus,
  UserCheck,
  Lock,
  Unlock,
  Server,
  Search,
  Bell
} from 'lucide-react'

interface DeveloperTool {
  title: string
  description: string
  href: string
  icon: any
  category: string
  status?: 'stable' | 'beta' | 'experimental'
  isNew?: boolean
}

const developerTools: DeveloperTool[] = [
  // Core Application Pages
  {
    title: 'Home Page',
    description: 'Main landing page with hero section and property showcase',
    href: '/',
    icon: Globe,
    category: 'Core Application',
    status: 'stable'
  },
  {
    title: 'Properties Management',
    description: 'View, add, edit, and manage villa properties',
    href: '/properties',
    icon: Building,
    category: 'Core Application',
    status: 'stable'
  },
  {
    title: 'Add Property',
    description: 'Create new villa property with detailed information',
    href: '/properties/add',
    icon: Plus,
    category: 'Core Application',
    status: 'stable'
  },
  {
    title: 'Bookings System',
    description: 'Manage reservations and guest communications',
    href: '/bookings',
    icon: Calendar,
    category: 'Core Application',
    status: 'stable'
  },
  {
    title: 'Staff Management',
    description: 'Manage staff profiles, roles, and assignments',
    href: '/staff',
    icon: Users,
    category: 'Core Application',
    status: 'stable',
    isNew: true
  },

  // Dashboards
  {
    title: 'Client Dashboard',
    description: 'Property owner dashboard with villa management tools',
    href: '/dashboard/client',
    icon: Building,
    category: 'Dashboards',
    status: 'stable'
  },
  {
    title: 'Staff Dashboard',
    description: 'Staff management interface with task coordination',
    href: '/dashboard/staff',
    icon: Users,
    category: 'Dashboards',
    status: 'stable'
  },
  {
    title: 'Admin Dashboard',
    description: 'Administrative interface for task and user management',
    href: '/dashboard/admin',
    icon: Settings,
    category: 'Dashboards',
    status: 'stable'
  },
  {
    title: 'Staff Tasks',
    description: 'Task management interface for staff members',
    href: '/dashboard/staff/tasks',
    icon: Terminal,
    category: 'Dashboards',
    status: 'stable',
    isNew: true
  },
  {
    title: 'Booking Sync Admin',
    description: 'Manage iCal integration with Airbnb and Booking.com',
    href: '/dashboard/admin/booking-sync',
    icon: Server,
    category: 'Dashboards',
    status: 'stable',
    isNew: true
  },

  // Onboarding & Forms
  {
    title: 'Villa Onboarding (Full)',
    description: 'Comprehensive villa setup and information collection',
    href: '/onboard',
    icon: FileText,
    category: 'Onboarding',
    status: 'stable'
  },
  {
    title: 'Simple Onboarding',
    description: 'Simplified villa onboarding form with webhook integration',
    href: '/onboard-simple',
    icon: Zap,
    category: 'Onboarding',
    status: 'stable'
  },
  {
    title: 'Admin Villa Reviews',
    description: 'Staff interface for reviewing and approving villas',
    href: '/admin/villa-reviews',
    icon: Eye,
    category: 'Onboarding',
    status: 'beta'
  },

  // Authentication
  {
    title: 'Sign In',
    description: 'User authentication login page',
    href: '/auth/login',
    icon: Lock,
    category: 'Authentication',
    status: 'stable'
  },
  {
    title: 'Sign Up',
    description: 'User registration and account creation',
    href: '/auth/signup',
    icon: Unlock,
    category: 'Authentication',
    status: 'stable'
  },
  {
    title: 'Auth Debug Console',
    description: 'Test authentication flows, sign in/out, and debug auth issues',
    href: '/auth-debug',
    icon: Shield,
    category: 'Authentication',
    status: 'stable'
  },

  // Testing & Development
  {
    title: 'Test Suite',
    description: 'Organized testing tools for all system components',
    href: '/developers/tests',
    icon: TestTube,
    category: 'Testing',
    status: 'stable',
    isNew: true
  },
  {
    title: 'Firebase Authentication Test',
    description: 'Test Firebase auth setup and user creation',
    href: '/test-firebase',
    icon: Shield,
    category: 'Testing',
    status: 'stable'
  },
  {
    title: 'Webhook Test',
    description: 'Test Make.com webhook integration and email automation',
    href: '/test-webhook',
    icon: Server,
    category: 'Testing',
    status: 'stable'
  },
  {
    title: 'Storage Test',
    description: 'Test localStorage persistence and data management',
    href: '/test-storage',
    icon: Database,
    category: 'Testing',
    status: 'stable'
  },
  {
    title: 'Firestore Test',
    description: 'Test Firestore database operations',
    href: '/test-firestore',
    icon: Database,
    category: 'Testing',
    status: 'stable'
  },

  // Debug & Development Tools
  {
    title: 'Debug Tools',
    description: 'Organized debugging utilities and development tools',
    href: '/developers/debug',
    icon: Bug,
    category: 'Debug Tools',
    status: 'stable',
    isNew: true
  },
  {
    title: 'User Debug Console',
    description: 'View current user state, session info, and profile data',
    href: '/debug-user',
    icon: UserCheck,
    category: 'Debug Tools',
    status: 'stable'
  }
]

const categories = ['Core Application', 'Dashboards', 'Onboarding', 'Authentication', 'Testing', 'Debug Tools']

// Frequently used development tools
const favoriteTools = [
  'Test Suite',
  'Debug Tools',
  'Staff Management',
  'Admin Dashboard',
  'Webhook Test',
  'Firebase Authentication Test'
]

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'stable': return 'bg-emerald-900 text-emerald-300 border border-emerald-800'
    case 'beta': return 'bg-yellow-900 text-yellow-300 border border-yellow-800'
    case 'experimental': return 'bg-red-900 text-red-300 border border-red-800'
    default: return 'bg-neutral-900 text-neutral-300 border border-neutral-800'
  }
}

export default function DevelopersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const filteredTools = developerTools.filter(tool => {
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory
    const matchesSearch = searchQuery === '' ||
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        {/* Header - Linear style */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600">
              <Code className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Developer Console</h1>
          </div>
          <p className="text-neutral-400 max-w-3xl mb-6">
            Comprehensive development tools and testing utilities for Sia Moon Property Management.
            Access all application features, debug authentication, test database connections, and more.
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Environment Status */}
        <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600">
                <Server className="h-4 w-4 text-white" />
              </div>
              Environment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <span className="font-medium text-neutral-300">Firebase Project</span>
                <span className={process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'text-emerald-400' : 'text-red-400'}>
                  {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Connected' : '❌ Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <span className="font-medium text-neutral-300">Firebase Auth</span>
                <span className={process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'text-emerald-400' : 'text-red-400'}>
                  {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Configured' : '❌ Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <span className="font-medium text-neutral-300">Development Mode</span>
                <span className="text-emerald-400">
                  ✅ Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorites Section */}
        <Card className="bg-neutral-950 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600">
                <Zap className="h-4 w-4 text-white" />
              </div>
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {favoriteTools.map(toolName => {
                const tool = developerTools.find(t => t.title === toolName)
                if (!tool) return null

                const IconComponent = tool.icon
                return (
                  <Link key={tool.href} href={tool.href}>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12 hover:bg-neutral-800 transition-colors"
                    >
                      <IconComponent className="mr-3 h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">{tool.title}</div>
                        <div className="text-xs text-neutral-500">{tool.category}</div>
                      </div>
                      {tool.isNew && (
                        <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                          NEW
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'All' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('All')}
            >
              All ({developerTools.length})
            </Button>
            {categories.map(category => {
              const count = developerTools.filter(tool => tool.category === category).length
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category} ({count})
                </Button>
              )
            })}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {searchQuery ? `Search Results (${filteredTools.length})` : `${selectedCategory} Tools (${filteredTools.length})`}
          </h2>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-neutral-400"
            >
              Clear Search
            </Button>
          )}
        </div>

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <Card className="bg-neutral-950 border-neutral-800">
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No tools found</h3>
              <p className="text-neutral-400">
                {searchQuery
                  ? `No tools match "${searchQuery}". Try a different search term.`
                  : `No tools in the ${selectedCategory} category.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool, index) => {
            const IconComponent = tool.icon
            return (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600">
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg text-white">{tool.title}</CardTitle>
                          {tool.isNew && (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                              NEW
                            </Badge>
                          )}
                        </div>
                        {tool.status && (
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusColor(tool.status)}`}>
                            {tool.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-neutral-400 text-sm mb-4">{tool.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">
                      {tool.category}
                    </span>
                    <Link href={tool.href}>
                      <Button size="sm">
                        Open
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          </div>
        )}

        {/* Quick Actions */}
        <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800 mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600">
                <Zap className="h-4 w-4 text-white" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/developers/tests">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Suite
                </Button>
              </Link>
              <Link href="/developers/debug">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Bug className="mr-2 h-4 w-4" />
                  Debug Tools
                </Button>
              </Link>
              <Link href="/staff">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Users className="mr-2 h-4 w-4" />
                  Staff Management
                </Button>
              </Link>
              <Link href="/onboard">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <FileText className="mr-2 h-4 w-4" />
                  Villa Survey
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Development Info */}
        <Card className="bg-neutral-950 border-neutral-800 mt-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-white mb-2">Development Status</h4>
                <div className="space-y-1 text-neutral-400">
                  <p>• Staff Management: ✅ Complete</p>
                  <p>• Firebase Auth: ✅ Complete</p>
                  <p>• Email Notifications: ✅ Complete</p>
                  <p>• Test Suite: ✅ Organized</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Quick Tips</h4>
                <div className="space-y-1 text-neutral-400">
                  <p>• Use search to find specific tools</p>
                  <p>• Check "NEW" badges for latest features</p>
                  <p>• Test pages validate functionality</p>
                  <p>• Debug tools help troubleshoot issues</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Environment</h4>
                <div className="space-y-1 text-neutral-400">
                  <p>• Mode: Development</p>
                  <p>• Database: Firebase/localStorage</p>
                  <p>• Auth: Firebase</p>
                  <p>• Webhooks: Make.com</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-neutral-400">
          <p>Sia Moon Property Management - Developer Console</p>
          <p className="mt-1">🔧 This page is temporary and will be removed in production</p>
        </div>
      </div>
    </div>
  )
}
