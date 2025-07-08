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
  ArrowLeft
} from 'lucide-react'

export default function TestsPage() {
  const testCategories = [
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
        }
      ]
    },
    {
      title: 'Database Tests',
      description: 'Test database operations and data storage',
      icon: Database,
      tests: [
        {
          name: 'Firestore Operations',
          path: '/test-firestore',
          description: 'Test Firestore CRUD operations'
        },
        {
          name: 'Local Storage',
          path: '/test-storage',
          description: 'Test localStorage functionality'
        }
      ]
    },
    {
      title: 'Communication Tests',
      description: 'Test email and webhook integrations',
      icon: Mail,
      tests: [
        {
          name: 'Firebase Email',
          path: '/test-firebase-email',
          description: 'Test Firebase email sending'
        },
        {
          name: 'Signup Webhook',
          path: '/test-signup-webhook',
          description: 'Test Make.com signup webhook'
        },
        {
          name: 'General Webhook',
          path: '/test-webhook',
          description: 'Test general webhook functionality'
        }
      ]
    },
    {
      title: 'UI/UX Tests',
      description: 'Test user interface and experience features',
      icon: FileText,
      tests: [
        {
          name: 'Smooth Scrolling',
          path: '/smooth-scroll-test',
          description: 'Test smooth scroll animations'
        },
        {
          name: 'Simple Components',
          path: '/simple-test',
          description: 'Test basic UI components'
        }
      ]
    },
    {
      title: 'Staff Management Tests',
      description: 'Test staff management system functionality',
      icon: Users,
      tests: [
        {
          name: 'Staff Test Data',
          path: '/staff/test-data',
          description: 'Create and manage test staff data'
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
            Test Suite
          </h1>
          <p className="text-gray-400 mt-2">
            Comprehensive testing tools for all system components
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
              Common testing workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/test-firebase">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800">
                  Test Auth Flow
                </Button>
              </Link>
              <Link href="/test-webhook">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800">
                  Test Webhooks
                </Button>
              </Link>
              <Link href="/staff/test-data">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800">
                  Generate Test Data
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
