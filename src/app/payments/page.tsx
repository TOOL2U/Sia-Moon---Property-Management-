'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Banknote
} from 'lucide-react'

export default function PaymentsPage() {
  return (
    <DashboardLayout
      title="Payments"
      subtitle="Payment processing and financial transactions"
      actions={
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
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
                  <p className="text-sm text-neutral-400">Total Received</p>
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
                  <p className="text-sm text-neutral-400">Pending</p>
                  <p className="text-2xl font-bold text-white">฿0</p>
                </div>
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Transactions</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Sample Payment Method */}
            <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Bank Transfer</h4>
                    <p className="text-sm text-neutral-400">Kasikorn Bank - ****1234</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Active
                </Badge>
              </div>
            </div>

            {/* Add Payment Method Placeholder */}
            <div className="p-4 bg-neutral-800/50 rounded-lg border border-dashed border-neutral-600">
              <div className="text-center">
                <Plus className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                <p className="text-sm text-neutral-400 mb-2">Add a new payment method</p>
                <Button variant="outline" size="sm">
                  Add Payment Method
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            
            {/* Empty State */}
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No transactions yet</h3>
              <p className="text-neutral-400 mb-4">
                Your payment transactions will appear here once you start receiving bookings.
              </p>
              <Button variant="outline">
                View All Transactions
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Payment Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Auto-deposit</h4>
                  <p className="text-sm text-neutral-400">Automatically transfer funds to your bank</p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Enabled
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Payment notifications</h4>
                  <p className="text-sm text-neutral-400">Get notified of new payments</p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Enabled
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Tax reporting</h4>
                  <p className="text-sm text-neutral-400">Generate tax documents</p>
                </div>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  Setup Required
                </Badge>
              </div>

            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Payout Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="p-4 bg-neutral-800 rounded-lg">
                <h4 className="font-medium text-white mb-2">Current Schedule</h4>
                <p className="text-sm text-neutral-400 mb-2">Weekly payouts every Friday</p>
                <p className="text-xs text-neutral-500">Next payout: Friday, Dec 15, 2024</p>
              </div>

              <div className="p-4 bg-neutral-800 rounded-lg">
                <h4 className="font-medium text-white mb-2">Processing Time</h4>
                <p className="text-sm text-neutral-400">1-3 business days</p>
              </div>

              <Button variant="outline" className="w-full">
                Change Schedule
              </Button>

            </CardContent>
          </Card>

        </div>

        {/* Coming Soon Notice */}
        <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
          <CardContent className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Advanced Payment Features Coming Soon</h3>
            <p className="text-neutral-400 mb-4">
              We're integrating with multiple payment processors and adding advanced financial tools.
            </p>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              In Development
            </Badge>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
