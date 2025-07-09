'use client'

import { format, isAfter, isBefore, addDays } from 'date-fns'
import { Calendar, Users, DollarSign, MapPin, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface Booking {
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

interface BookingCardProps {
  booking: Booking
  className?: string
}

export function BookingCard({ booking, className }: BookingCardProps) {
  const checkInDate = new Date(booking.check_in)
  const checkOutDate = new Date(booking.check_out)
  const now = new Date()
  
  const isUpcoming = isAfter(checkInDate, now)
  const isActive = isBefore(checkInDate, now) && isAfter(checkOutDate, now)
  const isCheckingInSoon = isAfter(checkInDate, now) && isBefore(checkInDate, addDays(now, 7))

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'checked_in':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'completed':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className={cn(
      "bg-neutral-950 border border-neutral-800 rounded-xl p-6 hover:shadow-xl transition-all duration-300 group",
      isActive && "border-green-500/30",
      isCheckingInSoon && "border-blue-500/30",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-1">{booking.guest_name}</h3>
          <p className="text-neutral-400 text-sm">{booking.guest_email}</p>
        </div>
        <Badge className={cn("border", getStatusColor(booking.status))}>
          {booking.status.replace('_', ' ')}
        </Badge>
      </div>

      {booking.property && (
        <div className="flex items-center text-neutral-400 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{booking.property.name}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-neutral-300">
          <Calendar className="w-4 h-4 mr-2 text-primary-400" />
          <div>
            <p className="text-xs text-neutral-500">Check-in</p>
            <p className="text-sm font-medium">{format(checkInDate, 'MMM dd, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center text-neutral-300">
          <Clock className="w-4 h-4 mr-2 text-primary-400" />
          <div>
            <p className="text-xs text-neutral-500">Check-out</p>
            <p className="text-sm font-medium">{format(checkOutDate, 'MMM dd, yyyy')}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
        <div className="flex items-center text-neutral-300">
          <Users className="w-4 h-4 mr-2 text-green-400" />
          <span className="text-sm">{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center text-green-400 font-semibold">
          <DollarSign className="w-4 h-4 mr-1" />
          <span>{formatCurrency(booking.total_amount, booking.currency)}</span>
        </div>
      </div>

      {isCheckingInSoon && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-sm font-medium">
            🔔 Guest checking in soon
          </p>
        </div>
      )}

      {isActive && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm font-medium">
            ✅ Currently staying
          </p>
        </div>
      )}
    </div>
  )
}
