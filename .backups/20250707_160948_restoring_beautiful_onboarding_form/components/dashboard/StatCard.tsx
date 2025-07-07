'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  className?: string
  valueClassName?: string
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  className,
  valueClassName 
}: StatCardProps) {
  return (
    <div className={cn(
      "bg-neutral-950 border border-neutral-800 rounded-xl p-6 hover:shadow-xl transition-all duration-300 group",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-neutral-400 text-sm font-medium mb-1">{title}</p>
          <p className={cn(
            "text-2xl font-bold text-white mb-1",
            valueClassName
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-neutral-500 text-xs">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-400" : "text-red-400"
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
              <span className="text-neutral-500 text-xs ml-1">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-lg flex items-center justify-center group-hover:from-primary-500/20 group-hover:to-primary-600/20 transition-all duration-300">
            <Icon className="w-6 h-6 text-primary-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
