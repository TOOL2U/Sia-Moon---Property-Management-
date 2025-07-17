'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { clientToast as toast } from '@/utils/clientToast'

interface ClearJobsUtilityProps {
  onJobsCleared?: () => void
}

export default function ClearJobsUtility({ onJobsCleared }: ClearJobsUtilityProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [lastClearResult, setLastClearResult] = useState<any>(null)

  // Get preview of what would be deleted
  const getPreview = async () => {
    try {
      setLoading(true)
      console.log('🔍 Getting job system preview...')
      
      const response = await fetch('/api/admin/clear-job-system')
      const data = await response.json()
      
      if (data.success) {
        setPreview(data)
        console.log('📊 Preview data:', data)
      } else {
        toast.error('Failed to get preview: ' + data.error)
      }
    } catch (error) {
      console.error('❌ Error getting preview:', error)
      toast.error('Failed to get preview')
    } finally {
      setLoading(false)
    }
  }

  // Clear all jobs and related data
  const clearJobSystem = async () => {
    if (!confirm('⚠️ This will permanently delete ALL jobs, assignments, and related data. Are you sure?')) {
      return
    }

    try {
      setLoading(true)
      console.log('🗑️ Clearing job system...')
      
      const response = await fetch('/api/admin/clear-job-system', {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        setLastClearResult(data)
        setPreview(null)
        toast.success(`✅ Successfully cleared ${data.totalDeleted} items from job system`)
        console.log('✅ Clear result:', data)
        
        // Notify parent component
        if (onJobsCleared) {
          onJobsCleared()
        }
      } else {
        toast.error('Failed to clear jobs: ' + data.error)
      }
    } catch (error) {
      console.error('❌ Error clearing jobs:', error)
      toast.error('Failed to clear job system')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Trash2 className="w-5 h-5 text-red-400" />
          Clear Job System
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Remove all jobs and related data for fresh testing
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={getPreview}
            disabled={loading}
            variant="outline"
            className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Preview
          </Button>
          
          <Button
            onClick={clearJobSystem}
            disabled={loading || !preview}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Clear All Jobs
          </Button>
        </div>

        {/* Preview Results */}
        {preview && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/50">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Items to be deleted:</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Jobs:</span>
                <Badge variant="outline" className="border-red-500/50 text-red-300">
                  {preview.counts.jobs}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Task Assignments:</span>
                <Badge variant="outline" className="border-red-500/50 text-red-300">
                  {preview.counts.taskAssignments}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Staff Tasks:</span>
                <Badge variant="outline" className="border-red-500/50 text-red-300">
                  {preview.counts.staffTasks}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Notifications:</span>
                <Badge variant="outline" className="border-red-500/50 text-red-300">
                  {preview.counts.jobNotifications}
                </Badge>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-600/50">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Total:</span>
                <Badge className="bg-red-600 text-white">
                  {preview.total} items
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Last Clear Result */}
        {lastClearResult && (
          <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium">Last Clear Result:</span>
            </div>
            
            <div className="text-sm text-gray-300">
              <p>✅ Deleted {lastClearResult.totalDeleted} total items</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(lastClearResult.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-yellow-400 font-medium">Warning:</p>
              <p className="text-gray-300">
                This action is permanent and cannot be undone. Use only for testing purposes.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
