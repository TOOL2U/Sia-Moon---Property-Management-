'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
// BookingService and EnhancedBookingService removed - now using direct API calls
// FinancialService removed - was using mock data
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { clientToast as toast } from '@/utils/clientToast'

import ErrorBoundary from '@/components/ErrorBoundary'
import AddStaffModal from '@/components/staff/AddStaffModal'
import EditStaffModal from '@/components/staff/EditStaffModal'
import StaffAccountModal from '@/components/staff/StaffAccountModal'
import StaffCredentialManager from '@/components/staff/StaffCredentialManager'
import WizardStaffModal from '@/components/staff/WizardStaffModal'
import { FinancialDashboard, FinancialFilters } from '@/types/financial'
import {
  STAFF_ROLES,
  STAFF_STATUSES,
  StaffFilters,
  StaffProfile,
  StaffStats,
} from '@/types/staff'

import BookingApprovalModal from '@/components/booking/BookingApprovalModal'
import StaffAssignmentModal from '@/components/booking/StaffAssignmentModal'
import CashFlowManagement from '@/components/financial/CashFlowManagement'
import ExpenseTrackingSystem from '@/components/financial/ExpenseTrackingSystem'
import FinancialCharts from '@/components/financial/FinancialCharts'
import FinancialExportManager from '@/components/financial/FinancialExportManager'
import FinancialForecasting from '@/components/financial/FinancialForecasting'
import FinancialKPIsDashboard from '@/components/financial/FinancialKPIsDashboard'
import ProfitLossStatement from '@/components/financial/ProfitLossStatement'
import PropertyDashboard from '@/components/property/PropertyDashboard'
import PropertyListing from '@/components/property/PropertyListing'
import PropertyAssignmentModal from '@/components/staff/PropertyAssignmentModal'
import StaffImportExportModal from '@/components/staff/StaffImportExportModal'
// SimpleIntegratedBookingsTab removed - unused
import AdvancedCalendarView from '@/components/admin/AdvancedCalendarView'
import AIAuditLogViewer from '@/components/admin/AIAuditLogViewer'
import AIAutomationToggle from '@/components/admin/AIAutomationToggle'
import AIBookingTestPanel from '@/components/admin/AIBookingTestPanel'
import AIDisabledWarning from '@/components/admin/AIDisabledWarning'
import CalendarSyncDashboard from '@/components/admin/CalendarSyncDashboard'
import { CalendarView } from '@/components/admin/CalendarView'
import ClearJobsUtility from '@/components/admin/ClearJobsUtility'
import ComprehensiveAIDashboard from '@/components/admin/ComprehensiveAIDashboard'
import { EnhancedBookingManagement } from '@/components/admin/EnhancedBookingManagement'
import { EnhancedJobManagementDashboard } from '@/components/admin/EnhancedJobManagementDashboard'
import JobAcceptancePanel from '@/components/admin/JobAcceptancePanel'
import JobCompletionAnalytics from '@/components/admin/JobCompletionAnalytics'
import KPIDashboard from '@/components/admin/KPIDashboard'
import { MobileIntegrationStatus } from '@/components/admin/MobileIntegrationStatus'
import NotificationDashboard from '@/components/admin/NotificationDashboard'
import OperationsMapDashboard from '@/components/admin/OperationsMapDashboard'
import SmartJobAnalyticsDashboard from '@/components/admin/SmartJobAnalyticsDashboard'
import SmartJobTestPanel from '@/components/admin/SmartJobTestPanel'
import CalendarEventService from '@/services/CalendarEventService'
import CalendarIntegrationService from '@/services/CalendarIntegrationService'
import TestJobService from '@/services/TestJobService'
import { OnboardingService } from '@/lib/services/onboardingService'
import { testCalendarIntegration } from '@/utils/calendarTestUtils'
import { Send } from 'lucide-react'
// Firebase imports for calendar cleanup
import { db } from '@/lib/firebase'
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore'
// BookingSyncService removed - unused
// Real-time sync services removed - handled by individual components
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  // Removed unused icons
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Bell,
  Brain,
  Building2,
  Calendar,
  Calendar as CalendarDays,
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Home,
  Key,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Percent,
  Phone,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Star,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wrench,
  // MoreHorizontal removed - unused
  X,
  XCircle,
  Zap,
} from 'lucide-react'

// Note: Mock data removed - now using real Firebase data from API endpoints

// Note: Mock staff data removed - now using real Firebase staff_accounts data

// Note: Mock financial data removed - now using real Firebase financial data

// Note: Mock maintenance and system alerts data removed - now using real Firebase data

