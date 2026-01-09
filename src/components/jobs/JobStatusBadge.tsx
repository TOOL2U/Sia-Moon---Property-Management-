'use client'

import { Badge } from '@/components/ui/Badge';
import { JobStatus } from '@/services/RealtimeJobSyncService';
import { CheckCircle, Clock, User, Zap, XCircle } from 'lucide-react';

interface JobStatusBadgeProps {
  status: JobStatus;
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

/**
 * Get status display configuration
 */
function getStatusConfig(status: JobStatus): {
  variant: string;
  icon: React.ReactNode;
  emoji: string;
  label: string;
} {
  switch (status) {
    case 'pending':
      return {
        variant: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: <Clock className="w-3 h-3" />,
        emoji: '⏳',
        label: 'Pending'
      };
    case 'assigned':
      return {
        variant: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: <User className="w-3 h-3" />,
        emoji: '📋',
        label: 'Assigned'
      };
    case 'accepted':
      return {
        variant: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: <CheckCircle className="w-3 h-3" />,
        emoji: '✅',
        label: 'Accepted'
      };
    case 'in_progress':
      return {
        variant: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        icon: <Zap className="w-3 h-3" />,
        emoji: '⚡',
        label: 'In Progress'
      };
    case 'completed':
      return {
        variant: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: <CheckCircle className="w-3 h-3" />,
        emoji: '✨',
        label: 'Completed'
      };
    case 'verified':
      return {
        variant: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        icon: <CheckCircle className="w-3 h-3" />,
        emoji: '🎉',
        label: 'Verified'
      };
    case 'cancelled':
      return {
        variant: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: <XCircle className="w-3 h-3" />,
        emoji: '❌',
        label: 'Cancelled'
      };
    default:
      return {
        variant: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: <Clock className="w-3 h-3" />,
        emoji: '❓',
        label: status
      };
  }
}

export function JobStatusBadge({ 
  status, 
  showIcon = true, 
  animate = false,
  className = ''
}: JobStatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <Badge 
      className={`
        ${config.variant}
        ${animate ? 'animate-pulse' : ''} 
        ${className}
        transition-all duration-200
        border
        flex items-center gap-1
      `}
    >
      {showIcon && (
        <>
          <span>{config.emoji}</span>
          {config.icon}
        </>
      )}
      <span className="ml-1 font-medium">{config.label}</span>
    </Badge>
  );
}

interface JobStatusIndicatorProps {
  status: JobStatus;
  previousStatus?: JobStatus;
  updatedAt?: any;
  className?: string;
}

export function JobStatusIndicator({ 
  status, 
  previousStatus,
  updatedAt,
  className = ''
}: JobStatusIndicatorProps) {
  const isRecentUpdate = updatedAt && 
    (Date.now() - new Date(updatedAt).getTime()) < 60000; // Updated in last minute

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <JobStatusBadge 
        status={status} 
        animate={isRecentUpdate} 
      />
      
      {previousStatus && previousStatus !== status && (
        <div className="text-xs text-neutral-400 flex items-center gap-1">
          <span>from</span>
          <JobStatusBadge status={previousStatus} showIcon={false} />
        </div>
      )}
      
      {isRecentUpdate && (
        <span className="text-xs text-green-400 animate-pulse">
          • Live
        </span>
      )}
    </div>
  );
}
