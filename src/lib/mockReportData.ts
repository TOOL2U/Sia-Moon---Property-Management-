import { ReportEntry, ReportMetrics, ChartDataPoint, ReportFilters, DateRange } from '@/types'

/**
 * Mock Data Generator for Reports
 * 
 * Generates realistic mock data for testing and development of the Reports page.
 * This file provides functions to create sample report entries, metrics, and chart data.
 * 
 * In production, these functions would be replaced with actual API calls to
 * Firebase/Supabase or other backend services.
 */

// Sample property names for mock data
const SAMPLE_PROPERTIES = [
  'Sunset Villa Bali',
  'Ocean View Retreat',
  'Mountain View Lodge',
  'Beachfront Paradise',
  'City Center Apartment',
  'Tropical Garden Villa',
  'Modern Loft Downtown',
  'Seaside Cottage'
]

// Sample guest names
const SAMPLE_GUESTS = [
  'Sarah Johnson',
  'Mike Chen',
  'Emma Wilson',
  'David Brown',
  'Lisa Garcia',
  'James Miller',
  'Anna Rodriguez',
  'Tom Anderson',
  'Maria Lopez',
  'Chris Taylor'
]

// Sample staff names
const SAMPLE_STAFF = [
  'Alex Thompson',
  'Jordan Smith',
  'Casey Williams',
  'Morgan Davis',
  'Riley Johnson',
  'Avery Brown'
]

/**
 * Generate random date within a range
 */
function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

/**
 * Get random item from array
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Generate mock report entries based on filters
 */
export function generateMockReportData(filters: ReportFilters): ReportEntry[] {
  const entries: ReportEntry[] = []
  const startDate = filters.dateRange.from || new Date(2024, 0, 1)
  const endDate = filters.dateRange.to || new Date()
  
  // Generate 50-100 random entries
  const entryCount = Math.floor(Math.random() * 50) + 50
  
  for (let i = 0; i < entryCount; i++) {
    const type = getRandomItem(['booking', 'maintenance', 'payment', 'expense'] as const)
    const status = getRandomItem(['completed', 'pending', 'cancelled'] as const)
    const property = getRandomItem(SAMPLE_PROPERTIES)
    const date = getRandomDate(startDate, endDate)
    
    // Generate type-specific data
    let description = ''
    let amount: number | undefined
    let guestName: string | undefined
    let staffName: string | undefined
    
    switch (type) {
      case 'booking':
        description = `Booking confirmation for ${Math.floor(Math.random() * 7) + 1} nights`
        amount = Math.floor(Math.random() * 2000) + 200
        guestName = getRandomItem(SAMPLE_GUESTS)
        break
        
      case 'maintenance':
        const maintenanceTasks = [
          'Pool cleaning and chemical balancing',
          'Air conditioning service',
          'Garden maintenance and landscaping',
          'Plumbing repair - kitchen sink',
          'Electrical work - lighting fixtures',
          'Deep cleaning after checkout',
          'Appliance maintenance - washing machine',
          'Roof inspection and minor repairs'
        ]
        description = getRandomItem(maintenanceTasks)
        amount = Math.floor(Math.random() * 500) + 50
        staffName = getRandomItem(SAMPLE_STAFF)
        break
        
      case 'payment':
        description = `Payment received for booking #${Math.floor(Math.random() * 10000) + 1000}`
        amount = Math.floor(Math.random() * 3000) + 300
        guestName = getRandomItem(SAMPLE_GUESTS)
        break
        
      case 'expense':
        const expenseTypes = [
          'Utility bills - electricity',
          'Internet and cable services',
          'Property insurance premium',
          'Cleaning supplies purchase',
          'Marketing and advertising',
          'Property management fees',
          'Maintenance supplies',
          'Guest amenities restocking'
        ]
        description = getRandomItem(expenseTypes)
        amount = Math.floor(Math.random() * 800) + 100
        break
    }
    
    entries.push({
      id: `entry-${i + 1}`,
      date: date.toISOString().split('T')[0],
      type,
      property_id: `prop-${SAMPLE_PROPERTIES.indexOf(property) + 1}`,
      property_name: property,
      status,
      amount,
      currency: 'USD',
      description,
      guest_name: guestName,
      staff_name: staffName,
      created_at: date.toISOString()
    })
  }
  
  // Sort by date (newest first)
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Generate mock metrics data
 */
export function generateMockMetrics(): ReportMetrics {
  return {
    totalProperties: Math.floor(Math.random() * 20) + 8, // 8-28 properties
    activeBookings: Math.floor(Math.random() * 50) + 15, // 15-65 bookings
    completedMaintenance: Math.floor(Math.random() * 30) + 10, // 10-40 tasks
    monthlyRevenue: Math.floor(Math.random() * 50000) + 25000, // $25k-$75k
    occupancyRate: Math.floor(Math.random() * 30) + 65 // 65-95%
  }
}

/**
 * Generate mock chart data for the specified date range
 */
export function generateMockChartData(dateRange: DateRange): ChartDataPoint[] {
  const startDate = dateRange.from || new Date(2024, 0, 1)
  const endDate = dateRange.to || new Date()
  const data: ChartDataPoint[] = []
  
  // Generate daily data points
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    // Generate realistic patterns with some randomness
    const dayOfWeek = currentDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Bookings tend to be higher on weekends
    const baseBookings = isWeekend ? 8 : 5
    const bookings = Math.max(0, baseBookings + Math.floor(Math.random() * 10) - 3)
    
    // Maintenance is typically lower on weekends
    const baseMaintenance = isWeekend ? 2 : 5
    const maintenance = Math.max(0, baseMaintenance + Math.floor(Math.random() * 6) - 2)
    
    // Revenue correlates with bookings
    const baseRevenue = bookings * 150
    const revenue = Math.max(0, baseRevenue + Math.floor(Math.random() * 1000) - 300)
    
    // Expenses are relatively stable with some variation
    const baseExpenses = 200
    const expenses = Math.max(0, baseExpenses + Math.floor(Math.random() * 400) - 150)
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      bookings,
      maintenance,
      revenue,
      expenses
    })
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return data
}

/**
 * Generate mock data for a specific time period (for testing)
 */
export function generateMockDataForPeriod(
  startDate: Date,
  endDate: Date,
  entryCount: number = 100
): {
  entries: ReportEntry[]
  metrics: ReportMetrics
  chartData: ChartDataPoint[]
} {
  const filters: ReportFilters = {
    dateRange: { from: startDate, to: endDate },
    reportType: 'all',
    status: 'all',
    searchQuery: ''
  }
  
  return {
    entries: generateMockReportData(filters).slice(0, entryCount),
    metrics: generateMockMetrics(),
    chartData: generateMockChartData({ from: startDate, to: endDate })
  }
}
