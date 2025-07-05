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
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        {/* Header - Linear style */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">Development Dashboard</h1>
              <p className="text-neutral-400">Quick access to all pages and features</p>
            </div>
          </div>
          
          {process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' && (
            <div className="bg-yellow-900 border border-yellow-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500">
                    <Settings className="h-4 w-4 text-yellow-900" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-300">
                    Development Mode Active
                  </h3>
                  <div className="mt-2 text-sm text-yellow-400">
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
              <h2 className="text-xl font-semibold text-white mb-4">{category} Pages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryPages.map((page) => {
                  const Icon = page.icon
                  return (
                    <Card key={page.href} className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600">
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-white">{page.title}</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-neutral-400">{page.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <code className="text-xs bg-neutral-900 border border-neutral-800 px-2 py-1 rounded text-neutral-400">
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
        <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800 mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600">
                <Plus className="h-4 w-4 text-white" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/properties/add">
                <Button className="w-full justify-start h-11" size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </Link>
              <Link href="/test-db">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Database className="h-4 w-4 mr-2" />
                  Test Database
                </Button>
              </Link>
              <Link href="/debug-user">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Bug className="h-4 w-4 mr-2" />
                  Debug User
                </Button>
              </Link>
              <Link href="/onboard">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <FileText className="h-4 w-4 mr-2" />
                  Villa Survey
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

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
