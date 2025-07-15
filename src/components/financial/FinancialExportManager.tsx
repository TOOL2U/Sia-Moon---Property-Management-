'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  Filter,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Mail,
  Share2,
  Archive
} from 'lucide-react'
import { FinancialDashboard, FinancialReport } from '@/types/financial'
import toast from 'react-hot-toast'

interface FinancialExportManagerProps {
  financialData: FinancialDashboard
  loading?: boolean
}

export default function FinancialExportManager({ financialData, loading }: FinancialExportManagerProps) {
  const [selectedReports, setSelectedReports] = useState<string[]>(['revenue', 'expenses'])
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [exportStatus, setExportStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle')
  const [generatedReports, setGeneratedReports] = useState<FinancialReport[]>([])

  const reportTypes = [
    {
      id: 'revenue',
      name: 'Revenue Analytics',
      description: 'Comprehensive revenue breakdown and analysis',
      icon: FileText,
      size: '2.3 MB'
    },
    {
      id: 'expenses',
      name: 'Expense Analysis',
      description: 'Detailed expense tracking and categorization',
      icon: FileSpreadsheet,
      size: '1.8 MB'
    },
    {
      id: 'profit_loss',
      name: 'Profit & Loss Statement',
      description: 'Complete P&L with margins and ratios',
      icon: FileText,
      size: '1.2 MB'
    },
    {
      id: 'cash_flow',
      name: 'Cash Flow Report',
      description: 'Cash flow analysis and projections',
      icon: FileSpreadsheet,
      size: '1.5 MB'
    },
    {
      id: 'kpi_summary',
      name: 'KPI Dashboard',
      description: 'Key performance indicators summary',
      icon: FileText,
      size: '0.9 MB'
    },
    {
      id: 'tax_report',
      name: 'Tax Report',
      description: 'Tax calculations and documentation',
      icon: FileSpreadsheet,
      size: '1.1 MB'
    }
  ]

  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF Document',
      description: 'Professional formatted reports',
      icon: FileText,
      color: 'text-red-400'
    },
    {
      value: 'excel',
      label: 'Excel Spreadsheet',
      description: 'Editable data with formulas',
      icon: FileSpreadsheet,
      color: 'text-green-400'
    },
    {
      value: 'csv',
      label: 'CSV Data',
      description: 'Raw data for analysis',
      icon: Archive,
      color: 'text-blue-400'
    }
  ]

  const handleReportToggle = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    )
  }

  const generateReports = async () => {
    setExportStatus('generating')
    
    try {
      // Simulate report generation
      const reports: FinancialReport[] = []
      
      for (const reportType of selectedReports) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing time
        
        const report: FinancialReport = {
          id: `report-${Date.now()}-${reportType}`,
          type: reportType as any,
          title: reportTypes.find(r => r.id === reportType)?.name || 'Financial Report',
          period: dateRange,
          data: getReportData(reportType),
          generatedAt: new Date().toISOString(),
          generatedBy: 'admin',
          format: exportFormat,
          status: 'ready'
        }
        
        reports.push(report)
      }
      
      setGeneratedReports(reports)
      setExportStatus('ready')
      toast.success(`${reports.length} reports generated successfully!`)
      
    } catch (error) {
      setExportStatus('error')
      toast.error('Failed to generate reports')
    }
  }

  const getReportData = (reportType: string) => {
    switch (reportType) {
      case 'revenue':
        return financialData.revenue
      case 'expenses':
        return financialData.expenses
      case 'profit_loss':
        return financialData.profitLoss
      case 'cash_flow':
        return financialData.cashFlow
      case 'kpi_summary':
        return financialData.kpis
      default:
        return {}
    }
  }

  const downloadReport = (report: FinancialReport) => {
    // Simulate file download
    const blob = new Blob([JSON.stringify(report.data, null, 2)], { 
      type: exportFormat === 'pdf' ? 'application/pdf' : 
           exportFormat === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
           'text/csv'
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${exportFormat}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success(`${report.title} downloaded successfully!`)
  }

  const downloadAllReports = () => {
    generatedReports.forEach((report, index) => {
      setTimeout(() => downloadReport(report), index * 500) // Stagger downloads
    })
  }

  const shareReports = () => {
    // Simulate sharing functionality
    toast.success('Reports shared successfully!')
  }

  const scheduleReports = () => {
    // Simulate scheduling functionality
    toast.success('Report scheduling configured!')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-neutral-900 border-neutral-800 animate-pulse">
          <CardHeader>
            <div className="h-4 bg-neutral-700 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-neutral-700 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Export Configuration */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5" />
            Financial Report Export Manager
          </CardTitle>
          <CardDescription>Generate and export comprehensive financial reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Selection */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Report Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Start Date</label>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">End Date</label>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Export Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formatOptions.map((format) => (
                <div
                  key={format.value}
                  onClick={() => setExportFormat(format.value as any)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    exportFormat === format.value
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <format.icon className={`h-6 w-6 ${format.color}`} />
                    <div>
                      <h4 className="text-white font-medium">{format.label}</h4>
                      <p className="text-sm text-neutral-400">{format.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Selection */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Select Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((report) => (
                <div
                  key={report.id}
                  onClick={() => handleReportToggle(report.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedReports.includes(report.id)
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <report.icon className={`h-5 w-5 ${
                      selectedReports.includes(report.id) ? 'text-green-400' : 'text-neutral-400'
                    }`} />
                    {selectedReports.includes(report.id) && (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    )}
                  </div>
                  <h4 className="text-white font-medium mb-1">{report.name}</h4>
                  <p className="text-sm text-neutral-400 mb-2">{report.description}</p>
                  <Badge className="bg-neutral-700 text-neutral-300 text-xs">
                    ~{report.size}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-neutral-800">
            <Button
              onClick={generateReports}
              disabled={selectedReports.length === 0 || exportStatus === 'generating'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {exportStatus === 'generating' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Reports ({selectedReports.length})
                </>
              )}
            </Button>
            
            <Button
              onClick={scheduleReports}
              variant="outline"
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            
            <Button
              onClick={shareReports}
              variant="outline"
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      {generatedReports.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Generated Reports
                </CardTitle>
                <CardDescription>
                  {generatedReports.length} reports ready for download
                </CardDescription>
              </div>
              <Button
                onClick={downloadAllReports}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <h4 className="text-white font-medium">{report.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-neutral-400">
                        <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
                        <span>Format: {report.format.toUpperCase()}</span>
                        <Badge className={`${
                          report.status === 'ready' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          report.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {report.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => downloadReport(report)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={shareReports}
                      size="sm"
                      variant="outline"
                      className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Status */}
      {exportStatus !== 'idle' && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {exportStatus === 'generating' && <Loader2 className="h-5 w-5 animate-spin text-blue-400" />}
              {exportStatus === 'ready' && <CheckCircle className="h-5 w-5 text-green-400" />}
              {exportStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
              Export Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exportStatus === 'generating' && (
                <div className="flex items-center gap-3">
                  <div className="w-full bg-neutral-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                  <span className="text-sm text-neutral-400">Processing...</span>
                </div>
              )}
              
              {exportStatus === 'ready' && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">All reports generated successfully!</span>
                </div>
              )}
              
              {exportStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Failed to generate reports. Please try again.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
