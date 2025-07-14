'use client'

import { useState, useEffect } from 'react'
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
  Bell,
  Brain,
  Crown
} from 'lucide-react'

interface DeveloperTool {
  title: string
  description: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
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
    status: 'stable'
  },
  {
    title: 'Reports & Analytics',
    description: 'Financial reports, property analytics, and business insights',
    href: '/reports',
    icon: BarChart3,
    category: 'Core Application',
    status: 'stable'
  },
  {
    title: 'User Profile',
    description: 'User account settings and profile management',
    href: '/profile',
    icon: UserCheck,
    category: 'Core Application',
    status: 'stable'
  },
  {
    title: 'Settings',
    description: 'Application settings and configuration',
    href: '/settings',
    icon: Settings,
    category: 'Core Application',
    status: 'stable'
  },

  // Dashboards
  {
    title: 'Main Dashboard',
    description: 'Central dashboard with navigation to all areas',
    href: '/dashboard',
    icon: BarChart3,
    category: 'Dashboards',
    status: 'stable'
  },
  {
    title: 'Client Dashboard',
    description: 'Property owner dashboard with villa management tools',
    href: '/dashboard/client',
    icon: Building,
    category: 'Dashboards',
    status: 'stable'
  },
  {
    title: 'Client Onboarding',
    description: 'Client property onboarding and setup process',
    href: '/dashboard/client/onboarding',
    icon: FileText,
    category: 'Dashboards',
    status: 'stable'
  },
  {
    title: 'Admin Dashboard',
    description: 'Administrative interface for system management',
    href: '/admin',
    icon: Settings,
    category: 'Dashboards',
    status: 'stable'
  },
  {
    title: 'Admin Bookings',
    description: 'Admin booking management and approval system',
    href: '/admin/bookings',
    icon: Calendar,
    category: 'Dashboards',
    status: 'stable'
  },
  {
    title: 'Admin Accounts',
    description: 'User account management and administration',
    href: '/admin/accounts',
    icon: Users,
    category: 'Dashboards',
    status: 'stable'
  },

  // AI & Machine Learning
  {
    title: 'AI Property Agent',
    description: 'AI-powered booking analysis and property matching system',
    href: '/admin/ai-log',
    icon: Brain,
    category: 'AI & Machine Learning',
    status: 'stable',
    isNew: true
  },
  {
    title: 'AI Analysis Test',
    description: 'Test AI booking analysis with custom data and scenarios',
    href: '/admin/ai-booking-analysis-test',
    icon: TestTube,
    category: 'AI & Machine Learning',
    status: 'stable',
    isNew: true
  },
  {
    title: 'AI Analysis API',
    description: 'RESTful API endpoint for AI booking analysis',
    href: '/api/ai-booking-analysis',
    icon: Terminal,
    category: 'AI & Machine Learning',
    status: 'stable',
    isNew: true
  },
  {
    title: 'AI Test API',
    description: 'Test API endpoint for creating test bookings and scenarios',
    href: '/api/test/ai-booking-analysis',
    icon: Server,
    category: 'AI & Machine Learning',
    status: 'stable',
    isNew: true
  },

  // Admin Tools & Testing
  {
    title: 'Booking Data Flow Test',
    description: 'Test complete booking automation flow from email to database',
    href: '/admin/booking-data-flow-test',
    icon: Server,
    category: 'Admin Tools',
    status: 'stable'
  },
  {
    title: 'Booking Parser Test',
    description: 'Test email parsing and data extraction from booking emails',
    href: '/admin/booking-parser-test',
    icon: TestTube,
    category: 'Admin Tools',
    status: 'stable'
  },
  {
    title: 'Client Matching Debug',
    description: 'Debug property-to-client matching issues (Donkey House fix)',
    href: '/admin/client-matching-debug',
    icon: Search,
    category: 'Admin Tools',
    status: 'stable'
  },
  {
    title: 'Villa Reviews',
    description: 'Admin interface for reviewing and approving villa submissions',
    href: '/admin/villa-reviews',
    icon: Eye,
    category: 'Admin Tools',
    status: 'stable'
  },

  // User Synchronization & Management (NEW)
  {
    title: 'User Profile Synchronization',
    description: 'Comprehensive user profile sync across Firebase Auth, Firestore profiles, and property data',
    href: '/sync-users',
    icon: Users,
    category: 'User Management',
    status: 'stable',
    isNew: true
  },
  {
    title: 'Debug Users Tool',
    description: 'Debug and synchronize user data across all collections with detailed logging',
    href: '/debug-users',
    icon: Bug,
    category: 'User Management',
    status: 'stable',
    isNew: true
  },
  {
    title: 'User Cleanup Tool',
    description: 'Clean up user data conflicts and resolve signup issues',
    href: '/cleanup-users',
    icon: Shield,
    category: 'User Management',
    status: 'stable',
    isNew: true
  },
  {
    title: 'Admin User Setup',
    description: 'Setup and verify admin user privileges for shaun@siamoon.com',
    href: '/admin-setup',
    icon: Crown,
    category: 'User Management',
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
    title: 'Forgot Password Test',
    description: 'Test password reset functionality',
    href: '/test-forgot-password',
    icon: Lock,
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
    title: 'Debug Environment',
    description: 'View environment variables and configuration',
    href: '/debug-env',
    icon: Settings,
    category: 'Debug Tools',
    status: 'stable'
  },
  {
    title: 'Debug Firebase',
    description: 'Debug Firebase connection and configuration',
    href: '/debug-firebase',
    icon: Database,
    category: 'Debug Tools',
    status: 'stable'
  },
  {
    title: 'Dev Dashboard',
    description: 'Development dashboard with system overview',
    href: '/dev-dashboard',
    icon: BarChart3,
    category: 'Debug Tools',
    status: 'stable'
  },
  {
    title: 'Dev Console',
    description: 'Basic development console and utilities',
    href: '/dev',
    icon: Terminal,
    category: 'Debug Tools',
    status: 'stable'
  },
  {
    title: 'Status Page',
    description: 'System status and health monitoring',
    href: '/status',
    icon: Eye,
    category: 'Debug Tools',
    status: 'stable'
  },
  {
    title: 'Email Test',
    description: 'Test email functionality and templates',
    href: '/developers/email-test',
    icon: Bell,
    category: 'Debug Tools',
    status: 'stable'
  },

  // Staff Tools
  {
    title: 'Staff Test Data',
    description: 'Generate and manage test data for staff system',
    href: '/staff/test-data',
    icon: Users,
    category: 'Staff Tools',
    status: 'stable'
  }
]

