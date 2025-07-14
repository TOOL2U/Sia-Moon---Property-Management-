'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import CloudinaryImage from '@/components/ui/CloudinaryImage'
import { NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME } from '@/lib/env'
import { CheckCircle, XCircle, AlertTriangle, Image as ImageIcon, Eye } from 'lucide-react'

export default function DebugCloudinaryPage() {
  const [testPublicId, setTestPublicId] = useState('e36eb55c-9c04-4d51-b1aa-8ce78e49ec97_s5opqn')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])
  }

  const testCloudinaryConfig = () => {
    setLogs([])
    addLog('🔍 Testing Cloudinary configuration...')

    // Check environment variables
    addLog(`📋 NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'MISSING'}`)
    addLog(`📋 process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'MISSING'}`)

    // Test URL generation
    const cloudName = NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'doez7m1hy'
    const testUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_300,h_200,c_fill,q_auto,f_webp/${testPublicId}`
    addLog(`🔗 Generated URL: ${testUrl}`)

    // Test image loading
    const img = new Image()
    img.onload = () => {
      addLog('✅ Image loaded successfully')
    }
    img.onerror = () => {
      addLog('❌ Image failed to load')
    }
    img.src = testUrl
  }

  const testDirectUrl = () => {
    addLog('🔍 Testing direct Cloudinary URL...')
    const directUrl = `https://res.cloudinary.com/doez7m1hy/image/upload/${testPublicId}`
    addLog(`🔗 Direct URL: ${directUrl}`)
    
    const img = new Image()
    img.onload = () => {
      addLog('✅ Direct URL loaded successfully')
    }
    img.onerror = () => {
      addLog('❌ Direct URL failed to load')
    }
    img.src = directUrl
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Cloudinary Debug Tool
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Debug Cloudinary image loading and environment configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={testPublicId}
                onChange={(e) => setTestPublicId(e.target.value)}
                placeholder="Cloudinary Public ID"
                className="flex-1"
              />
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button onClick={testCloudinaryConfig}>
                Test Configuration
              </Button>
              <Button onClick={testDirectUrl} variant="outline">
                Test Direct URL
              </Button>
              <Button onClick={clearLogs} variant="ghost">
                Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Environment Status */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Environment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <span className="font-medium text-neutral-300">Imported Cloud Name</span>
                <div className="flex items-center gap-2">
                  {NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-white">
                    {NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'MISSING'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <span className="font-medium text-neutral-300">Process Env Cloud Name</span>
                <div className="flex items-center gap-2">
                  {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-white">
                    {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'MISSING'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <span className="font-medium text-neutral-300">Fallback Cloud Name</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-white">doez7m1hy</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <span className="font-medium text-neutral-300">Test Public ID</span>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-white font-mono">
                    {testPublicId.substring(0, 20)}...
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CloudinaryImage Component Test */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">CloudinaryImage Component</CardTitle>
              <CardDescription className="text-neutral-400">
                Test using the CloudinaryImage component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative h-64 bg-neutral-800 rounded-lg overflow-hidden">
                  <CloudinaryImage
                    publicId={testPublicId}
                    alt="Test image"
                    fill
                    priority
                    opacity={12}
                    quality={100}
                    format="webp"
                    crop="fill"
                    gravity="center"
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
                <div className="text-sm text-neutral-400">
                  Using CloudinaryImage component with opacity=12
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direct Image Test */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Direct Image URL</CardTitle>
              <CardDescription className="text-neutral-400">
                Test using direct Cloudinary URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative h-64 bg-neutral-800 rounded-lg overflow-hidden">
                  <img
                    src={`https://res.cloudinary.com/doez7m1hy/image/upload/w_600,h_400,c_fill,q_auto,f_webp,o_12/${testPublicId}`}
                    alt="Direct test image"
                    className="w-full h-full object-cover"
                    onLoad={() => addLog('✅ Direct image loaded')}
                    onError={() => addLog('❌ Direct image failed')}
                  />
                </div>
                <div className="text-sm text-neutral-400">
                  Using direct Cloudinary URL with opacity=12
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Logs */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black p-4 rounded-lg max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-neutral-500">No logs yet. Click "Test Configuration" to start.</p>
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

        {/* URL Examples */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Generated URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-neutral-300 mb-1">Hero Image URL (with opacity=12):</div>
                <div className="text-xs font-mono text-neutral-400 bg-neutral-800 p-2 rounded break-all">
                  {`https://res.cloudinary.com/${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'doez7m1hy'}/image/upload/c_fill,g_center,q_100,f_webp,o_12/${testPublicId}`}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-300 mb-1">Direct URL (no opacity):</div>
                <div className="text-xs font-mono text-neutral-400 bg-neutral-800 p-2 rounded break-all">
                  {`https://res.cloudinary.com/${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'doez7m1hy'}/image/upload/${testPublicId}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
