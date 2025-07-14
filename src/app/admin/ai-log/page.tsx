'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { aiPropertyAgent } from '@/lib/services/aiPropertyAgent'
import { AILog } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { 
  Brain, 
  Filter, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AILogPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<AILog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error' | 'needs_review'>('all')
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'positive' | 'negative' | 'none'>('all')
  const [selectedLog, setSelectedLog] = useState<AILog | null>(null)
  const [feedbackComment, setFeedbackComment] = useState('')

  // Route protection - admin only
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login')
        return
      }
      if (user.role !== 'admin') {
        router.push('/dashboard/client')
        return
      }
    }
  }, [user, authLoading, router])

  // Load AI logs
  const loadAILogs = useCallback(async () => {
    try {
      setLoading(true)
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {}
      const aiLogs = await aiPropertyAgent.getAILogs(filters)
      setLogs(aiLogs)
    } catch (error) {
      console.error('Error loading AI logs:', error)
      toast.error('Failed to load AI logs')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadAILogs()
  }, [statusFilter, loadAILogs])

  const handleFeedback = async (logId: string, feedback: 'positive' | 'negative') => {
    try {
      await aiPropertyAgent.updateLogFeedback(logId, feedback, feedbackComment)
      toast.success('Feedback submitted successfully')
      setFeedbackComment('')
      setSelectedLog(null)
      loadAILogs()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'needs_review':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <Target className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFeedbackIcon = (feedback: string | null | undefined) => {
    switch (feedback) {
      case 'positive':
        return <ThumbsUp className="w-4 h-4 text-green-500" />
      case 'negative':
        return <ThumbsDown className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.booking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ai_summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.property_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFeedback = feedbackFilter === 'all' || 
      (feedbackFilter === 'none' && !log.feedback) ||
      log.feedback === feedbackFilter
    
    return matchesSearch && matchesFeedback
  })

  const stats = {
    total: logs.length,
    success: logs.filter(log => log.status === 'success').length,
    error: logs.filter(log => log.status === 'error').length,
    needs_review: logs.filter(log => log.status === 'needs_review').length,
    with_feedback: logs.filter(log => log.feedback).length
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Property Management Log</h1>
          </div>
          <p className="text-gray-600">
            Review AI-powered booking analysis, property matching decisions, and provide feedback to improve the system.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{stats.success}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Need Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.needs_review}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{stats.error}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">With Feedback</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.with_feedback}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search booking ID, summary, or property..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="min-w-40">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'success' | 'error' | 'needs_review')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="needs_review">Needs Review</option>
                  <option value="error">Error</option>
                </select>
              </div>
              
              <div className="min-w-40">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback
                </label>
                <select 
                  value={feedbackFilter}
                  onChange={(e) => setFeedbackFilter(e.target.value as 'all' | 'positive' | 'negative' | 'none')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Feedback</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="none">No Feedback</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Logs List */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI logs found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || feedbackFilter !== 'all' 
                    ? 'Try adjusting your filters to see more results.'
                    : 'AI analyses will appear here when bookings are processed.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Booking: {log.booking_id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getFeedbackIcon(log.feedback)}
                      <Badge className={getStatusColor(log.status)}>
                        {log.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {log.confidence_score}% confidence
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Property Match</p>
                      <p className="text-sm text-gray-600">
                        {log.property_id || 'No match found'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Suggested Actions</p>
                      <div className="flex flex-wrap gap-1">
                        {log.suggested_actions.map((action, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {action.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">AI Summary</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {log.ai_summary}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">AI Reasoning</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {log.ai_reasoning}
                    </p>
                  </div>
                  
                  {log.feedback_comment && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Feedback Comment</p>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                        {log.feedback_comment}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {!log.feedback && (
                      <>
                        <Button
                          onClick={() => setSelectedLog(log)}
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:bg-green-50"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Good Analysis
                        </Button>
                        <Button
                          onClick={() => setSelectedLog(log)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Poor Analysis
                        </Button>
                      </>
                    )}
                    
                    <Button
                      onClick={() => window.open(`/admin/bookings?search=${log.booking_id}`, '_blank')}
                      size="sm"
                      variant="outline"
                      className="ml-auto"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Booking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Feedback Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Provide Feedback for AI Analysis
              </h3>
              <p className="text-gray-600 mb-4">
                Help improve our AI by providing feedback on this analysis.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Provide specific feedback on what was good or could be improved..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-2 justify-end">
                <Button
                  onClick={() => setSelectedLog(null)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleFeedback(selectedLog.id, 'positive')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Positive
                </Button>
                <Button
                  onClick={() => handleFeedback(selectedLog.id, 'negative')}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  Negative
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
