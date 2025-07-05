'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import SupabaseService from '@/lib/supabaseService'
import { VillaOnboarding } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { 
  Building, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const { profile: user } = useAuth()
  const router = useRouter()
  const [onboardings, setOnboardings] = useState<VillaOnboarding[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Check if user is staff/admin
    if (user && user.role !== 'staff') {
      toast.error('Access denied. Admin privileges required.')
      router.push('/dashboard/client')
      return
    }
    
    if (user) {
      fetchOnboardings()
    }
  }, [user, router])

  const fetchOnboardings = async () => {
    try {
      setLoading(true)
      const { data, error } = await SupabaseService.getAllVillaOnboardings()
      
      if (error) {
        console.error('Error fetching onboardings:', error)
        toast.error('Failed to load villa onboardings')
        return
      }

      setOnboardings(data || [])
    } catch (error) {
      console.error('Error fetching onboardings:', error)
      toast.error('Failed to load villa onboardings')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, newStatus: VillaOnboarding['status']) => {
    try {
      const { error } = await SupabaseService.updateVillaOnboarding(id, { status: newStatus })
      
      if (error) {
        toast.error('Failed to update status')
        return
      }

      // Update local state
      setOnboardings(prev => 
        prev.map(onboarding => 
          onboarding.id === id 
            ? { ...onboarding, status: newStatus }
            : onboarding
        )
      )

      toast.success(`Status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const getStatusBadge = (status: VillaOnboarding['status']) => {
    const variants = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      under_review: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      approved: 'bg-green-500/10 text-green-500 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/20'
    }

    const icons = {
      pending: Clock,
      under_review: Eye,
      approved: CheckCircle,
      rejected: XCircle
    }

    const Icon = icons[status]

    return (
      <Badge className={`${variants[status]} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const filteredOnboardings = onboardings.filter(onboarding => {
    const matchesFilter = filter === 'all' || onboarding.status === filter
    const matchesSearch = searchTerm === '' || 
      onboarding.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      onboarding.owner_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      onboarding.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-neutral-400">You need to be signed in to access the admin panel.</p>
        </div>
      </div>
    )
  }

  if (user.role !== 'staff') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-400">Admin privileges required to access this page.</p>
          <Link href="/dashboard/client">
            <Button className="mt-4">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Villa Onboarding Admin</h1>
              <p className="text-neutral-400">Review and manage villa onboarding submissions</p>
            </div>
            <Link href="/admin/accounts">
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                View All Accounts
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by property name, owner name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'under_review', label: 'Under Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' }
              ]}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Submissions</p>
                  <p className="text-2xl font-bold">{onboardings.length}</p>
                </div>
                <Building className="h-8 w-8 text-neutral-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {onboardings.filter(o => o.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Approved</p>
                  <p className="text-2xl font-bold text-green-500">
                    {onboardings.filter(o => o.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Rejected</p>
                  <p className="text-2xl font-bold text-red-500">
                    {onboardings.filter(o => o.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading villa onboardings...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOnboardings.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm || filter !== 'all' ? 'No matching submissions' : 'No villa onboardings yet'}
            </h3>
            <p className="text-neutral-400">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Villa onboarding submissions will appear here.'}
            </p>
          </div>
        )}

        {/* Onboarding Cards */}
        {!loading && filteredOnboardings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOnboardings.map((onboarding) => (
              <Card key={onboarding.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{onboarding.property_name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <User className="h-4 w-4 mr-1" />
                        {onboarding.owner_full_name}
                      </CardDescription>
                    </div>
                    {getStatusBadge(onboarding.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-neutral-400">
                      <Mail className="h-4 w-4 mr-2" />
                      {onboarding.owner_email}
                    </div>
                    <div className="flex items-center text-sm text-neutral-400">
                      <Phone className="h-4 w-4 mr-2" />
                      {onboarding.owner_contact_number}
                    </div>
                    <div className="flex items-center text-sm text-neutral-400">
                      <MapPin className="h-4 w-4 mr-2" />
                      {onboarding.property_address}
                    </div>
                    
                    {onboarding.bedrooms && onboarding.bathrooms && (
                      <div className="flex items-center gap-4 text-sm text-neutral-400">
                        <span>{onboarding.bedrooms} bed</span>
                        <span>{onboarding.bathrooms} bath</span>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Link href={`/admin/onboarding/${onboarding.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                      
                      {onboarding.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => updateStatus(onboarding.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 px-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(onboarding.id, 'rejected')}
                            className="bg-red-600 hover:bg-red-700 px-2"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
