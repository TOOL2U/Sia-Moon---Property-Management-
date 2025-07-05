'use client'

import { useAuth } from '@/contexts/RealAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Building, Calendar, DollarSign, TrendingUp, Plus, Eye, ArrowUpRight } from 'lucide-react'

export default function OwnerDashboard() {
  const { user } = useAuth()

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
        {/* Header - Linear style with animations */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="animate-fade-in-up will-change-transform">
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">Owner Dashboard</h1>
              <p className="mt-2 text-neutral-400">Welcome back, {user.email}</p>
            </div>
            <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-3 animate-fade-in-up animate-delay-150">
              <Button className="w-full sm:w-auto h-10 btn-hover-lift will-change-transform">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
              <Button variant="outline" className="w-full sm:w-auto h-10 btn-hover-scale will-change-transform">
                <Eye className="mr-2 h-4 w-4" />
                View All
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid - Linear design with staggered animations */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 animate-stagger-fade-in animate-delay-75 will-change-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Total Properties</p>
                  <p className="text-2xl font-semibold text-white mt-2">12</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 hover-glow">
                  <Building className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-400 mr-1 icon-hover" />
                <span className="text-emerald-400 font-medium">+2</span>
                <span className="text-neutral-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 animate-stagger-fade-in animate-delay-150 will-change-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Active Bookings</p>
                  <p className="text-2xl font-semibold text-white mt-2">24</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 hover-glow">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-400 mr-1 icon-hover" />
                <span className="text-emerald-400 font-medium">+12%</span>
                <span className="text-neutral-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 animate-stagger-fade-in animate-delay-225 will-change-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Monthly Revenue</p>
                  <p className="text-2xl font-semibold text-white mt-2">$45,231</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 hover-glow">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-400 mr-1 icon-hover" />
                <span className="text-emerald-400 font-medium">+20.1%</span>
                <span className="text-neutral-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 animate-stagger-fade-in animate-delay-300 will-change-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Occupancy Rate</p>
                  <p className="text-2xl font-semibold text-white mt-2">78%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 hover-glow">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-400 mr-1 icon-hover" />
                <span className="text-emerald-400 font-medium">+5%</span>
                <span className="text-neutral-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Linear layout with animations */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 animate-fade-in-up animate-delay-375 will-change-transform">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Recent Bookings</CardTitle>
                  <CardDescription className="text-neutral-400">Latest reservations for your properties</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary-400 hover:text-primary-300 btn-hover-scale will-change-transform">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-white">Villa Sunset</p>
                    <p className="text-sm text-neutral-400">John Doe • 3 nights</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-lg text-white">$1,200</p>
                    <p className="text-sm text-neutral-400">Dec 15-18</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-white">Ocean View Villa</p>
                    <p className="text-sm text-neutral-400">Jane Smith • 5 nights</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-lg text-white">$2,500</p>
                    <p className="text-sm text-neutral-400">Dec 20-25</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-white">Mountain Retreat</p>
                    <p className="text-sm text-neutral-400">Mike Johnson • 2 nights</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-lg text-white">$800</p>
                    <p className="text-sm text-neutral-400">Dec 22-24</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover-lift bg-neutral-950 border-neutral-800 animate-fade-in-up animate-delay-450 will-change-transform">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Property Performance</CardTitle>
                  <CardDescription className="text-neutral-400">Top performing properties this month</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary-400 hover:text-primary-300 btn-hover-scale will-change-transform">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-emerald-950/20 rounded-lg border border-emerald-800/30 hover:bg-emerald-950/30 transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-white">Villa Paradise</p>
                    <p className="text-sm text-neutral-400">95% occupancy</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-lg text-white">$8,500</p>
                    <p className="text-sm text-emerald-400 font-medium">+15%</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-blue-950/20 rounded-lg border border-blue-800/30 hover:bg-blue-950/30 transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-white">Beachfront Villa</p>
                    <p className="text-sm text-neutral-400">87% occupancy</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-lg text-white">$7,200</p>
                    <p className="text-sm text-emerald-400 font-medium">+8%</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-purple-950/20 rounded-lg border border-purple-800/30 hover:bg-purple-950/30 transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-white">City Center Loft</p>
                    <p className="text-sm text-neutral-400">82% occupancy</p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right">
                    <p className="font-semibold text-lg text-white">$6,800</p>
                    <p className="text-sm text-emerald-400 font-medium">+12%</p>
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
