import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import SupabaseService from '@/lib/supabaseService'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export interface SupabaseReport {
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
  notes: string | null
  pdf_url: string | null
  created_at: string
  updated_at: string
  property?: {
    id: string
    name: string
  }
}

export interface UseSupabaseReportsOptions {
  propertyId?: string
  autoLoad?: boolean
}

export interface UseSupabaseReportsReturn {
  reports: SupabaseReport[]
  loading: boolean
  error: string | null
  loadReports: () => Promise<void>
  generateReport: (propertyId: string, month: number, year: number) => Promise<boolean>
  downloadReport: (reportId: string) => Promise<void>
  refreshReports: () => Promise<void>
}

export function useSupabaseReports(options: UseSupabaseReportsOptions = {}): UseSupabaseReportsReturn {
  const { propertyId, autoLoad = true } = options
  const { profile: user } = useAuth()
  const [reports, setReports] = useState<SupabaseReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loadReports = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      let reportsResult

      // Filter by property if specified
      if (propertyId) {
        reportsResult = await SupabaseService.getReportsByProperty(propertyId)
      } else {
        // For property owners, only show their properties
        if (user.role !== 'staff') {
          // Get user's properties first
          const propertiesResult = await SupabaseService.getPropertiesByOwner(user.id)

          if (!propertiesResult.success || !propertiesResult.data?.length) {
            setReports([])
            return
          }

          // Get reports for all user properties
          const allReportsPromises = propertiesResult.data.map(property =>
            SupabaseService.getReportsByProperty(property.id)
          )

          const allReportsResults = await Promise.all(allReportsPromises)
          const allReports = allReportsResults.reduce((acc, result) => {
            if (result.success && result.data) {
              acc.push(...result.data)
            }
            return acc
          }, [] as any[])

          // Add property information
          const reportsWithProperties = allReports.map(report => {
            const property = propertiesResult.data?.find(p => p.id === report.property_id)
            return {
              ...report,
              property: property ? {
                id: property.id,
                name: property.name
              } : undefined
            }
          })

          // Sort by year and month (newest first)
          reportsWithProperties.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year
            return b.month - a.month
          })

          setReports(reportsWithProperties)
          return
        } else {
          // Staff can see all reports
          reportsResult = await SupabaseService.getAllReports()
        }
      }

      if (!reportsResult.success) {
        throw new Error(reportsResult.error || 'Failed to load reports')
      }

      setReports(reportsResult.data || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reports'
      setError(errorMessage)
      console.error('Error loading reports:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const generateReport = async (propertyId: string, month: number, year: number): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      // Call the Supabase Edge Function to generate the report
      const { data, error } = await supabase.functions.invoke('generate-monthly-reports', {
        body: {
          propertyId,
          month,
          year,
          single: true
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data?.success) {
        toast.success('Report generated successfully!')
        await loadReports() // Refresh the reports list
        return true
      } else {
        throw new Error(data?.error || 'Failed to generate report')
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
  
  const downloadReport = async (reportId: string) => {
    try {
      const report = reports.find(r => r.id === reportId)
      if (!report) {
        throw new Error('Report not found')
      }

      if (report.pdf_url) {
        // Create a temporary link to download the PDF
        const link = document.createElement('a')
        link.href = report.pdf_url
        link.download = `${report.property?.name || 'Property'}_Report_${report.year}_${report.month.toString().padStart(2, '0')}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success('Report download started')
      } else {
        throw new Error('PDF not available for this report')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download report'
      toast.error(errorMessage)
      console.error('Error downloading report:', err)
    }
  }
  
  const refreshReports = async () => {
    await loadReports()
  }
  
  // Auto-load reports on mount and when dependencies change
  useEffect(() => {
    if (autoLoad && user) {
      loadReports()
    }
  }, [autoLoad, user, propertyId])
  
  return {
    reports,
    loading,
    error,
    loadReports,
    generateReport,
    downloadReport,
    refreshReports
  }
}

// Helper function to format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Helper function to get month name
export function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return monthNames[month - 1] || 'Unknown'
}

// Helper function to calculate net income
export function calculateNetIncome(income: number, expenses: number): number {
  return income - expenses
}
