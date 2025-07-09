'use client'

import { format } from 'date-fns'
import { FileText, Download, Eye, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface Report {
  id: string
  property_id: string
  month: number
  year: number
  total_income: number
  total_expenses: number
  net_income: number
  occupancy_rate: number
  total_bookings: number
  currency: string
  pdf_url?: string | null
  created_at: string
  property?: {
    id: string
    name: string
  }
}

interface ReportCardProps {
  report: Report
  onView?: (report: Report) => void
  onDownload?: (report: Report) => void
  className?: string
}

export function ReportCard({ report, onView, onDownload, className }: ReportCardProps) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const isProfit = report.net_income > 0
  const occupancyColor = report.occupancy_rate >= 70 ? 'text-green-400' : 
                         report.occupancy_rate >= 50 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className={cn(
      "bg-neutral-950 border border-neutral-800 rounded-xl p-6 hover:shadow-xl transition-all duration-300 group",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-lg flex items-center justify-center mr-3 group-hover:from-primary-500/20 group-hover:to-primary-600/20 transition-all duration-300">
            <FileText className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {monthNames[report.month - 1]} {report.year}
            </h3>
            {report.property && (
              <p className="text-neutral-400 text-sm">{report.property.name}</p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {report.total_bookings} booking{report.total_bookings !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div>
            <p className="text-neutral-500 text-xs">Income</p>
            <p className="text-green-400 font-semibold">
              {formatCurrency(report.total_income, report.currency)}
            </p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">Expenses</p>
            <p className="text-red-400 font-semibold">
              {formatCurrency(report.total_expenses, report.currency)}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-neutral-500 text-xs">Net Income</p>
            <div className="flex items-center">
              {isProfit ? (
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
              )}
              <p className={cn(
                "font-semibold",
                isProfit ? "text-green-400" : "text-red-400"
              )}>
                {formatCurrency(report.net_income, report.currency)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">Occupancy</p>
            <p className={cn("font-semibold", occupancyColor)}>
              {report.occupancy_rate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
        <p className="text-neutral-500 text-xs">
          Generated {format(new Date(report.created_at), 'MMM dd, yyyy')}
        </p>
        <div className="flex gap-2">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(report)}
              className="text-neutral-400 hover:text-white"
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          )}
          {onDownload && report.pdf_url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(report)}
              className="text-primary-400 hover:text-primary-300"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
