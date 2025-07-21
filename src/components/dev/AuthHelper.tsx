'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Shield, 
  Settings, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Crown,
  Code
} from 'lucide-react'
import { setMockUser, clearMockUser } from '@/lib/auth/useAuthGuard'
import { createMockAdminUser, getAdminStatus } from '@/lib/auth/isAdmin'

// Mock user presets for testing
const mockUsers = {
  admin: {
    id: 'admin-001',
    email: 'admin@siamoon.com',
    role: 'admin',
    isAdmin: true,
    adminLevel: 10,
    permissions: ['admin', 'ai_dashboard', 'settings', 'monitor']
  },
  manager: {
    id: 'manager-001', 
    email: 'manager@siamoon.com',
    role: 'manager',
    isAdmin: false,
    adminLevel: 5,
    permissions: ['ai_dashboard', 'rules']
  },
  user: {
    id: 'user-001',
    email: 'user@siamoon.com', 
    role: 'user',
    isAdmin: false,
    adminLevel: 1,
    permissions: ['basic']
  },
  developer: {
    id: 'dev-001',
    email: 'developer@siamoon.com',
    role: 'developer', 
    isAdmin: false,
    adminLevel: 6,
    permissions: ['ai_dashboard', 'rules', 'feedback', 'logs']
  }
}

export default function AuthHelper() {
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const handleSetUser = (userType: string) => {
    if (userType === 'none') {
      clearMockUser()
      setCurrentUser(null)
      return
    }

    const user = mockUsers[userType as keyof typeof mockUsers]
    if (user) {
      setMockUser(user)
      setCurrentUser(user)
    }
  }

  const getCurrentMockUser = () => {
    try {
      const userData = localStorage.getItem('mockUser')
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  }

  React.useEffect(() => {
    setCurrentUser(getCurrentMockUser())
  }, [])

  const adminStatus = getAdminStatus(currentUser)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 border-yellow-200 bg-yellow-50 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
            <Code className="h-5 w-5" />
            🚧 Dev Auth Helper
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current User Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-800">Current User:</span>
              {currentUser ? (
                <Badge variant="outline" className="text-green-700 border-green-300">
                  <User className="h-3 w-3 mr-1" />
                  {currentUser.role}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-700 border-red-300">
                  <XCircle className="h-3 w-3 mr-1" />
                  None
                </Badge>
              )}
            </div>

            {currentUser && (
              <div className="text-xs text-yellow-700 space-y-1">
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Admin Level:</strong> {adminStatus.adminLevel}/10</p>
                <p><strong>Is Admin:</strong> {adminStatus.isAdmin ? '✅' : '❌'}</p>
              </div>
            )}
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-yellow-800">
              Switch User:
            </label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select user type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    No User (Logged Out)
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-purple-500" />
                    Admin (Full Access)
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Manager (Limited Access)
                  </div>
                </SelectItem>
                <SelectItem value="developer">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-green-500" />
                    Developer (Dev Access)
                  </div>
                </SelectItem>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Regular User (No Access)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apply Button */}
          <Button 
            onClick={() => handleSetUser(selectedUser)}
            disabled={!selectedUser}
            className="w-full"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Apply & Reload
          </Button>

          {/* Accessible Features */}
          {currentUser && adminStatus.accessibleFeatures.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-yellow-800">
                Accessible Features:
              </p>
              <div className="flex flex-wrap gap-1">
                {adminStatus.accessibleFeatures.map(feature => (
                  <Badge 
                    key={feature} 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Bypass Status */}
          {adminStatus.bypassActive && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-xs">
                Development bypass is active. All features accessible.
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="text-xs text-yellow-600 space-y-1">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Select a user type to test different access levels</li>
              <li>Page will reload to apply changes</li>
              <li>Try accessing AI Dashboard with different roles</li>
              <li>Set NEXT_PUBLIC_BYPASS_AUTH=true to bypass all auth</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
