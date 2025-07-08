'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Bug, 
  User, 
  BarChart3, 
  ArrowLeft,
  Eye,
  Terminal,
  Settings
} from 'lucide-react'

export default function DebugPage() {
  const debugCategories = [
    {
      title: 'Authentication Debug',
      description: 'Debug authentication flows and user state',
      icon: User,
      tools: [
        {
          name: 'User Debug Console',
          path: '/debug-user',
          description: 'View current user state, session info, and profile data',
          status: 'stable'
        }
      ]
    },
    {
      title: 'UI/UX Debug',
      description: 'Debug user interface and animations',
      icon: Eye,
      tools: [
        {
          name: 'Smooth Scroll Test',
          path: '/smooth-scroll-test',
          description: 'Test smooth scrolling animations and performance',
          status: 'experimental'
        },
        {
          name: 'Simple Component Test',
          path: '/simple-test',
          description: 'Basic functionality and component testing',
          status: 'experimental'
        }
      ]
    },
    {
      title: 'Legacy Tools',
      description: 'Deprecated development tools',
      icon: Settings,
      tools: [
        {
          name: 'Dev Dashboard (Legacy)',
          path: '/dev-dashboard',
          description: 'Original development dashboard (deprecated)',
          status: 'deprecated'
        }
      ]
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'bg-emerald-900 text-emerald-300 border border-emerald-800'
      case 'experimental': return 'bg-yellow-900 text-yellow-300 border border-yellow-800'
      case 'deprecated': return 'bg-red-900 text-red-300 border border-red-800'
      default: return 'bg-neutral-900 text-neutral-300 border border-neutral-800'
    }
  }

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
            <Bug className="h-8 w-8" />
            Debug Tools
          </h1>
          <p className="text-gray-400 mt-2">
            Development and debugging utilities for troubleshooting
          </p>
        </div>

        {/* Debug Categories */}
        <div className="grid gap-8">
          {debugCategories.map((category, index) => {
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
                    {category.tools.map((tool, toolIndex) => (
                      <div key={toolIndex} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{tool.name}</h4>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tool.status)}`}>
                            {tool.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">{tool.description}</p>
                        <Link href={tool.path}>
                          <Button 
                            size="sm" 
                            variant={tool.status === 'deprecated' ? 'outline' : 'default'}
                            className={`w-full ${tool.status === 'deprecated' 
                              ? 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white' 
                              : 'bg-white text-black hover:bg-gray-100'
                            }`}
                          >
                            {tool.status === 'deprecated' ? 'View (Deprecated)' : 'Open Tool'}
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
            <CardTitle className="text-white">Quick Debug Actions</CardTitle>
            <CardDescription className="text-gray-400">
              Common debugging workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/debug-user">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800">
                  <User className="mr-2 h-4 w-4" />
                  Debug User State
                </Button>
              </Link>
              <Link href="/simple-test">
                <Button variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800">
                  <Bug className="mr-2 h-4 w-4" />
                  Run Simple Tests
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Warning for Deprecated Tools */}
        <Card className="bg-red-950/20 border-red-800 mt-8">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Deprecated Tools Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-300 text-sm">
              Some tools marked as "deprecated" are legacy development utilities that may not function correctly 
              with the current system. They are kept for reference purposes only and should not be used in 
              active development.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
