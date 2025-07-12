'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Wrench, 
  Plus, 
  Calendar, 
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  MapPin,
  Phone
} from 'lucide-react'

export default function MaintenancePage() {
  return (
    <DashboardLayout
      title="Maintenance"
      subtitle="Property maintenance requests and scheduling"
      actions={
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Request
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
                  <p className="text-sm text-neutral-400">Open Requests</p>
                  <p className="text-2xl font-bold text-white">2</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">In Progress</p>
                  <p className="text-2xl font-bold text-white">1</p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Completed</p>
                  <p className="text-2xl font-bold text-white">8</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">This Month</p>
                  <p className="text-2xl font-bold text-white">11</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Maintenance Requests */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Active Maintenance Requests
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                2 Open
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Sample Maintenance Request 1 */}
            <div className="p-4 bg-neutral-800 rounded-lg border border-orange-500/20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-white">Pool Pump Repair</h4>
                  <p className="text-sm text-neutral-400">Villa Sunset Beach - Pool Area</p>
                </div>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  High Priority
                </Badge>
              </div>
              
              <p className="text-sm text-neutral-300 mb-4">
                Pool pump making unusual noise and water circulation appears reduced. 
                Guest reported issue this morning.
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Reported: Dec 12, 2024
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Assigned: John Smith
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>

            {/* Sample Maintenance Request 2 */}
            <div className="p-4 bg-neutral-800 rounded-lg border border-blue-500/20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-white">Air Conditioning Service</h4>
                  <p className="text-sm text-neutral-400">Villa Mango Beach - Master Bedroom</p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Scheduled
                </Badge>
              </div>
              
              <p className="text-sm text-neutral-300 mb-4">
                Routine maintenance service for master bedroom AC unit. 
                Scheduled for tomorrow morning.
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Scheduled: Dec 13, 2024
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Assigned: Mike Johnson
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="p-4 bg-neutral-800 rounded-lg">
                <h4 className="font-medium text-white mb-2">Plumbing</h4>
                <p className="text-sm text-neutral-400 mb-2">24/7 Emergency Service</p>
                <p className="text-sm text-blue-400">+66 77 123 4567</p>
              </div>

              <div className="p-4 bg-neutral-800 rounded-lg">
                <h4 className="font-medium text-white mb-2">Electrical</h4>
                <p className="text-sm text-neutral-400 mb-2">Licensed Electrician</p>
                <p className="text-sm text-blue-400">+66 77 234 5678</p>
              </div>

              <div className="p-4 bg-neutral-800 rounded-lg">
                <h4 className="font-medium text-white mb-2">Pool Service</h4>
                <p className="text-sm text-neutral-400 mb-2">Pool & Spa Maintenance</p>
                <p className="text-sm text-blue-400">+66 77 345 6789</p>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardContent className="p-8 text-center">
            <Wrench className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Advanced Maintenance Features Coming Soon</h3>
            <p className="text-neutral-400 mb-4">
              We're building automated scheduling, vendor management, and maintenance tracking features.
            </p>
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
              In Development
            </Badge>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