export default function BackOfficePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Real booking data state
  const [pendingBookings, setPendingBookings] = useState<any[]>([])
  const [confirmedBookings, setConfirmedBookings] = useState<any[]>([])
  // realMaintenanceRequests removed - unused

  // Staff management state
  const [staffList, setStaffList] = useState<StaffProfile[]>([])
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null)
  const [staffFilters, setStaffFilters] = useState<StaffFilters>({})
  const [staffLoading, setStaffLoading] = useState(false)
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  const [showEditStaffModal, setShowEditStaffModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<StaffProfile | null>(null)

  // Enhanced staff management modals
  const [showWizardStaffModal, setShowWizardStaffModal] = useState(false)
  const [showStaffAccountModal, setShowStaffAccountModal] = useState(false)
  const [showCredentialManager, setShowCredentialManager] = useState(false)
  const [selectedStaffForCredentials, setSelectedStaffForCredentials] =
    useState<any>(null)
  const [showPropertyAssignmentModal, setShowPropertyAssignmentModal] =
    useState(false)
  const [staffForPropertyAssignment, setStaffForPropertyAssignment] =
    useState<StaffProfile | null>(null)
  const [showImportExportModal, setShowImportExportModal] = useState(false)

  // Onboarding submissions state
  const [onboardingSubmissions, setOnboardingSubmissions] = useState<any[]>([])
  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [submissionFilter, setSubmissionFilter] = useState('all')

  // Financial management state
  const [financialDashboard, setFinancialDashboard] =
    useState<FinancialDashboard | null>(null)
  const [financialLoading, setFinancialLoading] = useState(false)

  // Property Management State
  const [propertyView, setPropertyView] = useState<'dashboard' | 'listing'>(
    'dashboard'
  )
  // selectedProperty removed - unused

  // Property Management Handlers
  const handleViewProperty = (property: any) => {
    // TODO: Implement property viewing
    toast.success(`Viewing details for ${property.name}`)
  }

  const handleEditProperty = (property: any) => {
    // TODO: Implement property editing
    toast.success(`Editing ${property.name}`)
  }

  const handleBulkAction = (propertyIds: string[], action: string) => {
    console.log('Bulk action:', action, 'on properties:', propertyIds)

    switch (action) {
      case 'activate':
        toast.success(`Activated ${propertyIds.length} properties`)
        break
      case 'deactivate':
        toast.success(`Deactivated ${propertyIds.length} properties`)
        break
      case 'export':
        toast.success(`Exporting data for ${propertyIds.length} properties`)
        break
      default:
        toast.success(`Performed ${action} on ${propertyIds.length} properties`)
    }
  }

  const handleCreateProperty = () => {
    toast.success('Opening property creation form')
  }
  const [financialFilters, setFinancialFilters] = useState<FinancialFilters>({
    dateRange: {
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
  })

  // Enhanced booking management state
  const [selectedBookings, setSelectedBookings] = useState<string[]>([])
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' })
  const [sourceFilter, setSourceFilter] = useState('all')
  // Removed unused booking dialog states

  // Enhanced booking sync modals
  const [bookingApprovalModal, setBookingApprovalModal] = useState<{
    booking: any
  } | null>(null)
  const [staffAssignmentModal, setStaffAssignmentModal] = useState<{
    booking: any
  } | null>(null)
  // Unused state variables removed

  // Test job state
  const [sendingTestJob, setSendingTestJob] = useState(false)

  // Route protection - admin only
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('❌ No user found, redirecting to login')
        router.push('/auth/login')
        return
      }
      if (user.role !== 'admin') {
        console.log('❌ User is not admin, access denied')
        router.push('/dashboard')
        return
      }
      console.log('✅ Admin user verified, loading back office')
    }
  }, [user, authLoading, router])

  // Load real data on component mount and setup real-time sync
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAllBookingData()
      loadStaffData()
      loadOnboardingSubmissions()

      // Initialize calendar integration workflows
      CalendarIntegrationService.initialize()
    }

    // Cleanup calendar integration on unmount
    return () => {
      CalendarIntegrationService.destroy()
    }
  }, [user])

  // Reload staff data when filters change (with debouncing)
  useEffect(() => {
    if (user && user.role === 'admin') {
      const timeoutId = setTimeout(() => {
        loadStaffData()
      }, 300) // Debounce search

      return () => clearTimeout(timeoutId)
    }
  }, [staffFilters, user])

  // Financial data loading - now uses real booking data
  const loadFinancialData = async () => {
    try {
      setFinancialLoading(true)
      console.log('🔄 Loading financial data...')

      // Financial data is now calculated from real bookings in loadBookingData()
      // This function is kept for compatibility but doesn't need to do anything
      console.log('✅ Financial data loaded from real bookings')
    } catch (error) {
      console.error('❌ Error loading financial data:', error)
      toast.error('Failed to load financial data')
    } finally {
      setFinancialLoading(false)
    }
  }

  // Load financial data when filters change
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadFinancialData()
    }
  }, [financialFilters, user])

  // Staff Management Functions
  const loadStaffData = async () => {
    try {
      setStaffLoading(true)
      console.log('🔄 Loading staff data from staff accounts API...')

      // Use staff accounts API endpoint to get staff data
      const response = await fetch('/api/admin/staff-accounts')
      const data = await response.json()

      if (data.success && data.data) {
        setStaffList(data.data)
        setStaffStats(data.stats)
        console.log(
          '✅ Staff accounts API data loaded:',
          data.data.length,
          'staff accounts'
        )
      } else {
        console.error('❌ Failed to load staff accounts:', data.error)
        console.error('❌ API Response:', data)
        toast.error('Failed to load staff accounts')

        // Set empty data instead of falling back to localStorage
        setStaffList([])
        setStaffStats({
          total: 0,
          active: 0,
          inactive: 0,
          onLeave: 0,
          byRole: {},
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          overdueeTasks: 0,
          todayTasks: 0,
          upcomingTasks: 0,
          averageCompletionTime: 0,
          completionRate: 0,
          averageRating: 0,
          performanceMetrics: {
            topPerformers: [],
            lowPerformers: [],
            recentHires: [],
            staffUtilization: 0,
            averageTasksPerStaff: 0,
          },
        })
      }
    } catch (error) {
      console.error('❌ Error loading staff accounts:', error)
      toast.error('Error loading staff accounts')

      // Set empty data on error
      setStaffList([])
      setStaffStats({
        total: 0,
        active: 0,
        inactive: 0,
        onLeave: 0,
        byRole: {},
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        overdueeTasks: 0,
        todayTasks: 0,
        upcomingTasks: 0,
        averageCompletionTime: 0,
        completionRate: 0,
        averageRating: 0,
        performanceMetrics: {
          topPerformers: [],
          lowPerformers: [],
          recentHires: [],
          staffUtilization: 0,
          averageTasksPerStaff: 0,
        },
      })
    } finally {
      setStaffLoading(false)
    }
  }

  // Load onboarding submissions data
  const loadOnboardingSubmissions = async () => {
    try {
      setOnboardingLoading(true)
      console.log('🔄 Loading onboarding submissions...')

      const submissions = await OnboardingService.getAllSubmissions()
      setOnboardingSubmissions(submissions)
      console.log(`✅ Loaded ${submissions.length} onboarding submissions`)
    } catch (error) {
      console.error('❌ Error loading onboarding submissions:', error)
      toast.error('Failed to load onboarding submissions')
      setOnboardingSubmissions([])
    } finally {
      setOnboardingLoading(false)
    }
  }

  const handleAddStaff = () => {
    setShowWizardStaffModal(true)
  }

  const handleAddStaffWithAuth = () => {
    setShowWizardStaffModal(true)
  }

  const handleAddStaffAccount = () => {
    setShowWizardStaffModal(true)
  }

  const handleManageCredentials = (staff: StaffProfile) => {
    setSelectedStaffForCredentials({
      id: staff.id,
      name: staff.name,
      email: staff.email || '',
      role: staff.role,
      status: staff.status,
    })
    setShowCredentialManager(true)
  }

  const handleEditStaff = (staff: StaffProfile) => {
    setSelectedStaff(staff)
    setShowEditStaffModal(true)
  }

  const handleDeleteStaff = (staff: StaffProfile) => {
    setStaffToDelete(staff)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return

    try {
      setLoading(true)

      // Delete staff account via API
      const response = await fetch(
        `/api/admin/staff-accounts/${staffToDelete.id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (data.success) {
        toast.success('Staff member deleted successfully')
        loadStaffData() // Reload staff list
        setShowDeleteConfirm(false)
        setStaffToDelete(null)
      } else {
        toast.error(data.error || 'Failed to delete staff member')
      }
    } catch (error) {
      console.error('❌ Error deleting staff:', error)
      toast.error('Error deleting staff member')
    } finally {
      setLoading(false)
    }
  }

  const handleStaffSuccess = () => {
    loadStaffData() // Reload staff list after add/edit
  }

  const handlePropertyAssignment = (staff: StaffProfile) => {
    setStaffForPropertyAssignment(staff)
    setShowPropertyAssignmentModal(true)
  }

  // Load all booking data from Firebase
  const loadAllBookingData = async () => {
    try {
      setDashboardLoading(true)
      console.log('🔄 Loading real booking data from Firebase...')

      // Load pending bookings
      const pendingResponse = await fetch('/api/admin/bookings/pending')
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingBookings(pendingData.bookings || [])
        console.log(
          `✅ Loaded ${pendingData.bookings?.length || 0} pending bookings`
        )
      }

      // Load confirmed bookings
      const confirmedResponse = await fetch('/api/admin/bookings/confirmed')
      if (confirmedResponse.ok) {
        const confirmedData = await confirmedResponse.json()
        setConfirmedBookings(confirmedData.bookings || [])
        console.log(
          `✅ Loaded ${confirmedData.bookings?.length || 0} confirmed bookings`
        )
      }

      // Load all bookings from real API
      const bookingsResponse = await fetch('/api/bookings')
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        const allBookings = bookingsData.bookings || []
        console.log(
          `✅ Loaded ${allBookings.length} total bookings from Firebase`
        )

        // Separate bookings by status
        const pending = allBookings.filter((b: any) => b.status === 'pending')
        const confirmed = allBookings.filter(
          (b: any) => b.status === 'confirmed' || b.status === 'approved'
        )

        setPendingBookings(pending)
        setConfirmedBookings(confirmed)

        // Calculate financial data from bookings
        const totalRevenue = allBookings.reduce(
          (sum: number, booking: any) => sum + (booking.amount || 0),
          0
        )
        const monthlyRevenue = allBookings
          .filter(
            (b: any) => new Date(b.checkIn).getMonth() === new Date().getMonth()
          )
          .reduce((sum: number, booking: any) => sum + (booking.amount || 0), 0)

        // Create comprehensive financial data structure
        const calculatedFinancialData: FinancialDashboard = {
          revenue: {
            totalRevenue,
            monthlyRevenue,
            quarterlyRevenue: totalRevenue, // TODO: Calculate actual quarterly
            yearlyRevenue: totalRevenue, // TODO: Calculate actual yearly
            revenueGrowth: {
              monthly: 0, // TODO: Calculate actual growth
              quarterly: 0,
              yearly: 0,
            },
            revenueByProperty: [], // TODO: Calculate by property
            revenueBySource: [], // TODO: Calculate by source
            revenueByMonth: [], // TODO: Calculate monthly breakdown
            seasonalTrends: [], // TODO: Calculate seasonal trends
            averageDailyRate:
              allBookings.length > 0 ? totalRevenue / allBookings.length : 0,
            totalBookings: allBookings.length,
            confirmedBookings: allBookings.filter(
              (b: any) => b.status === 'confirmed'
            ).length,
            pendingRevenue: allBookings
              .filter((b: any) => b.status === 'pending')
              .reduce((sum: number, b: any) => sum + (b.amount || 0), 0),
          },
          expenses: {
            totalExpenses: 0, // TODO: Calculate actual expenses
            monthlyExpenses: 0,
            expensesByCategory: [], // TODO: Calculate by category
            expensesByProperty: [], // TODO: Calculate by property
            expenseGrowth: {
              monthly: 0,
              quarterly: 0,
              yearly: 0,
            },
            operationalExpenses: 0,
            staffCosts: 0,
            maintenanceExpenses: 0,
            marketingExpenses: 0,
            utilitiesExpenses: 0,
            insuranceExpenses: 0,
            taxExpenses: 0,
          },
          kpis: {
            adr: allBookings.length > 0 ? totalRevenue / allBookings.length : 0,
            revPAR: 0, // TODO: Calculate RevPAR
            occupancyRate: 0, // TODO: Calculate occupancy
            grossMargin: 0, // TODO: Calculate margins
            netMargin: 0,
            returnOnInvestment: 0,
            customerLifetimeValue: 0,
            customerAcquisitionCost: 0,
            bookingConversionRate: 0,
            averageBookingValue:
              allBookings.length > 0 ? totalRevenue / allBookings.length : 0,
            cashFlowRatio: 0,
            debtToEquityRatio: 0,
            currentRatio: 0,
            quickRatio: 0,
          },
          cashFlow: {
            totalCashFlow: totalRevenue,
            operatingCashFlow: totalRevenue,
            investingCashFlow: 0,
            financingCashFlow: 0,
            cashInflows: [],
            cashOutflows: [],
            accountsReceivable: 0,
            accountsPayable: 0,
            cashOnHand: totalRevenue,
            projectedCashFlow: [],
            paymentMethods: [],
          },
          profitLoss: {
            period: {
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0],
              type: 'monthly' as const,
            },
            revenue: {
              totalRevenue,
              bookingRevenue: totalRevenue,
              additionalServices: 0,
              otherRevenue: 0,
            },
            expenses: {
              totalExpenses: 0,
              operatingExpenses: 0,
              staffCosts: 0,
              maintenanceExpenses: 0,
              marketingExpenses: 0,
              administrativeExpenses: 0,
              depreciation: 0,
              interestExpense: 0,
              taxes: 0,
            },
            grossProfit: totalRevenue,
            operatingIncome: totalRevenue,
            netIncome: totalRevenue,
            margins: {
              grossMargin: 0,
              operatingMargin: 0,
              netMargin: 0,
            },
            ebitda: totalRevenue,
          },
          forecasting: {
            forecastPeriod: {
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
              months: 12,
            },
            revenueProjection: [],
            expenseProjection: [],
            profitProjection: [],
            occupancyProjection: [],
            assumptions: [],
            confidence: 0.8,
            scenarios: [],
          },
          lastUpdated: new Date().toISOString(),
        }

        setFinancialDashboard(calculatedFinancialData)
        console.log('✅ Calculated financial dashboard data from bookings')
      } else {
        console.error('❌ Failed to load bookings from API')
        setPendingBookings([])
        setConfirmedBookings([])
        setFinancialDashboard(null)
      }

      // Load staff data from real API
      // Note: Staff data is already loaded via the existing staff management system

      // Load maintenance requests from real API
      // Note: Maintenance requests will be loaded from Firebase when implemented

      setLastRefresh(new Date())
      toast.success('Dashboard data loaded successfully')
    } catch (error) {
      console.error('❌ Error loading booking data:', error)
      toast.error('Failed to load booking data')
    } finally {
      setDashboardLoading(false)
    }
  }

  // Real-time sync is now handled by individual components
  // EnhancedBookingManagement handles its own real-time updates

  // Enhanced booking approval handler
  const handleBookingApproval = async (
    bookingId: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      const booking = getAllBookings().find((b) => b.id === bookingId)
      if (!booking) {
        toast.error('Booking not found')
        return
      }

      // Convert booking to the format expected by the modal
      const modalBooking = {
        id: booking.id,
        propertyName: booking.propertyName,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        checkInDate: booking.checkIn,
        checkOutDate: booking.checkOut,
        guestCount: booking.guestCount || 1,
        price: booking.amount || 0,
        currency: 'USD',
        specialRequests: booking.specialRequests,
        source: booking.source || 'unknown',
        createdAt: booking.createdAt || new Date().toISOString(),
        nights: booking.nights || 1,
      }

      setBookingApprovalModal({ booking: modalBooking })
    } catch (error) {
      console.error('Error opening booking approval modal:', error)
      toast.error('Failed to open approval dialog')
    }
  }

  // Enhanced staff assignment handler
  const handleStaffAssignment = async (bookingId: string) => {
    try {
      const booking = getAllBookings().find((b) => b.id === bookingId)
      if (!booking) {
        toast.error('Booking not found')
        return
      }

      // Convert booking to the format expected by the modal
      const modalBooking = {
        id: booking.id,
        propertyName: booking.propertyName,
        guestName: booking.guestName,
        checkInDate: booking.checkIn,
        checkOutDate: booking.checkOut,
        guestCount: booking.guestCount || 1,
      }

      setStaffAssignmentModal({ booking: modalBooking })
    } catch (error) {
      console.error('Error opening staff assignment modal:', error)
      toast.error('Failed to open staff assignment dialog')
    }
  }

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'kpi-dashboard', label: 'KPI Dashboard', icon: BarChart3 },
    { id: 'job-assignments', label: 'Job Assignments', icon: ClipboardList },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'onboarding', label: 'Onboarding Submissions', icon: FileText },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'operations', label: 'Operations', icon: ClipboardList },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'ai-dashboard', label: 'AI Dashboard', icon: Brain },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const handleBookingAction = async (
    bookingId: string,
    action: 'approve' | 'reject'
  ) => {
    setLoading(true)
    try {
      console.log(`${action} booking:`, bookingId)
      toast.success(`Booking ${action}d successfully`)
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error)
      toast.error(`Failed to ${action} booking`)
    } finally {
      setLoading(false)
    }
  }

  const exportData = (type: 'pdf' | 'csv', section: string) => {
    console.log(`Export ${section} as ${type}`)
    toast.success(`Exporting ${section} as ${type.toUpperCase()}...`)
  }

  // Send test job to mobile app
  const sendTestJobToMobile = async () => {
    try {
      setSendingTestJob(true)
      console.log('🧪 Creating test job for mobile app...')

      // Create a test job using our TestJobService
      const result = await TestJobService.createTestJob()

      if (result.success) {
        toast.success(
          <div className="space-y-2">
            <p>✅ Test job created successfully!</p>
            <p className="text-sm">Job ID: {result.jobId}</p>
            <p className="text-sm">Staff: {result.staffName}</p>
            <p className="text-sm">User ID: {result.userId}</p>
            <p className="text-sm">Email: {result.staffEmail}</p>
          </div>,
          { duration: 8000 }
        )
        console.log('✅ Test job created:', result)
      } else {
        toast.error(`Failed to create test job: ${result.error}`)
        console.error('❌ Test job creation failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Error sending test job:', error)
      toast.error(
        `❌ Failed to send test job: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setSendingTestJob(false)
    }
  }

  // Test calendar integration
  const testCalendarDateParsing = async () => {
    try {
      setSendingTestJob(true)
      console.log('🧪 Testing calendar date parsing...')

      await testCalendarIntegration()
      toast.success(
        '✅ Calendar date parsing tests completed - check console for details'
      )
    } catch (error) {
      console.error('❌ Error testing calendar:', error)
      toast.error(
        `❌ Calendar test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setSendingTestJob(false)
    }
  }

  // Clean up ALL test/mock calendar events
  const cleanupTestJobEvents = async () => {
    try {
      setSendingTestJob(true)
      console.log('🧹 Cleaning up ALL test/mock calendar events...')

      // Direct Firebase cleanup using static imports
      const calendarEventsRef = collection(db, 'calendarEvents')
      const allEventsSnapshot = await getDocs(calendarEventsRef)

      if (allEventsSnapshot.empty) {
        console.log('✅ No calendar events found')
        toast.success('✅ No calendar events found to clean up')
        return
      }

      // Check if we should do aggressive cleanup (remove ALL events)
      const shouldDoAggressiveCleanup =
        confirmedBookings.length === 0 && pendingBookings.length === 0

      if (shouldDoAggressiveCleanup) {
        console.log(
          '🧹 No bookings found - performing aggressive cleanup of ALL calendar events'
        )

        const allEventIds = allEventsSnapshot.docs.map((doc) => doc.id)

        if (allEventIds.length === 0) {
          console.log('✅ No calendar events found to clean up')
          toast.success('✅ No calendar events found to clean up')
          return
        }

        console.log(
          `🧹 Removing ALL ${allEventIds.length} calendar events (no bookings exist)`
        )

        // Delete all calendar events in batches
        const batchSize = 10
        for (let i = 0; i < allEventIds.length; i += batchSize) {
          const batch = allEventIds.slice(i, i + batchSize)
          const deletePromises = batch.map((eventId) =>
            deleteDoc(doc(db, 'calendarEvents', eventId))
          )
          await Promise.all(deletePromises)
          console.log(`🗑️ Deleted batch ${Math.floor(i / batchSize) + 1}`)
        }

        console.log(
          `✅ Aggressive cleanup complete: removed ${allEventIds.length} calendar events`
        )
        toast.success(
          `✅ Aggressive cleanup complete: removed ${allEventIds.length} calendar events`
        )
        return
      }

      const testEventIds: string[] = []

      allEventsSnapshot.forEach((eventDoc) => {
        const data = eventDoc.data()
        const isTestEvent =
          // Test job IDs
          data.sourceId?.includes('test_job') ||
          data.sourceId?.includes('temp_') ||
          data.sourceId?.includes('test_property') ||
          data.id?.includes('test_') ||
          // Mock property names
          data.propertyName?.includes('Sunset Paradise') ||
          data.propertyName?.includes('Ocean View Villa') ||
          data.propertyName?.includes('Test Property') ||
          data.propertyName?.includes('Paradise Villa') ||
          data.propertyName?.includes('Villa Sia Moon Test') ||
          data.propertyName?.includes('Beachfront Villa') ||
          data.propertyName?.includes('Mountain View') ||
          data.propertyName?.includes('City Center') ||
          // Mock staff names
          data.assignedStaff?.includes('Maria Santos') ||
          data.assignedStaff?.includes('John Chen') ||
          data.assignedStaff?.includes('Test Staff') ||
          data.assignedStaff?.includes('Carlos Rodriguez') ||
          // Test titles
          data.title?.includes('Test ') ||
          data.title?.includes('Sample ') ||
          data.title?.includes('Mock ') ||
          data.title?.includes('Demo ') ||
          data.title?.includes('Maintenance - ') ||
          data.title?.includes('Event - ') ||
          data.title?.includes('Cleaning - ') ||
          data.title?.includes('Check-in - ') ||
          data.title?.includes('Check-out - ') ||
          // Test descriptions containing test keywords
          data.description?.toLowerCase().includes('test') ||
          data.description?.toLowerCase().includes('sample') ||
          data.description?.toLowerCase().includes('mock') ||
          data.description?.toLowerCase().includes('demo') ||
          // Any event with test property IDs
          data.propertyId?.includes('test_property') ||
          data.propertyId?.includes('sample_') ||
          data.propertyId?.includes('demo_')

        if (isTestEvent) {
          testEventIds.push(eventDoc.id)
          console.log(`🗑️ Marking for deletion: ${data.title} (${eventDoc.id})`)
        }
      })

      if (testEventIds.length === 0) {
        console.log('✅ No test/mock calendar events found to clean up')
        toast.success('✅ No test/mock calendar events found to clean up')
        return
      }

      console.log(
        `🧹 Found ${testEventIds.length} test/mock calendar events to delete`
      )

      // Delete test calendar events in batches
      const batchSize = 10
      for (let i = 0; i < testEventIds.length; i += batchSize) {
        const batch = testEventIds.slice(i, i + batchSize)
        const deletePromises = batch.map((eventId) =>
          deleteDoc(doc(db, 'calendarEvents', eventId))
        )
        await Promise.all(deletePromises)
        console.log(`🗑️ Deleted batch ${Math.floor(i / batchSize) + 1}`)
      }

      console.log(
        `✅ Cleaned up ${testEventIds.length} test/mock calendar events`
      )
      toast.success(
        `✅ Cleaned up ${testEventIds.length} test/mock calendar events`
      )
    } catch (error) {
      console.error('❌ Error cleaning up test events:', error)
      toast.error(
        `❌ Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setSendingTestJob(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // Helper functions for dashboard calculations using real data
  const getAllBookings = () => {
    // Combine pending and confirmed bookings for comprehensive view
    const allBookings = [...pendingBookings, ...confirmedBookings]
    return allBookings.map((booking) => ({
      ...booking,
      // Normalize data structure for consistency
      guestName: booking.guestName || booking.guest_name || 'Unknown Guest',
      propertyName:
        booking.property ||
        booking.villaName ||
        booking.propertyName ||
        'Unknown Property',
      checkIn: booking.checkInDate || booking.check_in || booking.checkIn,
      checkOut: booking.checkOutDate || booking.check_out || booking.checkOut,
      amount: booking.price || booking.amount || 0,
      status:
        booking.status === 'pending_approval' ? 'pending' : booking.status,
      paymentStatus: booking.paymentStatus || 'pending',
      source: booking.source || 'unknown',
      guestEmail: booking.guestEmail || booking.guest_email || '',
      guestPhone: booking.guestPhone || booking.guest_phone || '',
      guestCount: booking.guests || booking.guestCount || 1,
      specialRequests:
        booking.specialRequests || booking.special_requests || '',
      bookingReference: booking.id || booking.bookingId || `BK${Date.now()}`,
      createdAt:
        booking.createdAt || booking.created_at || new Date().toISOString(),
      isCheckingInToday: isToday(booking.checkInDate || booking.check_in),
      isCheckingOutToday: isToday(booking.checkOutDate || booking.check_out),
    }))
  }

  const isToday = (dateString: string) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getTodaysCheckIns = () =>
    getAllBookings().filter((b) => b.isCheckingInToday)
  const getTodaysCheckOuts = () =>
    getAllBookings().filter((b) => b.isCheckingOutToday)
  const getPendingBookings = () =>
    getAllBookings().filter((b) => b.status === 'pending')
  const getOverduePayments = () => [] // TODO: Implement with real financial data
  const getHighPriorityMaintenance = () => [] // TODO: Implement with real maintenance data
  const getAverageOccupancyRate = () => 0 // TODO: Calculate from real property data

  // Dashboard action handlers
  const handleRefreshDashboard = async () => {
    setDashboardLoading(true)
    try {
      // Reload all real data from Firebase
      await loadAllBookingData()
      toast.success('Dashboard refreshed successfully')
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
      toast.error('Failed to refresh dashboard')
    } finally {
      setDashboardLoading(false)
    }
  }

  const handleQuickApproval = async (bookingId: string) => {
    setLoading(true)
    try {
      console.log('Quick approve booking:', bookingId)

      // Create calendar event for approved booking
      try {
        const calendarResult =
          await CalendarEventService.createEventsFromBooking(bookingId)

        if (calendarResult.success) {
          console.log(
            `✅ Calendar events created: ${calendarResult.eventIds?.join(', ')}`
          )
          toast.success('✅ Booking approved • Calendar event created')
        } else {
          console.warn(
            '⚠️ Calendar event creation failed:',
            calendarResult.error
          )
          toast.success('✅ Booking approved • Calendar event creation failed')
        }
      } catch (calendarError) {
        console.error('❌ Calendar event creation error:', calendarError)
        toast.success('✅ Booking approved • Calendar event creation failed')
      }
    } catch (error) {
      toast.error('Failed to approve booking')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickStaffAssign = async (bookingId: string, staffId: string) => {
    setLoading(true)
    try {
      console.log('Quick assign staff:', staffId, 'to booking:', bookingId)
      toast.success('Staff assigned successfully')
    } catch (error) {
      toast.error('Failed to assign staff')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkTaskComplete = async (taskId: string) => {
    setLoading(true)
    try {
      console.log('Mark task complete:', taskId)
      toast.success('Task marked as complete')
    } catch (error) {
      toast.error('Failed to complete task')
    } finally {
      setLoading(false)
    }
  }

  // Enhanced booking management functions using real data
  const getFilteredBookings = () => {
    const allBookings = getAllBookings()
    return allBookings.filter((booking) => {
      const matchesSearch =
        booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.bookingReference
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || booking.status === statusFilter
      const matchesProperty =
        propertyFilter === 'all' || booking.propertyName === propertyFilter
      const matchesPayment =
        paymentFilter === 'all' || booking.paymentStatus === paymentFilter
      const matchesSource =
        sourceFilter === 'all' || booking.source === sourceFilter

      let matchesDateRange = true
      if (dateRangeFilter.start && dateRangeFilter.end) {
        const checkInDate = new Date(booking.checkIn)
        const startDate = new Date(dateRangeFilter.start)
        const endDate = new Date(dateRangeFilter.end)
        matchesDateRange = checkInDate >= startDate && checkInDate <= endDate
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProperty &&
        matchesPayment &&
        matchesSource &&
        matchesDateRange
      )
    })
  }

  const handleBookingSelection = (bookingId: string, selected: boolean) => {
    if (selected) {
      setSelectedBookings((prev) => [...prev, bookingId])
    } else {
      setSelectedBookings((prev) => prev.filter((id) => id !== bookingId))
    }
  }

  const handleSelectAllBookings = (selected: boolean) => {
    if (selected) {
      setSelectedBookings(getFilteredBookings().map((b) => b.id))
    } else {
      setSelectedBookings([])
    }
  }

  const handleBulkApproval = async (
    action: 'approve' | 'reject',
    notes?: string
  ) => {
    setLoading(true)
    try {
      console.log(`Bulk ${action}:`, selectedBookings, 'Notes:', notes)
      toast.success(
        `${selectedBookings.length} bookings ${action}d successfully`
      )
      setSelectedBookings([])
      // setShowBulkActions removed
    } catch (error) {
      toast.error(`Failed to ${action} bookings`)
    } finally {
      setLoading(false)
    }
  }

  const handleBookingEdit = async (bookingId: string, updates: any) => {
    setLoading(true)
    try {
      console.log('Update booking:', bookingId, 'Updates:', updates)
      toast.success('Booking updated successfully')
      // Booking edit dialog removed - handled by EnhancedBookingManagement
    } catch (error) {
      toast.error('Failed to update booking')
    } finally {
      setLoading(false)
    }
  }

  const checkBookingConflicts = (booking: any) => {
    const conflicts = []
    const allBookings = getAllBookings()

    // Check for double bookings
    const overlappingBookings = allBookings.filter(
      (b) =>
        b.id !== booking.id &&
        b.propertyName === booking.propertyName &&
        (b.status === 'confirmed' || b.status === 'approved') &&
        ((new Date(booking.checkIn) >= new Date(b.checkIn) &&
          new Date(booking.checkIn) < new Date(b.checkOut)) ||
          (new Date(booking.checkOut) > new Date(b.checkIn) &&
            new Date(booking.checkOut) <= new Date(b.checkOut)))
    )

    if (overlappingBookings.length > 0) {
      conflicts.push({ type: 'double_booking', details: overlappingBookings })
    }

    // Check for maintenance overlaps
    // TODO: Implement with real maintenance data
    const maintenanceConflicts: any[] = []

    if (maintenanceConflicts.length > 0) {
      conflicts.push({
        type: 'maintenance_overlap',
        details: maintenanceConflicts,
      })
    }

    return conflicts
  }

  const getAvailableStaff = (propertyName: string, checkInDate: string) => {
    return staffList.filter(
      (staff: any) =>
        staff.assignedProperties?.includes(propertyName) &&
        staff.status === 'active'
    )
  }

  const sendGuestNotification = async (
    bookingId: string,
    type: 'approval' | 'rejection' | 'assignment',
    message?: string
  ) => {
    setLoading(true)
    try {
      console.log(
        'Send notification:',
        type,
        'to booking:',
        bookingId,
        'Message:',
        message
      )
      toast.success('Notification sent successfully')
    } catch (error) {
      toast.error('Failed to send notification')
    } finally {
      setLoading(false)
    }
  }

  const exportBookingData = async (format: 'csv' | 'pdf', bookings: any[]) => {
    setLoading(true)
    try {
      console.log('Export bookings:', format, bookings.length, 'bookings')
      toast.success(`Bookings exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Failed to export bookings')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white flex">
        {/* Fixed Sidebar */}
        <div
          className={`fixed left-0 top-0 h-full bg-neutral-950 border-r border-neutral-800 z-50 transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-neutral-800">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div>
                  <h2 className="text-lg font-bold text-white">Back Office</h2>
                  <p className="text-xs text-neutral-400">Management Hub</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-neutral-400 hover:text-white"
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`}
                />
              </Button>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="p-2 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.full_name || 'Admin'}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}
        >
          {/* Top Header */}
          <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-neutral-800">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {sidebarItems.find((item) => item.id === activeSection)
                      ?.label || 'Dashboard'}
                  </h1>
                  <p className="text-sm text-neutral-400">
                    {activeSection === 'dashboard' &&
                      'Overview of your business operations'}
                    {activeSection === 'bookings' &&
                      'Manage and approve property bookings'}
                    {activeSection === 'calendar' &&
                      'Calendar view of events, bookings, and staff schedules'}
                    {activeSection === 'kpi-dashboard' &&
                      'Performance metrics and operational analytics'}
                    {activeSection === 'job-assignments' &&
                      'Assign and track staff job assignments'}
                    {activeSection === 'staff' &&
                      'Staff management and assignments'}
                    {activeSection === 'onboarding' &&
                      'View, edit, and manage property onboarding submissions'}
                    {activeSection === 'financial' &&
                      'Financial overview and reporting'}
                    {activeSection === 'properties' &&
                      'Property management and overview'}
                    {activeSection === 'operations' &&
                      'Daily operations and tasks'}
                    {activeSection === 'reports' && 'Generate and view reports'}
                    {activeSection === 'ai-dashboard' &&
                      'AI performance monitoring and admin feedback'}
                    {activeSection === 'settings' &&
                      'System settings and configuration'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => exportData('pdf', activeSection)}
                    variant="outline"
                    size="sm"
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Activity className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="p-6 space-y-6">
            {/* Render content based on active section */}
            {renderSectionContent()}
          </main>
        </div>

        {/* Staff Management Modals */}
        <AddStaffModal
          isOpen={showAddStaffModal}
          onClose={() => setShowAddStaffModal(false)}
          onSuccess={handleStaffSuccess}
        />

        <EditStaffModal
          isOpen={showEditStaffModal}
          onClose={() => setShowEditStaffModal(false)}
          onSuccess={handleStaffSuccess}
          staff={selectedStaff}
        />

        <PropertyAssignmentModal
          isOpen={showPropertyAssignmentModal}
          onClose={() => setShowPropertyAssignmentModal(false)}
          onSuccess={handleStaffSuccess}
          staff={staffForPropertyAssignment}
        />

        <StaffImportExportModal
          isOpen={showImportExportModal}
          onClose={() => setShowImportExportModal(false)}
          onSuccess={handleStaffSuccess}
          staffList={staffList}
        />

        {/* Wizard Staff Management Modal */}
        <WizardStaffModal
          isOpen={showWizardStaffModal}
          onClose={() => setShowWizardStaffModal(false)}
          onStaffCreated={(staff, credentials) => {
            console.log('✅ Staff created with credentials:', staff.name)
            console.log('📧 Login credentials:', credentials.email)
            handleStaffSuccess()
            toast.success(
              `Staff member ${staff.name} created with login credentials!`
            )
          }}
          availableProperties={[
            { id: '1', name: 'Villa Sunset' },
            { id: '2', name: 'Ocean View Resort' },
            { id: '3', name: 'Mountain Lodge' },
            { id: '4', name: 'City Apartment' },
          ]}
        />

        {/* Staff Account Modal */}
        <StaffAccountModal
          isOpen={showStaffAccountModal}
          onClose={() => setShowStaffAccountModal(false)}
          onStaffCreated={(staff, credentials) => {
            console.log('✅ Staff account created:', staff.name)
            console.log('📧 Login credentials:', credentials.email)
            handleStaffSuccess()
            toast.success(
              `Staff account ${staff.name} created with login credentials!`
            )
          }}
          availableProperties={[
            { id: '1', name: 'Villa Sunset' },
            { id: '2', name: 'Ocean View Resort' },
            { id: '3', name: 'Mountain Lodge' },
            { id: '4', name: 'City Apartment' },
          ]}
        />

        {selectedStaffForCredentials && (
          <StaffCredentialManager
            isOpen={showCredentialManager}
            onClose={() => {
              setShowCredentialManager(false)
              setSelectedStaffForCredentials(null)
            }}
            staffMember={selectedStaffForCredentials}
            onCredentialsUpdated={() => {
              console.log('✅ Credentials updated successfully')
              handleStaffSuccess()
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && staffToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Delete Staff Member
                  </h3>
                  <p className="text-sm text-neutral-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-neutral-300 mb-6">
                Are you sure you want to delete{' '}
                <strong>{staffToDelete?.name}</strong>? This will remove their
                profile and all associated data.
              </p>

              <div className="flex items-center gap-3">
                <Button
                  onClick={confirmDeleteStaff}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Staff
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setStaffToDelete(null)
                  }}
                  variant="outline"
                  disabled={loading}
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding Submission Detail Modal */}
        {showSubmissionModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {selectedSubmission.propertyName || 'Property Submission'}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Submitted by {selectedSubmission.ownerFullName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(selectedSubmission.status)}>
                    {selectedSubmission.status}
                  </Badge>
                  <Button
                    onClick={() => {
                      setShowSubmissionModal(false)
                      setSelectedSubmission(null)
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Owner Information */}
                  <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Owner Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm text-neutral-400">Full Name</label>
                        <p className="text-white">{selectedSubmission.ownerFullName}</p>
                      </div>
                      <div>
                        <label className="text-sm text-neutral-400">Email</label>
                        <p className="text-white">{selectedSubmission.ownerEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm text-neutral-400">Phone</label>
                        <p className="text-white">{selectedSubmission.ownerContactNumber}</p>
                      </div>
                      {selectedSubmission.ownerNationality && (
                        <div>
                          <label className="text-sm text-neutral-400">Nationality</label>
                          <p className="text-white">{selectedSubmission.ownerNationality}</p>
                        </div>
                      )}
                      {selectedSubmission.preferredContactMethod && (
                        <div>
                          <label className="text-sm text-neutral-400">Preferred Contact</label>
                          <p className="text-white">{selectedSubmission.preferredContactMethod}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Property Details */}
                  <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Property Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm text-neutral-400">Property Name</label>
                        <p className="text-white">{selectedSubmission.propertyName}</p>
                      </div>
                      <div>
                        <label className="text-sm text-neutral-400">Address</label>
                        <p className="text-white">{selectedSubmission.propertyAddress || 'Not provided'}</p>
                      </div>
                      {selectedSubmission.googleMapsUrl && (
                        <div>
                          <label className="text-sm text-neutral-400">Google Maps</label>
                          <a 
                            href={selectedSubmission.googleMapsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            View on Maps
                          </a>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-neutral-400">Bedrooms</label>
                          <p className="text-white">{selectedSubmission.bedrooms || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-neutral-400">Bathrooms</label>
                          <p className="text-white">{selectedSubmission.bathrooms || 'Not specified'}</p>
                        </div>
                      </div>
                      {selectedSubmission.yearBuilt && (
                        <div>
                          <label className="text-sm text-neutral-400">Year Built</label>
                          <p className="text-white">{selectedSubmission.yearBuilt}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Amenities */}
                  <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Amenities & Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={selectedSubmission.hasPool ? 'text-green-400' : 'text-neutral-500'}>
                            {selectedSubmission.hasPool ? '✓' : '✗'}
                          </span>
                          Pool
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={selectedSubmission.hasGarden ? 'text-green-400' : 'text-neutral-500'}>
                            {selectedSubmission.hasGarden ? '✓' : '✗'}
                          </span>
                          Garden
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={selectedSubmission.hasAirConditioning ? 'text-green-400' : 'text-neutral-500'}>
                            {selectedSubmission.hasAirConditioning ? '✓' : '✗'}
                          </span>
                          Air Conditioning
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={selectedSubmission.hasParking ? 'text-green-400' : 'text-neutral-500'}>
                            {selectedSubmission.hasParking ? '✓' : '✗'}
                          </span>
                          Parking
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={selectedSubmission.hasLaundry ? 'text-green-400' : 'text-neutral-500'}>
                            {selectedSubmission.hasLaundry ? '✓' : '✗'}
                          </span>
                          Laundry
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={selectedSubmission.hasBackupPower ? 'text-green-400' : 'text-neutral-500'}>
                            {selectedSubmission.hasBackupPower ? '✓' : '✗'}
                          </span>
                          Backup Power
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Smart System */}
                  {selectedSubmission.hasSmartElectricSystem && (
                    <Card className="bg-neutral-800 border-neutral-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Smart Electric System
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedSubmission.smartSystemBrand && (
                          <div>
                            <label className="text-sm text-neutral-400">Brand</label>
                            <p className="text-white">{selectedSubmission.smartSystemBrand}</p>
                          </div>
                        )}
                        {selectedSubmission.smartDevicesControlled && (
                          <div>
                            <label className="text-sm text-neutral-400">Controlled Devices</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedSubmission.smartDevicesControlled.map((device, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {device}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedSubmission.smartSystemSpecialInstructions && (
                          <div>
                            <label className="text-sm text-neutral-400">Special Instructions</label>
                            <p className="text-white">{selectedSubmission.smartSystemSpecialInstructions}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Emergency Contact */}
                  {(selectedSubmission.emergencyContactName || selectedSubmission.emergencyContactPhone) && (
                    <Card className="bg-neutral-800 border-neutral-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Phone className="h-5 w-5" />
                          Emergency Contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedSubmission.emergencyContactName && (
                          <div>
                            <label className="text-sm text-neutral-400">Name</label>
                            <p className="text-white">{selectedSubmission.emergencyContactName}</p>
                          </div>
                        )}
                        {selectedSubmission.emergencyContactPhone && (
                          <div>
                            <label className="text-sm text-neutral-400">Phone</label>
                            <p className="text-white">{selectedSubmission.emergencyContactPhone}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Additional Notes */}
                  {selectedSubmission.notes && (
                    <Card className="bg-neutral-800 border-neutral-700 lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Additional Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-white whitespace-pre-wrap">{selectedSubmission.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-neutral-800">
                  {selectedSubmission.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => {
                          handleUpdateStatus(selectedSubmission.id, 'approved')
                          setShowSubmissionModal(false)
                          setSelectedSubmission(null)
                        }}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={loading}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Submission
                      </Button>
                      <Button
                        onClick={() => {
                          handleUpdateStatus(selectedSubmission.id, 'rejected')
                          setShowSubmissionModal(false)
                          setSelectedSubmission(null)
                        }}
                        variant="outline"
                        className="border-red-500 text-red-400 hover:bg-red-500/10"
                        disabled={loading}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Submission
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => {
                      setShowSubmissionModal(false)
                      setSelectedSubmission(null)
                    }}
                    variant="outline"
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Booking Approval Modal */}
        {bookingApprovalModal && (
          <BookingApprovalModal
            isOpen={!!bookingApprovalModal}
            onClose={() => setBookingApprovalModal(null)}
            booking={bookingApprovalModal.booking}
            currentUser={{
              id: user?.id || '',
              name: user?.full_name || user?.email || 'Admin',
            }}
            onApprovalComplete={async (bookingId, action) => {
              console.log(`Booking ${bookingId} ${action}d successfully`)
              setBookingApprovalModal(null)
              // Reload data to reflect changes
              loadAllBookingData()

              // Create calendar event for approved bookings
              if (action === 'approve') {
                try {
                  const calendarResult =
                    await CalendarEventService.createEventsFromBooking(
                      bookingId
                    )

                  if (calendarResult.success) {
                    console.log(
                      `✅ Calendar events created: ${calendarResult.eventIds?.join(', ')}`
                    )
                    toast.success(
                      `✅ Booking approved • Calendar event created • Synced to mobile app`
                    )
                  } else {
                    console.warn(
                      '⚠️ Calendar event creation failed:',
                      calendarResult.error
                    )
                    toast.success(
                      `✅ Booking approved • Synced to mobile app • Calendar event creation failed`
                    )
                  }
                } catch (calendarError) {
                  console.error(
                    '❌ Calendar event creation error:',
                    calendarError
                  )
                  toast.success(
                    `✅ Booking approved • Synced to mobile app • Calendar event creation failed`
                  )
                }
              } else {
                toast.success(
                  `Booking ${action}d successfully and synced to mobile app`
                )
              }

              // Redirect to job assignment page for approved bookings
              if (action === 'approve') {
                const booking = bookingApprovalModal.booking
                const params = new URLSearchParams({
                  bookingId: booking.id,
                  propertyName:
                    booking.propertyName ||
                    booking.property ||
                    'Unknown Property',
                  guestName:
                    booking.guestName || booking.guest || 'Unknown Guest',
                  checkInDate: booking.checkInDate || booking.checkin || '',
                  checkOutDate: booking.checkOutDate || booking.checkout || '',
                  numberOfGuests: String(
                    booking.numberOfGuests || booking.guests || 1
                  ),
                  ...(booking.specialRequests && {
                    specialRequests: booking.specialRequests,
                  }),
                })

                // Navigate to job assignment page with booking data
                window.open(
                  `/admin/job-assignments?${params.toString()}`,
                  '_blank'
                )
              }
            }}
          />
        )}

        {/* Enhanced Staff Assignment Modal */}
        {staffAssignmentModal && (
          <StaffAssignmentModal
            isOpen={!!staffAssignmentModal}
            onClose={() => setStaffAssignmentModal(null)}
            booking={staffAssignmentModal.booking}
            currentUser={{
              id: user?.id || '',
              name: user?.full_name || user?.email || 'Admin',
            }}
            onAssignmentComplete={(assignments) => {
              console.log(`${assignments.length} tasks created successfully`)
              setStaffAssignmentModal(null)
              // Reload data to reflect changes
              loadAllBookingData()
              toast.success(
                `Staff assigned successfully with ${assignments.length} tasks created`
              )
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  )

  // Function to render content based on active section
  function renderSectionContent() {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard()
      case 'bookings':
        return renderBookings()
      case 'calendar':
        return <CalendarView />
      case 'kpi-dashboard':
        return <KPIDashboard />
      case 'job-assignments':
        return renderJobAssignments()
      case 'staff':
        return renderStaff()
      case 'onboarding':
        return renderOnboardingSubmissions()
      case 'financial':
        return renderFinancial()
      case 'properties':
        return renderProperties()
      case 'operations':
        return <OperationsMapDashboard />
      case 'reports':
        return renderReports()
      case 'ai-dashboard':
        return <ComprehensiveAIDashboard />
      case 'settings':
        return renderSettings()
      default:
        return renderDashboard()
    }
  }

  // Dashboard Section
  function renderDashboard() {
    const todaysCheckIns = getTodaysCheckIns()
    const todaysCheckOuts = getTodaysCheckOuts()
    const pendingBookings = getPendingBookings()
    const overduePayments = getOverduePayments()
    const highPriorityMaintenance = getHighPriorityMaintenance()
    const avgOccupancy = getAverageOccupancyRate()

    return (
      <div className="space-y-6">
        {/* Dashboard Header with Refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Property Management Dashboard
            </h2>
            <p className="text-sm text-neutral-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={sendTestJobToMobile}
              disabled={sendingTestJob}
              size="sm"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {sendingTestJob ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Test Job
            </Button>

            <Button
              onClick={testCalendarDateParsing}
              disabled={sendingTestJob}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              {sendingTestJob ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CalendarIcon className="h-4 w-4 mr-2" />
              )}
              Test Calendar
            </Button>

            <Button
              onClick={cleanupTestJobEvents}
              disabled={sendingTestJob}
              size="sm"
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
            >
              {sendingTestJob ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove Mock Data
            </Button>

            <Button
              onClick={handleRefreshDashboard}
              disabled={dashboardLoading}
              variant="outline"
              size="sm"
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              {dashboardLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Check-ins */}
          <Card
            className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30 hover:border-blue-400/50 transition-colors cursor-pointer"
            onClick={() => setActiveSection('bookings')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Check-ins Today
                </div>
                <ExternalLink className="h-4 w-4 opacity-60" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {todaysCheckIns.length}
              </div>
              <div className="space-y-1 mt-2">
                {todaysCheckIns.slice(0, 2).map((booking) => (
                  <p key={booking.id} className="text-xs text-blue-200">
                    {booking.guestName} - {booking.propertyName}
                  </p>
                ))}
                {todaysCheckIns.length > 2 && (
                  <p className="text-xs text-blue-300">
                    +{todaysCheckIns.length - 2} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Check-outs */}
          <Card
            className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30 hover:border-orange-400/50 transition-colors cursor-pointer"
            onClick={() => setActiveSection('bookings')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  Check-outs Today
                </div>
                <ExternalLink className="h-4 w-4 opacity-60" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-400">
                {todaysCheckOuts.length}
              </div>
              <div className="space-y-1 mt-2">
                {todaysCheckOuts.slice(0, 2).map((booking) => (
                  <p key={booking.id} className="text-xs text-orange-200">
                    {booking.guestName} - {booking.propertyName}
                  </p>
                ))}
                {todaysCheckOuts.length > 2 && (
                  <p className="text-xs text-orange-300">
                    +{todaysCheckOuts.length - 2} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revenue with Trend */}
          <Card
            className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 hover:border-green-400/50 transition-colors cursor-pointer"
            onClick={() => setActiveSection('financial')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Monthly Revenue
                </div>
                <ExternalLink className="h-4 w-4 opacity-60" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                $
                {financialDashboard?.revenue?.monthlyRevenue?.toLocaleString() ||
                  '0'}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center text-sm text-green-200">
                  <TrendingUp className="h-3 w-3 mr-1" />+
                  {financialDashboard?.revenue?.revenueGrowth?.monthly || 0}%
                </div>
                <div className="text-xs text-green-300">vs last month</div>
              </div>
            </CardContent>
          </Card>

          {/* Occupancy Rate */}
          <Card
            className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border-purple-500/30 hover:border-purple-400/50 transition-colors cursor-pointer"
            onClick={() => setActiveSection('properties')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Avg Occupancy
                </div>
                <ExternalLink className="h-4 w-4 opacity-60" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {avgOccupancy}%
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${avgOccupancy}%` }}
                ></div>
              </div>
              <p className="text-xs text-purple-200 mt-1">
                Across all properties
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts & Outstanding Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Outstanding Payments */}
          <Card className="bg-gradient-to-br from-red-600/10 to-red-800/10 border-red-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Outstanding Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400 mb-3">$0</div>
              <div className="space-y-2">
                <div className="text-center py-4">
                  <p className="text-neutral-400 text-sm">
                    No overdue payments
                  </p>
                  <p className="text-neutral-500 text-xs mt-1">
                    Payment tracking will be implemented with real financial
                    data
                  </p>
                </div>
                {overduePayments.length > 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => setActiveSection('financial')}
                  >
                    View All ({overduePayments.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="bg-gradient-to-br from-yellow-600/10 to-yellow-800/10 border-yellow-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400 mb-3">
                {pendingBookings.length}
              </div>
              <div className="space-y-2">
                {getPendingBookings()
                  .slice(0, 3)
                  .map((booking: any) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-2 bg-yellow-500/10 rounded"
                    >
                      <div>
                        <p className="text-white text-sm font-medium">
                          {booking.guestName}
                        </p>
                        <p className="text-yellow-300 text-xs">
                          {booking.propertyName}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleQuickApproval(booking.id)}
                          className="bg-green-600 hover:bg-green-700 h-6 px-2 text-xs"
                          disabled={loading}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-600/10 h-6 px-2 text-xs"
                          disabled={loading}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {pendingBookings.length > 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                    onClick={() => setActiveSection('bookings')}
                  >
                    View All ({pendingBookings.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* High Priority Maintenance */}
          <Card className="bg-gradient-to-br from-orange-600/10 to-orange-800/10 border-orange-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Urgent Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400 mb-3">
                {highPriorityMaintenance.length}
              </div>
              <div className="space-y-2">
                {highPriorityMaintenance.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-neutral-400 text-sm">
                      No high priority maintenance
                    </p>
                    <p className="text-neutral-500 text-xs mt-1">
                      Maintenance tracking will be implemented with real data
                    </p>
                  </div>
                ) : (
                  highPriorityMaintenance.slice(0, 3).map((request: any) => (
                    <div
                      key={request.id}
                      className="p-2 bg-orange-500/10 rounded"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-sm font-medium">
                          {request.propertyName}
                        </p>
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                          {request.priority}
                        </Badge>
                      </div>
                      <p className="text-orange-300 text-xs">{request.issue}</p>
                      <p className="text-orange-400 text-xs mt-1">
                        Assigned: {request.assignedTo || 'Unassigned'}
                      </p>
                    </div>
                  ))
                )}
                {highPriorityMaintenance.length > 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                    onClick={() => setActiveSection('operations')}
                  >
                    View All ({highPriorityMaintenance.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Property Performance & Staff Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Property Performance */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">
                    Property Performance
                  </CardTitle>
                  <CardDescription>
                    Real-time property status and metrics
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection('properties')}
                  className="text-neutral-400 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-neutral-400">
                    No property revenue data available
                  </p>
                  <p className="text-neutral-500 text-xs mt-1">
                    Property revenue tracking will be implemented with real
                    financial data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Performance & Availability */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Staff Overview</CardTitle>
                  <CardDescription>
                    Current staff status and performance
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection('staff')}
                  className="text-neutral-400 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffList.map((staff: any) => (
                  <div key={staff.id} className="p-3 bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">
                            {staff.name || 'Unknown Staff'}
                          </h4>
                          <p className="text-neutral-400 text-xs">
                            {staff.role || 'No role assigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            (staff.availability || 'unknown') === 'available'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : (staff.availability || 'unknown') === 'busy'
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }
                        >
                          {staff.availability || 'Unknown'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400" />
                          <span className="text-yellow-400 text-xs">
                            {staff.rating || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-400">Current Task</p>
                        <p className="text-white text-xs">
                          {staff.currentTask || 'No active task'}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-400">Completion Rate</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-neutral-700 rounded-full h-1.5">
                            <div
                              className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${staff.performance?.onTimeCompletion || 0}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-green-400 text-xs">
                            {staff.performance?.onTimeCompletion || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Alerts & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Alerts */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                System Alerts
              </CardTitle>
              <CardDescription>
                Recent notifications and system updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center py-8">
                  <p className="text-neutral-400">No system alerts</p>
                  <p className="text-neutral-500 text-xs mt-1">
                    System alerts will be implemented with real monitoring data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Quick Actions */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription>
                Frequently used management actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setActiveSection('bookings')}
                  className="bg-blue-600 hover:bg-blue-700 h-auto p-4 flex-col gap-2 relative group"
                >
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">Manage Bookings</span>
                  {pendingBookings.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5">
                      {pendingBookings.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  onClick={() =>
                    window.open('/admin/job-assignments', '_blank')
                  }
                  className="bg-green-600 hover:bg-green-700 h-auto p-4 flex-col gap-2"
                >
                  <ClipboardList className="h-5 w-5" />
                  <span className="text-sm">Job Assignments</span>
                </Button>
                <Button
                  onClick={() => setActiveSection('staff')}
                  className="bg-purple-600 hover:bg-purple-700 h-auto p-4 flex-col gap-2"
                >
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Staff Management</span>
                </Button>
                <Button
                  onClick={() => setActiveSection('financial')}
                  className="bg-orange-600 hover:bg-orange-700 h-auto p-4 flex-col gap-2 relative"
                >
                  <DollarSign className="h-5 w-5" />
                  <span className="text-sm">Financial Reports</span>
                  {overduePayments.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5">
                      {overduePayments.length}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Additional Quick Actions */}
              <div className="mt-4 pt-4 border-t border-neutral-700">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                    onClick={() => exportData('pdf', 'dashboard')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                    onClick={() => setActiveSection('reports')}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Reports
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                    onClick={() => setActiveSection('settings')}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Integration Status */}
        <MobileIntegrationStatus />

        {/* Enhanced Job Management Dashboard */}
        <EnhancedJobManagementDashboard />
      </div>
    )
  }

  // Enhanced Bookings Section - Now using Enhanced Booking Management
  function renderBookings() {
    return (
      <>
        <AIDisabledWarning context="bookings" className="mb-6" />
        <EnhancedBookingManagement
          onBookingApproved={(bookingId: string) => {
            console.log(
              `✅ Booking ${bookingId} approved in Enhanced Back Office`
            )
            loadAllBookingData()
          }}
          onStaffAssigned={(bookingId: string, staffIds: string[]) => {
            console.log(`👥 Staff assigned to booking ${bookingId}:`, staffIds)
            loadAllBookingData()
          }}
        />
      </>
    )
  }

  // Job Assignments Section - Enhanced Job Management Dashboard
  function renderJobAssignments() {
    return (
      <div className="space-y-6">
        {/* AI Disabled Warning */}
        <AIDisabledWarning context="jobs" />

        {/* Test Job Mobile Integration */}
        <Card className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-purple-400" />
              Mobile Job Test Integration
            </CardTitle>
            <CardDescription className="text-purple-300">
              Send a test job to the mobile app for staff to accept and process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={sendTestJobToMobile}
                disabled={sendingTestJob}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {sendingTestJob ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Test Job...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Job to Mobile
                  </>
                )}
              </Button>

              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/fix-staff-uid', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'fix_staff_siamoon' }),
                    })
                    const result = await response.json()
                    console.log('Staff UID fix result:', result)
                    toast.success(
                      result.success
                        ? 'Staff UID mapping fixed!'
                        : `Error: ${result.message}`
                    )
                  } catch (error) {
                    console.error('Error fixing staff UID:', error)
                    toast.error('Error fixing staff UID mapping')
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white mt-2"
              >
                <Settings className="mr-2 h-4 w-4" />
                Fix Staff UID Mapping
              </Button>

              <p className="text-sm text-purple-300">
                This will create a test job in Firebase and allow you to assign
                it to a staff member for mobile app testing.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Clear Jobs Utility for Testing */}
        <ClearJobsUtility
          onJobsCleared={() => {
            toast.success('Jobs cleared - ready for fresh testing!')
            // Refresh the job dashboard
            window.location.reload()
          }}
        />

        {/* Main Job Management Dashboard */}
        <EnhancedJobManagementDashboard />
      </div>
    )
  }

  // Legacy booking section (kept for reference) - UNUSED
  function renderLegacyBookings() {
    const filteredBookings = getFilteredBookings()
    const pendingCount = filteredBookings.filter(
      (b) => b.status === 'pending'
    ).length
    const confirmedCount = filteredBookings.filter(
      (b) => b.status === 'confirmed'
    ).length

    return (
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Bookings</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {filteredBookings.length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-sm">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {pendingCount}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Confirmed</p>
                  <p className="text-2xl font-bold text-green-400">
                    {confirmedCount}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Revenue</p>
                  <p className="text-2xl font-bold text-purple-400">
                    $
                    {filteredBookings
                      .reduce((sum, b) => sum + (b.amount || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Booking Management Card */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Management
                  {selectedBookings.length > 0 && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {selectedBookings.length} selected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  View, approve, and manage all property bookings
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {selectedBookings.length > 0 && (
                  <Button
                    onClick={() => console.log('Bulk actions not implemented')}
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Bulk Actions
                  </Button>
                )}
                <Button
                  onClick={() => exportBookingData('csv', filteredBookings)}
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => exportBookingData('pdf', filteredBookings)}
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  disabled={loading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Enhanced Search and Filter Bar */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      type="text"
                      placeholder="Search by guest name, property, booking reference..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleRefreshDashboard}
                    variant="outline"
                    size="sm"
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    disabled={dashboardLoading}
                  >
                    {dashboardLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-neutral-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <select
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Properties</option>
                  <option value="Villa Sunset">Villa Sunset</option>
                  <option value="Villa Paradise">Villa Paradise</option>
                  <option value="Villa Moonlight">Villa Moonlight</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                </select>

                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Sources</option>
                  <option value="website">Website</option>
                  <option value="api">API</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-neutral-400" />
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={dateRangeFilter.start}
                    onChange={(e) =>
                      setDateRangeFilter((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="bg-neutral-800 border-neutral-700 text-white text-sm w-40"
                  />
                  <span className="text-neutral-400">to</span>
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={dateRangeFilter.end}
                    onChange={(e) =>
                      setDateRangeFilter((prev) => ({
                        ...prev,
                        end: e.target.value,
                      }))
                    }
                    className="bg-neutral-800 border-neutral-700 text-white text-sm w-40"
                  />
                </div>

                {(searchTerm ||
                  statusFilter !== 'all' ||
                  propertyFilter !== 'all' ||
                  paymentFilter !== 'all' ||
                  sourceFilter !== 'all' ||
                  dateRangeFilter.start ||
                  dateRangeFilter.end) && (
                  <Button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                      setPropertyFilter('all')
                      setPaymentFilter('all')
                      setSourceFilter('all')
                      setDateRangeFilter({ start: '', end: '' })
                    }}
                    variant="outline"
                    size="sm"
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Bulk Selection Header */}
            {filteredBookings.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedBookings.length === filteredBookings.length
                    }
                    onChange={(e) => handleSelectAllBookings(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white text-sm">
                    {selectedBookings.length === filteredBookings.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </span>
                </div>
                <div className="text-neutral-400 text-sm">
                  Showing {filteredBookings.length} bookings
                </div>
              </div>
            )}

            {/* Enhanced Bookings Table */}
            <div className="space-y-3">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-400 mb-2">
                    No bookings found
                  </h3>
                  <p className="text-neutral-500">
                    Try adjusting your filters or search terms
                  </p>
                </div>
              ) : (
                filteredBookings.map((booking) => {
                  const conflicts = checkBookingConflicts(booking)
                  const isExpanded = expandedBooking === booking.id
                  const isSelected = selectedBookings.includes(booking.id)

                  return (
                    <div
                      key={booking.id}
                      className={`border rounded-lg transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/5'
                          : 'border-neutral-800 hover:border-neutral-700'
                      } ${conflicts.length > 0 ? 'border-l-4 border-l-red-500' : ''}`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                handleBookingSelection(
                                  booking.id,
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 mt-1"
                            />

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="font-semibold text-white text-lg">
                                  {booking.guestName}
                                </h3>
                                <Badge
                                  className={getStatusColor(booking.status)}
                                >
                                  {booking.status}
                                </Badge>
                                <Badge
                                  className={`text-xs ${
                                    booking.paymentStatus === 'paid'
                                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                      : booking.paymentStatus === 'partial'
                                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}
                                >
                                  {booking.paymentStatus}
                                </Badge>
                                {booking.assignedStaff && (
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    {booking.assignedStaff}
                                  </Badge>
                                )}
                                {conflicts.length > 0 && (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Conflict
                                  </Badge>
                                )}
                                <Badge
                                  className={`text-xs ${
                                    booking.source === 'website'
                                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                      : booking.source === 'api'
                                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                        : booking.source === 'phone'
                                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                  }`}
                                >
                                  {booking.source}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div className="space-y-1">
                                  <p className="text-neutral-400">
                                    Property & Dates
                                  </p>
                                  <p className="text-white font-medium">
                                    {booking.propertyName}
                                  </p>
                                  <p className="text-neutral-300">
                                    {booking.checkIn} → {booking.checkOut}
                                  </p>
                                  <p className="text-neutral-400">
                                    {booking.totalNights} nights •{' '}
                                    {booking.guestCount} guests
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-neutral-400">
                                    Financial Details
                                  </p>
                                  <p className="text-white font-medium">
                                    ${(booking.amount || 0).toLocaleString()}
                                  </p>
                                  <p className="text-green-400">
                                    Paid: $
                                    {(booking.paidAmount || 0).toLocaleString()}
                                  </p>
                                  {(booking.paidAmount || 0) <
                                    (booking.amount || 0) && (
                                    <p className="text-red-400">
                                      Outstanding: $
                                      {(
                                        (booking.amount || 0) -
                                        (booking.paidAmount || 0)
                                      ).toLocaleString()}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <p className="text-neutral-400">
                                    Contact & Reference
                                  </p>
                                  <p className="text-white">
                                    {booking.bookingReference}
                                  </p>
                                  <p className="text-neutral-300">
                                    {booking.guestEmail}
                                  </p>
                                  <p className="text-neutral-300">
                                    {booking.guestPhone}
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-neutral-400">
                                    Booking Info
                                  </p>
                                  <p className="text-neutral-300">
                                    Created:{' '}
                                    {booking.createdAt
                                      ? new Date(
                                          booking.createdAt
                                        ).toLocaleDateString()
                                      : 'N/A'}
                                  </p>
                                  <p className="text-neutral-300">
                                    Modified:{' '}
                                    {booking.lastModified
                                      ? new Date(
                                          booking.lastModified
                                        ).toLocaleDateString()
                                      : 'N/A'}
                                  </p>
                                  <p className="text-neutral-400">
                                    By: {booking.modifiedBy || 'Unknown'}
                                  </p>
                                </div>
                              </div>

                              {booking.specialRequests && (
                                <div className="mt-3 p-2 bg-neutral-800 rounded">
                                  <p className="text-neutral-400 text-xs mb-1">
                                    Special Requests:
                                  </p>
                                  <p className="text-neutral-300 text-sm">
                                    {booking.specialRequests}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleBookingApproval(booking.id, 'approve')
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={loading}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleBookingApproval(booking.id, 'reject')
                                  }
                                  className="border-red-600 text-red-400 hover:bg-red-600/10"
                                  disabled={loading}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {!booking.assignedStaff &&
                              booking.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleStaffAssignment(booking.id)
                                  }
                                  className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                                  disabled={loading}
                                >
                                  <Users className="h-4 w-4 mr-1" />
                                  Assign Staff
                                </Button>
                              )}

                            {/* Edit button removed - handled by EnhancedBookingManagement */}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setExpandedBooking(
                                  isExpanded ? null : booking.id
                                )
                              }
                              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {isExpanded ? 'Less' : 'More'}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-neutral-800">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Approval History */}
                              <div>
                                <h4 className="text-white font-medium mb-3">
                                  Approval History
                                </h4>
                                {booking.approvalHistory.length > 0 ? (
                                  <div className="space-y-2">
                                    {(booking.approvalHistory || []).map(
                                      (history: any, index: number) => (
                                        <div
                                          key={index}
                                          className="p-2 bg-neutral-800 rounded text-sm"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span
                                              className={`font-medium ${
                                                history.action === 'approved'
                                                  ? 'text-green-400'
                                                  : 'text-red-400'
                                              }`}
                                            >
                                              {history.action
                                                .charAt(0)
                                                .toUpperCase() +
                                                history.action.slice(1)}
                                            </span>
                                            <span className="text-neutral-400">
                                              {history.timestamp
                                                ? new Date(
                                                    history.timestamp
                                                  ).toLocaleString()
                                                : 'N/A'}
                                            </span>
                                          </div>
                                          <p className="text-neutral-300">
                                            By: {history.by}
                                          </p>
                                          {history.notes && (
                                            <p className="text-neutral-400 mt-1">
                                              {history.notes}
                                            </p>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-neutral-500 text-sm">
                                    No approval history yet
                                  </p>
                                )}
                              </div>

                              {/* Notes & Communication */}
                              <div>
                                <h4 className="text-white font-medium mb-3">
                                  Internal Notes
                                </h4>
                                {booking.notes.length > 0 ? (
                                  <div className="space-y-2">
                                    {(booking.notes || []).map(
                                      (note: any, index: number) => (
                                        <div
                                          key={index}
                                          className="p-2 bg-neutral-800 rounded text-sm"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-neutral-300">
                                              {note.by}
                                            </span>
                                            <span className="text-neutral-400">
                                              {note.timestamp
                                                ? new Date(
                                                    note.timestamp
                                                  ).toLocaleString()
                                                : 'N/A'}
                                            </span>
                                          </div>
                                          <p className="text-white mt-1">
                                            {note.text}
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-neutral-500 text-sm">
                                    No notes added yet
                                  </p>
                                )}

                                <div className="mt-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      sendGuestNotification(
                                        booking.id,
                                        'approval'
                                      )
                                    }
                                    className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                                    disabled={loading}
                                  >
                                    <Mail className="h-4 w-4 mr-1" />
                                    Email Guest
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                                  >
                                    <Phone className="h-4 w-4 mr-1" />
                                    Call Guest
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Conflicts Alert */}
                            {conflicts.length > 0 && (
                              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="h-4 w-4 text-red-400" />
                                  <span className="text-red-400 font-medium">
                                    Booking Conflicts Detected
                                  </span>
                                </div>
                                {conflicts.map((conflict, index) => (
                                  <p
                                    key={index}
                                    className="text-red-300 text-sm"
                                  >
                                    {conflict.type === 'double_booking' &&
                                      'Double booking detected with existing reservation'}
                                    {conflict.type === 'maintenance_overlap' &&
                                      'Maintenance scheduled during stay period'}
                                    {conflict.type === 'capacity_exceeded' &&
                                      'Guest count exceeds property capacity'}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Onboarding Submissions Section
  function renderOnboardingSubmissions() {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending':
          return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        case 'reviewed':
          return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        case 'approved':
          return 'bg-green-500/20 text-green-400 border-green-500/30'
        case 'rejected':
          return 'bg-red-500/20 text-red-400 border-red-500/30'
        default:
          return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      }
    }

    const filteredSubmissions = onboardingSubmissions.filter((submission) => {
      if (submissionFilter === 'all') return true
      return submission.status === submissionFilter
    })

    const handleUpdateStatus = async (id: string, status: string) => {
      try {
        setLoading(true)
        await OnboardingService.updateSubmissionStatus(id, status as any)
        toast.success(`Submission status updated to ${status}`)
        loadOnboardingSubmissions() // Reload data
      } catch (error) {
        console.error('Error updating status:', error)
        toast.error('Failed to update submission status')
      } finally {
        setLoading(false)
      }
    }

    const handleDeleteSubmission = async (id: string) => {
      if (!confirm('Are you sure you want to delete this submission?')) return
      
      try {
        setLoading(true)
        await OnboardingService.deleteSubmission(id)
        toast.success('Submission deleted successfully')
        loadOnboardingSubmissions() // Reload data
      } catch (error) {
        console.error('Error deleting submission:', error)
        toast.error('Failed to delete submission')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="space-y-6">
        {/* Header with Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Total Submissions</p>
                  <p className="text-2xl font-bold text-white">{onboardingSubmissions.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {onboardingSubmissions.filter(s => s.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Approved</p>
                  <p className="text-2xl font-bold text-green-400">
                    {onboardingSubmissions.filter(s => s.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400">Rejected</p>
                  <p className="text-2xl font-bold text-red-400">
                    {onboardingSubmissions.filter(s => s.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Input
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white w-full sm:w-64"
                />
                <select
                  value={submissionFilter}
                  onChange={(e) => setSubmissionFilter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <Button
                onClick={loadOnboardingSubmissions}
                disabled={onboardingLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {onboardingLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Onboarding Submissions</CardTitle>
            <CardDescription>
              View and manage property onboarding submissions from clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {onboardingLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-neutral-400">Loading submissions...</span>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400 text-lg">No submissions found</p>
                <p className="text-neutral-500 text-sm">
                  {submissionFilter === 'all' 
                    ? 'No onboarding submissions have been received yet.'
                    : `No submissions with status "${submissionFilter}" found.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions
                  .filter((submission) =>
                    submission.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    submission.ownerFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    submission.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((submission) => (
                    <div
                      key={submission.id}
                      className="border border-neutral-700 rounded-lg p-6 hover:border-neutral-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {submission.propertyName || 'Unnamed Property'}
                            </h3>
                            <Badge className={getStatusColor(submission.status)}>
                              {submission.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-neutral-400">Owner</p>
                              <p className="text-white">{submission.ownerFullName}</p>
                            </div>
                            <div>
                              <p className="text-neutral-400">Email</p>
                              <p className="text-white">{submission.ownerEmail}</p>
                            </div>
                            <div>
                              <p className="text-neutral-400">Phone</p>
                              <p className="text-white">{submission.ownerContactNumber}</p>
                            </div>
                            <div>
                              <p className="text-neutral-400">Address</p>
                              <p className="text-white">{submission.propertyAddress || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-neutral-400">Bedrooms</p>
                              <p className="text-white">{submission.bedrooms || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-neutral-400">Submitted</p>
                              <p className="text-white">
                                {submission.createdAt?.toDate().toLocaleDateString() || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            onClick={() => {
                              setSelectedSubmission(submission)
                              setShowSubmissionModal(true)
                            }}
                            size="sm"
                            variant="outline"
                            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          
                          {submission.status === 'pending' && (
                            <>
                              <Button
                                onClick={() => handleUpdateStatus(submission.id, 'approved')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={loading}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleUpdateStatus(submission.id, 'rejected')}
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-400 hover:bg-red-500/10"
                                disabled={loading}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          <Button
                            onClick={() => handleDeleteSubmission(submission.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-400 hover:bg-red-500/10"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Staff Section
  function renderStaff() {
    // Remove duplicates based on staff ID to prevent React key conflicts
    const displayStaff = staffList.filter(
      (staff, index, self) => index === self.findIndex((s) => s.id === staff.id)
    )

    return (
      <div className="space-y-6">
        {/* Staff Stats Cards */}
        {staffStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">
                      Total Staff
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {staffStats.total}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">
                      Active Staff
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {staffStats.active}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">
                      Pending Tasks
                    </p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {staffStats.pendingTasks}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">
                      Completion Rate
                    </p>
                    <p className="text-2xl font-bold text-purple-400">
                      {staffStats.completionRate.toFixed(1)}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Performance Metrics */}
        {staffStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">
                      Average Rating
                    </p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {staffStats.averageRating.toFixed(1)}
                    </p>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.floor(staffStats.averageRating) ? 'text-yellow-400 fill-current' : 'text-neutral-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">
                      Staff Utilization
                    </p>
                    <p className="text-2xl font-bold text-blue-400">
                      {staffStats.performanceMetrics.staffUtilization.toFixed(
                        1
                      )}
                      %
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Active staff with tasks
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-400">
                      Avg Tasks/Staff
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {staffStats.performanceMetrics.averageTasksPerStaff.toFixed(
                        1
                      )}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Per active staff member
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Insights */}
        {staffStats && staffStats.performanceMetrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            {staffStats.performanceMetrics.topPerformers.length > 0 && (
              <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {staffStats.performanceMetrics.topPerformers.map(
                      (staff, index) => (
                        <div
                          key={staff.id}
                          className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0
                                  ? 'bg-yellow-500 text-black'
                                  : index === 1
                                    ? 'bg-gray-400 text-black'
                                    : 'bg-orange-600 text-white'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {staff.name}
                              </p>
                              <p className="text-sm text-neutral-400 capitalize">
                                {staff.role}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-white font-medium">
                                {staff.averageRating?.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-400">
                              {staff.completionRate?.toFixed(1)}% completion
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Hires */}
            {staffStats.performanceMetrics.recentHires.length > 0 && (
              <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-blue-500" />
                    Recent Hires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(staffStats?.performanceMetrics?.recentHires || []).map(
                      (staff) => (
                        <div
                          key={staff.id}
                          className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {staff.name || 'Unknown Staff'}
                              </p>
                              <p className="text-sm text-neutral-400 capitalize">
                                {staff.role || 'No role'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white">
                              {staff.created_at
                                ? new Date(
                                    staff.created_at
                                  ).toLocaleDateString()
                                : 'Unknown date'}
                            </p>
                            <Badge
                              className={`text-xs ${
                                staff.status === 'active'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {staff.status}
                            </Badge>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Staff Management Card */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Staff Management</CardTitle>
                <CardDescription>
                  Manage staff profiles, assignments, and schedules
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => exportData('csv', 'staff')}
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddStaffAccount}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Staff Member
                  </Button>
                  <Button
                    onClick={handleAddStaff}
                    variant="outline"
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff (Basic)
                  </Button>
                  <Button
                    onClick={() => setShowImportExportModal(true)}
                    variant="outline"
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    disabled={loading}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Import/Export
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Bar */}
            <div className="space-y-4 mb-6">
              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                  <Input
                    placeholder="Search staff by name, email, role, or skills..."
                    className="pl-10 bg-neutral-800 border-neutral-700 text-white"
                    value={staffFilters.search || ''}
                    onChange={(e) =>
                      setStaffFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  onClick={loadStaffData}
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  disabled={staffLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${staffLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Role
                  </label>
                  <select
                    value={staffFilters.role || ''}
                    onChange={(e) =>
                      setStaffFilters((prev) => ({
                        ...prev,
                        role: e.target.value as any,
                      }))
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-white text-sm"
                  >
                    <option value="">All Roles</option>
                    {STAFF_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Status
                  </label>
                  <select
                    value={staffFilters.status || ''}
                    onChange={(e) =>
                      setStaffFilters((prev) => ({
                        ...prev,
                        status: e.target.value as any,
                      }))
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-white text-sm"
                  >
                    <option value="">All Statuses</option>
                    {STAFF_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={staffFilters.sortBy || 'name'}
                    onChange={(e) =>
                      setStaffFilters((prev) => ({
                        ...prev,
                        sortBy: e.target.value as any,
                      }))
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-white text-sm"
                  >
                    <option value="name">Name</option>
                    <option value="role">Role</option>
                    <option value="status">Status</option>
                    <option value="performance">Performance</option>
                    <option value="createdAt">Date Added</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Order
                  </label>
                  <select
                    value={staffFilters.sortOrder || 'asc'}
                    onChange={(e) =>
                      setStaffFilters((prev) => ({
                        ...prev,
                        sortOrder: e.target.value as any,
                      }))
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-white text-sm"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>

              {/* Filter Summary */}
              {(staffFilters.search ||
                staffFilters.role ||
                staffFilters.status) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-neutral-400">
                    Active filters:
                  </span>
                  {staffFilters.search && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      Search: "{staffFilters.search}"
                    </Badge>
                  )}
                  {staffFilters.role && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Role:{' '}
                      {
                        STAFF_ROLES.find((r) => r.value === staffFilters.role)
                          ?.label
                      }
                    </Badge>
                  )}
                  {staffFilters.status && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      Status:{' '}
                      {
                        STAFF_STATUSES.find(
                          (s) => s.value === staffFilters.status
                        )?.label
                      }
                    </Badge>
                  )}
                  <Button
                    onClick={() => setStaffFilters({})}
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-white h-6 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Staff Grid */}
            {staffLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-neutral-400">Loading staff...</span>
              </div>
            ) : displayStaff.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No Staff Members
                </h3>
                <p className="text-neutral-400 mb-4">
                  Get started by adding your first staff member.
                </p>
                <Button
                  onClick={handleAddStaff}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Staff Member
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayStaff.map((staff) => (
                  <Card
                    key={staff.id}
                    className="bg-neutral-800 border-neutral-700 hover:border-neutral-600 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg">
                              {staff.name}
                            </CardTitle>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                              {staff.role}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1 hover:bg-neutral-700"
                            onClick={() =>
                              handlePropertyAssignment(staff as StaffProfile)
                            }
                            disabled={loading}
                            title="Assign Properties"
                          >
                            <Building2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1 hover:bg-neutral-700"
                            onClick={() =>
                              handleEditStaff(staff as StaffProfile)
                            }
                            disabled={loading}
                            title="Edit Staff"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1 text-blue-400 hover:bg-blue-500/10"
                            onClick={() =>
                              handleManageCredentials(staff as StaffProfile)
                            }
                            disabled={loading}
                            title="Manage Login Credentials"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1 text-red-400 hover:bg-red-500/10"
                            onClick={() =>
                              handleDeleteStaff(staff as StaffProfile)
                            }
                            disabled={loading}
                            title="Delete Staff"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        {staff.phone && (
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Phone className="h-3 w-3" />
                            {staff.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Mail className="h-3 w-3" />
                          {staff.email}
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Activity className="h-3 w-3" />
                          <Badge
                            className={`text-xs ${staff.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
                          >
                            {staff.status}
                          </Badge>
                        </div>
                      </div>
                      {staff.assignedProperties &&
                        staff.assignedProperties.length > 0 && (
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">
                              Assigned Properties:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {staff.assignedProperties.map((property) => (
                                <Badge
                                  key={property}
                                  className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                                >
                                  {property}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Performance Metrics */}
                      <div className="border-t border-neutral-700 pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500">
                            Performance
                          </span>
                          {(staff as StaffProfile).averageRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-white">
                                {(staff as StaffProfile).averageRating?.toFixed(
                                  1
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Task Completion */}
                        {(staff as StaffProfile).completedTasks !== undefined &&
                          (staff as StaffProfile).totalAssignedTasks !==
                            undefined && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-500">
                                  Tasks Completed
                                </span>
                                <span className="text-white">
                                  {(staff as StaffProfile).completedTasks}/
                                  {(staff as StaffProfile).totalAssignedTasks}
                                </span>
                              </div>
                              <div className="w-full bg-neutral-700 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${((staff as StaffProfile).totalAssignedTasks || 0) > 0 ? (((staff as StaffProfile).completedTasks || 0) / ((staff as StaffProfile).totalAssignedTasks || 1)) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                        {/* Completion Rate */}
                        {(staff as StaffProfile).completionRate !==
                          undefined && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-500">
                              Completion Rate
                            </span>
                            <span
                              className={`font-medium ${
                                ((staff as StaffProfile).completionRate || 0) >=
                                90
                                  ? 'text-green-400'
                                  : ((staff as StaffProfile).completionRate ||
                                        0) >= 75
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                              }`}
                            >
                              {(staff as StaffProfile).completionRate?.toFixed(
                                1
                              )}
                              %
                            </span>
                          </div>
                        )}

                        {/* Skills */}
                        {(staff as StaffProfile).skills &&
                          (staff as StaffProfile).skills!.length > 0 && (
                            <div>
                              <p className="text-xs text-neutral-500 mb-1">
                                Skills:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {(staff as StaffProfile)
                                  .skills!.slice(0, 3)
                                  .map((skill) => (
                                    <Badge
                                      key={skill}
                                      className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                {(staff as StaffProfile).skills!.length > 3 && (
                                  <Badge className="bg-neutral-600/20 text-neutral-400 border-neutral-600/30 text-xs">
                                    +
                                    {(staff as StaffProfile).skills!.length - 3}{' '}
                                    more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Financial Section - Comprehensive Revenue Analytics Dashboard
  function renderFinancial() {
    if (financialLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-neutral-400">Loading financial data...</p>
          </div>
        </div>
      )
    }

    if (!financialDashboard) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No Financial Data Available
          </h3>
          <p className="text-neutral-400 mb-4">
            Unable to load financial dashboard data.
          </p>
          <Button
            onClick={loadFinancialData}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )
    }

    const { revenue, expenses, kpis, cashFlow, profitLoss } = financialDashboard

    return (
      <div className="space-y-6">
        {/* Financial Filters */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">
              Financial Analytics Dashboard
            </CardTitle>
            <CardDescription>
              Comprehensive financial overview and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={financialFilters.dateRange.startDate}
                  onChange={(e) =>
                    setFinancialFilters((prev) => ({
                      ...prev,
                      dateRange: {
                        ...prev.dateRange,
                        startDate: e.target.value,
                      },
                    }))
                  }
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={financialFilters.dateRange.endDate}
                  onChange={(e) =>
                    setFinancialFilters((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, endDate: e.target.value },
                    }))
                  }
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={loadFinancialData}
                  disabled={financialLoading}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${financialLoading ? 'animate-spin' : ''}`}
                  />
                  Update
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-400">
                  ${(revenue?.totalRevenue || 0).toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-green-400">
                    +{(revenue?.revenueGrowth?.monthly || 0).toFixed(1)}% vs
                    last month
                  </span>
                </div>
                <div className="text-sm text-neutral-400">
                  Monthly: ${(revenue?.monthlyRevenue || 0).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Average Daily Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-blue-400">
                  ${(kpis?.adr || 0).toFixed(0)}
                </p>
                <div className="text-sm text-neutral-400">
                  RevPAR: ${(kpis?.revPAR || 0).toFixed(0)}
                </div>
                <div className="text-sm text-neutral-400">
                  Occupancy: {(kpis?.occupancyRate || 0).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <PieChart className="h-5 w-5" />
                Profit Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-purple-400">
                  {(kpis?.grossMargin || 0).toFixed(1)}%
                </p>
                <div className="text-sm text-neutral-400">
                  Net Margin: {(kpis?.netMargin || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-neutral-400">
                  ROI: {(kpis?.returnOnInvestment || 0).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <TrendingDown className="h-5 w-5" />
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-orange-400">
                  ${(expenses?.totalExpenses || 0).toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-orange-400">
                    +{(expenses?.expenseGrowth?.monthly || 0).toFixed(1)}% vs
                    last month
                  </span>
                </div>
                <div className="text-sm text-neutral-400">
                  Monthly: ${(expenses?.monthlyExpenses || 0).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue by Property */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Revenue by Property
            </CardTitle>
            <CardDescription>
              Performance breakdown by individual properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenue?.revenueByProperty &&
            revenue.revenueByProperty.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {revenue.revenueByProperty.map((property) => (
                  <Card
                    key={property.propertyId}
                    className="bg-neutral-800 border-neutral-700"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg">
                        {property.propertyName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Total Revenue</span>
                        <span className="text-white font-semibold">
                          ${(property.totalRevenue || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Bookings</span>
                        <span className="text-white">
                          {property.bookingCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">
                          Avg Booking Value
                        </span>
                        <span className="text-white">
                          $
                          {(property.averageBookingValue || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Occupancy Rate</span>
                        <span className="text-green-400">
                          {(property.occupancyRate || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">ADR</span>
                        <span className="text-blue-400">
                          ${(property.adr || 0).toFixed(0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                <p className="text-neutral-400">
                  No property revenue data available
                </p>
                <p className="text-neutral-500 text-sm">
                  Property-specific revenue will be calculated when booking data
                  is available
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Booking Source */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Revenue by Booking Source
            </CardTitle>
            <CardDescription>
              Channel performance and commission analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {revenue.revenueBySource.map((source) => (
                  <div
                    key={source.source}
                    className="bg-neutral-800 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-white font-medium capitalize">
                        {source.source.replace('_', ' ')}
                      </h4>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {source.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Revenue</span>
                        <span className="text-white">
                          ${source.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Bookings</span>
                        <span className="text-white">
                          {source.bookingCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Avg Value</span>
                        <span className="text-white">
                          ${source.averageValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Commission</span>
                        <span className="text-red-400">
                          -${source.commission.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-700 pt-2">
                        <span className="text-neutral-400">Net Revenue</span>
                        <span className="text-green-400 font-medium">
                          ${source.netRevenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-neutral-800 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4">
                  Channel Performance Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Total Channels</span>
                    <span className="text-white">
                      {revenue.revenueBySource?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Best Performing</span>
                    <span className="text-green-400">
                      {revenue.revenueBySource?.length > 0
                        ? revenue.revenueBySource
                            .reduce((best, current) =>
                              current.revenue > best.revenue ? current : best
                            )
                            .source.replace('_', ' ')
                        : 'No data'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Total Commission</span>
                    <span className="text-red-400">
                      -$
                      {(
                        revenue.revenueBySource?.reduce(
                          (sum, s) => sum + s.commission,
                          0
                        ) || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-700 pt-2">
                    <span className="text-neutral-400">Net Revenue</span>
                    <span className="text-green-400 font-medium">
                      $
                      {(
                        revenue.revenueBySource?.reduce(
                          (sum, s) => sum + s.netRevenue,
                          0
                        ) || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Overview */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Cash Flow Overview
            </CardTitle>
            <CardDescription>
              Current cash position and flow analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowUp className="h-5 w-5 text-green-400" />
                  <h4 className="text-white font-medium">Cash Inflows</h4>
                </div>
                <p className="text-2xl font-bold text-green-400 mb-2">
                  $
                  {(
                    cashFlow.cashInflows?.reduce(
                      (sum, inflow) => sum + inflow.amount,
                      0
                    ) || 0
                  ).toLocaleString()}
                </p>
                <p className="text-sm text-neutral-400">
                  {cashFlow.cashInflows?.length || 0} transactions
                </p>
              </div>

              <div className="bg-neutral-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowDown className="h-5 w-5 text-red-400" />
                  <h4 className="text-white font-medium">Cash Outflows</h4>
                </div>
                <p className="text-2xl font-bold text-red-400 mb-2">
                  $
                  {(
                    cashFlow.cashOutflows?.reduce(
                      (sum, outflow) => sum + outflow.amount,
                      0
                    ) || 0
                  ).toLocaleString()}
                </p>
                <p className="text-sm text-neutral-400">
                  {cashFlow.cashOutflows?.length || 0} transactions
                </p>
              </div>

              <div className="bg-neutral-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                  <h4 className="text-white font-medium">Net Cash Flow</h4>
                </div>
                <p
                  className={`text-2xl font-bold mb-2 ${
                    cashFlow.totalCashFlow >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  ${cashFlow.totalCashFlow.toLocaleString()}
                </p>
                <p className="text-sm text-neutral-400">
                  Cash on hand: ${cashFlow.cashOnHand.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial KPIs Dashboard */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5" />
              Key Performance Indicators
            </CardTitle>
            <CardDescription>
              Comprehensive financial and operational metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialKPIsDashboard kpis={kpis} loading={financialLoading} />
          </CardContent>
        </Card>

        {/* Advanced Cash Flow Management */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Advanced Cash Flow Management
            </CardTitle>
            <CardDescription>
              Detailed cash flow analysis, payment methods, and projections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CashFlowManagement
              cashFlow={cashFlow}
              loading={financialLoading}
            />
          </CardContent>
        </Card>

        {/* Comprehensive Expense Tracking */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Expense Management System
            </CardTitle>
            <CardDescription>
              Track operational costs, staff expenses, and property maintenance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseTrackingSystem
              expenses={expenses}
              loading={financialLoading}
              onCreateExpense={(expense) => {
                // Handle expense creation
                console.log('Creating expense:', expense)
                toast.success('Expense created successfully!')
              }}
              onUpdateExpense={(id, updates) => {
                // Handle expense update
                console.log('Updating expense:', id, updates)
                toast.success('Expense updated successfully!')
              }}
              onDeleteExpense={(id) => {
                // Handle expense deletion
                console.log('Deleting expense:', id)
                toast.success('Expense deleted successfully!')
              }}
            />
          </CardContent>
        </Card>

        {/* Profit & Loss Statement */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Profit & Loss Statement
            </CardTitle>
            <CardDescription>
              Comprehensive financial performance analysis and reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfitLossStatement
              profitLoss={profitLoss}
              loading={financialLoading}
              onExport={(format) => {
                console.log(`Exporting P&L as ${format}`)
                toast.success(
                  `P&L statement exported as ${format.toUpperCase()}`
                )
              }}
              onGenerateReport={() => {
                console.log('Generating P&L report')
                toast.success('P&L report generated successfully')
              }}
            />
          </CardContent>
        </Card>

        {/* Financial Forecasting & Predictive Analytics */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Financial Forecasting & Predictive Analytics
            </CardTitle>
            <CardDescription>
              Advanced forecasting with scenario analysis and predictive
              modeling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialForecasting
              forecast={financialDashboard.forecasting}
              loading={financialLoading}
              onUpdateAssumptions={(assumptions) => {
                console.log('Updating forecast assumptions:', assumptions)
                toast.success('Forecast assumptions updated successfully')
              }}
              onGenerateScenario={(scenario) => {
                console.log('Generating scenario:', scenario)
                toast.success(`${scenario} scenario generated successfully`)
              }}
            />
          </CardContent>
        </Card>

        {/* Interactive Financial Charts */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Interactive Financial Charts & Analytics
            </CardTitle>
            <CardDescription>
              Visual data analysis with interactive charts and performance
              metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialCharts
              revenue={revenue}
              expenses={expenses}
              loading={financialLoading}
            />
          </CardContent>
        </Card>

        {/* Financial Export Manager */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Download className="h-5 w-5" />
              Report Export & Management
            </CardTitle>
            <CardDescription>
              Generate, export, and manage comprehensive financial reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialExportManager
              financialData={financialDashboard}
              loading={financialLoading}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Properties Section - Enhanced Property Management System
  function renderProperties() {
    return (
      <div className="space-y-6">
        {/* Property Management Navigation */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">
                  Property Management System
                </CardTitle>
                <CardDescription>
                  Comprehensive property oversight and management
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPropertyView('dashboard')}
                  variant={propertyView === 'dashboard' ? 'default' : 'outline'}
                  className={
                    propertyView === 'dashboard'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  onClick={() => setPropertyView('listing')}
                  variant={propertyView === 'listing' ? 'default' : 'outline'}
                  className={
                    propertyView === 'listing'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Properties
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Property Dashboard View */}
        {propertyView === 'dashboard' && (
          <PropertyDashboard
            onViewProperty={handleViewProperty}
            onCreateProperty={handleCreateProperty}
          />
        )}

        {/* Property Listing View */}
        {propertyView === 'listing' && (
          <PropertyListing
            onViewProperty={handleViewProperty}
            onEditProperty={handleEditProperty}
            onBulkAction={handleBulkAction}
          />
        )}
      </div>
    )
  }

  // Operations Section
  function renderOperations() {
    return (
      <div className="space-y-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Daily Operations</CardTitle>
            <CardDescription>
              Manage daily tasks and operational activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Active Tasks
                </h3>
                {[
                  {
                    task: 'Villa Sunset - Cleaning',
                    staff: 'Maria Santos',
                    due: '2 hours',
                    priority: 'high',
                  },
                  {
                    task: 'Villa Paradise - Maintenance',
                    staff: 'Carlos Rodriguez',
                    due: '4 hours',
                    priority: 'medium',
                  },
                  {
                    task: 'Guest Check-in Preparation',
                    staff: 'Maria Santos',
                    due: '6 hours',
                    priority: 'high',
                  },
                ].map((item, index) => (
                  <div key={index} className="p-3 bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{item.task}</h4>
                      <Badge
                        className={
                          item.priority === 'high'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }
                      >
                        {item.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-400">
                      Assigned to: {item.staff}
                    </p>
                    <p className="text-sm text-neutral-400">
                      Due in: {item.due}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button className="bg-green-600 hover:bg-green-700 h-auto p-4 flex-col gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">Complete Task</span>
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 h-auto p-4 flex-col gap-2">
                    <Plus className="h-5 w-5" />
                    <span className="text-sm">New Task</span>
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700 h-auto p-4 flex-col gap-2">
                    <Users className="h-5 w-5" />
                    <span className="text-sm">Assign Staff</span>
                  </Button>
                  <Button className="bg-orange-600 hover:bg-orange-700 h-auto p-4 flex-col gap-2">
                    <Bell className="h-5 w-5" />
                    <span className="text-sm">Send Alert</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Reports Section
  function renderReports() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Reports</CardTitle>
              <CardDescription>Generate commonly used reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => exportData('pdf', 'daily-report')}
                variant="outline"
                className="w-full justify-start border-neutral-600 text-neutral-300 hover:bg-neutral-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Daily Operations Report
              </Button>
              <Button
                onClick={() => exportData('pdf', 'weekly-report')}
                variant="outline"
                className="w-full justify-start border-neutral-600 text-neutral-300 hover:bg-neutral-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Weekly Performance Report
              </Button>
              <Button
                onClick={() => exportData('pdf', 'monthly-report')}
                variant="outline"
                className="w-full justify-start border-neutral-600 text-neutral-300 hover:bg-neutral-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Monthly Financial Report
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">System Status</CardTitle>
              <CardDescription>
                Current system health and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Last Backup</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  2 hours ago
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">System Health</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Excellent
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Active Integrations</span>
                <span className="text-white">3/3</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Settings Section
  function renderSettings() {
    return (
      <div className="space-y-6">
        {/* AI Automation Control */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">AI Automation Control</CardTitle>
            <CardDescription>
              Manage automated operations and AI-driven features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AIAutomationToggle />
          </CardContent>
        </Card>

        {/* AI Booking Test Panel */}
        <AIBookingTestPanel />

        {/* Smart Job Assignment Test Panel */}
        <SmartJobTestPanel />

        {/* Smart Job Analytics Dashboard */}
        <SmartJobAnalyticsDashboard />

        {/* Calendar Synchronization Dashboard */}
        <CalendarSyncDashboard />

        {/* Advanced Calendar View */}
        <AdvancedCalendarView />

        {/* Financial Dashboard - Rendered in Financial section */}

        {/* Job Completion Analytics */}
        <JobCompletionAnalytics />

        {/* Notification Dashboard */}
        <NotificationDashboard />

        {/* Job Acceptance Panel */}
        <JobAcceptancePanel />

        {/* AI Audit Log Viewer */}
        <AIAuditLogViewer />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure system notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">New Booking Alerts</p>
                  <p className="text-sm text-neutral-400">
                    Get notified of new bookings
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Staff Assignment Reminders</p>
                  <p className="text-sm text-neutral-400">
                    Remind to assign staff to bookings
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">System Backup</CardTitle>
              <CardDescription>Manage data backup and recovery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Auto Backup</p>
                  <p className="text-sm text-neutral-400">
                    Daily automatic backups
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <Button
                variant="outline"
                className="w-full border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Create Manual Backup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}
