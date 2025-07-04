'use client'

// TODO: Switch back to Supabase auth for production
// import { useAuth } from '@/contexts/RealAuthContext'
import { useLocalAuth } from '@/hooks/useLocalAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Building, Calendar, DollarSign, TrendingUp, Plus, Eye, ArrowUpRight, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function ClientDashboard() {
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
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Welcome back, {user.name || user.email}
          </h1>
          <p className="mt-2 text-neutral-400">
            Manage your villa properties and track performance
          </p>
        </div>

        {/* Stats Grid - Linear design */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Total Properties</p>
                  <p className="text-2xl font-semibold text-white mt-2">3</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600">
                  <Building className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-400 mr-1" />
                <span className="text-emerald-400 font-medium">+1</span>
                <span className="text-neutral-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Active Bookings</p>
                  <p className="text-2xl font-semibold text-white mt-2">12</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-400 font-medium">+3</span>
                <span className="text-neutral-400 ml-1">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Monthly Revenue</p>
                  <p className="text-2xl font-semibold text-white mt-2">฿45,231</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-400 font-medium">+12%</span>
                <span className="text-neutral-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Occupancy Rate</p>
                  <p className="text-2xl font-semibold text-white mt-2">78%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                <span className="text-emerald-400 font-medium">+5%</span>
                <span className="text-neutral-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity - Linear layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
              <CardDescription className="text-neutral-400">
                Common tasks for property management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/properties/add">
                <Button className="w-full justify-start h-11" size="lg">
                  <Plus className="mr-3 h-4 w-4" />
                  Add New Property
                </Button>
              </Link>
              <Link href="/properties">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Eye className="mr-3 h-4 w-4" />
                  View All Properties
                </Button>
              </Link>
              <Link href="/bookings">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Calendar className="mr-3 h-4 w-4" />
                  Manage Bookings
                </Button>
              </Link>
              <Link href="/onboard">
                <Button variant="outline" className="w-full justify-start h-11" size="lg">
                  <Building className="mr-3 h-4 w-4" />
                  Villa Onboarding Survey
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-white">Recent Activity</CardTitle>
              <CardDescription className="text-neutral-400">
                Latest updates from your properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-neutral-900 transition-colors duration-200">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      New booking confirmed
                    </p>
                    <p className="text-sm text-neutral-400">
                      Villa Paradise - 5 nights in March
                    </p>
                  </div>
                  <div className="text-xs text-neutral-500 flex-shrink-0">2h ago</div>
                </div>

                <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-neutral-900 transition-colors duration-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      Maintenance completed
                    </p>
                    <p className="text-sm text-neutral-400">
                      Pool cleaning at Sunset Villa
                    </p>
                  </div>
                  <div className="text-xs text-neutral-500 flex-shrink-0">1d ago</div>
                </div>

                <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-neutral-900 transition-colors duration-200">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      Payment received
                    </p>
                    <p className="text-sm text-neutral-400">
                      ฿15,000 from guest checkout
                    </p>
                  </div>
                  <div className="text-xs text-neutral-500 flex-shrink-0">2d ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Overview - Linear design */}
        <Card className="group hover:shadow-xl transition-all duration-300 card-hover bg-neutral-950 border-neutral-800">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-white">Your Properties</CardTitle>
                <CardDescription className="text-neutral-400">
                  Overview of your villa portfolio
                </CardDescription>
              </div>
              <Link href="/properties">
                <Button variant="outline" size="sm" className="h-9">
                  View All
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Property Cards - Linear style */}
              <div className="group/card border border-neutral-800 rounded-lg p-5 hover:shadow-lg hover:border-neutral-700 hover:bg-neutral-900 transition-all duration-200">
                <div className="aspect-video bg-neutral-800 rounded-lg mb-4 flex items-center justify-center">
                  <Building className="h-8 w-8 text-neutral-500" />
                </div>
                <h3 className="font-semibold text-white mb-2">Villa Paradise</h3>
                <p className="text-sm text-neutral-400 mb-4">Phuket, Thailand</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-medium text-emerald-400">85% occupied</span>
                  </div>
                  <span className="text-sm font-medium text-white">฿18,500/month</span>
                </div>
              </div>

              <div className="group/card border border-neutral-800 rounded-lg p-5 hover:shadow-lg hover:border-neutral-700 hover:bg-neutral-900 transition-all duration-200">
                <div className="aspect-video bg-neutral-800 rounded-lg mb-4 flex items-center justify-center">
                  <Building className="h-8 w-8 text-neutral-500" />
                </div>
                <h3 className="font-semibold text-white mb-2">Sunset Villa</h3>
                <p className="text-sm text-neutral-400 mb-4">Koh Samui, Thailand</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-medium text-emerald-400">72% occupied</span>
                  </div>
                  <span className="text-sm font-medium text-white">฿15,200/month</span>
                </div>
              </div>

              <div className="group/card border border-neutral-800 rounded-lg p-5 hover:shadow-lg hover:border-neutral-700 hover:bg-neutral-900 transition-all duration-200">
                <div className="aspect-video bg-neutral-800 rounded-lg mb-4 flex items-center justify-center">
                  <Building className="h-8 w-8 text-neutral-500" />
                </div>
                <h3 className="font-semibold text-white mb-2">Ocean Breeze</h3>
                <p className="text-sm text-neutral-400 mb-4">Krabi, Thailand</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm font-medium text-amber-400">68% occupied</span>
                  </div>
                  <span className="text-sm font-medium text-white">฿12,800/month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}