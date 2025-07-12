'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  User,
  Home
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Property {
  id: string
  userId: string
  name: string
  address: string
  createdAt: any
}

interface MatchResult {
  clientId?: string
  propertyId?: string
  propertyName?: string
  confidence: number
  matchMethod: string
}

export default function ClientMatchingDebugPage() {
  const [searchTerm, setSearchTerm] = useState('Donkey House')
  const [properties, setProperties] = useState<Property[]>([])
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadAllProperties = async () => {
    setIsLoading(true)
    try {
      console.log('🔍 Loading all properties from Firebase...')
      
      // Import Firebase modules dynamically for client-side use
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore')
      
      // Import the centralized Firebase db instance
      const firebaseModule = await import('@/lib/firebase')
      const db = firebaseModule.db
      
      if (!db) {
        throw new Error('Firebase database not initialized')
      }
      
      const q = query(
        collection(db, 'properties'),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const loadedProperties: Property[] = []
      
      querySnapshot.forEach((doc) => {
        loadedProperties.push({
          id: doc.id,
          ...doc.data()
        } as Property)
      })
      
      setProperties(loadedProperties)
      console.log(`✅ Loaded ${loadedProperties.length} properties`)
      toast.success(`Loaded ${loadedProperties.length} properties`)
      
    } catch (error) {
      console.error('❌ Error loading properties:', error)
      toast.error('Failed to load properties')
    } finally {
      setIsLoading(false)
    }
  }

  const testClientMatching = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a property name to test')
      return
    }
    
    setIsLoading(true)
    try {
      console.log('🎯 Testing client matching for:', searchTerm)
      
      // Test exact name match
      const exactMatch = properties.find(p => 
        p.name.toLowerCase().trim() === searchTerm.toLowerCase().trim()
      )
      
      if (exactMatch) {
        const result: MatchResult = {
          clientId: exactMatch.userId,
          propertyId: exactMatch.id,
          propertyName: exactMatch.name,
          confidence: 0.95,
          matchMethod: 'exact_property_name'
        }
        setMatchResult(result)
        console.log('✅ Exact match found:', result)
        toast.success('Exact match found!')
        return
      }
      
      // Test fuzzy matching
      const fuzzyMatches = properties.map(property => {
        const similarity = calculateStringSimilarity(
          searchTerm.toLowerCase().trim(),
          property.name.toLowerCase().trim()
        )
        
        return {
          property,
          similarity
        }
      }).filter(match => match.similarity > 0.7)
      
      if (fuzzyMatches.length > 0) {
        fuzzyMatches.sort((a, b) => b.similarity - a.similarity)
        const bestMatch = fuzzyMatches[0]
        
        const result: MatchResult = {
          clientId: bestMatch.property.userId,
          propertyId: bestMatch.property.id,
          propertyName: bestMatch.property.name,
          confidence: bestMatch.similarity * 0.9,
          matchMethod: 'fuzzy_property_name'
        }
        setMatchResult(result)
        console.log('✅ Fuzzy match found:', result)
        toast.success(`Fuzzy match found (${(bestMatch.similarity * 100).toFixed(1)}% similarity)`)
        return
      }
      
      // No match found
      setMatchResult({
        confidence: 0,
        matchMethod: 'no_match'
      })
      console.log('❌ No match found for:', searchTerm)
      toast.error('No matching property found')
      
    } catch (error) {
      console.error('❌ Error testing client matching:', error)
      toast.error('Error testing client matching')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStringSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length
    const len2 = str2.length
    
    if (len1 === 0) return len2 === 0 ? 1 : 0
    if (len2 === 0) return 0
    
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null))
    
    for (let i = 0; i <= len1; i++) {
      matrix[0][i] = i
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[j][0] = j
    }
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }
    
    const maxLen = Math.max(len1, len2)
    const distance = matrix[len2][len1]
    
    return (maxLen - distance) / maxLen
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Search className="w-8 h-8 text-blue-400" />
            Client Matching Debug Tool
          </h1>
          <p className="text-neutral-400">
            Debug why "Donkey House" booking failed to match with donkey@gmail.com's property
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Debug Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Property Name to Test
                </label>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter property name (e.g., Donkey House)"
                  className="bg-neutral-900 border-neutral-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={loadAllProperties}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Database className="w-4 h-4 mr-2" />
                  {isLoading ? 'Loading...' : `Load All Properties (${properties.length})`}
                </Button>
                
                <Button
                  onClick={testClientMatching}
                  disabled={isLoading || properties.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Test Client Matching
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Matching Results</CardTitle>
            </CardHeader>
            <CardContent>
              {matchResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {matchResult.confidence > 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-medium">
                      {matchResult.confidence > 0 ? 'Match Found' : 'No Match Found'}
                    </span>
                    <Badge className={matchResult.confidence > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {(matchResult.confidence * 100).toFixed(1)}% confidence
                    </Badge>
                  </div>
                  
                  {matchResult.confidence > 0 && (
                    <div className="space-y-2 text-sm">
                      <div><strong>Client ID:</strong> {matchResult.clientId}</div>
                      <div><strong>Property ID:</strong> {matchResult.propertyId}</div>
                      <div><strong>Property Name:</strong> {matchResult.propertyName}</div>
                      <div><strong>Match Method:</strong> {matchResult.matchMethod}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">No matching test performed yet</p>
                  <p className="text-neutral-500 text-sm">Load properties and test matching</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
        {properties.length > 0 && (
          <Card className="bg-neutral-950 border-neutral-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Home className="w-5 h-5" />
                All Properties ({properties.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="p-3 bg-neutral-900 rounded border border-neutral-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{property.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {property.id.slice(0, 8)}...
                      </Badge>
                    </div>
                    <div className="text-sm text-neutral-400">
                      <div><strong>Owner ID:</strong> {property.userId}</div>
                      <div><strong>Address:</strong> {property.address}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
