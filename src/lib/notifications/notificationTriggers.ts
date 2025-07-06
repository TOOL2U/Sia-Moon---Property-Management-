import { NotificationService } from './notificationService'
import SupabaseService from '@/lib/supabaseService'
import { MonthlyReport, Task, User } from '@/lib/db'

/**
 * Notification triggers for various system events
 */
export class NotificationTriggers {
  
  /**
   * Trigger notification when a monthly report is generated
   */
  static async onReportGenerated(report: MonthlyReport): Promise<void> {
    try {
      console.log(`📊 Triggering report notification for report ${report.id}`)
      
      // Get property details
      const propertyResult = await SupabaseService.getProperty(report.property_id)
      if (propertyResult.error || !propertyResult.data) {
        console.error('Property not found for report notification')
        return
      }
      
      const property = propertyResult.data
      
      // Get property owner
      const ownerResult = await SupabaseService.getUser(property.owner_id)
      if (ownerResult.error || !ownerResult.data) {
        console.error('Property owner not found for report notification')
        return
      }

      const owner = ownerResult.data
      
      // Format report data for notification
      const reportData = {
        property_name: property.name,
        report_period: `${new Date(report.year, report.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        net_income: `${report.currency} ${(report.net_income / 100).toFixed(2)}`,
        occupancy_rate: `${report.occupancy_rate.toFixed(1)}%`,
        total_bookings: report.total_bookings.toString(),
        report_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/dashboard/client/reports`
      }
      
      // Send notification to property owner
      await NotificationService.sendNotification({
        userId: owner.id,
        category: 'report_generated',
        title: 'Monthly Report Available',
        message: `Your monthly report for ${property.name} is now available.`,
        data: reportData,
        priority: 'normal',
        channels: ['email', 'in_app'],
        emailSubject: `Monthly Report Available - ${property.name}`,
        emailTemplate: 'report_generated'
      })
      
      console.log('✅ Report notification sent successfully')
      
    } catch (error) {
      console.error('❌ Error sending report notification:', error)
    }
  }
  
