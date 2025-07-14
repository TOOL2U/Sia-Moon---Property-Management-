'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  TestTube,
  Database,
  Mail,
  Webhook,
  User,
  FileText,
  Scroll,
  Users,
  ArrowLeft,
  Shield,
  Crown,
  Bug,
  Settings,
  Server,
  Search,
  Brain
} from 'lucide-react'

export default function TestsPage() {
  const testCategories = [
    {
      title: 'User Management & Synchronization',
      description: 'Test user profile synchronization and admin management',
      icon: Users,
      tests: [
        {
          name: 'User Profile Synchronization',
          path: '/sync-users',
          description: 'Comprehensive user profile sync across all collections'
        },
        {
          name: 'Debug Users Tool',
          path: '/debug-users',
          description: 'Debug and synchronize user data with detailed logging'
        },
        {
          name: 'User Cleanup Tool',
          path: '/cleanup-users',
          description: 'Clean up user data conflicts and resolve signup issues'
        },
        {
          name: 'Admin User Setup',
          path: '/admin-setup',
          description: 'Setup and verify admin user privileges'
        }
      ]
    },
    {
      title: 'Authentication Tests',
      description: 'Test Firebase authentication and user management',
      icon: User,
      tests: [
        {
          name: 'Firebase Authentication',
          path: '/test-firebase',
          description: 'Test Firebase auth setup and user creation'
        },
        {
          name: 'Forgot Password Flow',
          path: '/test-forgot-password',
          description: 'Test password reset email functionality'
        },
        {
          name: 'Auth Debug Console',
          path: '/auth-debug',
          description: 'Debug authentication flows and test sign in/out'
        }
      ]
    },
    {
      title: 'Admin Tools & Automation',
      description: 'Test admin functionality and booking automation',
      icon: Settings,
      tests: [
        {
          name: 'Booking Data Flow Test',
          path: '/admin/booking-data-flow-test',
          description: 'Test complete booking automation flow from email to database'
        },
        {
          name: 'Booking Parser Test',
          path: '/admin/booking-parser-test',
          description: 'Test email parsing and data extraction from booking emails'
        },
        {
          name: 'Client Matching Debug',
          path: '/admin/client-matching-debug',
          description: 'Debug property-to-client matching issues'
        },
        {
          name: 'Villa Reviews',
          path: '/admin/villa-reviews',
          description: 'Admin interface for reviewing and approving villa submissions'
        }
      ]
    },
    {
      title: 'AI & Machine Learning',
      description: 'Test AI-powered booking analysis and property matching',
      icon: Brain,
      tests: [
        {
          name: 'AI Property Agent',
          path: '/admin/ai-log',
          description: 'AI-powered booking analysis and property matching system'
        },
        {
          name: 'AI Analysis Test',
          path: '/admin/ai-booking-analysis-test',
          description: 'Test AI booking analysis with custom data and scenarios'
        }
      ]
    },
    {
      title: 'Communication Tests',
      description: 'Test email and webhook integrations',
      icon: Mail,
      tests: [
        {
          name: 'Webhook Test',
          path: '/test-webhook',
          description: 'Test Make.com webhook integration and email automation'
        },
        {
          name: 'Email Test',
          path: '/developers/email-test',
          description: 'Test email functionality and templates'
        }
      ]
    },
    {
      title: 'Debug & Development Tools',
      description: 'Development and debugging utilities',
      icon: Bug,
      tests: [
        {
          name: 'Debug Tools',
          path: '/developers/debug',
          description: 'Organized debugging utilities and development tools'
        },
        {
          name: 'Debug Environment',
          path: '/debug-env',
          description: 'View environment variables and configuration'
        },
        {
          name: 'Debug Firebase',
          path: '/debug-firebase',
          description: 'Debug Firebase connection and configuration'
        },
        {
          name: 'Status Page',
          path: '/status',
          description: 'System status and health monitoring'
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/developers" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Developers
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <TestTube className="h-8 w-8" />
            Test Suite & Development Tools
          </h1>
          <p className="text-gray-400 mt-2">
            Comprehensive testing, debugging, and development tools for user management, booking automation, and system administration
          </p>
        </div>

        {/* Test Categories */}
        <div className="grid gap-8">
          {testCategories.map((category, index) => {
            const Icon = category.icon
            return (
              <Card key={index} className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <Icon className="h-6 w-6" />
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {category.tests.map((test, testIndex) => (
                      <div key={testIndex} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                        <h4 className="font-semibold text-white mb-2">{test.name}</h4>
                        <p className="text-sm text-gray-400 mb-4">{test.description}</p>
                        <Link href={test.path}>
                          <Button 
                            size="sm" 
                            className="w-full bg-white text-black hover:bg-gray-100"
                          >
                            Run Test
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card className="bg-neutral-900 border-neutral-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">
              Most frequently used testing and debugging tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/sync-users">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Sync
                </Button>
              </Link>
              <Link href="/admin-setup">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800 flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Admin Setup
                </Button>
              </Link>
              <Link href="/debug-users">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800 flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Debug Users
                </Button>
              </Link>
              <Link href="/admin/booking-data-flow-test">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800 flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Booking Flow
                </Button>
              </Link>
              <Link href="/test-firebase">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Auth Test
                </Button>
              </Link>
              <Link href="/admin/client-matching-debug">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Client Matching
                </Button>
              </Link>
              <Link href="/test-webhook">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800 flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Webhooks
                </Button>
              </Link>
              <Link href="/admin/ai-log">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Agent
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Testing Status */}
        <Card className="bg-neutral-900 border-neutral-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Testing Status</CardTitle>
            <CardDescription className="text-gray-400">
              Current status of major system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-white">User Synchronization</span>
                </div>
                <p className="text-sm text-gray-400">All user profile sync tools operational</p>
              </div>
              <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-white">Admin Management</span>
                </div>
                <p className="text-sm text-gray-400">Admin user setup and privileges working</p>
              </div>
              <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-white">Booking Automation</span>
                </div>
                <p className="text-sm text-gray-400">Gmail booking flow fully automated</p>
              </div>
              <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-white">Client Matching</span>
                </div>
                <p className="text-sm text-gray-400">Property-to-client matching resolved</p>
              </div>
              <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-white">AI Integration</span>
                </div>
                <p className="text-sm text-gray-400">AI booking analysis operational</p>
              </div>
              <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-white">Firebase Integration</span>
                </div>
                <p className="text-sm text-gray-400">Auth, Firestore, and Storage working</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
