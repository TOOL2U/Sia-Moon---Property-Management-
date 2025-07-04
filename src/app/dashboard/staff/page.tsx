'use client'

// TODO: Switch back to Supabase auth for production
// import { useAuth } from '@/contexts/RealAuthContext'
import { useLocalAuth } from '@/hooks/useLocalAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, Clock, AlertTriangle, Users, Plus, Filter, ArrowUpRight } from 'lucide-react'

export default function StaffDashboard() {
  // TODO: Switch back to Supabase auth for production
  const { user } = useLocalAuth()

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
              <Button className="w-full sm:w-auto h-10">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
              <Button variant="outline" className="w-full sm:w-auto h-10">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Task Stats - Linear design */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Pending Tasks</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-2">8</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 dark:bg-orange-600">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Due today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Completed Today</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-2">12</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 dark:bg-emerald-600">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">+3</span>
                <span className="text-neutral-600 dark:text-neutral-400 ml-1">from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Urgent Issues</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-2">3</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 dark:bg-red-600">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Requires attention</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Active Guests</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-2">24</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 dark:bg-blue-600">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Across 8 properties</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks and Activities - Linear layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="group hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Today's Tasks</CardTitle>
                  <CardDescription className="text-neutral-600 dark:text-neutral-400">Your assigned tasks for today</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">Clean Villa Sunset</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Check-in at 3 PM</p>
                    </div>
                  </div>
                  <span className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                    Urgent
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 bg-amber-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">Maintenance - Pool Villa</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Pool filter replacement</p>
                    </div>
                  </div>
                  <span className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
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
                  <span className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-300">
                    Low
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recent Activity</CardTitle>
                  <CardDescription className="text-neutral-600 dark:text-neutral-400">Latest updates and completions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors duration-150">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">Completed: Ocean View Villa cleaning</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors duration-150">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">Completed: Guest welcome package</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">4 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors duration-150">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">Issue reported: AC not working</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Villa Paradise • 6 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors duration-150">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">Completed: Laundry service</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Mountain Retreat • 8 hours ago</p>
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
