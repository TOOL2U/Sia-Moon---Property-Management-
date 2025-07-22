'use client'

import { AlertTriangle, Clock, Users, DollarSign } from 'lucide-react'
import { VitalMetric } from '@/hooks/useVitalSigns'

interface EmergencyMetricsProps {
  metrics: VitalMetric[]
}

export default function EmergencyMetrics({ metrics }: EmergencyMetricsProps) {
  // Filter critical metrics
  const criticalMetrics = metrics.filter(m => m.status === 'critical')
  const warningMetrics = metrics.filter(m => m.status === 'warning')

  if (criticalMetrics.length === 0 && warningMetrics.length === 0) {
    return null
  }

  // Generate emergency alerts based on critical metrics
  const generateEmergencyAlerts = () => {
    const alerts = []

    criticalMetrics.forEach(metric => {
      switch (metric.id) {
        case 'staff':
          alerts.push({
            icon: Users,
            title: 'Staff Shortage Critical',
            message: `Only ${metric.value} staff active. Immediate action required.`,
            severity: 'critical',
            action: 'Call backup staff'
          })
          break
        case 'response':
          alerts.push({
            icon: Clock,
            title: 'Slow Emergency Response',
            message: `Response time ${metric.value} exceeds 15min threshold.`,
            severity: 'critical',
            action: 'Check staff locations'
          })
          break
        case 'revenue':
          alerts.push({
            icon: DollarSign,
            title: 'Revenue Target at Risk',
            message: `Daily revenue ${metric.value} significantly below target.`,
            severity: 'critical',
            action: 'Review bookings'
          })
          break
        case 'efficiency':
          alerts.push({
            icon: AlertTriangle,
            title: 'Low Job Completion',
            message: `Efficiency at ${metric.value}. Jobs falling behind schedule.`,
            severity: 'critical',
            action: 'Reassign resources'
          })
          break
      }
    })

    // Add warning alerts
    warningMetrics.forEach(metric => {
      switch (metric.id) {
        case 'transitions':
          if (parseInt(metric.value) > 5) {
            alerts.push({
              icon: AlertTriangle,
              title: 'High Property Turnover',
              message: `${metric.value} properties in transition. Monitor closely.`,
              severity: 'warning',
              action: 'Optimize scheduling'
            })
          }
          break
        case 'satisfaction':
          if (parseFloat(metric.value) < 4.0) {
            alerts.push({
              icon: AlertTriangle,
              title: 'Guest Satisfaction Low',
              message: `Rating ${metric.value} below 4.0 threshold.`,
              severity: 'warning',
              action: 'Review feedback'
            })
          }
          break
      }
    })

    return alerts
  }

  const emergencyAlerts = generateEmergencyAlerts()

  if (emergencyAlerts.length === 0) {
    return null
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-700">
      <div className="flex items-center space-x-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <span className="text-sm font-semibold text-red-400">EMERGENCY ALERTS</span>
      </div>

      <div className="space-y-2">
        {emergencyAlerts.map((alert, index) => {
          const Icon = alert.icon
          const isCritical = alert.severity === 'critical'
          
          return (
            <div 
              key={index}
              className={`
                p-2 rounded-lg border transition-all duration-200
                ${isCritical 
                  ? 'bg-red-900/20 border-red-500/50 animate-pulse' 
                  : 'bg-yellow-900/20 border-yellow-500/50'
                }
              `}
            >
              <div className="flex items-start space-x-2">
                <Icon className={`h-4 w-4 mt-0.5 ${
                  isCritical ? 'text-red-400' : 'text-yellow-400'
                }`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-semibold ${
                      isCritical ? 'text-red-300' : 'text-yellow-300'
                    }`}>
                      {alert.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-mono uppercase ${
                      isCritical 
                        ? 'bg-red-900/30 text-red-300' 
                        : 'bg-yellow-900/30 text-yellow-300'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-300 mb-2">
                    {alert.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Recommended action: {alert.action}
                    </span>
                    
                    <button className={`
                      text-xs px-2 py-1 rounded transition-colors
                      ${isCritical 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      }
                    `}>
                      Take Action
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Emergency Contact Info */}
      {criticalMetrics.length > 0 && (
        <div className="mt-3 p-2 bg-red-900/10 border border-red-700 rounded">
          <div className="flex items-center justify-between">
            <div className="text-xs text-red-300">
              <div className="font-semibold">CRITICAL SITUATION DETECTED</div>
              <div>Multiple systems require immediate attention</div>
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded font-semibold">
              ESCALATE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
