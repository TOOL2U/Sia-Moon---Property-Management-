'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Database,
  Server,
  Shield,
  Users,
  Building,
  Calendar,
  FileText,
  Bell,
  Zap
} from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'warning' | 'loading'
  description: string
  icon: React.ReactNode
  lastChecked?: string
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Supabase Database',
      status: 'loading',
      description: 'Core database connection',
      icon: <Database className="h-5 w-5" />
    },
    {
      name: 'Authentication',
      status: 'loading', 
      description: 'User authentication system',
      icon: <Shield className="h-5 w-5" />
    },
    {
      name: 'Profiles Service',
      status: 'loading',
      description: 'User profile management',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Properties Service',
      status: 'loading',
      description: 'Property management',
      icon: <Building className="h-5 w-5" />
    },
    {
      name: 'Bookings Service',
      status: 'loading',
      description: 'Booking management',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      name: 'Reports Service',
      status: 'loading',
      description: 'Report generation',
      icon: <FileText className="h-5 w-5" />
    },
    {
      name: 'Notifications Service',
      status: 'loading',
      description: 'Notification system',
      icon: <Bell className="h-5 w-5" />
    },
    {
      name: 'Edge Functions',
      status: 'loading',
      description: 'Serverless functions',
      icon: <Zap className="h-5 w-5" />
    }
  ])

  const [overallStatus, setOverallStatus] = useState<'healthy' | 'degraded' | 'down' | 'loading'>('loading')

  useEffect(() => {
    checkAllServices()
  }, [])

  const checkAllServices = async () => {
    try {
      // Test Supabase connection
      const response = await fetch('/api/test-supabase')
      const data = await response.json()

      const updatedServices = services.map(service => {
        switch (service.name) {
          case 'Supabase Database':
            return {
              ...service,
              status: data.database ? 'online' : 'offline',
              lastChecked: new Date().toLocaleTimeString()
            }
          case 'Authentication':
            return {
              ...service,
              status: data.auth ? 'online' : 'offline',
              lastChecked: new Date().toLocaleTimeString()
            }
          case 'Profiles Service':
            return {
              ...service,
              status: data.profiles ? 'online' : 'offline',
              lastChecked: new Date().toLocaleTimeString()
            }
          case 'Properties Service':
            return {
              ...service,
              status: data.properties ? 'online' : 'offline',
              lastChecked: new Date().toLocaleTimeString()
            }
          case 'Bookings Service':
            return {
              ...service,
              status: data.bookings ? 'online' : 'offline',
              lastChecked: new Date().toLocaleTimeString()
            }
          case 'Reports Service':
            return {
              ...service,
              status: data.reports ? 'online' : 'offline',
              lastChecked: new Date().toLocaleTimeString()
            }
          case 'Notifications Service':
            return {
              ...service,
              status: data.notifications ? 'online' : 'offline',
              lastChecked: new Date().toLocaleTimeString()
            }
          case 'Edge Functions':
            return {
              ...service,
              status: data.edgeFunctions ? 'online' : 'offline',
              lastChecked: new Date().toLocaleTimeString()
            }
          default:
            return service
        }
      })

      setServices(updatedServices as ServiceStatus[])

      // Calculate overall status
      const onlineCount = updatedServices.filter(s => s.status === 'online').length
      const totalCount = updatedServices.length

      if (onlineCount === totalCount) {
        setOverallStatus('healthy')
      } else if (onlineCount >= totalCount * 0.7) {
        setOverallStatus('degraded')
      } else {
        setOverallStatus('down')
      }

    } catch (error) {
      console.error('Status check failed:', error)
      setOverallStatus('down')
      setServices(prev => prev.map(service => ({
        ...service,
        status: 'offline',
        lastChecked: new Date().toLocaleTimeString()
      })))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'loading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Online</Badge>
      case 'offline':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Offline</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Warning</Badge>
      case 'loading':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Checking...</Badge>
      default:
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Unknown</Badge>
    }
  }

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'healthy':
        return 'text-green-500'
      case 'degraded':
        return 'text-yellow-500'
      case 'down':
        return 'text-red-500'
      case 'loading':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">System Status</h1>
          <div className={`text-2xl font-semibold ${getOverallStatusColor()}`}>
            {overallStatus === 'loading' && 'Checking System Health...'}
            {overallStatus === 'healthy' && 'All Systems Operational'}
            {overallStatus === 'degraded' && 'Some Services Degraded'}
            {overallStatus === 'down' && 'System Issues Detected'}
          </div>
          <p className="text-gray-400 mt-2">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Refresh Button */}
        <div className="text-center mb-8">
          <Button 
            onClick={checkAllServices}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Server className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {service.icon}
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                  </div>
                  {getStatusIcon(service.status)}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400 mb-3">
                  {service.description}
                </CardDescription>
                <div className="flex items-center justify-between">
                  {getStatusBadge(service.status)}
                  {service.lastChecked && (
                    <span className="text-xs text-gray-500">
                      {service.lastChecked}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-6">Quick Links</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild className="bg-gray-800 hover:bg-gray-700">
              <a href="/test-supabase">Test Supabase</a>
            </Button>
            <Button asChild className="bg-gray-800 hover:bg-gray-700">
              <a href="/auth/signup">Sign Up</a>
            </Button>
            <Button asChild className="bg-gray-800 hover:bg-gray-700">
              <a href="/dashboard">Dashboard</a>
            </Button>
            <Button asChild className="bg-gray-800 hover:bg-gray-700">
              <a href="/developers">Developers</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
