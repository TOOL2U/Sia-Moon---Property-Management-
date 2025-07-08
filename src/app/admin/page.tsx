'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Shield,
  Users,
  Settings,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-neutral-400 mt-2">
            Administrative tools and system management
          </p>
        </div>

        {/* Placeholder Notice */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Admin Panel Under Development
            </CardTitle>
            <CardDescription>
              The admin dashboard is currently being rebuilt with a new authentication system.
              Full functionality will be restored soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
                    <p className="text-sm text-neutral-400 mb-4">
                      Manage user accounts and permissions
                    </p>
                    <Button variant="outline" disabled className="w-full">
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-6">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
                    <p className="text-sm text-neutral-400 mb-4">
                      View system analytics and reports
                    </p>
                    <Button variant="outline" disabled className="w-full">
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Settings className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">System Settings</h3>
                    <p className="text-sm text-neutral-400 mb-4">
                      Configure system-wide settings
                    </p>
                    <Button variant="outline" disabled className="w-full">
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