  /**
   * Trigger notification when a task is assigned to staff
   */
  static async onTaskAssigned(task: Task): Promise<void> {
    try {
      console.log(`📋 Triggering task assignment notification for task ${task.id}`)
      
      if (!task.assigned_to) {
        console.log('Task has no assigned user, skipping notification')
        return
      }
      
      // Get assigned staff member
      const staffResult = await SupabaseService.getUser(task.assigned_to)
      if (staffResult.error || !staffResult.data) {
        console.error('Assigned staff member not found for task notification')
        return
      }
      
      const staff = staffResult.data
      
      // Get property details if available
      let property: { name: string; owner_id: string } | null = null
      if (task.property_id) {
        const propertyResult = await SupabaseService.getProperty(task.property_id)
        if (propertyResult.data) {
          property = propertyResult.data
        }
      }
      
      // Format task data for notification
      const taskData = {
        staff_name: staff.full_name || staff.email,
        task_title: task.title,
        task_description: task.description || 'No description provided',
        property_name: property?.name || 'N/A',
        due_date: task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date',
        priority: task.priority || 'Normal',
        task_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/dashboard/staff/tasks`
      }
      
      // Determine priority and channels based on task urgency
      const isUrgent = task.priority === 'urgent' || task.type === 'maintenance'
      const priority = isUrgent ? 'urgent' : 'normal'
      const channels = isUrgent ? ['email', 'push', 'in_app'] : ['email', 'in_app']
      
      // Send notification to assigned staff
      await NotificationService.sendNotification({
        userId: staff.id,
        category: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${task.title}`,
        data: taskData,
        priority,
        channels: (channels as ("email" | "push" | "in_app")[]),
        emailSubject: `New Task Assigned - ${task.title}`,
        emailTemplate: 'task_assigned',
        pushTitle: 'New Task Assigned',
        pushBody: `${task.title} - ${property?.name || 'Property task'}`,
        pushUrl: taskData.task_url
      })
      
      console.log('✅ Task assignment notification sent successfully')
      
    } catch (error) {
      console.error('❌ Error sending task assignment notification:', error)
    }
  }
  
  /**
   * Trigger notification when a task is completed
   */
  static async onTaskCompleted(task: Task): Promise<void> {
    try {
      console.log(`✅ Triggering task completion notification for task ${task.id}`)
      
      // Get property details if available
      let property: { name: string; owner_id: string } | null = null
      if (task.property_id) {
        const propertyResult = await SupabaseService.getProperty(task.property_id)
        if (propertyResult.data) {
          property = propertyResult.data
        }
      }
      
      // Get property owner if property exists
      if (property) {
        const ownerResult = await SupabaseService.getUser(property.owner_id)
        if (ownerResult.data) {
          const owner = ownerResult.data
          
          // Format task data for notification
          const taskData = {
            owner_name: owner.full_name || owner.email,
            task_title: task.title,
            property_name: property.name,
            completed_date: new Date().toLocaleDateString(),
            task_description: task.description || 'No description provided'
          }
          
          // Send notification to property owner
          await NotificationService.sendNotification({
            userId: owner.id,
            category: 'task_completed',
            title: 'Task Completed',
            message: `Task "${task.title}" has been completed for ${property.name}.`,
            data: taskData,
            priority: 'normal',
            channels: ['email', 'in_app'],
            emailSubject: `Task Completed - ${property.name}`,
            emailTemplate: 'task_completed'
          })
        }
      }
      
      // Also notify admin/staff about completion
      const adminUsers = await this.getAdminUsers()
      for (const admin of adminUsers) {
        await NotificationService.sendNotification({
          userId: admin.id,
          category: 'task_completed',
          title: 'Task Completed',
          message: `Task "${task.title}" has been marked as completed.`,
          data: {
            admin_name: admin.name,
            task_title: task.title,
            property_name: property?.name || 'N/A',
            completed_date: new Date().toLocaleDateString()
          },
          priority: 'low',
          channels: ['in_app']
        })
      }
      
      console.log('✅ Task completion notifications sent successfully')
      
    } catch (error) {
      console.error('❌ Error sending task completion notification:', error)
    }
  }
  
  /**
   * Trigger notification for maintenance required
   */
  static async onMaintenanceRequired(propertyId: string, issue: string, priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'): Promise<void> {
    try {
      console.log(`🔧 Triggering maintenance notification for property ${propertyId}`)
      
      // Get property details
      const propertyResult = await SupabaseService.getProperty(propertyId)
      if (propertyResult.error || !propertyResult.data) {
        console.error('Property not found for maintenance notification')
        return
      }
      
      const property = propertyResult.data
      
      // Get property owner
      const ownerResult = await SupabaseService.getUser(property.owner_id)
      if (ownerResult.data) {
        const owner = ownerResult.data
        
        await NotificationService.sendNotification({
          userId: owner.id,
          category: 'maintenance_required',
          title: 'Maintenance Required',
          message: `Maintenance is required for ${property.name}: ${issue}`,
          data: {
            owner_name: owner.full_name || owner.email,
            property_name: property.name,
            issue,
            priority
          },
          priority,
          channels: priority === 'urgent' ? ['email', 'push', 'in_app'] : ['email', 'in_app'],
          emailSubject: `Maintenance Required - ${property.name}`,
          emailTemplate: 'maintenance_required'
        })
      }
      
      // Notify staff/admin
      const adminUsers = await this.getAdminUsers()
      for (const admin of adminUsers) {
        await NotificationService.sendNotification({
          userId: admin.id,
          category: 'maintenance_required',
          title: 'Maintenance Alert',
          message: `Maintenance required at ${property.name}: ${issue}`,
          data: {
            admin_name: admin.name,
            property_name: property.name,
            issue,
            priority
          },
          priority,
          channels: priority === 'urgent' ? ['push', 'in_app'] : ['in_app']
        })
      }
      
      console.log('✅ Maintenance notifications sent successfully')
      
    } catch (error) {
      console.error('❌ Error sending maintenance notification:', error)
    }
  }
  
  /**
   * Trigger system alert notifications
   */
  static async onSystemAlert(title: string, message: string, priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'): Promise<void> {
    try {
      console.log(`🚨 Triggering system alert: ${title}`)
      
      // Send to all admin users
      const adminUsers = await this.getAdminUsers()
      
      for (const admin of adminUsers) {
        await NotificationService.sendNotification({
          userId: admin.id,
          category: 'system_alert',
          title,
          message,
          data: {
            admin_name: admin.name,
            alert_time: new Date().toISOString()
          },
          priority,
          channels: priority === 'urgent' ? ['email', 'push', 'in_app'] : ['email', 'in_app'],
          emailSubject: `System Alert - ${title}`,
          emailTemplate: 'system_alert'
        })
      }
      
      console.log('✅ System alert notifications sent successfully')
      
    } catch (error) {
      console.error('❌ Error sending system alert notification:', error)
    }
  }
  
  /**
   * Get all admin/staff users
   */
  private static async getAdminUsers(): Promise<User[]> {
    try {
      const usersResult = await SupabaseService.getAllUsers()
      if (usersResult.error || !usersResult.data) {
        return []
      }
      
      return usersResult.data.filter((user: { role?: string }) => user.role === 'staff') as User[]
    } catch (error) {
      console.error('Error getting admin users:', error)
      return []
    }
  }
}
