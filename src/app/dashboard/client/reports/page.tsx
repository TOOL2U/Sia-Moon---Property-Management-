'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Lightbulb,
  Target,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { clientToast as toast } from '@/utils/clientToast'

interface FinancialReport {
  id: string
  bookingId: string
  propertyName: string
  guestName: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guests: number
  grossRevenue: number
  commission: number
  netRevenue: number
  currency: string
  month: string
  year: number
  quarter: string
  createdAt: any
}

interface FinancialSummary {
  totalBookings: number
  totalGrossRevenue: number
  totalCommission: number
  totalNetRevenue: number
  averageBookingValue: number
  averageNights: number
  occupancyRate: number
  topProperty: string
  monthlyBreakdown: any[]
  quarterlyBreakdown: any[]
  lastUpdated: any
}

export default function ClientReportsPage() {
  const { user } = useAuth()
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([])
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<string[]>([])

  useEffect(() => {
    if (user?.id) {
      loadFinancialData()
    }
  }, [user])

  const loadFinancialData = async () => {
    try {
      setLoading(true)
      console.log('📊 Loading financial data for client:', user?.id)

      if (!user?.id) {
        console.log('⚠️ No user ID available')
        return
      }

      const database = getDb()

      // Load financial reports from user subcollection
      const reportsQuery = query(
        collection(database, `users/${user.id}/financial_reports`),
        orderBy('createdAt', 'desc'),
        limit(50)
      )

      const reportsSnapshot = await getDocs(reportsQuery)
      const reports = reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FinancialReport[]

      setFinancialReports(reports)

      // Load latest financial summary
      const summaryQuery = query(
        collection(database, `users/${user.id}/financial_summaries`),
        orderBy('lastUpdated', 'desc'),
        limit(1)
      )

      const summarySnapshot = await getDocs(summaryQuery)
      if (!summarySnapshot.empty) {
        const summary = summarySnapshot.docs[0].data() as FinancialSummary
        setFinancialSummary(summary)

        // Generate AI insights
        const aiInsights = generateAIInsights(summary)
        setInsights(aiInsights)
      }

      console.log(`✅ Loaded ${reports.length} financial reports`)

    } catch (error) {
      console.error('❌ Error loading financial data:', error)
      toast.error('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  const generateAIInsights = (summary: FinancialSummary): string[] => {
    const insights: string[] = []

    // Revenue insights
    if (summary.averageBookingValue > 15000) {
      insights.push(`🎯 High-value bookings: Your average booking value of ฿${summary.averageBookingValue.toLocaleString()} is excellent`)
    }

    // Occupancy insights
    if (summary.occupancyRate > 80) {
      insights.push(`📈 Strong occupancy: ${summary.occupancyRate}% occupancy rate indicates high demand`)
    } else if (summary.occupancyRate < 60) {
      insights.push(`📊 Growth opportunity: ${summary.occupancyRate}% occupancy suggests room for improvement`)
    }

    // Booking frequency insights
    if (summary.totalBookings > 20) {
      insights.push(`🏆 Popular property: ${summary.totalBookings} bookings shows strong market appeal`)
    }

    return insights
  }

  const refreshData = () => {
    loadFinancialData()
    toast.success('Refreshing financial data...')
  }

  return (
    <DashboardLayout
      title="Financial Reports"
      subtitle="AI-powered financial analytics and insights for your properties"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto space-y-8">

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-neutral-400">Loading financial data...</p>
          </div>
        ) : (
          <>
            {/* AI Insights Section */}
            {insights.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    AI Financial Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-neutral-900/50 rounded-lg">
                      <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-neutral-300 text-sm">{insight}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-white">
                        ฿{financialSummary?.totalGrossRevenue?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-400">Net Revenue</p>
                      <p className="text-2xl font-bold text-white">
                        ฿{financialSummary?.totalNetRevenue?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-400">Total Bookings</p>
                      <p className="text-2xl font-bold text-white">
                        {financialSummary?.totalBookings || 0}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-400">Occupancy Rate</p>
                      <p className="text-2xl font-bold text-white">
                        {financialSummary?.occupancyRate || 0}%
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Financial Reports */}
            {financialReports.length > 0 && (
              <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    Recent Financial Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialReports.slice(0, 5).map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{report.propertyName}</h4>
                          <p className="text-sm text-neutral-400">
                            {report.guestName} • {report.nights} nights • {report.guests} guests
                          </p>
                          <p className="text-xs text-neutral-500">
                            {new Date(report.checkInDate).toLocaleDateString()} - {new Date(report.checkOutDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-400">
                            ฿{report.grossRevenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-neutral-400">
                            Net: ฿{report.netRevenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Data State */}
            {financialReports.length === 0 && (
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Financial Data Yet</h3>
                  <p className="text-neutral-400 mb-6">
                    Financial reports will automatically appear here when bookings are approved by our admin team.
                  </p>
                  <Button onClick={refreshData} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check for Updates
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

      </div>
    </DashboardLayout>
  )
}
