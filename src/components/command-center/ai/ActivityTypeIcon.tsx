'use client'

import { 
  Users, 
  Route, 
  Clock, 
  AlertTriangle, 
  BookOpen, 
  DollarSign, 
  Zap, 
  TrendingUp,
  Brain,
  Target,
  Eye,
  Settings
} from 'lucide-react'
import { AIActivityType } from '@/services/AIActivityLogger'

interface ActivityTypeIconProps {
  type: AIActivityType
  size?: 'sm' | 'md' | 'lg'
}

export default function ActivityTypeIcon({ type, size = 'sm' }: ActivityTypeIconProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }

  const getIconAndColor = () => {
    switch (type) {
      case 'staff_reassignment':
        return {
          icon: Users,
          color: 'text-blue-400',
          bg: 'bg-blue-900/20'
        }
      
      case 'route_optimization':
        return {
          icon: Route,
          color: 'text-green-400',
          bg: 'bg-green-900/20'
        }
      
      case 'delay_prediction':
        return {
          icon: Clock,
          color: 'text-yellow-400',
          bg: 'bg-yellow-900/20'
        }
      
      case 'anomaly_detection':
        return {
          icon: AlertTriangle,
          color: 'text-red-400',
          bg: 'bg-red-900/20'
        }
      
      case 'learning_event':
        return {
          icon: Brain,
          color: 'text-purple-400',
          bg: 'bg-purple-900/20'
        }
      
      case 'booking_decision':
        return {
          icon: BookOpen,
          color: 'text-cyan-400',
          bg: 'bg-cyan-900/20'
        }
      
      case 'financial_analysis':
        return {
          icon: DollarSign,
          color: 'text-emerald-400',
          bg: 'bg-emerald-900/20'
        }
      
      case 'emergency_escalation':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bg: 'bg-red-900/30'
        }
      
      case 'system_optimization':
        return {
          icon: Settings,
          color: 'text-indigo-400',
          bg: 'bg-indigo-900/20'
        }
      
      case 'guest_prediction':
        return {
          icon: Eye,
          color: 'text-pink-400',
          bg: 'bg-pink-900/20'
        }
      
      default:
        return {
          icon: Zap,
          color: 'text-gray-400',
          bg: 'bg-gray-900/20'
        }
    }
  }

  const { icon: Icon, color, bg } = getIconAndColor()

  return (
    <div className={`rounded-full p-1 ${bg}`}>
      <Icon className={`${sizeClasses[size]} ${color}`} />
    </div>
  )
}
