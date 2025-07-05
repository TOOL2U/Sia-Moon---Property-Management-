'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { useSupabaseReports } from '@/hooks/useSupabaseReports'
import SupabaseService from '@/lib/supabaseService'
import { Property, MonthlyReport } from '@/types/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Plus,
  RefreshCw,
  Building,
  Users,
  BarChart3,
  ArrowLeft,
  Settings
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AdminReportsPage() {
  const { profile: user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [allReports, setAllReports] = useState<MonthlyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [generateForm, setGenerateForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })
  
  const {
    generateAllReports,
    downloadPDF
  } = useSupabaseReports({ autoLoad: false })
  
  useEffect(() => {
    if (user?.role === 'staff') {
      loadData()
    }
  }, [user])
  
  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load all properties
      const propertiesResult = await SupabaseService.getAllProperties()
      if (propertiesResult.data) {
        setProperties(propertiesResult.data)
      }

      // Load all reports
      const reportsResult = await SupabaseService.getAllMonthlyReports()
      if (reportsResult.data) {
        setAllReports(reportsResult.data)
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }
  
  const handleGenerateAllReports = async () => {
    const success = await generateAllReports(generateForm.year, generateForm.month)
    
    if (success) {
      setShowGenerateForm(false)
      await loadData() // Refresh data
    }
  }
  
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return `${currency} ${(amount / 100).toFixed(2)}`
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'generating': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'error': return 'bg-red-500/10 text-red-400 border-red-500/20'
      default: return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
    }
  }
  
  // Group reports by property
  const reportsByProperty = allReports.reduce((acc, report) => {
    if (!acc[report.property_id]) {
      acc[report.property_id] = []
    }
    acc[report.property_id].push(report)
    return acc
  }, {} as Record<string, MonthlyReport[]>)
  
  // Calculate summary statistics
  const totalReports = allReports.length
  const completedReports = allReports.filter(r => r.status === 'completed').length
  const totalRevenue = allReports.reduce((sum, r) => sum + r.total_income, 0)
  const totalExpenses = allReports.reduce((sum, r) => sum + r.total_expenses, 0)
  const averageOccupancy = allReports.length > 0 
    ? allReports.reduce((sum, r) => sum + r.occupancy_rate, 0) / allReports.length 
    : 0
  
  if (!user || user.role !== 'staff') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-400">Admin access required to view this page.</p>
          <Link href="/dashboard/client">
            <Button className="mt-4">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/admin">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              
              <div>
                <h1 className="text-3xl font-bold mb-2">Reports Management</h1>
                <p className="text-neutral-400">Manage monthly reports for all properties</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setShowGenerateForm(!showGenerateForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Generate Reports
              </Button>
              
              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
        
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-neutral-950 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Reports</p>
                  <p className="text-2xl font-bold text-white">{totalReports}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-neutral-950 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Properties</p>
                  <p className="text-2xl font-bold text-white">{properties.length}</p>
                </div>
                <Building className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-neutral-950 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-neutral-950 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Avg Occupancy</p>
                  <p className="text-2xl font-bold text-white">{averageOccupancy.toFixed(1)}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Generate Reports Form */}
        {showGenerateForm && (
          <Card className="bg-neutral-950 border-neutral-800 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Generate Reports for All Properties</CardTitle>
              <CardDescription>Create monthly reports for all properties for a specific month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Year</label>
                  <select
                    value={generateForm.year}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Month</label>
                  <select
                    value={generateForm.month}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>
                        {format(new Date(2024, month - 1), 'MMMM')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={handleGenerateAllReports}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate All
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Reports by Property */}
        <div className="space-y-6">
          {properties.map((property) => {
            const propertyReports = reportsByProperty[property.id] || []
            
            return (
              <Card key={property.id} className="bg-neutral-950 border-neutral-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{property.name}</CardTitle>
                      <CardDescription>{property.address}</CardDescription>
                    </div>
                    
                    <Badge variant="outline" className="text-neutral-400">
                      {propertyReports.length} reports
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {propertyReports.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No Reports</h3>
                      <p className="text-neutral-400">No reports generated for this property yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {propertyReports.slice(0, 6).map((report) => (
                        <Card key={report.id} className="bg-neutral-900 border-neutral-700">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-white">
                                {format(new Date(report.year, report.month - 1), 'MMM yyyy')}
                              </h4>
                              <Badge className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-neutral-400">Net Income:</span>
                                <span className={report.net_income >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {formatCurrency(report.net_income, report.currency)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-400">Occupancy:</span>
                                <span className="text-white">{report.occupancy_rate.toFixed(1)}%</span>
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadPDF(report.id)}
                              className="w-full mt-3"
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Download PDF
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
