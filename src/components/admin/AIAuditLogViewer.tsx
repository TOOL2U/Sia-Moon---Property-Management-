'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  FileText, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  User,
  Calendar
} from 'lucide-react'
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface AuditLogEntry {
  id: string
  action: string
  bookingId?: string
  guestName?: string
  propertyId?: string
  reason: string
  details?: any
  timestamp: any
  system: string
  aiEnabled: boolean
}

export default function AIAuditLogViewer() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'error'>('all')

  useEffect(() => {
    if (!db) {
      console.error("Firebase not initialized")
      setLoading(false)
      return
    }
    
    // Set up real-time listener for audit logs
    const auditLogsRef = collection(db, 'auditLogs')
    let auditQuery = query(
      auditLogsRef,
      where('system', '==', 'AI_BOOKING_APPROVAL'),
      orderBy('timestamp', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(
      auditQuery,
      (snapshot) => {
        const logs: AuditLogEntry[] = []
        snapshot.forEach((doc) => {
          logs.push({
            id: doc.id,
            ...doc.data()
          } as AuditLogEntry)
        })
        setAuditLogs(logs)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading audit logs:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const getFilteredLogs = () => {
    if (filter === 'all') return auditLogs
    
    return auditLogs.filter(log => {
      switch (filter) {
        case 'approved':
          return log.action === 'booking_approved'
        case 'rejected':
          return log.action === 'booking_rejected'
        case 'error':
          return log.action === 'booking_error'
        default:
          return true
      }
    })
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'booking_approved':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'booking_rejected':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'booking_error':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      default:
        return <FileText className="h-4 w-4 text-neutral-400" />
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'booking_approved':
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800">Approved</Badge>
      case 'booking_rejected':
        return <Badge variant="destructive" className="text-xs">Rejected</Badge>
      case 'booking_error':
        return <Badge variant="destructive" className="text-xs">Error</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{action}</Badge>
    }
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown'
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            AI Booking Audit Logs
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white text-sm"
            >
              <option value="all">All Actions</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="error">Errors</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="border-neutral-700 hover:bg-neutral-800"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-neutral-400 text-sm">
          Real-time log of AI booking approval decisions and actions
        </p>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Clock className="h-5 w-5 animate-spin text-neutral-400 mr-2" />
            <span className="text-neutral-400">Loading audit logs...</span>
          </div>
        ) : getFilteredLogs().length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No audit logs found</p>
            <p className="text-sm">AI booking decisions will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {getFilteredLogs().map((log) => (
              <div
                key={log.id}
                className="bg-neutral-800 rounded-lg p-4 border border-neutral-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getActionIcon(log.action)}
                    <span className="text-white font-medium">
                      {log.guestName || 'Unknown Guest'}
                    </span>
                    {getActionBadge(log.action)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-neutral-400">
                    <Calendar className="h-3 w-3" />
                    {formatTimestamp(log.timestamp)}
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  {log.bookingId && (
                    <p className="text-neutral-400">
                      <span className="text-neutral-500">Booking ID:</span> {log.bookingId}
                    </p>
                  )}
                  
                  {log.propertyId && (
                    <p className="text-neutral-400">
                      <span className="text-neutral-500">Property:</span> {log.propertyId}
                    </p>
                  )}
                  
                  <p className="text-neutral-300">
                    <span className="text-neutral-500">Reason:</span> {log.reason}
                  </p>
                  
                  {log.details && (
                    <details className="mt-2">
                      <summary className="text-neutral-500 cursor-pointer text-xs">
                        View Details
                      </summary>
                      <pre className="text-xs text-neutral-400 mt-1 bg-neutral-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-700">
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <User className="h-3 w-3" />
                    AI System
                  </div>
                  <div className="text-xs text-neutral-500">
                    AI Enabled: {log.aiEnabled ? '✅' : '❌'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
