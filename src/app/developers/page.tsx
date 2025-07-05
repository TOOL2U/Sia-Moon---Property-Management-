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
    case 'stable': return 'bg-emerald-900 text-emerald-300 border border-emerald-800'
    case 'beta': return 'bg-yellow-900 text-yellow-300 border border-yellow-800'
    case 'experimental': return 'bg-red-900 text-red-300 border border-red-800'
    default: return 'bg-neutral-900 text-neutral-300 border border-neutral-800'
  }
}

export default function DevelopersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  
  const filteredTools = selectedCategory === 'All' 
    ? developerTools 
    : developerTools.filter(tool => tool.category === selectedCategory)

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
          <p className="text-neutral-400 max-w-3xl">
            Comprehensive development tools and testing utilities for Sia Moon Property Management.
            Access all application features, debug authentication, test database connections, and more.
          </p>
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
                <span className="font-medium text-neutral-300">Supabase URL</span>
                <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-emerald-400' : 'text-red-400'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <span className="font-medium text-neutral-300">Anon Key</span>
                <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-emerald-400' : 'text-red-400'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <span className="font-medium text-neutral-300">Auth Bypass</span>
                <span className={process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' ? 'text-yellow-400' : 'text-emerald-400'}>
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
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600">
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">{tool.title}</CardTitle>
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
              <Link href="/auth-debug">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Bug className="mr-2 h-4 w-4" />
                  Debug Auth
                </Button>
              </Link>
              <Link href="/test-connection">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Database className="mr-2 h-4 w-4" />
                  Test DB
                </Button>
              </Link>
              <Link href="/properties/add">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
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

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-neutral-400">
          <p>Sia Moon Property Management - Developer Console</p>
          <p className="mt-1">Use these tools to test, debug, and develop application features</p>
        </div>
      </div>
    </div>
  )
}
