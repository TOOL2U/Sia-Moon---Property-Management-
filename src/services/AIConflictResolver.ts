import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

interface ConflictAnalysisInput {
  bookingId: string
  bookingData: {
    propertyName: string
    guestName: string
    checkInDate: string
    checkOutDate: string
    guestCount: number
    price: number
  }
  conflicts: any[]
  triggeredBy: string
}

interface ConflictResolution {
  aiAnalysis: {
    canAutoResolve: boolean
    conflictSeverity: 'low' | 'medium' | 'high' | 'critical'
    conflicts: any[]
    reasoning: string
    suggestedActions: string[]
  }
  recommendations: string[]
  actionsToken: string[]
}

export class AIConflictResolver {
  private firestore

  constructor() {
    if (!db) {
      throw new Error('Firebase not initialized')
    }
    this.firestore = db
  }

  async analyzeAndResolve(input: ConflictAnalysisInput): Promise<ConflictResolution> {
    console.log('🤖 AI analyzing booking conflicts...')

    try {
      // Analyze conflict severity
      const conflictSeverity = this.assessConflictSeverity(input.conflicts)

      // Determine if conflicts can be auto-resolved
      const canAutoResolve = this.canAutoResolveConflicts(input.conflicts, conflictSeverity)

      // Generate AI reasoning and recommendations
      const aiAnalysis = await this.generateAIAnalysis(input, conflictSeverity, canAutoResolve)

      // Generate specific recommendations
      const recommendations = this.generateRecommendations(input, aiAnalysis)

      // Generate action tokens for automated resolution
      const actionsToken = canAutoResolve ? this.generateActionTokens(input, aiAnalysis) : []

      // Log the AI decision-making process
      await this.logAIDecision(input, aiAnalysis, recommendations, actionsToken)

      const resolution: ConflictResolution = {
        aiAnalysis,
        recommendations,
        actionsToken
      }

      console.log('🤖 AI conflict analysis completed:', {
        canAutoResolve,
        conflictSeverity,
        recommendationsCount: recommendations.length,
        actionsCount: actionsToken.length
      })

      return resolution

    } catch (error) {
      console.error('❌ AI conflict resolution failed:', error)

      // Return safe fallback resolution
      return {
        aiAnalysis: {
          canAutoResolve: false,
          conflictSeverity: 'high',
          conflicts: input.conflicts,
          reasoning: 'AI analysis failed - manual intervention required',
          suggestedActions: ['Contact property manager', 'Review conflicts manually']
        },
        recommendations: [
          'Manual review required due to AI analysis failure',
          'Contact property manager immediately',
          'Do not proceed with automatic booking approval'
        ],
        actionsToken: []
      }
    }
  }

  private assessConflictSeverity(conflicts: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (conflicts.length === 0) return 'low'

    let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    for (const conflict of conflicts) {
      const severity = conflict.severity || 'medium'

      if (severity === 'critical') return 'critical'
      if (severity === 'high' && maxSeverity !== 'critical') maxSeverity = 'high'
      if (severity === 'medium' && !['high', 'critical'].includes(maxSeverity)) maxSeverity = 'medium'
    }

    return maxSeverity
  }

  private canAutoResolveConflicts(conflicts: any[], severity: string): boolean {
    // Never auto-resolve critical conflicts
    if (severity === 'critical') return false

    // Check if all conflicts are resolvable types
    const resolvableTypes = ['meeting', 'inspection', 'other']

    return conflicts.every(conflict => {
      // Booking overlaps are critical and need manual intervention
      if (conflict.type === 'booking_overlap') return false

      // Calendar events with low severity can be auto-resolved
      if (conflict.type === 'calendar_event_overlap') {
        return resolvableTypes.includes(conflict.conflictingEventType)
      }

      return false
    })
  }

  private async generateAIAnalysis(
    input: ConflictAnalysisInput,
    severity: string,
    canAutoResolve: boolean
  ) {
    const reasoning = this.generateReasoning(input, severity, canAutoResolve)
    const suggestedActions = this.generateSuggestedActions(input, severity, canAutoResolve)

    return {
      canAutoResolve,
      conflictSeverity: severity as 'low' | 'medium' | 'high' | 'critical',
      conflicts: input.conflicts,
      reasoning,
      suggestedActions
    }
  }

  private generateReasoning(input: ConflictAnalysisInput, severity: string, canAutoResolve: boolean): string {
    const conflictCount = input.conflicts.length
    const property = input.bookingData.propertyName
    const guest = input.bookingData.guestName

    if (conflictCount === 0) {
      return `No conflicts detected for ${guest}'s booking at ${property}. Proceeding with automatic approval.`
    }

    let reasoning = `Detected ${conflictCount} conflict(s) for ${guest}'s booking at ${property}. `

    // Analyze conflict types
    const bookingConflicts = input.conflicts.filter(c => c.type === 'booking_overlap').length
    const calendarConflicts = input.conflicts.filter(c => c.type === 'calendar_event_overlap').length

    if (bookingConflicts > 0) {
      reasoning += `${bookingConflicts} booking overlap(s) detected - these require immediate manual intervention. `
    }

    if (calendarConflicts > 0) {
      reasoning += `${calendarConflicts} calendar event conflict(s) detected. `

      const lowPriorityEvents = input.conflicts.filter(c =>
        c.type === 'calendar_event_overlap' &&
        ['meeting', 'inspection', 'other'].includes(c.conflictingEventType)
      ).length

      if (lowPriorityEvents > 0) {
        reasoning += `${lowPriorityEvents} of these are low-priority events that can potentially be rescheduled. `
      }
    }

    reasoning += canAutoResolve
      ? 'AI assessment: Conflicts can be automatically resolved.'
      : 'AI assessment: Manual intervention required due to conflict severity.'

    return reasoning
  }

