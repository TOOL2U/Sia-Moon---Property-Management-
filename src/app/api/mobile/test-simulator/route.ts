import { NextRequest, NextResponse } from 'next/server'

/**
 * 📱 Mobile App Test Simulator
 *
 * Simulates mobile app sending live test data including:
 * - Job completions
 * - Audit reports
 * - Performance data
 */

interface SimulationConfig {
  staffIds: string[]
  simulationType: 'job_completion' | 'audit_report' | 'both'
  duration: number // minutes
  frequency: number // seconds between events
}

// Sample staff data
const SAMPLE_STAFF = [
  { id: 'staff_001', name: 'John Smith', role: 'cleaner' },
  { id: 'staff_002', name: 'Maria Garcia', role: 'maintenance' },
  { id: 'staff_003', name: 'David Chen', role: 'manager' }
]

// Sample properties
const SAMPLE_PROPERTIES = [
  { id: 'prop_001', name: 'Maya House' },
  { id: 'prop_002', name: 'Ocean Villa' },
  { id: 'prop_003', name: 'Paradise Resort' }
]

// Generate random job completion data
const generateJobCompletion = (staffId: string) => {
  const property = SAMPLE_PROPERTIES[Math.floor(Math.random() * SAMPLE_PROPERTIES.length)]
  const jobTypes = ['cleaning', 'maintenance', 'inspection', 'setup']
  const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)]

  const startTime = new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000) // Up to 4 hours ago
  const endTime = new Date(startTime.getTime() + (30 + Math.random() * 90) * 60 * 1000) // 30-120 minutes later

  return {
    staffId,
    jobId: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    jobType,
    propertyId: property.id,
    propertyName: property.name,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    completionStatus: Math.random() > 0.1 ? 'completed' : 'partial',
    gpsLocations: Array.from({ length: Math.floor(Math.random() * 10) + 5 }, () => ({
      latitude: 13.7563 + (Math.random() - 0.5) * 0.01,
      longitude: 100.5018 + (Math.random() - 0.5) * 0.01,
      timestamp: new Date(startTime.getTime() + Math.random() * (endTime.getTime() - startTime.getTime())).toISOString(),
      accuracy: Math.random() * 0.3 + 0.7 // 70-100% accuracy
    })),
    photos: Array.from({ length: Math.floor(Math.random() * 4) + 2 }, (_, i) => ({
      type: i === 0 ? 'before' : i === 1 ? 'after' : 'during',
      url: `https://example.com/photo_${Date.now()}_${i}.jpg`,
      timestamp: new Date(startTime.getTime() + (i / 4) * (endTime.getTime() - startTime.getTime())).toISOString(),
      gpsLocation: {
        latitude: 13.7563 + (Math.random() - 0.5) * 0.01,
        longitude: 100.5018 + (Math.random() - 0.5) * 0.01
      }
    })),
    notes: Math.random() > 0.5 ? `${jobType} completed successfully` : undefined,
    qualityRating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
    aiInteractions: Math.random() > 0.7 ? [{
      timestamp: new Date(startTime.getTime() + Math.random() * (endTime.getTime() - startTime.getTime())).toISOString(),
      query: 'How should I handle this maintenance issue?',
      response: 'Follow the standard maintenance protocol and document any issues.',
      helpful: Math.random() > 0.2
    }] : []
  }
}

