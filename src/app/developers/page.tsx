'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
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
  Server
} from 'lucide-react'

interface DeveloperTool {
  title: string
  description: string
  href: string
  icon: any
  category: string
  status?: 'stable' | 'beta' | 'experimental'
}

const developerTools: DeveloperTool[] = [
  // Authentication & Testing
  {
    title: 'Auth Debug Console',
    description: 'Test authentication flows, sign in/out, and debug auth issues',
    href: '/auth-debug',
    icon: Shield,
    category: 'Authentication',
    status: 'stable'
  },
  {
    title: 'Connection Test',
    description: 'Test Supabase connection, database access, and environment setup',
    href: '/test-connection',
    icon: Database,
    category: 'Testing',
    status: 'stable'
  },
  {
    title: 'User Debug',
    description: 'View current user state, session info, and profile data',
    href: '/debug-user',
    icon: UserCheck,
    category: 'Authentication',
    status: 'stable'
  },

  // Core Application Pages
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
    title: 'Properties Management',
    description: 'View, add, edit, and manage villa properties',
    href: '/properties',
    icon: Building,
    category: 'Core Features',
    status: 'stable'
  },
  {
    title: 'Add Property',
    description: 'Create new villa property with detailed information',
    href: '/properties/add',
    icon: Plus,
    category: 'Core Features',
    status: 'stable'
  },
  {
    title: 'Bookings System',
    description: 'Manage reservations and guest communications',
    href: '/bookings',
    icon: Calendar,
    category: 'Core Features',
    status: 'beta'
  },

  // Onboarding & Admin
  {
    title: 'Villa Onboarding',
    description: 'Comprehensive villa setup and information collection',
    href: '/onboard',
    icon: FileText,
    category: 'Onboarding',
    status: 'stable'
  },
  {
    title: 'Admin Villa Reviews',
    description: 'Staff interface for reviewing and approving villas',
    href: '/admin/villa-reviews',
    icon: Eye,
    category: 'Admin',
    status: 'beta'
  },

  // Development & Testing
  {
    title: 'Database Test',
    description: 'Test database operations and data integrity',
    href: '/test-db',
    icon: Database,
    category: 'Testing',
    status: 'experimental'
  },
  {
    title: 'Test Property',
    description: 'Property testing and validation tools',
    href: '/test-property',
    icon: TestTube,
    category: 'Testing',
    status: 'experimental'
  },

  // Authentication Pages
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
  }
]

const categories = ['Authentication', 'Testing', 'Dashboards', 'Core Features', 'Onboarding', 'Admin']

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'stable': return 'bg-green-100 text-green-800'
    case 'beta': return 'bg-yellow-100 text-yellow-800'
    case 'experimental': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function DevelopersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  
  const filteredTools = selectedCategory === 'All' 
    ? developerTools 
    : developerTools.filter(tool => tool.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Code className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Developer Console</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl">
            Comprehensive development tools and testing utilities for Sia Moon Property Management. 
            Access all application features, debug authentication, test database connections, and more.
          </p>
        </div>

        {/* Environment Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Environment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Supabase URL</span>
                <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Anon Key</span>
                <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Auth Bypass</span>
                <span className={process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' ? 'text-yellow-600' : 'text-green-600'}>
                  {process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' ? '⚠️ Enabled' : '✅ Disabled'}
                </span>
              </div>
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

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool, index) => {
            const IconComponent = tool.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tool.title}</CardTitle>
                        {tool.status && (
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tool.status)}`}>
                            {tool.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
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

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/auth-debug">
                <Button variant="outline" className="w-full justify-start">
                  <Bug className="mr-2 h-4 w-4" />
                  Debug Auth
                </Button>
              </Link>
              <Link href="/test-connection">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="mr-2 h-4 w-4" />
                  Test DB
                </Button>
              </Link>
              <Link href="/properties/add">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Button>
              </Link>
              <Link href="/onboard">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Villa Survey
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Sia Moon Property Management - Developer Console</p>
          <p className="mt-1">Use these tools to test, debug, and develop application features</p>
        </div>
      </div>
    </div>
  )
}
