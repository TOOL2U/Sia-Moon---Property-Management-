'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  User, 
  Calendar, 
  Home, 
  DollarSign, 
  Users, 
  MapPin,
  Bot,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Zap,
  Brain,
  Eye,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface EnhancedBookingCardProps {
  booking: any
  onApprove?: (bookingId: string) => void
  onReject?: (bookingId: string) => void
  onReassign?: (bookingId: string, userId: string) => void
  onTriggerAI?: (bookingId: string) => void
  onViewDetails?: (booking: any) => void
  isProcessing?: boolean
  className?: string
}

export function EnhancedBookingCard({
  booking,
  onApprove,
  onReject,
  onReassign,
  onTriggerAI,
  onViewDetails,
  isProcessing = false,
  className
}: EnhancedBookingCardProps) {
  const [showReassignModal, setShowReassignModal] = useState(false)

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_approval: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      approved: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      assigned: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Target },
      unassigned: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
      completed: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: CheckCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_approval
    const IconComponent = config.icon
    
    return (
      <Badge className={cn('border', config.color)}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getMatchBadge = () => {
    if (booking.matchConfidence) {
      const confidence = booking.matchConfidence * 100
      const method = booking.matchMethod || 'unknown'
      
      if (confidence >= 95) {
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <Bot className="w-3 h-3 mr-1" />
            {confidence.toFixed(0)}% {method}
          </Badge>
        )
      } else if (confidence >= 70) {
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Brain className="w-3 h-3 mr-1" />
            {confidence.toFixed(0)}% {method}
          </Badge>
        )
      } else {
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {confidence.toFixed(0)}% {method}
          </Badge>
        )
      }
    }
    
    if (booking.status === 'unassigned') {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Unmatched
        </Badge>
      )
    }
    
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy')
    } catch {
      return dateStr
    }
  }

  return (
    <Card className={cn(
      'bg-neutral-900 border-neutral-700 hover:border-neutral-600 transition-all duration-200',
      booking.status === 'unassigned' && 'border-orange-500/30',
      booking.status === 'assigned' && 'border-blue-500/30',
      className
    )}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              {booking.assignedUserId && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{booking.guestName}</h3>
              <p className="text-neutral-400">{booking.guestEmail}</p>
              {booking.assignedUserEmail && (
                <p className="text-sm text-blue-400">→ {booking.assignedUserEmail}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(booking.status)}
            {getMatchBadge()}
          </div>
        </div>

        {/* Property & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-neutral-300">
            <Home className="w-4 h-4 mr-2 text-blue-400" />
            <div>
              <p className="font-medium">{booking.property || booking.villaName}</p>
              {booking.assignedPropertyName && booking.assignedPropertyName !== booking.property && (
                <p className="text-sm text-green-400">→ {booking.assignedPropertyName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center text-neutral-300">
            <Calendar className="w-4 h-4 mr-2 text-green-400" />
            <span>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center text-neutral-300">
            <Users className="w-4 h-4 mr-2 text-purple-400" />
            <span>{booking.guests} guests</span>
          </div>
          <div className="flex items-center text-neutral-300">
            <DollarSign className="w-4 h-4 mr-2 text-green-400" />
            <span>{formatCurrency(booking.price)}</span>
          </div>
          <div className="flex items-center text-neutral-300">
            <Clock className="w-4 h-4 mr-2 text-yellow-400" />
            <span>{booking.nights} nights</span>
          </div>
          <div className="flex items-center text-neutral-300">
            <MapPin className="w-4 h-4 mr-2 text-red-400" />
            <span className="truncate">{booking.address}</span>
          </div>
        </div>

        {/* AI Matching Details */}
        {booking.matchDetails && (
          <div className="bg-neutral-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-neutral-300">
              <Bot className="w-4 h-4 inline mr-1 text-blue-400" />
              {booking.matchDetails}
            </p>
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
            {booking.status === 'unassigned' && onTriggerAI && (
              <Button
                size="sm"
                onClick={() => onTriggerAI(booking.id)}
                disabled={isProcessing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Brain className="w-4 h-4 mr-1" />
                Retry AI
              </Button>
            )}
            
            {booking.status === 'pending_approval' && (
              <>
                {onReject && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(booking.id)}
                    disabled={isProcessing}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    Reject
                  </Button>
                )}
                {onApprove && (
                  <Button
                    size="sm"
                    onClick={() => onApprove(booking.id)}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    )}
                    Approve
                  </Button>
                )}
              </>
            )}
            
            {onReassign && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowReassignModal(true)}
                className="text-blue-400 hover:text-blue-300"
              >
                <Settings className="w-4 h-4 mr-1" />
                Reassign
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
