'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { clientToast as toast } from '@/utils/clientToast'
import { 
  Bot, 
  Zap, 
  AlertTriangle, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Sparkles,
  Brain,
  Rocket
} from 'lucide-react'

interface AIJobResult {
  success: boolean
  jobId?: string
  assignedStaffId?: string
  message: string
  aiAnalysis?: any
}

export default function AIJobCreationPanel() {
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<AIJobResult | null>(null)

  const createAIJob = async (action: string, options: any = {}) => {
    try {
      setLoading(true)
      toast.loading('🤖 AI is creating and assigning a job...', { id: 'ai-job' })

      const response = await fetch('/api/admin/ai-job-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, options })
      })

      const data = await response.json()

      if (data.success) {
        setLastResult({
          success: true,
          jobId: data.data.jobId,
          assignedStaffId: data.data.assignedStaffId,
          message: data.message,
          aiAnalysis: data.data.aiAnalysis
        })

        toast.success(
          `🤖 AI Success!\n${data.message}`,
          { id: 'ai-job', duration: 6000 }
        )
      } else {
        setLastResult({
          success: false,
          message: data.error || 'AI job creation failed'
        })
        toast.error(`❌ AI Failed: ${data.error}`, { id: 'ai-job' })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLastResult({
        success: false,
        message: errorMessage
      })
      toast.error('Error creating AI job', { id: 'ai-job' })
      console.error('Error creating AI job:', error)
    } finally {
      setLoading(false)
    }
  }

  const runTestScenarios = async () => {
    try {
      setLoading(true)
      toast.loading('🧪 Running AI test scenarios...', { id: 'ai-test' })

      const response = await fetch('/api/admin/ai-job-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_ai_scenarios' })
      })

      const data = await response.json()

      if (data.success) {
        const { successCount, failureCount } = data.data
        toast.success(
          `🧪 Test Complete!\n${successCount} successful, ${failureCount} failed`,
          { id: 'ai-test', duration: 6000 }
        )
      } else {
        toast.error(`❌ Test Failed: ${data.error}`, { id: 'ai-test' })
      }
    } catch (error) {
      toast.error('Error running AI tests', { id: 'ai-test' })
      console.error('Error running AI tests:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Job Creation & Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Job Creation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            onClick={() => createAIJob('create_ai_job', {
              jobType: 'cleaning',
              priority: 'medium',
              targetStaffEmail: 'staff@siamoon.com'
            })}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            AI Cleaning Job
          </Button>

          <Button
            onClick={() => createAIJob('create_custom_ai_job', {
              jobType: 'maintenance',
              priority: 'high',
              customPrompt: 'Pool maintenance needed before VIP guest arrival tomorrow'
            })}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            AI Custom Job
          </Button>

          <Button
            onClick={() => createAIJob('create_emergency_ai_job', {
              customPrompt: 'Emergency: Guest reported water leak in bathroom, needs immediate response'
            })}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-2" />
            )}
            AI Emergency
          </Button>

          <Button
            onClick={runTestScenarios}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Rocket className="w-4 h-4 mr-2" />
            )}
            Run AI Tests
          </Button>
        </div>

        {/* Last Result Display */}
        {lastResult && (
          <div className="bg-neutral-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              Last AI Job Result
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={lastResult.success ? "bg-green-600" : "bg-red-600"}>
                  {lastResult.success ? "Success" : "Failed"}
                </Badge>
                <span className="text-sm text-neutral-400">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              
              <p className="text-sm text-neutral-300">
                {lastResult.message}
              </p>
              
              {lastResult.success && lastResult.jobId && (
                <div className="text-xs text-neutral-400 space-y-1">
                  <div>Job ID: {lastResult.jobId}</div>
                  <div>Assigned to: {lastResult.assignedStaffId}</div>
                  {lastResult.aiAnalysis && (
                    <div>AI Analysis: Available in job details</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Features Description */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Zap className="w-5 h-5" />
            <span className="font-medium">AI-Powered Job Creation</span>
          </div>
          <div className="text-sm text-blue-300 space-y-1">
            <p>🤖 <strong>AI Cleaning Job</strong>: Creates intelligent cleaning assignments</p>
            <p>🧠 <strong>AI Custom Job</strong>: Generates jobs based on specific requirements</p>
            <p>🚨 <strong>AI Emergency</strong>: Creates urgent response jobs with high priority</p>
            <p>🧪 <strong>Run AI Tests</strong>: Tests multiple AI scenarios simultaneously</p>
          </div>
        </div>

        {/* Mobile Integration Notice */}
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Mobile Integration Active</span>
          </div>
          <div className="text-sm text-green-300 space-y-1">
            <p>📱 AI-created jobs are automatically sent to <strong>staff@siamoon.com</strong></p>
            <p>🚨 Mobile app receives <strong>URGENT notifications</strong> with job details</p>
            <p>🔔 Push notifications include AI-generated job descriptions</p>
            <p>⚡ Real-time synchronization between AI system and mobile app</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-neutral-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">How AI Job Creation Works</h4>
          <div className="text-sm text-neutral-300 space-y-1">
            <p>1. <strong>AI Analysis</strong>: OpenAI generates realistic job requirements</p>
            <p>2. <strong>Smart Assignment</strong>: AI selects the best staff member</p>
            <p>3. <strong>Job Creation</strong>: Creates detailed job document in Firebase</p>
            <p>4. <strong>Mobile Notification</strong>: Sends URGENT alert to staff mobile app</p>
            <p>5. <strong>Real-time Sync</strong>: Job appears immediately in mobile interface</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