// Generate random audit report
const generateAuditReport = (staffId: string) => {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // Sunday
  weekEnd.setHours(23, 59, 59, 999)

  const trustScore = Math.floor(Math.random() * 40) + 60 // 60-100
  const qualityScore = Math.floor(Math.random() * 40) + 60 // 60-100

  const jobsCompleted = Math.floor(Math.random() * 15) + 5
  const jobsAccepted = jobsCompleted + Math.floor(Math.random() * 3)

  const strengths = [
    'Consistently completes tasks ahead of schedule',
    'Excellent attention to detail',
    'Proactive communication with management',
    'High guest satisfaction ratings',
    'Efficient use of resources'
  ]

  const concerns = [
    'Occasional delays in task completion',
    'Inconsistent photo documentation',
    'GPS location accuracy issues',
    'Late responses to urgent requests'
  ]

  const recommendations = [
    'Schedule additional training on mobile app features',
    'Review cleaning checklist procedures',
    'Implement daily check-in confirmation',
    'Provide feedback on photo documentation quality'
  ]

  const patterns = [
    'Performs best on morning assignments',
    'More efficient with cleaning than maintenance tasks',
    'Responds quickly to direct messages',
    'Most productive on weekdays'
  ]

  const trends = ['improving', 'declining', 'stable']

  return {
    staffId,
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    trustScore,
    qualityScore,
    metrics: {
      jobsCompleted,
      jobsAccepted,
      averageCompletionTime: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
      onTimeCompletionRate: Math.random() * 0.4 + 0.6, // 60-100%
      photoComplianceRate: Math.random() * 0.5 + 0.5, // 50-100%
      gpsAccuracy: Math.random() * 0.3 + 0.7, // 70-100%
      aiUsageCount: Math.floor(Math.random() * 10),
      responseTime: Math.floor(Math.random() * 20) + 5 // 5-25 minutes
    },
    insights: {
      strengths: strengths.slice(0, Math.floor(Math.random() * 3) + 2),
      concerns: concerns.slice(0, Math.floor(Math.random() * 2) + 1),
      recommendations: recommendations.slice(0, Math.floor(Math.random() * 2) + 1),
      behavioralPatterns: patterns.slice(0, Math.floor(Math.random() * 2) + 1)
    },
    trends: {
      trustScoreTrend: trends[Math.floor(Math.random() * trends.length)],
      qualityTrend: trends[Math.floor(Math.random() * trends.length)],
      productivityTrend: trends[Math.floor(Math.random() * trends.length)]
    },
    aiAnalysis: `Weekly Performance Analysis for Staff ID: ${staffId}\n\nTrust Score: ${trustScore}/100\nQuality Score: ${qualityScore}/100\n\nThis staff member completed ${jobsCompleted} jobs this week with an average completion time of ${Math.floor(Math.random() * 60) + 30} minutes. Performance shows ${trends[Math.floor(Math.random() * trends.length)]} trends across key metrics.\n\nRecommendations for continued improvement include enhanced mobile app utilization and consistent documentation practices.`,
    weekNumber: Math.ceil((weekStart.getDate() - weekStart.getDay() + 1) / 7),
    year: weekStart.getFullYear(),
    generatedBy: 'mobile-app-simulator-v1.0',
    dataPoints: Math.floor(Math.random() * 50) + 20,
    confidenceLevel: Math.random() * 0.3 + 0.7 // 70-100%
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Mobile App Test Simulator: Starting simulation...')

    const config: SimulationConfig = await request.json()

    // Validate config
    if (!config.staffIds || config.staffIds.length === 0) {
      config.staffIds = SAMPLE_STAFF.map(s => s.id)
    }

    if (!config.simulationType) {
      config.simulationType = 'both'
    }

    if (!config.duration) {
      config.duration = 5 // 5 minutes default
    }

    if (!config.frequency) {
      config.frequency = 30 // 30 seconds default
    }

    console.log('🎯 Simulation config:', config)

    const results = {
      jobCompletions: 0,
      auditReports: 0,
      errors: 0,
      startTime: new Date().toISOString(),
      endTime: ''
    }

    // Run simulation
    const endTime = Date.now() + (config.duration * 60 * 1000)

    while (Date.now() < endTime) {
      for (const staffId of config.staffIds) {
        try {
          // Send job completion
          if (config.simulationType === 'job_completion' || config.simulationType === 'both') {
            const jobData = generateJobCompletion(staffId)

            const jobResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mobile/job-completion`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(jobData)
            })

            if (jobResponse.ok) {
              results.jobCompletions++
              console.log(`✅ Job completion sent for ${staffId}`)
            } else {
              results.errors++
              console.error(`❌ Job completion failed for ${staffId}`)
            }
          }

          // Send audit report (less frequently)
          if ((config.simulationType === 'audit_report' || config.simulationType === 'both') && Math.random() > 0.7) {
            const auditData = generateAuditReport(staffId)

            const auditResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mobile/audit-report`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(auditData)
            })

            if (auditResponse.ok) {
              results.auditReports++
              console.log(`✅ Audit report sent for ${staffId}`)
            } else {
              results.errors++
              console.error(`❌ Audit report failed for ${staffId}`)
            }
          }

        } catch (error) {
          results.errors++
          console.error(`❌ Simulation error for ${staffId}:`, error)
        }
      }

      // Wait before next iteration
      await new Promise(resolve => setTimeout(resolve, config.frequency * 1000))
    }

    results.endTime = new Date().toISOString()

    console.log('🎉 Simulation completed:', results)

    return NextResponse.json({
      success: true,
      message: 'Mobile app simulation completed',
      config,
      results
    })

  } catch (error) {
    console.error('❌ Mobile App Simulator Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for simulation status and options
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Mobile App Test Simulator is active',
    description: 'Simulates mobile app sending live test data for audit report generation',
    sampleStaff: SAMPLE_STAFF,
    sampleProperties: SAMPLE_PROPERTIES,
    simulationOptions: {
      simulationType: ['job_completion', 'audit_report', 'both'],
      defaultDuration: '5 minutes',
      defaultFrequency: '30 seconds',
      staffIds: 'array of staff IDs (optional, uses sample staff if not provided)'
    },
    usage: {
      method: 'POST',
      body: {
        staffIds: 'string[] (optional)',
        simulationType: 'job_completion | audit_report | both (optional)',
        duration: 'number in minutes (optional)',
        frequency: 'number in seconds (optional)'
      }
    }
  })
}
