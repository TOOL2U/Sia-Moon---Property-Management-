/**
 * KPI Dashboard Service
 * Comprehensive analytics and metrics calculation for Back Office dashboard
 */

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore'

export interface TimeFilter {
  type: 'today' | 'week' | 'month' | 'custom'
  startDate?: Date
  endDate?: Date
}

export interface KPIMetrics {
  totalBookings: number
  jobsCompleted: number
  pendingJobs: number
  cancelledJobs: number
  avgCompletionTime: number // minutes
  revenueGenerated: number
  staffEfficiencyScore: number // jobs per day
  bookingTrend: number // percentage change
  completionRate: number // percentage
}

export interface StaffMetric {
  id: string
  name: string
  jobsAssigned: number
  jobsCompleted: number
  avgCompletionTime: number // minutes
  acceptanceRate: number // percentage
  efficiency: number // jobs per day
  status: 'excellent' | 'good' | 'warning' | 'critical'
  lastActive: string
}

export interface PropertyMetric {
  id: string
  name: string
  zone?: string
  totalBookings: number
  revenue: number
  avgJobTime: number // minutes
  completionRate: number // percentage
  rating: number
  status: 'high' | 'medium' | 'low'
}

export interface ChartData {
  date: string
  value: number
  label?: string
}

export interface KPIAnalytics {
  metrics: KPIMetrics
  staffMetrics: StaffMetric[]
  propertyMetrics: PropertyMetric[]
  charts: {
    jobsPerDay: ChartData[]
    revenuePerProperty: ChartData[]
    completionTimeDistribution: ChartData[]
  }
  flags: {
    slowPerformers: string[]
    overdueJobs: string[]
    highPerformers: string[]
  }
}

class KPIDashboardService {
  private readonly BOOKINGS_COLLECTION = 'bookings'
  private readonly CALENDAR_EVENTS_COLLECTION = 'calendarEvents'
  private readonly STAFF_COLLECTION = 'staff_accounts'
  private readonly PROPERTIES_COLLECTION = 'properties'

  /**
   * Get comprehensive KPI analytics
   */
  async getKPIAnalytics(
    timeFilter: TimeFilter,
    filters?: {
      staffId?: string
      propertyId?: string
      jobType?: string
    }
  ): Promise<KPIAnalytics> {
    console.log('📊 Calculating KPI analytics...', { timeFilter, filters })

    try {
      const { startDate, endDate } = this.getDateRange(timeFilter)
      
      // Fetch all required data
      const [bookings, calendarEvents, staff, properties] = await Promise.all([
        this.getBookings(startDate, endDate, filters),
        this.getCalendarEvents(startDate, endDate, filters),
        this.getStaff(),
        this.getProperties()
      ])

      // Calculate metrics
      const metrics = this.calculateKPIMetrics(bookings, calendarEvents)
      const staffMetrics = this.calculateStaffMetrics(calendarEvents, staff)
      const propertyMetrics = this.calculatePropertyMetrics(bookings, calendarEvents, properties)
      const charts = this.generateChartData(bookings, calendarEvents, properties)
      const flags = this.generateKPIFlags(staffMetrics, calendarEvents)

      console.log('✅ KPI analytics calculated successfully')

      return {
        metrics,
        staffMetrics,
        propertyMetrics,
        charts,
        flags
      }

    } catch (error) {
      console.error('❌ Error calculating KPI analytics:', error)
      throw error
    }
  }

  /**
   * Get date range from time filter
   */
  private getDateRange(timeFilter: TimeFilter): { startDate: Date; endDate: Date } {
    const now = new Date()
    const endDate = new Date(now)
    let startDate: Date

    switch (timeFilter.type) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'custom':
        startDate = timeFilter.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        endDate.setTime(timeFilter.endDate?.getTime() || now.getTime())
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    return { startDate, endDate }
  }