const categories = [
  'Core Application',
  'Dashboards',
  'Admin Tools',
  'User Management',
  'Onboarding',
  'Authentication',
  'Testing',
  'Debug Tools',
  'Staff Tools',
  'AI & Machine Learning'
]

// Frequently used development tools
const favoriteTools = [
  'User Profile Synchronization',
  'Debug Users Tool',
  'Admin User Setup',
  'Admin Dashboard',
  'Test Suite',
  'Debug Tools',
  'Booking Data Flow Test',
  'Client Matching Debug',
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

  // Add error handling for console errors from browser extensions
  useEffect(() => {
    // Suppress Chrome extension errors that don't affect functionality
    const originalError = console.error
    console.error = (...args) => {
      const message = args[0]?.toString() || ''
      if (message.includes('chrome-extension://') ||
          message.includes('Cannot use import statement outside a module') ||
          message.includes('Failed to load resource')) {
        // Suppress these specific errors as they're from browser extensions
        return
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

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
              <Link href="/sync-users">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Users className="mr-2 h-4 w-4" />
                  User Sync
                </Button>
              </Link>
              <Link href="/admin-setup">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Crown className="mr-2 h-4 w-4" />
                  Admin Setup
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Button>
              </Link>
              <Link href="/debug-users">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Bug className="mr-2 h-4 w-4" />
                  Debug Users
                </Button>
              </Link>
              <Link href="/admin/booking-data-flow-test">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Server className="mr-2 h-4 w-4" />
                  Booking Flow Test
                </Button>
              </Link>
              <Link href="/admin/client-matching-debug">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Search className="mr-2 h-4 w-4" />
                  Client Matching
                </Button>
              </Link>
              <Link href="/developers/tests">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Suite
                </Button>
              </Link>
              <Link href="/test-firebase">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Shield className="mr-2 h-4 w-4" />
                  Firebase Test
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
                  <p>• User Profile Synchronization: ✅ Complete</p>
                  <p>• Admin User Management: ✅ Complete</p>
                  <p>• Gmail Booking Automation: ✅ Complete</p>
                  <p>• Client Matching System: ✅ Fixed</p>
                  <p>• API Endpoints: ✅ Complete</p>
                  <p>• Firebase Integration: ✅ Complete</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Quick Tips</h4>
                <div className="space-y-1 text-neutral-400">
                  <p>• Use search to find specific tools</p>
                  <p>• Check &quot;NEW&quot; badges for latest features</p>
                  <p>• User Management tools for profile sync</p>
                  <p>• Admin Setup for user privilege management</p>
                  <p>• Debug Users for data consistency</p>
                  <p>• All pages organized by category</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Environment</h4>
                <div className="space-y-1 text-neutral-400">
                  <p>• Mode: Development</p>
                  <p>• Database: Firebase Firestore</p>
                  <p>• Auth: Firebase Authentication</p>
                  <p>• Webhooks: Make.com Gmail Watch</p>
                  <p>• API: /api/bookings endpoint</p>
                  <p>• Storage: Cloudinary + Firebase</p>
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
