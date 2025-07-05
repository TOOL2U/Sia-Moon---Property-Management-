'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { useSupabaseReports } from '@/hooks/useSupabaseReports'
import SupabaseService from '@/lib/supabaseService'
import { Property, MonthlyReport } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Plus,
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function ClientReportsPage() {
  const { profile: user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [generateForm, setGenerateForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })
  
  const { 
    reports, 
    loading, 
    error, 
    generateReport, 
    loadReports, 
    downloadPDF,
    refreshReports
  } = useReports({ 
    propertyId: selectedProperty,
    autoLoad: false 
  })
  
  // Load user's properties
  useEffect(() => {
    const loadProperties = async () => {
      if (!user) return
      
      try {
        setLoadingProperties(true)
        const result = await SupabaseService.getPropertiesByOwner(user.id)
        
        if (result.error) {
          toast.error('Failed to load properties')
          return
        }
        
        const userProperties = result.data || []
        setProperties(userProperties)
        
        // Auto-select first property
        if (userProperties.length > 0 && !selectedProperty) {
          setSelectedProperty(userProperties[0].id)
        }
        
      } catch (error) {
        console.error('Error loading properties:', error)
        toast.error('Failed to load properties')
      } finally {
        setLoadingProperties(false)
      }
    }
    
    loadProperties()
  }, [user])
  
  // Load reports when property changes
  useEffect(() => {
    if (selectedProperty) {
      loadReports(selectedProperty)
    }
  }, [selectedProperty])
  
  const handleGenerateReport = async () => {
    if (!selectedProperty) {
      toast.error('Please select a property')
      return
    }
    
    const success = await generateReport({
      propertyId: selectedProperty,
      year: generateForm.year,
      month: generateForm.month,
      currency: 'USD'
    })
    
    if (success) {
      setShowGenerateForm(false)
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
  
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-400">Please log in to view reports.</p>
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
            <div>
              <h1 className="text-3xl font-bold mb-2">Monthly Reports</h1>
              <p className="text-neutral-400">View and download comprehensive property reports</p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setShowGenerateForm(!showGenerateForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Generate Report
              </Button>
              
              <Button
                variant="outline"
                onClick={refreshReports}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
        
        {/* Property Selection */}
        <Card className="bg-neutral-950 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Select Property</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProperties ? (
              <div className="flex items-center gap-2 text-neutral-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading properties...
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Properties Found</h3>
                <p className="text-neutral-400">You don't have any properties yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <Card 
                    key={property.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedProperty === property.id 
                        ? 'bg-primary-500/10 border-primary-500' 
                        : 'bg-neutral-900 border-neutral-700 hover:border-neutral-600'
                    }`}
                    onClick={() => setSelectedProperty(property.id)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-medium text-white mb-1">{property.name}</h3>
                      <p className="text-sm text-neutral-400">{property.address}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Generate Report Form */}
        {showGenerateForm && (
          <Card className="bg-neutral-950 border-neutral-800 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Generate New Report</CardTitle>
              <CardDescription>Create a monthly report for the selected property</CardDescription>
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
                    onClick={handleGenerateReport}
                    disabled={loading || !selectedProperty}
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
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Reports List */}
        {selectedProperty && (
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Reports</CardTitle>
              <CardDescription>
                Monthly reports for {properties.find(p => p.id === selectedProperty)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && reports.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-neutral-600" />
                  <p className="text-neutral-400">Loading reports...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Error Loading Reports</h3>
                  <p className="text-neutral-400 mb-4">{error}</p>
                  <Button onClick={refreshReports} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Reports Found</h3>
                  <p className="text-neutral-400 mb-4">Generate your first monthly report to get started.</p>
                  <Button onClick={() => setShowGenerateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="bg-neutral-900 border-neutral-700">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/10">
                              <FileText className="h-5 w-5 text-primary-400" />
                            </div>
                            <div>
                              <h3 className="font-medium text-white">
                                {format(new Date(report.year, report.month - 1), 'MMMM yyyy')}
                              </h3>
                              <p className="text-sm text-neutral-400">
                                Generated {format(new Date(report.generated_at), 'PPP')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadPDF(report.id)}
                              className="flex items-center gap-2"
                            >
                              <Download className="h-3 w-3" />
                              PDF
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <DollarSign className="h-4 w-4 text-green-400" />
                              <span className="text-sm text-neutral-400">Net Income</span>
                            </div>
                            <p className={`font-medium ${report.net_income >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(report.net_income, report.currency)}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <BarChart3 className="h-4 w-4 text-blue-400" />
                              <span className="text-sm text-neutral-400">Occupancy</span>
                            </div>
                            <p className="font-medium text-white">
                              {report.occupancy_rate.toFixed(1)}%
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Calendar className="h-4 w-4 text-purple-400" />
                              <span className="text-sm text-neutral-400">Bookings</span>
                            </div>
                            <p className="font-medium text-white">
                              {report.total_bookings}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <TrendingUp className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm text-neutral-400">Revenue</span>
                            </div>
                            <p className="font-medium text-white">
                              {formatCurrency(report.total_income, report.currency)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
