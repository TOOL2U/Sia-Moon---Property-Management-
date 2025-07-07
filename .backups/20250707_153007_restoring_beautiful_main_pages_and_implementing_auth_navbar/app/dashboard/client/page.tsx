'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Home, Calendar, DollarSign, Activity } from 'lucide-react'

export default function ClientDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-400 mt-2">
            Welcome to your property management dashboard
          </p>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Dashboard Under Development
            </CardTitle>
            <CardDescription>
              This dashboard is currently being rebuilt with a new authentication system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-400">Properties</p>
                      <p className="text-2xl font-bold text-white">-</p>
                    </div>
                    <Home className="h-8 w-8 text-neutral-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-400">Bookings</p>
                      <p className="text-2xl font-bold text-white">-</p>
                    </div>
                    <Calendar className="h-8 w-8 text-neutral-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-400">Revenue</p>
                      <p className="text-2xl font-bold text-white">-</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-neutral-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-400">Occupancy</p>
                      <p className="text-2xl font-bold text-white">-</p>
                    </div>
                    <Activity className="h-8 w-8 text-neutral-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Button variant="outline" disabled>
                Coming Soon - Full Dashboard Features
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
