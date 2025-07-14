'use client'

import { format, isToday, isTomorrow, isThisWeek, differenceInDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Calendar, 
  Users, 
  DollarSign, 
  MapPin, 
  Clock,
  ChevronRight,
  CalendarDays,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/utils/cn'
import Link from 'next/link'

interface BookingPreviewItem {
  id: string
  property_id: string
  guest_name: string
  guest_email: string
  check_in: string
  check_out: string
  guests: number
  total_amount: number
  currency: string
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed'
  property?: {
    id: string
    name: string
  }
}

interface BookingPreviewProps {
  bookings: BookingPreviewItem[]
  onViewAll?: () => void
  className?: string
}

export function BookingPreview({ 
  bookings, 
  onViewAll,
  className 
}: BookingPreviewProps) {
  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDateRange = (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    
    // Smart date formatting
    if (isToday(checkInDate)) {
      return `Today → ${format(checkOutDate, 'MMM d')}`
    } else if (isTomorrow(checkInDate)) {
      return `Tomorrow → ${format(checkOutDate, 'MMM d')}`
    } else if (isThisWeek(checkInDate)) {
      return `${format(checkInDate, 'EEE')} → ${format(checkOutDate, 'MMM d')}`
    } else {
      return `${format(checkInDate, 'MMM d')} → ${format(checkOutDate, 'MMM d')}`
    }
  }

  const getStatusBadge = (status: string, checkIn: string) => {
    const checkInDate = new Date(checkIn)
    const daysUntilCheckIn = differenceInDays(checkInDate, new Date())
    
    if (status === 'confirmed') {
      if (daysUntilCheckIn <= 1) {
        return (
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            Arriving Soon
          </Badge>
        )
      } else if (daysUntilCheckIn <= 7) {
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            This Week
          </Badge>
        )
      } else {
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
            Confirmed
          </Badge>
        )
      }
    }
    
    const statusColors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      checked_in: 'bg-green-500/20 text-green-400 border-green-500/30',
      checked_out: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      completed: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
    }
    
    return (
      <Badge variant="secondary" className={statusColors[status as keyof typeof statusColors]}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getUrgencyIndicator = (checkIn: string) => {
    const checkInDate = new Date(checkIn)
    const daysUntilCheckIn = differenceInDays(checkInDate, new Date())
    
    if (daysUntilCheckIn <= 1) {
      return <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
    } else if (daysUntilCheckIn <= 3) {
      return <div className="w-2 h-2 bg-yellow-400 rounded-full" />
    }
    return <div className="w-2 h-2 bg-green-400 rounded-full" />
  }

  // Show only next 3-5 bookings
  const displayBookings = bookings.slice(0, 5)

  if (bookings.length === 0) {
    return (
      <Card className={cn('bg-neutral-950 border-neutral-800', className)}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-white font-medium mb-2">No Upcoming Bookings</h3>
            <p className="text-neutral-400 text-sm mb-4">
              New bookings will appear here when confirmed
            </p>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('bg-neutral-950 border-neutral-800', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Bookings
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {bookings.length}
            </Badge>
          </CardTitle>
          {bookings.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="text-blue-400 hover:text-blue-300"
            >
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayBookings.map((booking, index) => (
            <div
              key={booking.id}
              className={cn(
                'group p-3 rounded-lg border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/50 transition-all duration-200',
                'hover:border-neutral-700 cursor-pointer'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getUrgencyIndicator(booking.check_in)}
                  <div>
                    <h4 className="text-white font-medium text-sm">{booking.guest_name}</h4>
                    <p className="text-neutral-400 text-xs">
                      {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {getStatusBadge(booking.status, booking.check_in)}
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-neutral-300 text-sm">
                  <Clock className="w-3 h-3" />
                  <span>{formatDateRange(booking.check_in, booking.check_out)}</span>
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                  <DollarSign className="w-3 h-3" />
                  {formatCurrency(booking.total_amount, booking.currency)}
                </div>
              </div>

              {booking.property && (
                <div className="flex items-center gap-2 text-neutral-400 text-xs">
                  <MapPin className="w-3 h-3" />
                  <span>{booking.property.name}</span>
                </div>
              )}

              {/* Mobile: Show expand indicator */}
              <div className="md:hidden flex justify-center mt-2">
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-neutral-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-4 pt-4 border-t border-neutral-800">
          <Button
            variant="outline"
            className="w-full"
            onClick={onViewAll}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            View All Bookings
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton loader for booking preview
export function BookingPreviewSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('bg-neutral-950 border-neutral-800', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-neutral-800 rounded animate-pulse" />
            <div className="h-6 w-32 bg-neutral-800 rounded animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-neutral-800 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/30">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-neutral-800 rounded-full animate-pulse" />
                  <div>
                    <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse mb-1" />
                    <div className="h-3 w-16 bg-neutral-800 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-5 w-16 bg-neutral-800 rounded animate-pulse" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" />
                <div className="h-4 w-20 bg-neutral-800 rounded animate-pulse" />
              </div>
              <div className="h-3 w-40 bg-neutral-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-800">
          <div className="h-10 w-full bg-neutral-800 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}
