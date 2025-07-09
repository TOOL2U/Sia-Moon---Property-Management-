import { useState, useEffect } from 'react'
import { MonthlyReport, Property } from '@/lib/db'
import toast from 'react-hot-toast'

export interface UseReportsOptions {
  propertyId?: string
  autoLoad?: boolean
}

export interface ReportGenerationRequest {
  propertyId: string
  year: number
  month: number
  currency?: string
}

export interface UseReportsReturn {
  reports: MonthlyReport[]
  loading: boolean
  error: string | null
  generateReport: (request: ReportGenerationRequest) => Promise<boolean>
  generateAllReports: (year: number, month: number) => Promise<boolean>
  loadReports: (propertyId?: string) => Promise<void>
  downloadPDF: (reportId: string) => Promise<void>
  refreshReports: () => Promise<void>
}

/**
 * Hook for managing monthly property reports
 */
export function useReports(options: UseReportsOptions = {}): UseReportsReturn {
  const { propertyId, autoLoad = true } = options
  
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  /**
   * Load reports for a specific property or all reports
   */
  const loadReports = async (targetPropertyId?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const id = targetPropertyId || propertyId
      
      if (id) {
        // Load reports for specific property
        const response = await fetch(`/api/reports/property/${id}`)
        const data = await response.json()
        
        if (data.success) {
          setReports(data.reports || [])
        } else {
          throw new Error(data.error || 'Failed to load reports')
        }
      } else {
        // Load all reports (admin view)
        const response = await fetch('/api/reports/all')
        const data = await response.json()
        
        if (data.success) {
          setReports(data.reports || [])
        } else {
          throw new Error(data.error || 'Failed to load reports')
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reports'
      setError(errorMessage)
      console.error('Error loading reports:', err)
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Generate a monthly report for a specific property
   */
  const generateReport = async (request: ReportGenerationRequest): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Report generated successfully!')
        
        // Add the new report to the list
        if (data.report) {
          setReports(prev => {
            const filtered = prev.filter(r => 
              !(r.property_id === data.report.property_id && 
                r.year === data.report.year && 
                r.month === data.report.month)
            )
            return [data.report, ...filtered].sort((a, b) => {
              if (a.year !== b.year) return b.year - a.year
              return b.month - a.month
            })
          })
        }
        
        return true
      } else {
        throw new Error(data.error || 'Failed to generate report')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error generating report:', err)
      return false
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Generate reports for all properties
   */
  const generateAllReports = async (year: number, month: number): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/reports/generate-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year, month })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Generated reports for ${data.summary.successful}/${data.summary.total} properties`)
        
        // Refresh reports list
        await loadReports()
        
        return true
      } else {
        throw new Error(data.error || 'Failed to generate reports')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate reports'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error generating all reports:', err)
      return false
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Download PDF for a specific report
   */
  const downloadPDF = async (reportId: string) => {
    try {
      setError(null)
      
      // Get PDF metadata first
      const metadataResponse = await fetch(`/api/reports/pdf/${reportId}`, {
        method: 'POST'
      })
      
      const metadata = await metadataResponse.json()
      
      if (!metadata.success) {
        throw new Error(metadata.error || 'Failed to prepare PDF')
      }
      
      // Download the PDF
      const downloadResponse = await fetch(`/api/reports/pdf/${reportId}`)
      
      if (!downloadResponse.ok) {
        throw new Error('Failed to download PDF')
      }
      
      // Create blob and download
      const blob = await downloadResponse.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = metadata.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('PDF downloaded successfully!')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download PDF'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error downloading PDF:', err)
    }
  }
  
  /**
   * Refresh the reports list
   */
  const refreshReports = async () => {
    await loadReports()
  }
  
  // Auto-load reports on mount
  useEffect(() => {
    if (autoLoad) {
      loadReports()
    }
  }, [propertyId, autoLoad])
  
  return {
    reports,
    loading,
    error,
    generateReport,
    generateAllReports,
    loadReports,
    downloadPDF,
    refreshReports
  }
}
