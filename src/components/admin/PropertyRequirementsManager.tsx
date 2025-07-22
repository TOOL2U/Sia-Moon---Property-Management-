'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  Save,
  Settings,
  Trash2,
  X
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export interface PropertyRequirementTemplate {
  id: string
  description: string
  isRequired: boolean
  category: 'safety' | 'cleaning' | 'maintenance' | 'inspection' | 'photo' | 'other'
  estimatedTime?: number // minutes
  notes?: string
}

interface PropertyRequirementsManagerProps {
  propertyId?: string
  initialRequirements?: PropertyRequirementTemplate[]
  onSave?: (requirements: PropertyRequirementTemplate[]) => void
  readOnly?: boolean
}

export function PropertyRequirementsManager({
  propertyId,
  initialRequirements = [],
  onSave,
  readOnly = false
}: PropertyRequirementsManagerProps) {
  const [requirements, setRequirements] = useState<PropertyRequirementTemplate[]>(initialRequirements)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Load requirements if propertyId is provided
  useEffect(() => {
    if (propertyId && !initialRequirements.length) {
      loadPropertyRequirements()
    }
  }, [propertyId])

  const loadPropertyRequirements = useCallback(async () => {
    if (!propertyId) return
    
    try {
      setLoading(true)
      // TODO: Replace with actual property API call
      const response = await fetch(`/api/properties/${propertyId}`)
      const data = await response.json()
      
      if (data.success && data.property?.requirementsTemplate) {
        setRequirements(data.property.requirementsTemplate)
      }
    } catch (error) {
      console.error('❌ Error loading property requirements:', error)
      toast.error('Failed to load property requirements')
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  const addRequirement = useCallback(() => {
    const newRequirement: PropertyRequirementTemplate = {
      id: `req_${Date.now()}`,
      description: '',
      isRequired: true,
      category: 'other',
      estimatedTime: 5,
      notes: ''
    }
    setRequirements(prev => [...prev, newRequirement])
  }, [])

  const updateRequirement = useCallback((id: string, updates: Partial<PropertyRequirementTemplate>) => {
    setRequirements(prev => 
      prev.map(req => req.id === id ? { ...req, ...updates } : req)
    )
  }, [])

  const deleteRequirement = useCallback((id: string) => {
    setRequirements(prev => prev.filter(req => req.id !== id))
  }, [])

  const saveRequirements = useCallback(async () => {
    try {
      setLoading(true)
      
      if (propertyId) {
        // Save to property
        const response = await fetch(`/api/properties/${propertyId}/requirements`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirementsTemplate: requirements })
        })
        
        if (!response.ok) {
          throw new Error('Failed to save requirements')
        }
      }
      
      // Call parent callback
      onSave?.(requirements)
      setIsEditing(false)
      
      toast.success('✅ Requirements template saved successfully')
    } catch (error) {
      console.error('❌ Error saving requirements:', error)
      toast.error('Failed to save requirements template')
    } finally {
      setLoading(false)
    }
  }, [requirements, propertyId, onSave])

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'safety': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'cleaning': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'maintenance': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'inspection': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'photo': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'safety': return '🛡️'
      case 'cleaning': return '🧹'
      case 'maintenance': return '🔧'
      case 'inspection': return '🔍'
      case 'photo': return '📸'
      default: return '📋'
    }
  }

  const totalEstimatedTime = requirements.reduce((sum, req) => sum + (req.estimatedTime || 0), 0)
  const requiredCount = requirements.filter(req => req.isRequired).length

  return (
    <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Job Requirements Template
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30">
              {requirements.length} Requirements
            </Badge>
            <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
              {totalEstimatedTime}min Total
            </Badge>
            {!readOnly && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
        <p className="text-gray-400">
          Define requirements that will be applied to all jobs created for this property.
          {requiredCount > 0 && ` ${requiredCount} required, ${requirements.length - requiredCount} optional.`}
        </p>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="ml-2 text-gray-400">Loading requirements...</span>
          </div>
        ) : requirements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No requirements defined for this property.</p>
            {!readOnly && (
              <Button onClick={addRequirement} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Add First Requirement
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {requirements.map((req, index) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    {isEditing ? (
                      <>
                        <Input
                          placeholder="Requirement description"
                          value={req.description}
                          onChange={(e) => updateRequirement(req.id, { description: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Select
                            value={req.category}
                            onValueChange={(value) => updateRequirement(req.id, { category: value as any })}
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="safety">🛡️ Safety</SelectItem>
                              <SelectItem value="cleaning">🧹 Cleaning</SelectItem>
                              <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                              <SelectItem value="inspection">🔍 Inspection</SelectItem>
                              <SelectItem value="photo">📸 Photo Documentation</SelectItem>
                              <SelectItem value="other">📋 Other</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Input
                            type="number"
                            placeholder="Est. minutes"
                            value={req.estimatedTime || ''}
                            onChange={(e) => updateRequirement(req.id, { estimatedTime: parseInt(e.target.value) || 0 })}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                          
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-white">
                              <input
                                type="checkbox"
                                checked={req.isRequired}
                                onChange={(e) => updateRequirement(req.id, { isRequired: e.target.checked })}
                                className="rounded border-slate-600"
                              />
                              Required
                            </label>
                            <Button
                              onClick={() => deleteRequirement(req.id)}
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <Input
                          placeholder="Additional notes (optional)"
                          value={req.notes || ''}
                          onChange={(e) => updateRequirement(req.id, { notes: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-medium">{req.description}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(req.category)}>
                              {getCategoryIcon(req.category)} {req.category}
                            </Badge>
                            {req.isRequired && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          {req.estimatedTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {req.estimatedTime} minutes
                            </div>
                          )}
                          {req.notes && (
                            <div className="flex-1">
                              <span className="text-gray-300">{req.notes}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isEditing && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <Button
                  onClick={addRequirement}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Requirement
                </Button>
                
                <Button
                  onClick={saveRequirements}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Template
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
