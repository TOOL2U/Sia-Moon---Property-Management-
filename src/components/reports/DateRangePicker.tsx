import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DateRange } from '@/types'

interface DateRangePickerProps {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
  className?: string
}

/**
 * DateRangePicker Component
 * 
 * A custom date range picker component with a clean, modern interface.
 * Allows users to select start and end dates for filtering reports.
 * 
 * Features:
 * - Clean dropdown interface with calendar icon
 * - Month/year navigation
 * - Range selection with visual feedback
 * - Preset quick selections (This Month, Last Month, etc.)
 * - Responsive design
 * - Keyboard navigation support
 */
export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className = ''
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /**
   * Format date range for display
   */
  const formatDateRange = (): string => {
    if (!dateRange.from && !dateRange.to) {
      return 'Select date range'
    }
    
    const formatDate = (date: Date | null) => {
      return date ? date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : ''
    }

    if (dateRange.from && dateRange.to) {
      return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
    } else if (dateRange.from) {
      return `From ${formatDate(dateRange.from)}`
    } else if (dateRange.to) {
      return `Until ${formatDate(dateRange.to)}`
    }

    return 'Select date range'
  }

  /**
   * Handle date selection
   */
  const handleDateSelect = (date: Date) => {
    if (selectingStart) {
      onDateRangeChange({ from: date, to: dateRange.to })
      setSelectingStart(false)
    } else {
      // Ensure end date is after start date
      if (dateRange.from && date < dateRange.from) {
        onDateRangeChange({ from: date, to: dateRange.from })
      } else {
        onDateRangeChange({ from: dateRange.from, to: date })
      }
      setSelectingStart(true)
      setIsOpen(false)
    }
  }

  /**
   * Handle preset selections
   */
  const handlePresetSelect = (preset: string) => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    switch (preset) {
      case 'thisMonth':
        onDateRangeChange({
          from: new Date(currentYear, currentMonth, 1),
          to: today
        })
        break
      case 'lastMonth':
        onDateRangeChange({
          from: new Date(currentYear, currentMonth - 1, 1),
          to: new Date(currentYear, currentMonth, 0)
        })
        break
      case 'last3Months':
        onDateRangeChange({
          from: new Date(currentYear, currentMonth - 3, 1),
          to: today
        })
        break
      case 'thisYear':
        onDateRangeChange({
          from: new Date(currentYear, 0, 1),
          to: today
        })
        break
    }
    setIsOpen(false)
  }

  /**
   * Navigate months
   */
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1)
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1)
      }
      return newMonth
    })
  }

  /**
   * Generate calendar days
   */
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  /**
   * Check if date is in range
   */
  const isDateInRange = (date: Date): boolean => {
    if (!dateRange.from || !dateRange.to) return false
    return date >= dateRange.from && date <= dateRange.to
  }

  /**
   * Check if date is selected (start or end)
   */
  const isDateSelected = (date: Date): boolean => {
    return Boolean((dateRange.from && date.toDateString() === dateRange.from.toDateString()) ||
           (dateRange.to && date.toDateString() === dateRange.to.toDateString()))
  }

  const calendarDays = generateCalendarDays()

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start text-left font-normal"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {formatDateRange()}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {/* Presets */}
            <div className="mb-4">
              <p className="text-sm font-medium text-neutral-300 mb-2">Quick Select</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect('thisMonth')}
                  className="text-xs"
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect('lastMonth')}
                  className="text-xs"
                >
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect('last3Months')}
                  className="text-xs"
                >
                  Last 3 Months
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect('thisYear')}
                  className="text-xs"
                >
                  This Year
                </Button>
              </div>
            </div>

            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-sm font-medium text-white">
                {currentMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs text-neutral-400 text-center p-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                const isToday = date.toDateString() === new Date().toDateString()
                const isSelected = isDateSelected(date)
                const isInRange = isDateInRange(date)

                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    className={`
                      p-2 text-xs rounded hover:bg-neutral-700 transition-colors
                      ${!isCurrentMonth ? 'text-neutral-600' : 'text-neutral-300'}
                      ${isToday ? 'bg-neutral-700 text-white' : ''}
                      ${isSelected ? 'bg-primary-600 text-white' : ''}
                      ${isInRange && !isSelected ? 'bg-primary-600/20' : ''}
                    `}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>

            {/* Instructions */}
            <div className="mt-4 text-xs text-neutral-400 text-center">
              {selectingStart ? 'Select start date' : 'Select end date'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
