'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Building, 
  Calendar, 
  FileText, 
  Settings, 
  Database, 
  Bug, 
  Plus,
  Users,
  BarChart3,
  Home
} from 'lucide-react'

const developmentPages = [
  {
    title: 'Home Page',
    description: 'Main landing page with hero section',
    href: '/',
    icon: Home,
    category: 'Main'
  },
  {
    title: 'Properties',
    description: 'View and manage villa properties',
    href: '/properties',
    icon: Building,
    category: 'Core'
  },
  {
    title: 'Add Property',
    description: 'Quick property addition form',
    href: '/properties/add',
    icon: Plus,
    category: 'Core'
  },
  {
    title: 'Bookings',
    description: 'Manage guest reservations',
    href: '/bookings',
    icon: Calendar,
    category: 'Core'
  },
  {
    title: 'Villa Survey',
    description: 'Comprehensive villa onboarding form',
    href: '/onboard',
    icon: FileText,
    category: 'Onboarding'
  },
  {
    title: 'Admin Reviews',
    description: 'Review villa submissions',
    href: '/admin/villa-reviews',
    icon: Settings,
    category: 'Admin'
  },
  {
    title: 'Client Dashboard',
    description: 'Property owner dashboard',
    href: '/dashboard/client',
    icon: Users,
    category: 'Dashboards'
  },
  {
    title: 'Staff Dashboard',
    description: 'Staff management dashboard',
    href: '/dashboard/staff',
    icon: BarChart3,
    category: 'Dashboards'
  },
  {
    title: 'Test Database',
    description: 'Interactive database testing',
    href: '/test-db',
    icon: Database,
    category: 'Development'
  },
  {
    title: 'Debug User',
    description: 'User and auth debugging',
    href: '/debug-user',
    icon: Bug,
    category: 'Development'
  },
  {
    title: 'Test Property',
    description: 'Property creation testing',
    href: '/test-property',
    icon: Building,
    category: 'Development'
  },
  {
    title: 'Login Page',
    description: 'User authentication login',
    href: '/auth/login',
    icon: Users,
    category: 'Authentication'
  },
  {
    title: 'Signup Page',
    description: 'User registration form',
    href: '/auth/signup',
    icon: Users,
    category: 'Authentication'
  }
]

const categories = ['Main', 'Core', 'Onboarding', 'Admin', 'Dashboards', 'Authentication', 'Development']

export default function DevDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Development Dashboard</h1>
              <p className="text-gray-600">Quick access to all pages and features</p>
            </div>
          </div>
          
          {process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Settings className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Development Mode Active
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Authentication is bypassed. All pages are accessible without login.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pages by Category */}
        {categories.map((category) => {
          const categoryPages = developmentPages.filter(page => page.category === category)
          
          return (
            <div key={category} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{category} Pages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryPages.map((page) => {
                  const Icon = page.icon
                  return (
                    <Card key={page.href} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{page.title}</CardTitle>
                          </div>
                        </div>
                        <CardDescription>{page.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {page.href}
                          </code>
                          <Link href={page.href}>
                            <Button size="sm">
                              Visit Page
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/properties/add">
              <Button fullWidth className="justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </Link>
            <Link href="/test-db">
              <Button variant="outline" fullWidth className="justify-start">
                <Database className="h-4 w-4 mr-2" />
                Test Database
              </Button>
            </Link>
            <Link href="/debug-user">
              <Button variant="outline" fullWidth className="justify-start">
                <Bug className="h-4 w-4 mr-2" />
                Debug User
              </Button>
            </Link>
            <Link href="/onboard">
              <Button variant="outline" fullWidth className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Villa Survey
              </Button>
            </Link>
          </div>
        </div>

        {/* Environment Info */}
        <div className="mt-8 bg-neutral-900 rounded-lg p-4">
          <h4 className="font-medium text-white mb-2">Environment Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-white">Auth Bypass:</span>{' '}
              <span className={process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' ? 'text-green-400' : 'text-red-400'}>
                {process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="font-medium text-white">Supabase URL:</span>{' '}
              <span className="text-neutral-400 font-mono text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not configured'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
