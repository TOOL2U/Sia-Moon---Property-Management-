'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ClearDataPage() {
  const [isClearing, setIsClearing] = useState(false)
  const [lastClearResult, setLastClearResult] = useState<{ 
    success: boolean; 
    message: string; 
    deletedCount?: number;
    deletedIds?: string[];
    details?: Record<string, unknown> 
  } | null>(null)

  const clearAllBookings = async () => {
    if (!confirm('⚠️ Are you sure you want to delete ALL bookings? This cannot be undone!')) {
      return
    }

    if (!confirm('🚨 FINAL WARNING: This will permanently delete all booking data. Continue?')) {
      return
    }

    try {
      setIsClearing(true)
      console.log('🧹 Starting booking cleanup...')

      const response = await fetch('/api/admin/clear-bookings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'sia-moon-admin-clear-2025'
        }
      })

      const result = await response.json()
      console.log('🔍 Clear bookings result:', result)

      if (result.success) {
        setLastClearResult(result)
        toast.success(`✅ Successfully deleted ${result.deletedCount} bookings`)
        console.log('✅ Bookings cleared successfully:', result)
      } else {
        toast.error(`❌ Failed to clear bookings: ${result.error}`)
        console.error('❌ Clear bookings failed:', result)
      }

    } catch (error) {
      console.error('❌ Error clearing bookings:', error)
      toast.error('❌ Network error while clearing bookings')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Data Management</h1>
          <p className="text-neutral-400">Clear test data and reset the system for fresh testing</p>
        </div>

        {/* Clear Bookings Card */}
        <Card className="bg-neutral-900 border-neutral-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Clear All Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span className="text-red-400 font-semibold">Danger Zone</span>
                </div>
                <p className="text-neutral-300 text-sm">
                  This will permanently delete all bookings from the live_bookings collection. 
                  Use this to clear test data before running fresh booking tests.
                </p>
              </div>

              <Button
                onClick={clearAllBookings}
                disabled={isClearing}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Clearing Bookings...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Bookings
                  </>
                )}
              </Button>

              {lastClearResult && (
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-semibold">Last Clear Result</span>
                  </div>
                  <div className="text-sm text-neutral-300">
                    <p><strong>Deleted:</strong> {lastClearResult.deletedCount} bookings</p>
                    <p><strong>Message:</strong> {lastClearResult.message}</p>
                    {lastClearResult.deletedIds && lastClearResult.deletedIds.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-neutral-400">Show deleted IDs</summary>
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          {lastClearResult.deletedIds.map((id: string, index: number) => (
                            <div key={id} className="text-xs text-neutral-500">
                              {index + 1}. {id}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-neutral-300">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold">1.</span>
                <span>Clear all existing bookings using the button above</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold">2.</span>
                <span>Send a new booking confirmation email to trigger Gmail automation</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold">3.</span>
                <span>Check the admin bookings dashboard for the new booking</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold">4.</span>
                <span>Test the approval workflow with clean data</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
