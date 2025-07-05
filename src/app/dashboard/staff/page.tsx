'use client'

import { useAuth } from '@/contexts/SupabaseAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, Clock, AlertTriangle, Users, Plus, Filter, ArrowUpRight, Settings, ClipboardList } from 'lucide-react'
import Link from 'next/link'

export default function StaffDashboard() {
  const { profile: user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-neutral-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        {/* Header - Linear style */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">Staff Dashboard</h1>
              <p className="mt-2 text-neutral-400">Welcome back, {user.email}</p>
            </div>
            <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/staff/tasks">
                <Button className="w-full sm:w-auto h-10">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  My Tasks
                </Button>
              </Link>
              <Link href="/dashboard/admin">
                <Button variant="outline" className="w-full sm:w-auto h-10">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Task Stats - Linear design */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Pending Tasks</p>
                  <p className="text-2xl font-semibold text-white mt-2">8</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-orange-400">Due today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Completed Today</p>
                  <p className="text-2xl font-semibold text-white mt-2">12</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-400 font-medium">+3</span>
                <span className="text-neutral-400 ml-1">from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Urgent Issues</p>
                  <p className="text-2xl font-semibold text-white mt-2">3</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-red-400">Requires attention</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Active Guests</p>
                  <p className="text-2xl font-semibold text-white mt-2">24</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-blue-400">Across 8 properties</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks and Activities - Linear layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Today's Tasks</CardTitle>
                  <CardDescription className="text-neutral-400">Your assigned tasks for today</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary-400 hover:text-primary-300">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-red-950/20 border border-red-800/30 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">Clean Villa Sunset</p>
                      <p className="text-sm text-neutral-400">Check-in at 3 PM</p>
                    </div>
                  </div>
                  <span className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-300 border border-red-800/30">
                    Urgent
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-amber-950/20 border border-amber-800/30 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 bg-amber-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">Maintenance - Pool Villa</p>
                      <p className="text-sm text-neutral-400">Pool filter replacement</p>
                    </div>
                  </div>
                  <span className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-900/30 text-amber-300 border border-amber-800/30">
                    Medium
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-emerald-950/20 border border-emerald-800/30 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">Inventory Check</p>
                      <p className="text-sm text-neutral-400">Weekly supplies audit</p>
                    </div>
                  </div>
                  <span className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-300 border border-emerald-800/30">
                    Low
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Recent Activity</CardTitle>
                  <CardDescription className="text-neutral-400">Latest updates and completions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary-400 hover:text-primary-300">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-emerald-950/20 rounded-lg hover:bg-emerald-950/30 transition-colors duration-200">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">Completed: Ocean View Villa cleaning</p>
                    <p className="text-sm text-neutral-400">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-emerald-950/20 rounded-lg hover:bg-emerald-950/30 transition-colors duration-200">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">Completed: Guest welcome package</p>
                    <p className="text-sm text-neutral-400">4 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-orange-950/20 rounded-lg hover:bg-orange-950/30 transition-colors duration-200">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">Issue reported: AC not working</p>
                    <p className="text-sm text-neutral-400">Villa Paradise • 6 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-blue-950/20 rounded-lg hover:bg-blue-950/30 transition-colors duration-200">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">Completed: Laundry service</p>
                    <p className="text-sm text-neutral-400">Mountain Retreat • 8 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}