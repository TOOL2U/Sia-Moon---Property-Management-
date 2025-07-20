/**
 * Job Assignment Notification Test Script
 * Use this to test and verify notification behavior
 */

import { JobAssignmentService } from '@/services/JobAssignmentService'
import { collection, doc, getDoc, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

interface NotificationTestResult {
  testName: string
  jobId: string
  staffId: string
  notificationsSent: number
  duplicatesDetected: boolean
  timingIssues: boolean
  success: boolean
  details: string[]
}

export class NotificationTester {
  private db = getDb()

  /**
   * Test single job assignment notification
   */
  async testSingleJobNotification(): Promise<NotificationTestResult> {
    const testName = 'Single Job Assignment'
    const testJobId = `test-job-${Date.now()}`
    const testStaffId = 'test-staff-1'
    
    console.log(`🧪 Starting test: ${testName}`)
    
    try {
      // Clear any existing notifications for this test
      await this.clearTestNotifications(testJobId)
      
      // Create a test job assignment
      const jobData = {
        id: testJobId,
        assignedStaffId: testStaffId,
        status: 'assigned',
        title: 'Test Cleaning Job',
        description: 'Test notification behavior',
        priority: 'medium' as const,
        propertyId: 'test-property',
        bookingId: 'test-booking',
        scheduledDate: new Date().toISOString().split('T')[0],
        estimatedDuration: 120,
        createdAt: Timestamp.now()
      }

      // Track notifications before assignment
      const notificationsBefore = await this.countNotifications(testJobId)
      
      // Assign the job (this should trigger notifications)
      const startTime = Date.now()
      await JobAssignmentService.createJobAssignment(jobData)
      
      // Wait for notifications to be processed
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Check notifications after assignment
      const notificationsAfter = await this.countNotifications(testJobId)
      const notificationsSent = notificationsAfter - notificationsBefore
      
      // Check for duplicates
      const notifications = await this.getJobNotifications(testJobId)
      const duplicatesDetected = this.checkForDuplicates(notifications)
      
      // Check timing
      const endTime = Date.now()
      const timingIssues = (endTime - startTime) > 10000 // Flag if took more than 10 seconds
      
      const success = notificationsSent === 1 && !duplicatesDetected && !timingIssues
      
      const result: NotificationTestResult = {
        testName,
        jobId: testJobId,
        staffId: testStaffId,
        notificationsSent,
        duplicatesDetected,
        timingIssues,
        success,
        details: [
          `Notifications sent: ${notificationsSent}`,
          `Duplicates detected: ${duplicatesDetected}`,
          `Processing time: ${endTime - startTime}ms`,
          `Expected: 1 notification, no duplicates, fast processing`
        ]
      }
      
      console.log(`✅ Test completed:`, result)
      return result
      
    } catch (error) {
      console.error(`❌ Test failed:`, error)
      return {
        testName,
        jobId: testJobId,
        staffId: testStaffId,
        notificationsSent: 0,
        duplicatesDetected: false,
        timingIssues: true,
        success: false,
        details: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * Test rapid job assignments (stress test)
   */
  async testRapidAssignments(): Promise<NotificationTestResult> {
    const testName = 'Rapid Job Assignments'
    const jobCount = 3
    const testStaffId = 'test-staff-rapid'
    
    console.log(`🧪 Starting test: ${testName} (${jobCount} jobs)`)
    
    try {
      const jobIds: string[] = []
      const startTime = Date.now()
      
      // Create multiple jobs rapidly
      for (let i = 0; i < jobCount; i++) {
        const testJobId = `rapid-test-${Date.now()}-${i}`
        jobIds.push(testJobId)
        
        const jobData = {
          id: testJobId,
          assignedStaffId: testStaffId,
          status: 'assigned',
          title: `Rapid Test Job ${i + 1}`,
          description: 'Test rapid assignment notifications',
          priority: 'medium' as const,
          propertyId: 'test-property',
          bookingId: 'test-booking',
          scheduledDate: new Date().toISOString().split('T')[0],
          estimatedDuration: 120,
          createdAt: Timestamp.now()
        }
        
        await JobAssignmentService.createJobAssignment(jobData)
        
        // Small delay between assignments
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Wait for all notifications to be processed
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Count total notifications
      let totalNotifications = 0
      let duplicatesDetected = false
      
      for (const jobId of jobIds) {
        const notifications = await this.getJobNotifications(jobId)
        totalNotifications += notifications.length
        
        if (this.checkForDuplicates(notifications)) {
          duplicatesDetected = true
        }
      }
      
      const endTime = Date.now()
      const timingIssues = (endTime - startTime) > 20000 // Flag if took more than 20 seconds
      
      const expectedNotifications = jobCount // Should be 1 per job
      const success = totalNotifications === expectedNotifications && !duplicatesDetected && !timingIssues
      
      const result: NotificationTestResult = {
        testName,
        jobId: jobIds.join(', '),
        staffId: testStaffId,
        notificationsSent: totalNotifications,
        duplicatesDetected,
        timingIssues,
        success,
        details: [
          `Jobs created: ${jobCount}`,
          `Total notifications sent: ${totalNotifications}`,
          `Expected notifications: ${expectedNotifications}`,
          `Duplicates detected: ${duplicatesDetected}`,
          `Processing time: ${endTime - startTime}ms`
        ]
      }
      
      console.log(`✅ Rapid assignment test completed:`, result)
      return result
      
    } catch (error) {
      console.error(`❌ Rapid assignment test failed:`, error)
      return {
        testName,
        jobId: 'multiple',
        staffId: testStaffId,
        notificationsSent: 0,
        duplicatesDetected: false,
        timingIssues: true,
        success: false,
        details: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * Get all notifications for a specific job
   */
  private async getJobNotifications(jobId: string): Promise<any[]> {
    const notifications: any[] = []
    
    // Check staff_notifications collection
    const staffNotificationsQuery = query(
      collection(this.db, 'staff_notifications'),
      where('jobId', '==', jobId)
    )
    const staffNotificationsSnapshot = await getDocs(staffNotificationsQuery)
    staffNotificationsSnapshot.forEach(doc => {
      notifications.push({ id: doc.id, source: 'staff_notifications', ...doc.data() })
    })
    
    // Check notifications collection
    const notificationsQuery = query(
      collection(this.db, 'notifications'),
      where('relatedJobId', '==', jobId)
    )
    const notificationsSnapshot = await getDocs(notificationsQuery)
    notificationsSnapshot.forEach(doc => {
      notifications.push({ id: doc.id, source: 'notifications', ...doc.data() })
    })
    
    return notifications
  }

  /**
   * Count notifications for a job
   */
  private async countNotifications(jobId: string): Promise<number> {
    const notifications = await this.getJobNotifications(jobId)
    return notifications.length
  }

  /**
   * Check for duplicate notifications
   */
  private checkForDuplicates(notifications: any[]): boolean {
    if (notifications.length <= 1) return false
    
    // Group by type and staffId
    const notificationGroups = new Map<string, any[]>()
    
    for (const notification of notifications) {
      const key = `${notification.type}-${notification.staffId}`
      if (!notificationGroups.has(key)) {
        notificationGroups.set(key, [])
      }
      notificationGroups.get(key)!.push(notification)
    }
    
    // Check if any group has more than 1 notification
    for (const [key, group] of notificationGroups) {
      if (group.length > 1) {
        console.warn(`🚨 Duplicate notifications detected for ${key}:`, group)
        return true
      }
    }
    
    return false
  }

  /**
   * Clear test notifications
   */
  private async clearTestNotifications(jobId: string): Promise<void> {
    // This would need to be implemented with proper cleanup logic
    console.log(`🧹 Clearing test notifications for job ${jobId}`)
    // In a real implementation, you'd delete test notifications here
  }

  /**
   * Run all notification tests
   */
  async runAllTests(): Promise<NotificationTestResult[]> {
    console.log('🧪 Running all notification tests...')
    
    const results: NotificationTestResult[] = []
    
    // Test 1: Single job assignment
    results.push(await this.testSingleJobNotification())
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test 2: Rapid assignments
    results.push(await this.testRapidAssignments())
    
    // Generate summary
    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount
    
    console.log(`\n📊 Test Summary:`)
    console.log(`✅ Passed: ${successCount}`)
    console.log(`❌ Failed: ${failureCount}`)
    console.log(`📋 Total: ${results.length}`)
    
    return results
  }
}