  private generateSuggestedActions(input: ConflictAnalysisInput, severity: string, canAutoResolve: boolean): string[] {
    const actions: string[] = []

    if (canAutoResolve) {
      actions.push('Automatically reschedule conflicting low-priority events')
      actions.push('Send notifications to affected staff about event changes')
      actions.push('Proceed with booking approval and calendar integration')
      actions.push('Monitor for any issues and escalate if needed')
    } else {
      actions.push('Immediately notify property manager about conflicts')
      actions.push('Contact guest to discuss alternative dates or solutions')
      actions.push('Review conflicting bookings/events for potential resolution')
      actions.push('Hold booking approval until conflicts are manually resolved')

      if (severity === 'critical') {
        actions.push('Escalate to senior management due to critical conflict severity')
        actions.push('Consider offering alternative properties or compensation')
      }
    }

    return actions
  }

  private generateRecommendations(input: ConflictAnalysisInput, aiAnalysis: any): string[] {
    const recommendations: string[] = []

    // Base recommendations based on conflict analysis
    if (aiAnalysis.canAutoResolve) {
      recommendations.push(`✅ AI can automatically resolve ${input.conflicts.length} conflict(s)`)
      recommendations.push('🔄 Low-priority events will be rescheduled automatically')
      recommendations.push('📧 Affected staff will be notified of changes')
      recommendations.push('🎯 Booking can proceed with automatic approval')
    } else {
      recommendations.push(`⚠️ Manual intervention required for ${input.conflicts.length} conflict(s)`)
      recommendations.push('🚫 Automatic booking approval blocked')
      recommendations.push('👥 Property manager notification sent')

      // Specific recommendations based on conflict types
      const bookingConflicts = input.conflicts.filter(c => c.type === 'booking_overlap')
      if (bookingConflicts.length > 0) {
        recommendations.push('🏠 Booking overlap detected - check for double-booking')
        recommendations.push('📞 Contact guest immediately to discuss alternatives')
      }

      const maintenanceConflicts = input.conflicts.filter(c =>
        c.type === 'calendar_event_overlap' && c.conflictingEventType === 'maintenance'
      )
      if (maintenanceConflicts.length > 0) {
        recommendations.push('🔧 Maintenance conflict - verify property readiness')
        recommendations.push('⏰ Consider rescheduling maintenance or booking')
      }
    }

    // Add timeline recommendations
    const checkInDate = new Date(input.bookingData.checkInDate)
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (daysUntilCheckIn <= 7) {
      recommendations.push(`⏰ Urgent: Check-in in ${daysUntilCheckIn} day(s) - prioritize resolution`)
    } else if (daysUntilCheckIn <= 30) {
      recommendations.push(`📅 Moderate urgency: ${daysUntilCheckIn} days until check-in`)
    }

    return recommendations
  }

  private generateActionTokens(input: ConflictAnalysisInput, aiAnalysis: any): string[] {
    const actions: string[] = []

    if (!aiAnalysis.canAutoResolve) return actions

    // Generate specific action tokens for automated resolution
    const resolvableConflicts = input.conflicts.filter(conflict =>
      conflict.type === 'calendar_event_overlap' &&
      ['meeting', 'inspection', 'other'].includes(conflict.conflictingEventType)
    )

    for (const conflict of resolvableConflicts) {
      actions.push(`reschedule_event:${conflict.conflictingEventId}`)
      actions.push(`notify_staff:${conflict.conflictingEventId}`)
    }

    actions.push(`approve_booking:${input.bookingId}`)
    actions.push(`create_calendar_events:${input.bookingId}`)
    actions.push(`notify_guest:${input.bookingId}`)

    return actions
  }

  private async logAIDecision(
    input: ConflictAnalysisInput,
    aiAnalysis: any,
    recommendations: string[],
    actionsToken: string[]
  ) {
    try {
      await addDoc(collection(this.firestore, 'ai_action_logs'), {
        timestamp: serverTimestamp(),
        agent: 'ai-conflict-resolver',
        action: 'analyze_booking_conflicts',
        bookingId: input.bookingId,
        propertyName: input.bookingData.propertyName,
        guestName: input.bookingData.guestName,
        conflictCount: input.conflicts.length,
        conflictSeverity: aiAnalysis.conflictSeverity,
        canAutoResolve: aiAnalysis.canAutoResolve,
        reasoning: aiAnalysis.reasoning,
        recommendations,
        actionsToken,
        triggeredBy: input.triggeredBy,
        success: true,
        details: {
          conflicts: input.conflicts,
          suggestedActions: aiAnalysis.suggestedActions
        }
      })

      console.log('📝 AI conflict resolution decision logged')

    } catch (error) {
      console.error('❌ Failed to log AI decision:', error)
    }
  }
}
