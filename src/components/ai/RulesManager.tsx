'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CheckCircle, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

// Interface for company rules data
interface CompanyRulesData {
  rules: string[]
  metadata?: {
    lastUpdated: string
    version: number
    totalRules: number
  }
}

// Interface for component state
interface RulesManagerState {
  rules: string[]
  editingIndex: number | null
  editingValue: string
  newRule: string
  loading: boolean
  saving: boolean
  error: string | null
  success: string | null
  metadata: {
    lastUpdated: string
    version: number
    totalRules: number
  } | null
}

export default function RulesManager() {
  const [state, setState] = useState<RulesManagerState>({
    rules: [],
    editingIndex: null,
    editingValue: '',
    newRule: '',
    loading: true,
    saving: false,
    error: null,
    success: null,
    metadata: null
  })

  // Load rules from API
  const loadRules = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const response = await fetch('/api/ai-policy')
      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          rules: data.rules || [],
          metadata: data.metadata || null,
          loading: false
        }))
      } else {
        throw new Error(data.error || 'Failed to load rules')
      }
    } catch (error) {
      console.error('Error loading rules:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load rules',
        loading: false
      }))
    }
  }

  // Add new rule
  const handleAdd = async () => {
    if (!state.newRule.trim()) {
      setState(prev => ({ ...prev, error: 'Rule cannot be empty' }))
      return
    }

    try {
      setState(prev => ({ ...prev, saving: true, error: null, success: null }))

      const response = await fetch('/api/ai-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: state.newRule.trim() })
      })

      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          rules: data.rules || [],
          metadata: data.metadata || null,
          newRule: '',
          saving: false,
          success: 'Rule added successfully'
        }))

        // Clear success message after 3 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, success: null }))
        }, 3000)
      } else {
        throw new Error(data.error || 'Failed to add rule')
      }
    } catch (error) {
      console.error('Error adding rule:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add rule',
        saving: false
      }))
    }
  }

  // Start editing a rule
  const handleEdit = (index: number) => {
    setState(prev => ({
      ...prev,
      editingIndex: index,
      editingValue: prev.rules[index] || '',
      error: null,
      success: null
    }))
  }

  // Save edited rule
  const handleSave = async (index: number) => {
    if (!state.editingValue.trim()) {
      setState(prev => ({ ...prev, error: 'Rule cannot be empty' }))
      return
    }

    try {
      setState(prev => ({ ...prev, saving: true, error: null, success: null }))

      const response = await fetch('/api/ai-policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index,
          rule: state.editingValue.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          rules: data.rules || [],
          metadata: data.metadata || null,
          editingIndex: null,
          editingValue: '',
          saving: false,
          success: 'Rule updated successfully'
        }))

        // Clear success message after 3 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, success: null }))
        }, 3000)
      } else {
        throw new Error(data.error || 'Failed to update rule')
      }
    } catch (error) {
      console.error('Error updating rule:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update rule',
        saving: false
      }))
    }
  }

  // Cancel editing
  const handleCancel = () => {
    setState(prev => ({
      ...prev,
      editingIndex: null,
      editingValue: '',
      error: null
    }))
  }

  // Delete rule
  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return
    }

    try {
      setState(prev => ({ ...prev, saving: true, error: null, success: null }))

      const response = await fetch(`/api/ai-policy?index=${index}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          rules: data.rules || [],
          metadata: data.metadata || null,
          saving: false,
          success: 'Rule deleted successfully'
        }))

        // Clear success message after 3 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, success: null }))
        }, 3000)
      } else {
        throw new Error(data.error || 'Failed to delete rule')
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete rule',
        saving: false
      }))
    }
  }

  // Clear error message
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  // Load rules on component mount
  useEffect(() => {
    loadRules()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              📋 AI Rules Manager
            </h2>
            <p className="text-sm text-muted-foreground">
              These rules guide AI decisions across the system.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {state.metadata && (
              <Badge variant="outline" className="text-xs">
                v{state.metadata.version} • {state.metadata.totalRules} rules
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadRules}
              disabled={state.loading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Alert */}
        {state.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {state.error}
              <Button variant="ghost" size="sm" onClick={clearError}>
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {state.success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {state.success}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {state.loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading rules...</span>
          </div>
        )}

        {/* Rules List */}
        {!state.loading && (
          <div className="space-y-3">
            {state.rules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No rules configured. Add your first rule below.
              </div>
            ) : (
              <ul className="space-y-3">
                {state.rules.map((rule, index) => (
                  <li key={index} className="flex items-center justify-between gap-2 p-3 border rounded-lg">
                    {state.editingIndex === index ? (
                      // Editing mode
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={state.editingValue}
                          onChange={(e) => setState(prev => ({ ...prev, editingValue: e.target.value }))}
                          className="flex-1"
                          placeholder="Enter rule..."
                          disabled={state.saving}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSave(index)}
                          disabled={state.saving || !state.editingValue.trim()}
                          className="flex items-center gap-1"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          disabled={state.saving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      // Display mode
                      <>
                        <div className="flex-1 text-sm">
                          <span className="text-muted-foreground mr-2">#{index + 1}</span>
                          {rule}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(index)}
                            disabled={state.saving}
                            className="flex items-center gap-1"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(index)}
                            disabled={state.saving || state.rules.length <= 1}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Add New Rule */}
        {!state.loading && (
          <div className="flex items-center gap-2 pt-4 border-t">
            <Input
              placeholder="Add new rule..."
              value={state.newRule}
              onChange={(e) => setState(prev => ({ ...prev, newRule: e.target.value }))}
              disabled={state.saving}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAdd()
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleAdd}
              disabled={state.saving || !state.newRule.trim()}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
        )}

        {/* Metadata */}
        {state.metadata && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Last updated: {new Date(state.metadata.lastUpdated).toLocaleString()} •
            Version: {state.metadata.version}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
