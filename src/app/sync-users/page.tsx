'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { UserSyncService, UserSyncReport } from '@/lib/services/userSyncService'
import { CheckCircle, XCircle, AlertTriangle, Users, Database, Link, Trash2 } from 'lucide-react'

export default function SyncUsersPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [syncReport, setSyncReport] = useState<UserSyncReport | null>(null)
  const [validationResult, setValidationResult] = useState<{
    isConsistent: boolean
    issues: string[]
    recommendations: string[]
  } | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])
  }

  const runFullSynchronization = async () => {
    setIsRunning(true)
    setSyncReport(null)
    setLogs([])
    
    addLog('🚀 Starting full user synchronization...')
    
    try {
      const report = await UserSyncService.synchronizeAllUsers()
      setSyncReport(report)
      
      if (report.errors.length === 0) {
        addLog('✅ Synchronization completed successfully')
      } else {
        addLog(`⚠️ Synchronization completed with ${report.errors.length} errors`)
      }
      
    } catch (error) {
      addLog(`❌ Synchronization failed: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  const validateDataConsistency = async () => {
    addLog('🔍 Validating data consistency...')
    
    try {
      const result = await UserSyncService.validateDataConsistency()
      setValidationResult(result)
      
      if (result.isConsistent) {
        addLog('✅ Data is consistent across all collections')
      } else {
        addLog(`⚠️ Found ${result.issues.length} consistency issues`)
      }
      
    } catch (error) {
      addLog(`❌ Validation failed: ${error}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  useEffect(() => {
    // Run validation on page load
    validateDataConsistency()
  }, [])

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">User Profile Synchronization</CardTitle>
            <CardDescription className="text-neutral-400">
              Ensure data consistency across Firebase Auth, Firestore profiles, and property data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button 
                onClick={runFullSynchronization} 
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                {isRunning ? 'Synchronizing...' : 'Run Full Sync'}
              </Button>
              
              <Button 
                onClick={validateDataConsistency} 
                disabled={isRunning}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Validate Consistency
              </Button>

              <Button onClick={clearLogs} variant="ghost">
                Clear Logs
              </Button>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold">Synchronization Process:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Creates missing profiles for users in Firebase Auth</li>
                    <li>Links properties from user subcollections to profiles</li>
                    <li>Updates profile data with latest user information</li>
                    <li>Removes orphaned profiles without corresponding users</li>
                    <li>Validates data consistency across all collections</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Report */}
        {syncReport && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Synchronization Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-neutral-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-neutral-400">Total Users</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{syncReport.totalUsers}</div>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-neutral-400">Profiles Created</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{syncReport.profilesCreated}</div>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Link className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-neutral-400">Properties Linked</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{syncReport.propertiesLinked}</div>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-neutral-400">Orphans Removed</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{syncReport.orphanedProfilesRemoved}</div>
                </div>
              </div>

              {syncReport.details.profilesCreated.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2">Profiles Created:</h4>
                  <div className="bg-neutral-800 p-3 rounded-lg">
                    {syncReport.details.profilesCreated.map((email, index) => (
                      <div key={index} className="text-sm text-green-400">✅ {email}</div>
                    ))}
                  </div>
                </div>
              )}

              {syncReport.details.propertiesLinked.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2">Properties Linked:</h4>
                  <div className="bg-neutral-800 p-3 rounded-lg">
                    {syncReport.details.propertiesLinked.map((item, index) => (
                      <div key={index} className="text-sm text-purple-400">
                        🏠 {item.userId}: {item.propertyCount} properties
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {syncReport.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2">Errors:</h4>
                  <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg">
                    {syncReport.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-400">❌ {error}</div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Validation Results */}
        {validationResult && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {validationResult.isConsistent ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Data Consistency Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {validationResult.isConsistent ? (
                <div className="text-green-400">
                  ✅ All data is consistent across collections
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Issues Found:</h4>
                    <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg">
                      {validationResult.issues.map((issue, index) => (
                        <div key={index} className="text-sm text-red-400">❌ {issue}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Recommendations:</h4>
                    <div className="bg-yellow-900/20 border border-yellow-700 p-3 rounded-lg">
                      {validationResult.recommendations.map((rec, index) => (
                        <div key={index} className="text-sm text-yellow-400">💡 {rec}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Debug Logs */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black p-4 rounded-lg max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-neutral-500">No logs yet</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono text-green-400">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
