'use client'

import { useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { systemHealthService, SystemHealthSummary } from '@/services/SystemHealthService'

export interface VitalMetric {
  id: string
  label: string
  value: string
  target?: string
  status: 'healthy' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  icon: string
  tooltip: string
}

export interface VitalSignsData {
  metrics: VitalMetric[]
  systemHealth: SystemHealthSummary | null
  lastUpdated: Date
  loading: boolean
  error: string | null
}

export function useVitalSigns() {
  const [vitalSigns, setVitalSigns] = useState<VitalSignsData>({
    metrics: [],
    systemHealth: null,
    lastUpdated: new Date(),
    loading: true,
    error: null
  })

  useEffect(() => {
    const db = getDb()
    if (!db) {
      setVitalSigns(prev => ({
        ...prev,
        error: 'Firebase not initialized',
        loading: false
      }))
      return
    }

    console.log('📊 Setting up vital signs monitoring...')

    // Set up real-time listeners for different data sources
    const unsubscribers: (() => void)[] = []

    // Staff monitoring
    const staffQuery = query(collection(db, 'staff_accounts'))
    const staffUnsubscribe = onSnapshot(staffQuery, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      updateStaffMetrics(staffData)
    })
    unsubscribers.push(staffUnsubscribe)

    // Staff locations monitoring
    const locationsQuery = query(
      collection(db, 'staff_locations'),
      orderBy('timestamp', 'desc'),
      limit(50)
    )
    const locationsUnsubscribe = onSnapshot(locationsQuery, (snapshot) => {
      const locationData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      updateLocationMetrics(locationData)
    })
    unsubscribers.push(locationsUnsubscribe)

    // Jobs monitoring
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const jobsQuery = query(
      collection(db, 'jobs'),
      where('scheduledDate', '>=', Timestamp.fromDate(startOfDay)),
      where('scheduledDate', '<', Timestamp.fromDate(endOfDay))
    )
    const jobsUnsubscribe = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      updateJobMetrics(jobsData)
    })
    unsubscribers.push(jobsUnsubscribe)

    // Properties monitoring
    const propertiesQuery = query(collection(db, 'properties'))
    const propertiesUnsubscribe = onSnapshot(propertiesQuery, (snapshot) => {
      const propertiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      updatePropertyMetrics(propertiesData)
    })
    unsubscribers.push(propertiesUnsubscribe)

    // Bookings monitoring for revenue
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('check_in', '>=', startOfDay.toISOString().split('T')[0]),
      where('check_in', '<', endOfDay.toISOString().split('T')[0])
    )
    const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      updateRevenueMetrics(bookingsData)
    })
    unsubscribers.push(bookingsUnsubscribe)

    // System health monitoring
    const checkSystemHealth = async () => {
      try {
        const health = await systemHealthService.checkAllServices()
        setVitalSigns(prev => ({
          ...prev,
          systemHealth: health,
          lastUpdated: new Date(),
          error: null
        }))
      } catch (error) {
        console.error('❌ Error checking system health:', error)
        setVitalSigns(prev => ({
          ...prev,
          error: 'Failed to check system health'
        }))
      }
    }

    // Initial health check
    checkSystemHealth()
    
    // Regular health checks every 30 seconds
    const healthInterval = setInterval(checkSystemHealth, 30000)

    // Initial loading complete
    setVitalSigns(prev => ({ ...prev, loading: false }))

    return () => {
      console.log('🔄 Cleaning up vital signs listeners')
      unsubscribers.forEach(unsubscribe => unsubscribe())
      clearInterval(healthInterval)
    }
  }, [])

  // Update staff metrics
  const updateStaffMetrics = (staffData: any[]) => {
    const activeStaff = staffData.filter(staff => 
      staff.status === 'active' && 
      staff.availability?.status !== 'off_duty'
    ).length
    
    const totalStaff = staffData.length
    const targetStaff = Math.max(8, Math.ceil(totalStaff * 0.8)) // 80% of total or minimum 8
    
    const staffRatio = totalStaff > 0 ? activeStaff / targetStaff : 0
    const status = staffRatio >= 1 ? 'healthy' : staffRatio >= 0.8 ? 'warning' : 'critical'

    updateMetric({
      id: 'staff',
      label: 'STAFF',
      value: `${activeStaff}/${targetStaff}`,
      status,
      trend: 'stable', // Would calculate from historical data
      icon: '👥',
      tooltip: `${activeStaff} active staff out of ${targetStaff} needed`
    })
  }

  // Update location-based metrics
  const updateLocationMetrics = (locationData: any[]) => {
    // Calculate average response time (mock calculation)
    const avgResponseTime = 8 // minutes - would calculate from actual emergency response data
    const status = avgResponseTime <= 10 ? 'healthy' : avgResponseTime <= 15 ? 'warning' : 'critical'

    updateMetric({
      id: 'response',
      label: 'RESPONSE',
      value: `${avgResponseTime}m`,
      status,
      trend: 'stable',
      icon: '🚨',
      tooltip: `Average emergency response time: ${avgResponseTime} minutes`
    })
  }

  // Update job-related metrics
  const updateJobMetrics = (jobsData: any[]) => {
    const completedJobs = jobsData.filter(job => job.status === 'completed').length
    const totalJobs = jobsData.length
    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 100
    
    const status = completionRate >= 90 ? 'healthy' : completionRate >= 75 ? 'warning' : 'critical'

    updateMetric({
      id: 'efficiency',
      label: 'EFFICIENCY',
      value: `${Math.round(completionRate)}%`,
      status,
      trend: completionRate >= 85 ? 'up' : 'down',
      icon: '⚡',
      tooltip: `Job completion rate: ${completedJobs}/${totalJobs} jobs completed`
    })
  }

  // Update property transition metrics
  const updatePropertyMetrics = (propertiesData: any[]) => {
    // Mock calculation - would use actual property status data
    const transitionStates = ['checkout', 'checkin', 'cleaning']
    const propertiesInTransition = Math.floor(Math.random() * 6) + 1 // 1-6 properties
    
    const status = propertiesInTransition <= 3 ? 'healthy' : propertiesInTransition <= 5 ? 'warning' : 'critical'

    updateMetric({
      id: 'transitions',
      label: 'TRANSITIONS',
      value: `${propertiesInTransition}`,
      status,
      trend: 'stable',
      icon: '🏠',
      tooltip: `${propertiesInTransition} properties in checkout/checkin/cleaning status`
    })
  }

  // Update revenue metrics
  const updateRevenueMetrics = (bookingsData: any[]) => {
    const todayRevenue = bookingsData
      .filter(booking => booking.status === 'confirmed')
      .reduce((sum, booking) => sum + (booking.total_amount || 0), 0)
    
    const dailyTarget = 50000 // ฿50,000 daily target
    const revenueRatio = todayRevenue / dailyTarget
    
    const status = revenueRatio >= 0.9 ? 'healthy' : revenueRatio >= 0.7 ? 'warning' : 'critical'

    updateMetric({
      id: 'revenue',
      label: 'REVENUE',
      value: `฿${(todayRevenue / 1000).toFixed(0)}k`,
      target: `฿${(dailyTarget / 1000).toFixed(0)}k`,
      status,
      trend: revenueRatio >= 0.8 ? 'up' : 'down',
      icon: '💰',
      tooltip: `Today's revenue: ฿${todayRevenue.toLocaleString()} / ฿${dailyTarget.toLocaleString()} target`
    })

    // Guest satisfaction (mock data - would come from actual feedback)
    const satisfaction = 4.2 + (Math.random() * 0.6) // 4.2-4.8 range
    const satisfactionStatus = satisfaction >= 4.5 ? 'healthy' : satisfaction >= 4.0 ? 'warning' : 'critical'

    updateMetric({
      id: 'satisfaction',
      label: 'SATISFACTION',
      value: `${satisfaction.toFixed(1)}★`,
      status: satisfactionStatus,
      trend: satisfaction >= 4.3 ? 'up' : 'down',
      icon: '⭐',
      tooltip: `Average guest satisfaction: ${satisfaction.toFixed(1)}/5.0 stars`
    })
  }

  // Helper function to update individual metrics
  const updateMetric = (newMetric: VitalMetric) => {
    setVitalSigns(prev => {
      const existingIndex = prev.metrics.findIndex(m => m.id === newMetric.id)
      const updatedMetrics = [...prev.metrics]
      
      if (existingIndex >= 0) {
        updatedMetrics[existingIndex] = newMetric
      } else {
        updatedMetrics.push(newMetric)
      }

      return {
        ...prev,
        metrics: updatedMetrics,
        lastUpdated: new Date()
      }
    })
  }

  return vitalSigns
}
