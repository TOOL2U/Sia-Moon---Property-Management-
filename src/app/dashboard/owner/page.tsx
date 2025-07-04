'use client'

import { useAuth } from '@/contexts/RealAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Building, Calendar, DollarSign, TrendingUp, Plus, Eye, ArrowUpRight } from 'lucide-react'

export default function OwnerDashboard() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        {/* Header - Linear style */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 sm:text-3xl">Owner Dashboard</h1>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">Welcome back, {user.email}</p>
            </div>
            <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <Button className="w-full sm:w-auto h-10">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
              <Button variant="outline" className="w-full sm:w-auto h-10">
                <Eye className="mr-2 h-4 w-4" />
                View All
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid - Linear design */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Properties</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-2">12</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 dark:bg-blue-600">
                  <Building className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">+2</span>
                <span className="text-neutral-600 dark:text-neutral-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Active Bookings</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-2">24</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 dark:bg-emerald-600">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">+12%</span>
                <span className="text-neutral-600 dark:text-neutral-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Monthly Revenue</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-2">$45,231</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 dark:bg-purple-600">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">+20.1%</span>
                <span className="text-neutral-600 dark:text-neutral-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Occupancy Rate</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-2">78%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 dark:bg-orange-600">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">+5%</span>
                <span className="text-neutral-600 dark:text-neutral-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Linear layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="group hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recent Bookings</CardTitle>
                  <CardDescription className="text-neutral-600 dark:text-neutral-400">Latest reservations for your properties</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">Villa Sunset</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">John Doe • 3 nights</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">$1,200</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Dec 15-18</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">Ocean View Villa</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Jane Smith • 5 nights</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">$2,500</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Dec 20-25</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">Mountain Retreat</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Mike Johnson • 2 nights</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">$800</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Dec 22-24</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Property Performance</CardTitle>
                  <CardDescription className="text-neutral-600 dark:text-neutral-400">Top performing properties this month</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">Villa Paradise</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">95% occupancy</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">$8,500</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">+15%</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">Beachfront Villa</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">87% occupancy</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">$7,200</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">+8%</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800/30 hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">City Center Loft</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">82% occupancy</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">$6,800</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">+12%</p>
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
