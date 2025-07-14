'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function VerifyCloudinaryPage() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])
  }

  const testUrl = (name: string, url: string) => {
    addLog(`Testing ${name}: ${url}`)

    if (typeof window !== 'undefined') {
      const img = new window.Image()
      img.onload = () => {
        addLog(`✅ ${name} loaded successfully`)
        setTestResults(prev => ({ ...prev, [name]: true }))
      }
      img.onerror = () => {
        addLog(`❌ ${name} failed to load`)
        setTestResults(prev => ({ ...prev, [name]: false }))
      }
      img.src = url
    } else {
      addLog(`❌ ${name} - Image testing not available on server`)
      setTestResults(prev => ({ ...prev, [name]: false }))
    }
  }

  const runAllTests = () => {
    setTestResults({})
    setLogs([])
    addLog('🚀 Starting Cloudinary URL tests...')

    const publicId = "villa-photos/iKCKOZIYz4RRSHvXymP4ziDhpgS2/Alesia_House/e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_n90qpl"
    const cloudName = "doez7m1hy"

    // Test various URL formats
    const tests = [
      {
        name: "Simple URL",
        url: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`
      },
      {
        name: "With basic transformations",
        url: `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_800,h_600/${publicId}`
      },
      {
        name: "With WebP format",
        url: `https://res.cloudinary.com/${cloudName}/image/upload/f_webp/${publicId}`
      },
      {
        name: "With quality",
        url: `https://res.cloudinary.com/${cloudName}/image/upload/q_auto/${publicId}`
      },
      {
        name: "Raw upload",
        url: `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`
      },
      {
        name: "Auto upload",
        url: `https://res.cloudinary.com/${cloudName}/image/upload/v1/${publicId}`
      },
      {
        name: "With version",
        url: `https://res.cloudinary.com/${cloudName}/image/upload/v1234567890/${publicId}`
      },
      {
        name: "JPG extension",
        url: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.jpg`
      },
      {
        name: "PNG extension",
        url: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.png`
      },
      {
        name: "WebP extension",
        url: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.webp`
      }
    ]

    tests.forEach((test, index) => {
      setTimeout(() => {
        testUrl(test.name, test.url)
      }, index * 500) // Stagger tests to avoid overwhelming
    })
  }

  const clearResults = () => {
    setTestResults({})
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Cloudinary URL Verification</CardTitle>
            <CardDescription className="text-neutral-400">
              Test different Cloudinary URL formats to find the working one for your hero image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={runAllTests}>
                Run All Tests
              </Button>
              <Button onClick={clearResults} variant="outline">
                Clear Results
              </Button>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold">Testing Public ID:</p>
                  <p className="font-mono text-xs">villa-photos/iKCKOZIYz4RRSHvXymP4ziDhpgS2/Alesia_House/e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_n90qpl</p>
                  <p className="font-semibold mt-2">Cloud Name:</p>
                  <p className="font-mono">doez7m1hy</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(testResults).map(([name, success]) => (
                <div key={name} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <span className="font-medium text-neutral-300">{name}</span>
                  <div className="flex items-center gap-2">
                    {success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm text-white">
                      {success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                </div>
              ))}
              {Object.keys(testResults).length === 0 && (
                <p className="text-neutral-500 col-span-2">No tests run yet. Click "Run All Tests" to start.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Working URLs */}
        {Object.entries(testResults).some(([_, success]) => success) && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Working URLs</CardTitle>
              <CardDescription className="text-neutral-400">
                These URLs successfully loaded the image
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(testResults)
                  .filter(([_, success]) => success)
                  .map(([name]) => {
                    const publicId = "e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn"
                    const cloudName = "doez7m1hy"
                    
                    let url = ""
                    switch (name) {
                      case "Simple URL":
                        url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`
                        break
                      case "With basic transformations":
                        url = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_800,h_600/${publicId}`
                        break
                      case "With WebP format":
                        url = `https://res.cloudinary.com/${cloudName}/image/upload/f_webp/${publicId}`
                        break
                      case "With quality":
                        url = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto/${publicId}`
                        break
                      case "Raw upload":
                        url = `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`
                        break
                      case "Auto upload":
                        url = `https://res.cloudinary.com/${cloudName}/image/upload/v1/${publicId}`
                        break
                      case "With version":
                        url = `https://res.cloudinary.com/${cloudName}/image/upload/v1234567890/${publicId}`
                        break
                      case "JPG extension":
                        url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.jpg`
                        break
                      case "PNG extension":
                        url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.png`
                        break
                      case "WebP extension":
                        url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.webp`
                        break
                    }
                    
                    return (
                      <div key={name} className="bg-neutral-800 p-3 rounded-lg">
                        <div className="font-medium text-green-400 mb-1">{name}</div>
                        <div className="text-xs font-mono text-neutral-300 break-all">{url}</div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Logs */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black p-4 rounded-lg max-h-64 overflow-y-auto">
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
