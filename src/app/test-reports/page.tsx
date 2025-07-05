'use client'

import { useState, useEffect } from 'react'
import { useReports } from '@/hooks/useReports'
import DatabaseService from '@/lib/dbService'
import { Property, FinancialTransaction } from '@/lib/db'
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
  TestTube,
  Database,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function TestReportsPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  
  const { 
    reports, 
    generateReport, 
    generateAllReports, 
    loadReports, 
    downloadPDF,
    refreshReports
  } = useReports({ autoLoad: false })
  
  useEffect(() => {
    loadProperties()
  }, [])
  
  const loadProperties = async () => {
    try {
      const result = await DatabaseService.getAllProperties()
      if (result.data) {
        setProperties(result.data)
        if (result.data.length > 0) {
          setSelectedProperty(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    }
  }
  
  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }
  
  const reset = () => {
    setTestResults([])
  }
  
  const createTestFinancialData = async () => {
    if (!selectedProperty) {
      addTestResult('❌ No property selected')
      return
    }
    
    try {
      addTestResult('📊 Creating test financial data...')
      
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      // Create sample income transactions
      const incomeTransactions: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>[] = [
        {
          property_id: selectedProperty,
          type: 'income',
          category: 'booking_revenue',
          amount: 150000, // $1,500.00
          currency: 'USD',
          description: 'Booking revenue - Guest A',
          date: `${year}-${month.toString().padStart(2, '0')}-05`,
          created_by: 'test-user'
        },
        {
          property_id: selectedProperty,
          type: 'income',
          category: 'booking_revenue',
          amount: 200000, // $2,000.00
          currency: 'USD',
          description: 'Booking revenue - Guest B',
          date: `${year}-${month.toString().padStart(2, '0')}-15`,
          created_by: 'test-user'
        },
        {
          property_id: selectedProperty,
          type: 'income',
          category: 'cleaning_fee',
          amount: 5000, // $50.00
          currency: 'USD',
          description: 'Cleaning fee',
          date: `${year}-${month.toString().padStart(2, '0')}-05`,
          created_by: 'test-user'
        }
      ]
      
      // Create sample expense transactions
      const expenseTransactions: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>[] = [
        {
          property_id: selectedProperty,
          type: 'expense',
          category: 'cleaning',
          amount: 8000, // $80.00
          currency: 'USD',
          description: 'Professional cleaning service',
          date: `${year}-${month.toString().padStart(2, '0')}-06`,
          created_by: 'test-user'
        },
        {
          property_id: selectedProperty,
          type: 'expense',
          category: 'maintenance',
          amount: 15000, // $150.00
          currency: 'USD',
          description: 'Pool maintenance',
          date: `${year}-${month.toString().padStart(2, '0')}-10`,
          created_by: 'test-user'
        },
        {
          property_id: selectedProperty,
          type: 'expense',
          category: 'utilities',
          amount: 12000, // $120.00
          currency: 'USD',
          description: 'Electricity bill',
          date: `${year}-${month.toString().padStart(2, '0')}-01`,
          created_by: 'test-user'
        }
      ]
      
      // Create all transactions
      for (const transaction of [...incomeTransactions, ...expenseTransactions]) {
        await DatabaseService.createFinancialTransaction(transaction)
      }
      
      addTestResult('✅ Test financial data created successfully')
      addTestResult(`📈 Created ${incomeTransactions.length} income transactions`)
      addTestResult(`📉 Created ${expenseTransactions.length} expense transactions`)
      
    } catch (error) {
      addTestResult(`❌ Error creating test data: ${error}`)
    }
  }
  
  const testReportGeneration = async () => {
    if (!selectedProperty) {
      addTestResult('❌ No property selected')
      return
    }
    
    try {
      addTestResult('📊 Testing report generation...')
      
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      const success = await generateReport({
        propertyId: selectedProperty,
        year,
        month,
        currency: 'USD'
      })
      
      if (success) {
        addTestResult('✅ Report generated successfully')
        await loadReports(selectedProperty)
      } else {
        addTestResult('❌ Report generation failed')
      }
      
    } catch (error) {
      addTestResult(`❌ Error generating report: ${error}`)
    }
  }
  
  const testPDFGeneration = async () => {
    if (reports.length === 0) {
      addTestResult('❌ No reports available for PDF generation')
      return
    }
    
    try {
      addTestResult('📄 Testing PDF generation...')
      
      const latestReport = reports[0]
      await downloadPDF(latestReport.id)
      
      addTestResult('✅ PDF generation and download successful')
      
    } catch (error) {
      addTestResult(`❌ Error generating PDF: ${error}`)
    }
  }
  
  const testBulkReportGeneration = async () => {
    try {
      addTestResult('📊 Testing bulk report generation...')
      
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      const success = await generateAllReports(year, month)
      
      if (success) {
        addTestResult('✅ Bulk report generation successful')
        await refreshReports()
      } else {
        addTestResult('❌ Bulk report generation failed')
      }
      
    } catch (error) {
      addTestResult(`❌ Error in bulk generation: ${error}`)
    }
  }
  
  const runAllTests = async () => {
    reset()
    setLoading(true)
    
    try {
      addTestResult('🚀 Starting comprehensive reports test...')
      
      // Test 1: Create test financial data
      await createTestFinancialData()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Test 2: Generate single report
      await testReportGeneration()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Test 3: Test PDF generation
      await testPDFGeneration()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Test 4: Test bulk generation
      await testBulkReportGeneration()
      
      addTestResult('🎉 All tests completed!')
      
    } catch (error) {
      addTestResult(`❌ Test suite failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }
  
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return `${currency} ${(amount / 100).toFixed(2)}`
  }
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Monthly Reports System Test
          </h1>
          <p className="text-neutral-400">
            Test all aspects of the monthly reports system including financial data, report generation, and PDF creation.
          </p>
        </div>
        
        {/* Property Selection */}
        <Card className="bg-neutral-900 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Test Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Test Property
                </label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={runAllTests}
                  disabled={loading || !selectedProperty}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Run All Tests
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Individual Test Buttons */}
        <Card className="bg-neutral-900 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Individual Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={createTestFinancialData}
                disabled={loading || !selectedProperty}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Create Test Data
              </Button>
              
              <Button
                onClick={testReportGeneration}
                disabled={loading || !selectedProperty}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Generate Report
              </Button>
              
              <Button
                onClick={testPDFGeneration}
                disabled={loading || reports.length === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Test PDF
              </Button>
              
              <Button
                onClick={testBulkReportGeneration}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Bulk Generate
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Test Results */}
        <Card className="bg-neutral-900 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Test Results</CardTitle>
            <CardDescription>Real-time test execution results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-neutral-500 text-center">No test results yet. Run a test to see results here.</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result.includes('✅') && <span className="text-green-400">{result}</span>}
                      {result.includes('❌') && <span className="text-red-400">{result}</span>}
                      {result.includes('⚠️') && <span className="text-yellow-400">{result}</span>}
                      {!result.includes('✅') && !result.includes('❌') && !result.includes('⚠️') && (
                        <span className="text-neutral-300">{result}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={reset}
                variant="outline"
                size="sm"
                disabled={testResults.length === 0}
              >
                Clear Results
              </Button>
              
              <Button
                onClick={() => loadReports(selectedProperty)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh Reports
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Generated Reports */}
        {reports.length > 0 && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Generated Reports</CardTitle>
              <CardDescription>Reports created during testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.slice(0, 3).map((report) => (
                  <Card key={report.id} className="bg-neutral-800 border-neutral-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-white">
                            {format(new Date(report.year, report.month - 1), 'MMMM yyyy')}
                          </h3>
                          <p className="text-sm text-neutral-400">
                            Net Income: {formatCurrency(report.net_income, report.currency)} | 
                            Occupancy: {report.occupancy_rate.toFixed(1)}%
                          </p>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => downloadPDF(report.id)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-3 w-3" />
                          Download PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Instructions */}
        <Card className="bg-neutral-900 border-neutral-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-neutral-300">
              <p>
                <strong>1. Create Test Data:</strong> Generates sample financial transactions (income and expenses) for the current month.
              </p>
              <p>
                <strong>2. Generate Report:</strong> Creates a comprehensive monthly report with financial analysis and occupancy metrics.
              </p>
              <p>
                <strong>3. Test PDF:</strong> Generates and downloads a PDF version of the latest report.
              </p>
              <p>
                <strong>4. Bulk Generate:</strong> Creates reports for all properties at once (useful for testing automation).
              </p>
              <p>
                <strong>5. Run All Tests:</strong> Executes all tests in sequence to validate the complete reports system.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
