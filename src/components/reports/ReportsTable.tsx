import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Calendar,
  Building2,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ReportEntry } from '@/types'

interface ReportsTableProps {
  data: ReportEntry[]
  loading: boolean
  onRefresh: () => void
  className?: string
}

type SortField = 'date' | 'type' | 'property_name' | 'status' | 'amount'
type SortDirection = 'asc' | 'desc'

/**
 * ReportsTable Component
 * 
 * A comprehensive table component for displaying report entries with advanced features.
 * Includes pagination, sorting, status badges, and responsive design.
 * 
 * Features:
 * - Sortable columns with visual indicators
 * - Pagination with configurable page sizes
 * - Status badges with color coding
 * - Responsive design that adapts to mobile
 * - Loading states and refresh functionality
 * - Formatted currency and date displays
 * - Hover effects and smooth transitions
 */
export function ReportsTable({
  data,
  loading,
  onRefresh,
  className = ''
}: ReportsTableProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  /**
   * Handle column sorting
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  /**
   * Sort and paginate data
   */
  const sortedAndPaginatedData = useMemo(() => {
    // Sort data
    const sorted = [...data].sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle date sorting
      if (sortField === 'date') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      // Handle numeric sorting
      if (sortField === 'amount') {
        aValue = aValue || 0
        bValue = bValue || 0
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    // Paginate
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    
    return {
      data: sorted.slice(startIndex, endIndex),
      totalPages: Math.ceil(sorted.length / pageSize),
      totalItems: sorted.length
    }
  }, [data, sortField, sortDirection, currentPage, pageSize])

  /**
   * Get status badge variant
   */
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'default'
    }
  }

  /**
   * Get report type icon
   */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return Calendar
      case 'maintenance':
        return Building2
      case 'payment':
      case 'expense':
        return DollarSign
      default:
        return Calendar
    }
  }

  /**
   * Format currency value
   */
  const formatCurrency = (amount: number | undefined, currency: string = 'USD'): string => {
    if (amount === undefined || amount === null) return '-'
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  /**
   * Render sort icon
   */
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-neutral-500" />
    }
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary-400" />
      : <ArrowDown className="h-4 w-4 text-primary-400" />
  }

  /**
   * Render table header
   */
  const renderTableHeader = () => (
    <thead className="bg-neutral-800">
      <tr>
        <th className="px-6 py-3 text-left">
          <button
            onClick={() => handleSort('date')}
            className="flex items-center gap-2 text-xs font-medium text-neutral-300 uppercase tracking-wider hover:text-white transition-colors"
          >
            Date
            {renderSortIcon('date')}
          </button>
        </th>
        <th className="px-6 py-3 text-left">
          <button
            onClick={() => handleSort('type')}
            className="flex items-center gap-2 text-xs font-medium text-neutral-300 uppercase tracking-wider hover:text-white transition-colors"
          >
            Type
            {renderSortIcon('type')}
          </button>
        </th>
        <th className="px-6 py-3 text-left">
          <button
            onClick={() => handleSort('property_name')}
            className="flex items-center gap-2 text-xs font-medium text-neutral-300 uppercase tracking-wider hover:text-white transition-colors"
          >
            Property
            {renderSortIcon('property_name')}
          </button>
        </th>
        <th className="px-6 py-3 text-left">
          <button
            onClick={() => handleSort('status')}
            className="flex items-center gap-2 text-xs font-medium text-neutral-300 uppercase tracking-wider hover:text-white transition-colors"
          >
            Status
            {renderSortIcon('status')}
          </button>
        </th>
        <th className="px-6 py-3 text-left">
          <button
            onClick={() => handleSort('amount')}
            className="flex items-center gap-2 text-xs font-medium text-neutral-300 uppercase tracking-wider hover:text-white transition-colors"
          >
            Amount
            {renderSortIcon('amount')}
          </button>
        </th>
        <th className="px-6 py-3 text-left">
          <span className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
            Details
          </span>
        </th>
      </tr>
    </thead>
  )

  /**
   * Render table row
   */
  const renderTableRow = (entry: ReportEntry) => {
    const TypeIcon = getTypeIcon(entry.type)
    
    return (
      <tr 
        key={entry.id}
        className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-white">
            {formatDate(entry.date)}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-neutral-400" />
            <span className="text-sm text-white capitalize">
              {entry.type}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-white">
            {entry.property_name}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Badge variant={getStatusVariant(entry.status)}>
            {entry.status}
          </Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-white">
            {formatCurrency(entry.amount, entry.currency)}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-neutral-300 max-w-xs truncate">
            {entry.description}
          </div>
          {entry.guest_name && (
            <div className="text-xs text-neutral-500 mt-1">
              Guest: {entry.guest_name}
            </div>
          )}
          {entry.staff_name && (
            <div className="text-xs text-neutral-500 mt-1">
              Staff: {entry.staff_name}
            </div>
          )}
        </td>
      </tr>
    )
  }

  return (
    <Card className={`bg-neutral-900 border-neutral-800 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-white">
          Report Entries
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-800">
            {renderTableHeader()}
            <tbody className="bg-neutral-900 divide-y divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-neutral-400 mr-2" />
                      <span className="text-neutral-400">Loading reports...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedAndPaginatedData.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-neutral-400">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-neutral-600" />
                      <p className="text-lg font-medium mb-2">No reports found</p>
                      <p className="text-sm">Try adjusting your filters or date range</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedAndPaginatedData.data.map(renderTableRow)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && sortedAndPaginatedData.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-400">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedAndPaginatedData.totalItems)} of {sortedAndPaginatedData.totalItems} entries
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <span className="text-sm text-neutral-400">
                  Page {currentPage} of {sortedAndPaginatedData.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(sortedAndPaginatedData.totalPages, prev + 1))}
                  disabled={currentPage === sortedAndPaginatedData.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
