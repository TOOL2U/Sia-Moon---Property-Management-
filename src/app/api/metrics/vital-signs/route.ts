import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    const db = getDb()
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      )
    }

    console.log('📊 Calculating vital signs metrics...')

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Fetch all required data in parallel
    const [
      staffSnapshot,
      locationsSnapshot,
      jobsSnapshot,
      propertiesSnapshot,
      bookingsSnapshot
    ] = await Promise.all([
      getDocs(query(collection(db, 'staff_accounts'))),
      getDocs(query(
        collection(db, 'staff_locations'),
        orderBy('timestamp', 'desc'),
        limit(50)
      )),
      getDocs(query(
        collection(db, 'jobs'),
        where('scheduledDate', '>=', Timestamp.fromDate(startOfDay)),
        where('scheduledDate', '<', Timestamp.fromDate(endOfDay))
      )),
      getDocs(query(collection(db, 'properties'))),
      getDocs(query(collection(db, 'bookings')))
    ])

    // Process data
    const staff = staffSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const locations = locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const properties = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Calculate metrics
    const metrics = {
      staff: calculateStaffMetric(staff, locations),
      transitions: calculateTransitionsMetric(properties),
      response: calculateResponseMetric(locations),
      revenue: calculateRevenueMetric(bookings, today),
      satisfaction: calculateSatisfactionMetric(bookings),
      efficiency: calculateEfficiencyMetric(jobs)
    }

    const responseTime = Date.now() - startTime

    const response = {
      success: true,
      metrics,
      metadata: {
        calculatedAt: new Date().toISOString(),
        responseTime,
        dataPoints: {
          staff: staff.length,
          locations: locations.length,
          jobs: jobs.length,
          properties: properties.length,
          bookings: bookings.length
        }
      }
    }

    console.log(`✅ Vital signs calculated in ${responseTime}ms`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error calculating vital signs:', error)
    return NextResponse.json(
      { error: 'Failed to calculate vital signs' },
      { status: 500 }
    )
  }
}

function calculateStaffMetric(staff: any[], locations: any[]) {
  const activeStaff = staff.filter(s => 
    s.status === 'active' && 
    s.availability?.status !== 'off_duty'
  ).length
  
  const totalStaff = staff.length
  const targetStaff = Math.max(8, Math.ceil(totalStaff * 0.8))
  
  const ratio = targetStaff > 0 ? activeStaff / targetStaff : 0
  const status = ratio >= 1 ? 'healthy' : ratio >= 0.8 ? 'warning' : 'critical'

  return {
    value: `${activeStaff}/${targetStaff}`,
    status,
    details: {
      active: activeStaff,
      total: totalStaff,
      target: targetStaff,
      ratio: Math.round(ratio * 100)
    }
  }
}

function calculateTransitionsMetric(properties: any[]) {
  // Mock calculation - would use actual property status data
  const transitionStates = ['checkout', 'checkin', 'cleaning']
  const propertiesInTransition = Math.floor(Math.random() * 6) + 1
  
  const status = propertiesInTransition <= 3 ? 'healthy' : 
                propertiesInTransition <= 5 ? 'warning' : 'critical'

  return {
    value: propertiesInTransition.toString(),
    status,
    details: {
      inTransition: propertiesInTransition,
      total: properties.length,
      states: transitionStates
    }
  }
}

function calculateResponseMetric(locations: any[]) {
  // Calculate average response time based on location updates
  const recentLocations = locations.filter(loc => {
    const timestamp = loc.timestamp?.toDate() || new Date(0)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return timestamp > fiveMinutesAgo
  })

  // Mock calculation - would use actual emergency response data
  const avgResponseTime = recentLocations.length > 5 ? 8 : 12 // minutes
  const status = avgResponseTime <= 10 ? 'healthy' : 
                avgResponseTime <= 15 ? 'warning' : 'critical'

  return {
    value: `${avgResponseTime}m`,
    status,
    details: {
      averageMinutes: avgResponseTime,
      recentUpdates: recentLocations.length,
      threshold: 10
    }
  }
}

function calculateRevenueMetric(bookings: any[], today: Date) {
  const todayStr = today.toISOString().split('T')[0]
  
  const todayBookings = bookings.filter(booking => 
    booking.check_in === todayStr && booking.status === 'confirmed'
  )
  
  const todayRevenue = todayBookings.reduce((sum, booking) => 
    sum + (booking.total_amount || 0), 0
  )
  
  const dailyTarget = 50000 // ฿50,000
  const ratio = todayRevenue / dailyTarget
  
  const status = ratio >= 0.9 ? 'healthy' : ratio >= 0.7 ? 'warning' : 'critical'

  return {
    value: `฿${(todayRevenue / 1000).toFixed(0)}k`,
    status,
    details: {
      amount: todayRevenue,
      target: dailyTarget,
      ratio: Math.round(ratio * 100),
      bookings: todayBookings.length
    }
  }
}

function calculateSatisfactionMetric(bookings: any[]) {
  // Mock calculation - would use actual guest feedback data
  const satisfaction = 4.2 + (Math.random() * 0.6) // 4.2-4.8 range
  const status = satisfaction >= 4.5 ? 'healthy' : 
                satisfaction >= 4.0 ? 'warning' : 'critical'

  return {
    value: `${satisfaction.toFixed(1)}★`,
    status,
    details: {
      score: satisfaction,
      outOf: 5.0,
      threshold: 4.0,
      reviews: Math.floor(Math.random() * 20) + 10
    }
  }
}

function calculateEfficiencyMetric(jobs: any[]) {
  const completedJobs = jobs.filter(job => job.status === 'completed').length
  const totalJobs = jobs.length
  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 100
  
  const status = completionRate >= 90 ? 'healthy' : 
                completionRate >= 75 ? 'warning' : 'critical'

  return {
    value: `${Math.round(completionRate)}%`,
    status,
    details: {
      completed: completedJobs,
      total: totalJobs,
      rate: completionRate,
      threshold: 90
    }
  }
}
