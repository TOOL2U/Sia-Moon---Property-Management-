'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

export default function ClientReportsPage() {
  return (
    <DashboardLayout
      title="Reports"
      subtitle="Financial reports and analytics for your properties"
      actions={
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      }
    >
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">฿0</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">This Month</p>
                  <p className="text-2xl font-bold text-white">฿0</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Bookings</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Occupancy</p>
                  <p className="text-2xl font-bold text-white">0%</p>
                </div>
                <Activity className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Financial Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Monthly Revenue Report</h4>
                  <p className="text-sm text-neutral-400">Detailed breakdown of monthly income</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Annual Summary</h4>
                  <p className="text-sm text-neutral-400">Year-end financial summary</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Tax Report</h4>
                  <p className="text-sm text-neutral-400">Tax-ready financial statements</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Performance Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Occupancy Analysis</h4>
                  <p className="text-sm text-neutral-400">Property utilization metrics</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Booking Trends</h4>
                  <p className="text-sm text-neutral-400">Seasonal booking patterns</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Guest Analytics</h4>
                  <p className="text-sm text-neutral-400">Guest demographics and feedback</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Advanced Reports Coming Soon</h3>
            <p className="text-neutral-400 mb-4">
              We're working on advanced analytics and custom report generation features.
            </p>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              In Development
            </Badge>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
