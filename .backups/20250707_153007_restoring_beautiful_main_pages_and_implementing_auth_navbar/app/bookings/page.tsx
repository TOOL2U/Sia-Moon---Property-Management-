'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, Clock, MapPin } from 'lucide-react'

export default function BookingsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            Bookings
          </h1>
          <p className="text-neutral-400 mt-2">
            Manage your property bookings and reservations
          </p>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Bookings System Under Development
            </CardTitle>
            <CardDescription>
              The bookings management system is currently being rebuilt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              Coming Soon - Booking Management Features
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