  /**
   * Fetch bookings data
   */
  private async getBookings(startDate: Date, endDate: Date, filters?: any): Promise<any[]> {
    try {
      const bookingsRef = collection(db, this.BOOKINGS_COLLECTION)
      let q = query(bookingsRef)

      // Add date filter if available
      if (startDate && endDate) {
        q = query(q, 
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          where('createdAt', '<=', Timestamp.fromDate(endDate))
        )
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    } catch (error) {
      console.error('❌ Error fetching bookings:', error)
      return []
    }
  }

  /**
   * Fetch calendar events (jobs) data
   */
  private async getCalendarEvents(startDate: Date, endDate: Date, filters?: any): Promise<any[]> {
    try {
      const eventsRef = collection(db, this.CALENDAR_EVENTS_COLLECTION)
      let q = query(eventsRef, orderBy('startDate', 'desc'))

      const snapshot = await getDocs(q)
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Filter by date range
      return events.filter(event => {
        const eventDate = new Date(event.startDate)
        return eventDate >= startDate && eventDate <= endDate
      }).filter(event => {
        // Apply additional filters
        if (filters?.staffId && event.staffId !== filters.staffId) return false
        if (filters?.propertyId && event.propertyId !== filters.propertyId) return false
        if (filters?.jobType && event.type !== filters.jobType) return false
        return true
      })

    } catch (error) {
      console.error('❌ Error fetching calendar events:', error)
      return []
    }
  }

  /**
   * Fetch staff data
   */
  private async getStaff(): Promise<any[]> {
    try {
      const staffRef = collection(db, this.STAFF_COLLECTION)
      const snapshot = await getDocs(staffRef)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    } catch (error) {
      console.error('❌ Error fetching staff:', error)
      return []
    }
  }

  /**
   * Fetch properties data
   */
  private async getProperties(): Promise<any[]> {
    try {
      const propertiesRef = collection(db, this.PROPERTIES_COLLECTION)
      const snapshot = await getDocs(propertiesRef)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    } catch (error) {
      console.error('❌ Error fetching properties:', error)
      return []
    }
  }

  /**
   * Calculate main KPI metrics
   */
  private calculateKPIMetrics(bookings: any[], calendarEvents: any[]): KPIMetrics {
    const totalBookings = bookings.length
    const jobsCompleted = calendarEvents.filter(e => e.status === 'completed').length
    const pendingJobs = calendarEvents.filter(e => e.status === 'pending').length
    const cancelledJobs = calendarEvents.filter(e => e.status === 'cancelled').length

    // Calculate average completion time
    const completedJobs = calendarEvents.filter(e => e.status === 'completed' && e.startDate && e.endDate)
    const avgCompletionTime = completedJobs.length > 0 
      ? completedJobs.reduce((sum, job) => {
          const start = new Date(job.startDate)
          const end = new Date(job.endDate)
          return sum + (end.getTime() - start.getTime()) / (1000 * 60) // minutes
        }, 0) / completedJobs.length
      : 0

    // Calculate revenue (mock calculation - would need actual booking amounts)
    const revenueGenerated = bookings.reduce((sum, booking) => {
      return sum + (parseFloat(booking.price?.toString() || '0') || 0)
    }, 0)

    // Calculate staff efficiency (jobs per day)
    const uniqueStaff = new Set(calendarEvents.filter(e => e.staffId).map(e => e.staffId))
    const daysInPeriod = 7 // Adjust based on time filter
    const staffEfficiencyScore = uniqueStaff.size > 0 
      ? jobsCompleted / (uniqueStaff.size * daysInPeriod)
      : 0

    // Calculate completion rate
    const totalJobs = calendarEvents.length
    const completionRate = totalJobs > 0 ? (jobsCompleted / totalJobs) * 100 : 0

    // Calculate booking trend (mock - would need historical data)
    const bookingTrend = 12.5 // Percentage change

    return {
      totalBookings,
      jobsCompleted,
      pendingJobs,
      cancelledJobs,
      avgCompletionTime: Math.round(avgCompletionTime),
      revenueGenerated,
      staffEfficiencyScore: Math.round(staffEfficiencyScore * 100) / 100,
      bookingTrend,
      completionRate: Math.round(completionRate)
    }
  }

  /**
   * Calculate staff metrics
   */
  private calculateStaffMetrics(calendarEvents: any[], staff: any[]): StaffMetric[] {
    return staff.map(staffMember => {
      const staffJobs = calendarEvents.filter(e => e.staffId === staffMember.id)
      const completedJobs = staffJobs.filter(e => e.status === 'completed')
      const assignedJobs = staffJobs.filter(e => e.status !== 'cancelled')

      // Calculate average completion time
      const avgCompletionTime = completedJobs.length > 0
        ? completedJobs.reduce((sum, job) => {
            const start = new Date(job.startDate)
            const end = new Date(job.endDate)
            return sum + (end.getTime() - start.getTime()) / (1000 * 60)
          }, 0) / completedJobs.length
        : 0

      // Calculate acceptance rate (mock - would need actual acceptance data)
      const acceptanceRate = assignedJobs.length > 0 ? 95 : 0

      // Calculate efficiency (jobs per day)
      const efficiency = completedJobs.length / 7 // Jobs per day over week

      // Determine status
      let status: 'excellent' | 'good' | 'warning' | 'critical' = 'good'
      if (efficiency >= 3) status = 'excellent'
      else if (efficiency >= 2) status = 'good'
      else if (efficiency >= 1) status = 'warning'
      else status = 'critical'

      return {
        id: staffMember.id,
        name: staffMember.name || 'Unknown Staff',
        jobsAssigned: assignedJobs.length,
        jobsCompleted: completedJobs.length,
        avgCompletionTime: Math.round(avgCompletionTime),
        acceptanceRate: Math.round(acceptanceRate),
        efficiency: Math.round(efficiency * 100) / 100,
        status,
        lastActive: staffMember.lastSeen || new Date().toISOString()
      }
    })
  }

  /**
   * Calculate property metrics
   */
  private calculatePropertyMetrics(bookings: any[], calendarEvents: any[], properties: any[]): PropertyMetric[] {
    return properties.map(property => {
      const propertyBookings = bookings.filter(b => b.propertyId === property.id || b.property === property.name)
      const propertyJobs = calendarEvents.filter(e => e.propertyId === property.id)
      const completedJobs = propertyJobs.filter(e => e.status === 'completed')

      // Calculate revenue
      const revenue = propertyBookings.reduce((sum, booking) => {
        return sum + (parseFloat(booking.price?.toString() || '0') || 0)
      }, 0)

      // Calculate average job time
      const avgJobTime = completedJobs.length > 0
        ? completedJobs.reduce((sum, job) => {
            const start = new Date(job.startDate)
            const end = new Date(job.endDate)
            return sum + (end.getTime() - start.getTime()) / (1000 * 60)
          }, 0) / completedJobs.length
        : 0

      // Calculate completion rate
      const completionRate = propertyJobs.length > 0 
        ? (completedJobs.length / propertyJobs.length) * 100 
        : 0

      // Determine status
      let status: 'high' | 'medium' | 'low' = 'medium'
      if (revenue > 10000 && completionRate > 90) status = 'high'
      else if (revenue < 2000 || completionRate < 70) status = 'low'

      return {
        id: property.id,
        name: property.name || 'Unknown Property',
        zone: property.zone,
        totalBookings: propertyBookings.length,
        revenue,
        avgJobTime: Math.round(avgJobTime),
        completionRate: Math.round(completionRate),
        rating: property.rating || 4.0,
        status
      }
    })
  }

  /**
   * Generate chart data
   */
  private generateChartData(bookings: any[], calendarEvents: any[], properties: any[]): {
    jobsPerDay: ChartData[]
    revenuePerProperty: ChartData[]
    completionTimeDistribution: ChartData[]
  } {
    // Jobs per day chart
    const jobsPerDay = this.generateJobsPerDayChart(calendarEvents)
    
    // Revenue per property chart
    const revenuePerProperty = this.generateRevenuePerPropertyChart(bookings, properties)
    
    // Completion time distribution
    const completionTimeDistribution = this.generateCompletionTimeChart(calendarEvents)

    return {
      jobsPerDay,
      revenuePerProperty,
      completionTimeDistribution
    }
  }

  /**
   * Generate jobs per day chart data
   */
  private generateJobsPerDayChart(calendarEvents: any[]): ChartData[] {
    const dailyJobs = new Map<string, number>()
    
    calendarEvents.forEach(event => {
      const date = new Date(event.startDate).toISOString().split('T')[0]
      dailyJobs.set(date, (dailyJobs.get(date) || 0) + 1)
    })

    return Array.from(dailyJobs.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        value,
        label: new Date(date).toLocaleDateString()
      }))
  }

  /**
   * Generate revenue per property chart data
   */
  private generateRevenuePerPropertyChart(bookings: any[], properties: any[]): ChartData[] {
    const propertyRevenue = new Map<string, number>()
    
    bookings.forEach(booking => {
      const propertyName = booking.propertyName || booking.property || 'Unknown'
      const revenue = parseFloat(booking.price?.toString() || '0') || 0
      propertyRevenue.set(propertyName, (propertyRevenue.get(propertyName) || 0) + revenue)
    })

    return Array.from(propertyRevenue.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 properties
      .map(([property, value]) => ({
        date: property,
        value,
        label: property
      }))
  }

  /**
   * Generate completion time distribution chart
   */
  private generateCompletionTimeChart(calendarEvents: any[]): ChartData[] {
    const completedJobs = calendarEvents.filter(e => e.status === 'completed' && e.startDate && e.endDate)
    const timeBuckets = new Map<string, number>()

    completedJobs.forEach(job => {
      const start = new Date(job.startDate)
      const end = new Date(job.endDate)
      const duration = (end.getTime() - start.getTime()) / (1000 * 60) // minutes

      let bucket: string
      if (duration <= 60) bucket = '0-1h'
      else if (duration <= 120) bucket = '1-2h'
      else if (duration <= 240) bucket = '2-4h'
      else if (duration <= 480) bucket = '4-8h'
      else bucket = '8h+'

      timeBuckets.set(bucket, (timeBuckets.get(bucket) || 0) + 1)
    })

    const bucketOrder = ['0-1h', '1-2h', '2-4h', '4-8h', '8h+']
    return bucketOrder.map(bucket => ({
      date: bucket,
      value: timeBuckets.get(bucket) || 0,
      label: bucket
    }))
  }

  /**
   * Generate KPI flags for alerts
   */
  private generateKPIFlags(staffMetrics: StaffMetric[], calendarEvents: any[]): {
    slowPerformers: string[]
    overdueJobs: string[]
    highPerformers: string[]
  } {
    const slowPerformers = staffMetrics
      .filter(staff => staff.status === 'critical' || staff.efficiency < 1)
      .map(staff => staff.name)

    const overdueJobs = calendarEvents
      .filter(event => {
        if (event.status !== 'pending') return false
        const eventDate = new Date(event.startDate)
        return eventDate < new Date()
      })
      .map(event => event.title)

    const highPerformers = staffMetrics
      .filter(staff => staff.status === 'excellent' && staff.efficiency >= 3)
      .map(staff => staff.name)

    return {
      slowPerformers,
      overdueJobs,
      highPerformers
    }
  }

  /**
   * Format currency value
   */
  formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value)
  }

  /**
   * Format duration in minutes to human readable
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)}m`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  /**
   * Get status color for metrics
   */
  getStatusColor(status: string): string {
    const colors = {
      excellent: 'text-green-400',
      good: 'text-blue-400',
      warning: 'text-yellow-400',
      critical: 'text-red-400',
      high: 'text-green-400',
      medium: 'text-blue-400',
      low: 'text-red-400'
    }
    return colors[status as keyof typeof colors] || 'text-gray-400'
  }
}

// Export singleton instance
export default new KPIDashboardService()
