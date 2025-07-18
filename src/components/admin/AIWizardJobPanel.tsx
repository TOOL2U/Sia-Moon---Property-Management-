'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { clientToast as toast } from '@/utils/clientToast'
import { 
  Wand2, 
  Sparkles, 
  Brain, 
  Target, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Users,
  Clock,
  MapPin,
  Wrench,
  Search,
  Home,
  Zap
} from 'lucide-react'

interface AIWizardResult {
  success: boolean
  jobId?: string
  assignedStaffId?: string
  assignedStaffName?: string
  message: string
  wizardData?: any
  assignmentAnalysis?: any
}

export default function AIWizardJobPanel() {
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<AIWizardResult | null>(null)

  const createWizardJob = async (action: string, options: any = {}) => {
    try {
      setLoading(true)
      toast.loading('🧙‍♂️ AI Wizard is creating comprehensive job...', { id: 'ai-wizard' })

      const response = await fetch('/api/admin/ai-wizard-job', {
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
          assignedStaffName: data.data.assignedStaffName,
          message: data.message,
          wizardData: data.data.wizardData,
          assignmentAnalysis: data.data.assignmentAnalysis
        })

        toast.success(
          `🧙‍♂️ AI Wizard Success!\n${data.message}`,
          { id: 'ai-wizard', duration: 8000 }
        )
      } else {
        setLastResult({
          success: false,
          message: data.error || 'AI wizard job creation failed'
        })
        toast.error(`❌ AI Wizard Failed: ${data.error}`, { id: 'ai-wizard' })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLastResult({
        success: false,
        message: errorMessage
      })
      toast.error('Error in AI wizard job creation', { id: 'ai-wizard' })
      console.error('Error in AI wizard job creation:', error)
    } finally {
      setLoading(false)
    }
  }

  const runWizardTests = async () => {
    try {
      setLoading(true)
      toast.loading('🧪 Running AI wizard test scenarios...', { id: 'wizard-test' })

      const response = await fetch('/api/admin/ai-wizard-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_wizard_scenarios' })
      })

      const data = await response.json()

      if (data.success) {
        const { successCount, failureCount } = data.data
        toast.success(
          `🧪 Wizard Tests Complete!\n${successCount} successful, ${failureCount} failed`,
          { id: 'wizard-test', duration: 6000 }
        )
      } else {
        toast.error(`❌ Wizard Tests Failed: ${data.error}`, { id: 'wizard-test' })
      }
    } catch (error) {
      toast.error('Error running wizard tests', { id: 'wizard-test' })
      console.error('Error running wizard tests:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          AI Wizard Job Creation & Intelligent Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Wizard Job Creation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button
            onClick={() => createWizardJob('create_comprehensive_cleaning')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white h-16 flex flex-col items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mb-1" />
                <span className="text-sm">Comprehensive Cleaning</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => createWizardJob('create_urgent_maintenance')}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white h-16 flex flex-col items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Wrench className="w-5 h-5 mb-1" />
                <span className="text-sm">Urgent Maintenance</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => createWizardJob('create_property_inspection')}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white h-16 flex flex-col items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5 mb-1" />
                <span className="text-sm">Property Inspection</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => createWizardJob('create_guest_preparation')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white h-16 flex flex-col items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Home className="w-5 h-5 mb-1" />
                <span className="text-sm">Guest Preparation</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => createWizardJob('create_wizard_job', {
              jobType: 'cleaning',
              priority: 'high',
              customPrompt: 'Create a custom villa management job with specific requirements'
            })}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-16 flex flex-col items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Brain className="w-5 h-5 mb-1" />
                <span className="text-sm">Custom AI Job</span>
              </>
            )}
          </Button>

          <Button
            onClick={runWizardTests}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white h-16 flex flex-col items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-sm">Run All Tests</span>
              </>
            )}
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
              Last AI Wizard Result
            </h4>
            
            <div className="space-y-3">
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
              
              {lastResult.success && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Job Details */}
                  <div className="bg-neutral-700 rounded-lg p-3">
                    <h5 className="text-white font-medium mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Job Details
                    </h5>
                    <div className="text-xs text-neutral-400 space-y-1">
                      <div>ID: {lastResult.jobId}</div>
                      {lastResult.wizardData && (
                        <>
                          <div>Type: {lastResult.wizardData.jobType}</div>
                          <div>Priority: {lastResult.wizardData.priority}</div>
                          <div>Duration: {lastResult.wizardData.estimatedDuration}min</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Assignment Details */}
                  <div className="bg-neutral-700 rounded-lg p-3">
                    <h5 className="text-white font-medium mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Assignment
                    </h5>
                    <div className="text-xs text-neutral-400 space-y-1">
                      <div>Staff: {lastResult.assignedStaffName}</div>
                      <div>UID: {lastResult.assignedStaffId?.substring(0, 8)}...</div>
                      {lastResult.assignmentAnalysis && (
                        <div>Confidence: {Math.round((lastResult.assignmentAnalysis.confidence || 0) * 100)}%</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Wizard Features */}
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Wand2 className="w-5 h-5" />
            <span className="font-medium">AI Wizard Capabilities</span>
          </div>
          <div className="text-sm text-purple-300 space-y-1">
            <p>🧙‍♂️ <strong>Comprehensive Job Creation</strong>: Uses wizard workflow with all required fields</p>
            <p>🎯 <strong>Intelligent Staff Assignment</strong>: AI analyzes best staff match with confidence scoring</p>
            <p>📱 <strong>URGENT Mobile Notifications</strong>: Sends high-priority alerts to assigned staff</p>
            <p>🔄 <strong>Complete Workflow Integration</strong>: Follows existing job management processes</p>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Clock className="w-5 h-5" />
            <span className="font-medium">AI Wizard Workflow</span>
          </div>
          <div className="text-sm text-blue-300 space-y-1">
            <p>1. <strong>AI Generation</strong>: Creates comprehensive job data using OpenAI GPT-4</p>
            <p>2. <strong>Intelligent Assignment</strong>: Analyzes staff skills, availability, and performance</p>
            <p>3. <strong>Wizard Integration</strong>: Uses existing job creation API and workflow</p>
            <p>4. <strong>Mobile Notification</strong>: Sends URGENT alert to staff@siamoon.com</p>
            <p>5. <strong>Real-time Sync</strong>: Job appears immediately in mobile app</p>
          </div>
        </div>

        {/* Mobile Integration Status */}
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Mobile Integration Active</span>
          </div>
          <div className="text-sm text-green-300 space-y-1">
            <p>📱 AI wizard jobs automatically sent to <strong>staff@siamoon.com</strong></p>
            <p>🚨 Mobile app receives <strong>URGENT notifications</strong> with complete job details</p>
            <p>🧙‍♂️ Jobs marked as "AI WIZARD" created for easy identification</p>
            <p>⚡ Real-time synchronization with existing mobile workflow</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
