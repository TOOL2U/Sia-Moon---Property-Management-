'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
// TODO: Replace with Firebase service
// import FirebaseService from '@/lib/firebaseService'

interface Profile {
  id: string
  email: string
  full_name: string
  role: 'client' | 'staff' | 'admin'
  created_at: string
  updated_at?: string
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { 
  ArrowLeft,
  User as UserIcon, 
  // Mail, 
  // Calendar,
  Shield,
  Users,
  Search,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AccountsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  useEffect(() => {
    // Check if user is staff/admin
    if (user && user.role !== 'staff') {
      toast.error('Access denied. Admin privileges required.')
      router.push('/dashboard/client')
      return
    }
    
    if (user) {
      fetchAccounts()
    }
  }, [user, router])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      // TODO: Replace with Firebase Firestore
      // const usersSnapshot = await getDocs(collection(db, 'users'))
      // const data = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      console.log('⚠️ Account fetching not implemented - Firebase integration needed')

      // Placeholder data for development
      const mockAccounts: Profile[] = [
        {
          id: '1',
          email: 'admin@example.com',
          full_name: 'Admin User',
          role: 'admin',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          email: 'client@example.com',
          full_name: 'Client User',
          role: 'client',
          created_at: new Date().toISOString()
        }
      ]

      setAccounts(mockAccounts)
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error('Failed to load user accounts')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const getRoleBadge = (role: Profile['role']) => {
    const variants: Record<string, string> = {
      client: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      staff: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      admin: 'bg-green-500/10 text-green-500 border-green-500/20'
    }
    const icons: Record<string, React.ElementType> = {
      client: UserIcon,
      staff: Shield,
      admin: Shield
    }
    const Icon = icons[role as keyof typeof icons] || UserIcon
    return (
      <Badge className={`${variants[role as keyof typeof variants] || ''} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {role}
      </Badge>
    )
  }

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = searchTerm === '' || 
      (account.full_name && account.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.role.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (!user || user.role !== 'staff') {
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
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">User Accounts</h1>
              <p className="text-neutral-400">View all registered user accounts</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowPasswords(!showPasswords)} 
                variant="outline" 
                size="sm"
              >
                {showPasswords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPasswords ? 'Hide' : 'Show'} Passwords
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Accounts</p>
                  <p className="text-2xl font-bold">{accounts.length}</p>
                </div>
                <Users className="h-8 w-8 text-neutral-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Client Accounts</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {accounts.filter(a => a.role === 'client').length}
                  </p>
                </div>
                <UserIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Staff Accounts</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {accounts.filter(a => a.role === 'staff').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading user accounts...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm ? 'No matching accounts' : 'No user accounts found'}
            </h3>
            <p className="text-neutral-400">
              {searchTerm 
                ? 'Try adjusting your search criteria.' 
                : 'User accounts will appear here when created.'}
            </p>
          </div>
        )}

        {/* Account Cards */}
        {!loading && filteredAccounts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAccounts.map((account) => (
              <Card key={account.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        {account.full_name || account.email}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {account.email}
                      </CardDescription>
                    </div>
                    {getRoleBadge(account.role)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-neutral-400 uppercase tracking-wide">User ID</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm bg-neutral-800 px-2 py-1 rounded font-mono">
                          {account.id.substring(0, 8)}...
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(account.id, 'User ID')}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-neutral-400 uppercase tracking-wide">Email</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm">{account.email}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(account.email, 'Email')}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Password display removed for Supabase profiles */}

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
                      <div>
                        <label className="text-xs text-neutral-400 uppercase tracking-wide">Created</label>
                        <p className="text-sm mt-1">
                          {new Date(account.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 uppercase tracking-wide">Updated</label>
                        <p className="text-sm mt-1">
                          {account.updated_at ? new Date(account.updated_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
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
