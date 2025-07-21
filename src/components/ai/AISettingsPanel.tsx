'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  RotateCcw, 
  Settings, 
  Shield, 
  Zap,
  Clock,
  Brain,
  AlertTriangle
} from 'lucide-react'

// Interface for AI settings
interface AISettings {
  temperature: number
  escalationThreshold: number
  simulationMode: boolean
  fallbackMessage: string
  maxTokens: number
  timeoutMs: number
  retryAttempts: number
  confidenceBoost: number
  debugMode: boolean
  modelVersion: string
  customPromptSuffix: string
  rateLimit: {
    requestsPerMinute: number
    enabled: boolean
  }
  security: {
    requireAuth: boolean
    allowedIPs: string[]
    logAllRequests: boolean
  }
}

interface AISettingsPanelProps {
  className?: string
  adminOnly?: boolean
}

export default function AISettingsPanel({ 
  className,
  adminOnly = true 
}: AISettingsPanelProps) {
  const [settings, setSettings] = useState<AISettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [version, setVersion] = useState<number>(0)

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  // Load AI settings
  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/ai-settings')
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.data)
        setHasChanges(false)
      } else {
        throw new Error('Failed to load AI settings')
      }
    } catch (err) {
      console.error('Error loading AI settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load AI settings')
    } finally {
      setLoading(false)
    }
  }

  // Update a specific setting
  const updateSetting = (field: keyof AISettings, value: any) => {
    if (!settings) return
    
    setSettings(prev => {
      if (!prev) return prev
      
      // Handle nested objects
      if (field === 'rateLimit' || field === 'security') {
        return {
          ...prev,
          [field]: { ...prev[field], ...value }
        }
      }
      
      return {
        ...prev,
        [field]: value
      }
    })
    
    setHasChanges(true)
    setError(null)
    setSuccess(null)
  }

  // Save settings
  const handleSave = async () => {
    if (!settings) return
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          updatedBy: 'admin', // In production, get from auth context
          reason: 'Settings updated via admin panel'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.data)
        setVersion(data.version)
        setHasChanges(false)
        setSuccess('Settings saved successfully!')
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error(data.error || 'Failed to save settings')
      }
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Reset to defaults
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          updatedBy: 'admin'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.data)
        setVersion(data.version)
        setHasChanges(false)
        setSuccess('Settings reset to defaults successfully!')
        
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error(data.error || 'Failed to reset settings')
      }
    } catch (err) {
      console.error('Error resetting settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to reset settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading AI settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p className="text-lg font-medium">Failed to load AI settings</p>
            <Button onClick={loadSettings} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              ⚙️ AI System Settings
              {version > 0 && (
                <Badge variant="outline" className="text-xs">
                  v{version}
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Control critical parameters for all AI agents. Changes take effect instantly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Unsaved Changes
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={loadSettings} disabled={loading || saving}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Core AI Parameters */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-medium">Core AI Parameters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="temperature">AI Temperature</Label>
              <Input
                id="temperature"
                type="number"
                value={settings.temperature}
                onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                min="0"
                max="2"
                step="0.1"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Controls randomness. Lower = safer, higher = more creative.
              </p>
            </div>

            <div>
              <Label htmlFor="escalationThreshold">Escalation Threshold</Label>
              <Input
                id="escalationThreshold"
                type="number"
                value={settings.escalationThreshold}
                onChange={(e) => updateSetting('escalationThreshold', parseFloat(e.target.value))}
                min="0"
                max="1"
                step="0.1"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Decisions below this confidence will escalate to human.
              </p>
            </div>

            <div>
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                value={settings.maxTokens}
                onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value))}
                min="100"
                max="8000"
                step="100"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum response length from AI model.
              </p>
            </div>

            <div>
              <Label htmlFor="confidenceBoost">Confidence Boost</Label>
              <Input
                id="confidenceBoost"
                type="number"
                value={settings.confidenceBoost}
                onChange={(e) => updateSetting('confidenceBoost', parseFloat(e.target.value))}
                min="-0.5"
                max="0.5"
                step="0.1"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Adjust AI confidence scores (-0.5 to +0.5).
              </p>
            </div>
          </div>
        </div>

        {/* System Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium">System Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Simulation Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Enable test runs without real-world consequences.
                </p>
              </div>
              <Switch
                checked={settings.simulationMode}
                onCheckedChange={(checked) => updateSetting('simulationMode', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Debug Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Enable detailed logging and debug information.
                </p>
              </div>
              <Switch
                checked={settings.debugMode}
                onCheckedChange={(checked) => updateSetting('debugMode', checked)}
                disabled={saving}
              />
            </div>

            <div>
              <Label htmlFor="modelVersion">AI Model Version</Label>
              <Select
                value={settings.modelVersion}
                onValueChange={(value) => updateSetting('modelVersion', value)}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeoutMs">Request Timeout (ms)</Label>
              <Input
                id="timeoutMs"
                type="number"
                value={settings.timeoutMs}
                onChange={(e) => updateSetting('timeoutMs', parseInt(e.target.value))}
                min="1000"
                max="120000"
                step="1000"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Fallback Message */}
        <div className="space-y-2">
          <Label htmlFor="fallbackMessage">Default Fallback Message</Label>
          <Textarea
            id="fallbackMessage"
            value={settings.fallbackMessage}
            onChange={(e) => updateSetting('fallbackMessage', e.target.value)}
            disabled={saving}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Message shown when AI cannot process a request.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
