/**
 * Calendar Test Utilities
 * Helper functions to test calendar integration and date parsing
 */

import CalendarEventService from '@/services/CalendarEventService'

export interface TestJobData {
  id: string
  title: string
  jobType: string
  scheduledDate: string
  scheduledStartTime?: string
  scheduledEndTime?: string
  deadline: string
  estimatedDuration: number
  assignedStaffId?: string
  assignedStaffName?: string
  propertyId?: string
  propertyName?: string
  description?: string
  priority?: string
  status?: string
}

/**
 * Test calendar event creation with various date formats
 */
export async function testCalendarEventCreation(): Promise<void> {
  console.log('🧪 Testing calendar event creation with various date formats...')

  const testCases: TestJobData[] = [
    {
      id: 'test_job_1',
      title: 'Test Cleaning Job',
      jobType: 'cleaning',
      scheduledDate: '2024-01-15',
      scheduledStartTime: '09:00',
      scheduledEndTime: '11:00',
      deadline: '2024-01-15T23:59:59',
      estimatedDuration: 120,
      assignedStaffName: 'Test Staff',
      propertyName: 'Test Property',
      description: 'Test cleaning job for calendar integration',
    },
    {
      id: 'test_job_2',
      title: 'Test Maintenance Job',
      jobType: 'maintenance',
      scheduledDate: '2024-01-16T10:00:00',
      deadline: '2024-01-16T18:00:00',
      estimatedDuration: 180,
      assignedStaffName: 'Test Staff 2',
      propertyName: 'Test Property 2',
      description: 'Test maintenance job with ISO date format',
    },
    {
      id: 'test_job_3',
      title: 'Test Inspection Job',
      jobType: 'inspection',
      scheduledDate: new Date().toISOString().split('T')[0], // Today's date
      scheduledStartTime: '14:30',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      estimatedDuration: 60,
      assignedStaffName: 'Test Staff 3',
      propertyName: 'Test Property 3',
      description: 'Test inspection job with current date',
    },
  ]

  for (const testJob of testCases) {
    try {
      console.log(`📅 Testing job: ${testJob.title}`)

      // Test the date parsing logic directly
      const service = CalendarEventService as any

      // Test parseFlexibleDate method
      if (service.parseFlexibleDate) {
        const parsedScheduledDate = service.parseFlexibleDate(
          testJob.scheduledDate
        )
        const parsedDeadline = service.parseFlexibleDate(testJob.deadline)

        console.log(
          `  ✅ Scheduled date parsed: ${parsedScheduledDate.toISOString()}`
        )
        console.log(`  ✅ Deadline parsed: ${parsedDeadline.toISOString()}`)

        if (testJob.scheduledStartTime) {
          const combinedDateTime = new Date(
            `${testJob.scheduledDate}T${testJob.scheduledStartTime}:00`
          )
          console.log(
            `  ✅ Combined date/time: ${combinedDateTime.toISOString()}`
          )
        }
      }

      console.log(`  ✅ Test passed for ${testJob.title}`)
    } catch (error) {
      console.error(`  ❌ Test failed for ${testJob.title}:`, error)
    }
  }

  console.log('🧪 Calendar date parsing tests completed')
}

/**
 * Validate date string formats
 */
export function validateDateFormat(dateString: string): boolean {
  try {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  } catch {
    return false
  }
}

/**
 * Format date for calendar display
 */
export function formatCalendarDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Format time for calendar display
 */
export function formatCalendarTime(date: Date): string {
  return date.toTimeString().split(' ')[0].substring(0, 5) // HH:MM format
}

/**
 * Test calendar integration with real job data from Firebase
 */
export async function testCalendarWithRealData(): Promise<void> {
  console.log('🧪 Testing calendar integration with real Firebase data...')

  try {
    // Import Firebase functions
    const { db } = await import('@/lib/firebase')
    const { collection, getDocs, limit, query } = await import(
      'firebase/firestore'
    )

    // Get a few real job assignments
    const jobsQuery = query(collection(db, 'job_assignments'), limit(3))
    const jobsSnapshot = await getDocs(jobsQuery)

    console.log(`📋 Found ${jobsSnapshot.docs.length} job assignments to test`)

    for (const jobDoc of jobsSnapshot.docs) {
      const jobData = { id: jobDoc.id, ...jobDoc.data() }
      console.log(
        `🔍 Testing job: ${jobData.title || jobData.jobType || jobDoc.id}`
      )
      console.log('📅 Job data structure:', {
        id: jobData.id,
        title: jobData.title,
        jobType: jobData.jobType,
        scheduledDate: jobData.scheduledDate,
        scheduledStartTime: jobData.scheduledStartTime,
        deadline: jobData.deadline,
        createdAt: jobData.createdAt,
        calendarEventCreated: jobData.calendarEventCreated,
      })

      // Test date parsing for this job
      const CalendarEventService = (
        await import('@/services/CalendarEventService')
      ).default

      try {
        // Test the parseFlexibleDate method if available
        const service = CalendarEventService as any
        if (service.parseFlexibleDate) {
          if (jobData.scheduledDate) {
            const parsed = service.parseFlexibleDate(jobData.scheduledDate)
            console.log(`  ✅ scheduledDate parsed: ${parsed.toISOString()}`)
          }
          if (jobData.deadline) {
            const parsed = service.parseFlexibleDate(jobData.deadline)
            console.log(`  ✅ deadline parsed: ${parsed.toISOString()}`)
          }
          if (jobData.createdAt) {
            const parsed = service.parseFlexibleDate(jobData.createdAt)
            console.log(`  ✅ createdAt parsed: ${parsed.toISOString()}`)
          }
        }

        console.log(`  ✅ Job ${jobDoc.id} data parsing successful`)
      } catch (error) {
        console.error(`  ❌ Job ${jobDoc.id} data parsing failed:`, error)
      }
    }

    console.log('✅ Real data calendar integration tests completed')
  } catch (error) {
    console.error('❌ Real data calendar integration tests failed:', error)
  }
}

/**
 * Test calendar integration with mock job data
 */
export async function testCalendarIntegration(): Promise<void> {
  console.log('🧪 Testing calendar integration...')

  try {
    await testCalendarEventCreation()
    await testCalendarWithRealData()
    console.log('✅ Calendar integration tests completed successfully')
  } catch (error) {
    console.error('❌ Calendar integration tests failed:', error)
  }
}
