'use client'

import { format, isAfter, isBefore, differenceInDays } from 'date-fns'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Calendar, 
  Users, 
  DollarSign, 
  MapPin, 
  Clock,
  Home,
  CheckCircle,
  AlertCircle,
  Phone,
  MessageSquare,
  Eye,
  Star
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { ClientBooking } from '@/lib/services/clientBookingService'

interface ClientBookingCardProps {
  booking: ClientBooking
  onViewDetails?: (booking: ClientBooking) => void
  onContactGuest?: (booking: ClientBooking) => void
  onGetHelp?: () => void
  className?: string
  compact?: boolean
}

export function ClientBookingCard({
  booking,
  onViewDetails,
  onContactGuest,
  onGetHelp,
  className,
  compact = false
}: ClientBookingCardProps) {
  const checkInDate = new Date(booking.checkInDate)
  const checkOutDate = new Date(booking.checkOutDate)
  const now = new Date()
  
  const isUpcoming = isAfter(checkInDate, now)
  const isActive = isBefore(checkInDate, now) && isAfter(checkOutDate, now)
  const isCompleted = isBefore(checkOutDate, now)
  const isCheckingInSoon = isUpcoming && differenceInDays(checkInDate, now) <= 7

  const getStatusInfo = () => {
    if (isActive) {
      return {
        status: 'Active',
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: CheckCircle,
        description: 'Guest is currently staying'
      }
    } else if (isCheckingInSoon) {
      return {
        status: 'Checking In Soon',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: Clock,
        description: `Check-in in ${differenceInDays(checkInDate, now)} days`
      }
    } else if (isUpcoming) {
      return {
        status: 'Upcoming',
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        icon: Calendar,
        description: 'Future booking'
      }
    } else if (isCompleted) {
      return {
        status: 'Completed',
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: CheckCircle,
        description: 'Stay completed'
      }
    } else {
      return {
        status: booking.status || 'Confirmed',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: CheckCircle,
        description: 'Confirmed booking'
      }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy')
  }

  const formatDateShort = (date: Date) => {
    return format(date, 'MMM dd')
  }

  if (compact) {
    return (
      <Card className={cn(
        'bg-neutral-950 border-neutral-800 hover:border-neutral-700 transition-all duration-200',
        isActive && 'border-green-500/30',
        isCheckingInSoon && 'border-blue-500/30',
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-medium">{booking.guestName}</h4>
                <p className="text-sm text-neutral-400">{booking.assignedPropertyName || booking.property}</p>
              </div>
            </div>
            <Badge className={cn('border text-xs', statusInfo.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.status}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-neutral-400">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{formatDateShort(checkInDate)} - {formatDateShort(checkOutDate)}</span>
            </div>
            <div className="flex items-center text-green-400 font-medium">
              <DollarSign className="w-4 h-4 mr-1" />
              <span>{formatCurrency(booking.price)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      'bg-neutral-950 border-neutral-800 hover:border-neutral-700 transition-all duration-200 hover:shadow-lg',
      isActive && 'border-green-500/30 shadow-green-500/10',
      isCheckingInSoon && 'border-blue-500/30 shadow-blue-500/10',
      className
    )}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{booking.guestName}</h3>
              <p className="text-neutral-400">{booking.guestEmail}</p>
              <p className="text-sm text-blue-400">{booking.assignedPropertyName || booking.property}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('border', statusInfo.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.status}
            </Badge>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-neutral-900 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center text-neutral-300">
              <Calendar className="w-4 h-4 mr-2 text-blue-400" />
              <div>
                <p className="text-sm text-neutral-400">Check-in</p>
                <p className="font-medium">{formatDate(checkInDate)}</p>
              </div>
            </div>
            <div className="flex items-center text-neutral-300">
              <Calendar className="w-4 h-4 mr-2 text-green-400" />
              <div>
                <p className="text-sm text-neutral-400">Check-out</p>
                <p className="font-medium">{formatDate(checkOutDate)}</p>
              </div>
            </div>
            <div className="flex items-center text-neutral-300">
              <Clock className="w-4 h-4 mr-2 text-purple-400" />
              <div>
                <p className="text-sm text-neutral-400">Duration</p>
                <p className="font-medium">{booking.nights} nights</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center text-neutral-300">
            <Users className="w-4 h-4 mr-2 text-green-400" />
            <span>{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center text-green-400 font-semibold">
            <DollarSign className="w-4 h-4 mr-1" />
            <span>{formatCurrency(booking.price)}</span>
          </div>
          <div className="flex items-center text-neutral-300">
            <Star className="w-4 h-4 mr-2 text-yellow-400" />
            <span>Premium Guest</span>
          </div>
        </div>

        {/* Status Message */}
        {(isCheckingInSoon || isActive) && (
          <div className={cn(
            'p-3 rounded-lg mb-4',
            isActive ? 'bg-green-500/10 border border-green-500/20' : 'bg-blue-500/10 border border-blue-500/20'
          )}>
            <p className={cn(
              'text-sm font-medium',
              isActive ? 'text-green-400' : 'text-blue-400'
            )}>
              {isActive ? '🏠 Guest is currently staying at your property' : '🔔 Guest checking in soon'}
            </p>
            <p className="text-xs text-neutral-400 mt-1">{statusInfo.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            {onViewDetails && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails(booking)}
                className="text-neutral-400 hover:text-white"
              >
                <Eye className="w-4 h-4 mr-1" />
                Details
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onContactGuest && (isActive || isCheckingInSoon) && (
              <Button
                size="sm"
                onClick={() => onContactGuest(booking)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Contact Guest
              </Button>
            )}
            
            {onGetHelp && (
              <Button
                size="sm"
                variant="outline"
                onClick={onGetHelp}
                className="text-purple-400 hover:text-purple-300"
              >
                <Phone className="w-4 h-4 mr-1" />
                Get Help
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
