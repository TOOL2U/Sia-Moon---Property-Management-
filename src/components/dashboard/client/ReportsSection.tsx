'use client'

import { useState } from 'react'
import { useReports } from '@/hooks/useReports'

// Utility functions
const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

const getMonthName = (month: number) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1] || 'Unknown'
}

const calculateNetIncome = (report: any) => {
  return (report.totalIncome || 0) - (report.totalExpenses || 0)
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Home,
  Percent,
  Loader2,
  RefreshCw,
  Plus,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'

interface ReportsSectionProps {
  propertyId?: string
}

export function ReportsSection({ propertyId }: ReportsSectionProps) {
  const { reports, loading, error, refreshReports, downloadPDF, generateReport } = useReports({
    propertyId,
    autoLoad: true
  })
  
  const [generatingReport, setGeneratingReport] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  
  const handleGenerateReport = async () => {
    if (!propertyId) {
      // If no specific property, we'd need to select one
      return
    }
    
    setGeneratingReport(true)
    try {
      await generateReport({
        propertyId: propertyId!,
        year: selectedYear,
        month: selectedMonth
      })
    } finally {
      setGeneratingReport(false)
    }
  }
  
  const handleDownload = async (reportId: string) => {
    await downloadPDF(reportId)
  }
  
  const getReportStatusColor = (report: any) => {
    const netIncome = report.net_income || 0
    if (netIncome > 0) return 'text-green-400'
    if (netIncome < 0) return 'text-red-400'
    return 'text-neutral-400'
  }

  const getReportStatusIcon = (report: any) => {
    const netIncome = report.net_income || 0
    if (netIncome > 0) return TrendingUp
    if (netIncome < 0) return TrendingDown
    return DollarSign
  }
  
  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i)
  
  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1)
  }))
  
  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400 mr-2" />
        <span className="text-neutral-400">Loading reports...</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Monthly Reports</h2>
          <p className="text-neutral-400">View and download your property performance reports</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={refreshReports}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {propertyId && (
            <Button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              size="sm"
              className="flex items-center gap-2"
            >
              {generatingReport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Generate Report
            </Button>
          )}
        </div>
      </div>
      
      {/* Generate Report Form */}
      {propertyId && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Generate New Report
            </CardTitle>
            <CardDescription>
              Generate a monthly report for a specific period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {monthOptions.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={handleGenerateReport}
                  disabled={generatingReport}
                  className="w-full"
                >
                  {generatingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Error State */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Reports List */}
      {reports.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Reports Available</h3>
            <p className="text-neutral-400 mb-4">
              {propertyId 
                ? "No monthly reports have been generated for this property yet."
                : "No monthly reports have been generated for your properties yet."
              }
            </p>
            {propertyId && (
              <Button onClick={handleGenerateReport} disabled={generatingReport}>
                <Plus className="h-4 w-4 mr-2" />
                Generate First Report
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reports.map((report) => {
            const netIncome = report.net_income || 0
            const StatusIcon = getReportStatusIcon(report)
            const statusColor = getReportStatusColor(report)
            
            return (
              <Card key={report.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary-400" />
                        {getMonthName(report.month)} {report.year}
                      </CardTitle>
                      {report.property_id && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Home className="h-3 w-3" />
                          Property ID: {report.property_id}
                        </CardDescription>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                      <Badge 
                        className={`${
                          netIncome > 0 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : netIncome < 0
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                        }`}
                      >
                        {netIncome > 0 ? 'Profit' : netIncome < 0 ? 'Loss' : 'Break Even'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-neutral-800 rounded-lg">
                      <div className="text-lg font-bold text-green-400">
                        {report.currency} {((report.total_income || 0) / 100).toLocaleString()}
                      </div>
                      <div className="text-xs text-neutral-400 uppercase tracking-wide">
                        Income
                      </div>
                    </div>

                    <div className="text-center p-3 bg-neutral-800 rounded-lg">
                      <div className="text-lg font-bold text-red-400">
                        {report.currency} {((report.total_expenses || 0) / 100).toLocaleString()}
                      </div>
                      <div className="text-xs text-neutral-400 uppercase tracking-wide">
                        Expenses
                      </div>
                    </div>

                    <div className="text-center p-3 bg-neutral-800 rounded-lg">
                      <div className={`text-lg font-bold ${statusColor}`}>
                        {report.currency} {(netIncome / 100).toLocaleString()}
                      </div>
                      <div className="text-xs text-neutral-400 uppercase tracking-wide">
                        Net Income
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-neutral-800 rounded-lg">
                      <div className="text-lg font-bold text-primary-400 flex items-center justify-center gap-1">
                        {report.occupancy_rate}
                        <Percent className="h-3 w-3" />
                      </div>
                      <div className="text-xs text-neutral-400 uppercase tracking-wide">
                        Occupancy
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => handleDownload(report.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>

                    <Button
                      onClick={() => handleDownload(report.id)}
                      variant="ghost"
                      size="sm"
                      className="flex-1 flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Report
                    </Button>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-neutral-800">
                    <p className="text-xs text-neutral-500">
                      Generated on {format(new Date(report.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
