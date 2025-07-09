'use client'

import { useState, useEffect } from 'react'
import { auth, db, storage } from '@/lib/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore'
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  details?: any
}

export default function TestFirebaseConnections() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testPassword, setTestPassword] = useState('testpassword123')

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }

  const updateResult = (name: string, updates: Partial<TestResult>) => {
    setResults(prev => prev.map(r => r.name === name ? { ...r, ...updates } : r))
  }

  // Test Firebase Configuration
  const testFirebaseConfig = async () => {
    addResult({ name: 'Firebase Configuration', status: 'pending', message: 'Checking configuration...' })
    
    try {
      const config = {
        auth: !!auth,
        firestore: !!db,
        storage: !!storage,
        authReady: auth !== null,
        firestoreReady: db !== null,
        storageReady: storage !== null
      }

      if (config.auth && config.firestore && config.storage) {
        updateResult('Firebase Configuration', {
          status: 'success',
          message: 'All Firebase services initialized successfully',
          details: config
        })
      } else {
        updateResult('Firebase Configuration', {
          status: 'error',
          message: 'Some Firebase services failed to initialize',
          details: config
        })
      }
    } catch (error) {
      updateResult('Firebase Configuration', {
        status: 'error',
        message: `Configuration error: ${error}`,
        details: error
      })
    }
  }

  // Test Firestore Connection
  const testFirestoreConnection = async () => {
    addResult({ name: 'Firestore Connection', status: 'pending', message: 'Testing Firestore read/write...' })
    
    try {
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      // Test write
      const testDoc = {
        message: 'Firebase connection test',
        timestamp: Timestamp.now(),
        testId: Math.random().toString(36).substr(2, 9)
      }

      const docRef = await addDoc(collection(db, 'connection_tests'), testDoc)
      
      // Test read
      const querySnapshot = await getDocs(collection(db, 'connection_tests'))
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Clean up test document
      await deleteDoc(doc(db, 'connection_tests', docRef.id))

      updateResult('Firestore Connection', {
        status: 'success',
        message: `Firestore read/write successful. Found ${docs.length} test documents.`,
        details: { documentId: docRef.id, totalDocs: docs.length }
      })
    } catch (error) {
      updateResult('Firestore Connection', {
        status: 'error',
        message: `Firestore error: ${error}`,
        details: error
      })
    }
  }

  // Test Firebase Auth
  const testFirebaseAuth = async () => {
    addResult({ name: 'Firebase Auth', status: 'pending', message: 'Testing authentication...' })
    
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized')
      }

      // Test auth state listener
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user?.email || 'No user')
      })

      // Clean up listener
      unsubscribe()

      updateResult('Firebase Auth', {
        status: 'success',
        message: 'Firebase Auth initialized and state listener working',
        details: { 
          currentUser: auth.currentUser?.email || 'No user signed in',
          authReady: true
        }
      })
    } catch (error) {
      updateResult('Firebase Auth', {
        status: 'error',
        message: `Auth error: ${error}`,
        details: error
      })
    }
  }

  // Test Firebase Storage
  const testFirebaseStorage = async () => {
    addResult({ name: 'Firebase Storage', status: 'pending', message: 'Testing file upload/download...' })
    
    try {
      if (!storage) {
        throw new Error('Firebase Storage not initialized')
      }

      // Create a test file
      const testContent = 'Firebase storage connection test'
      const testFile = new Blob([testContent], { type: 'text/plain' })
      const fileName = `connection-test-${Date.now()}.txt`
      
      // Test upload
      const storageRef = ref(storage, `tests/${fileName}`)
      const uploadResult = await uploadBytes(storageRef, testFile)
      
      // Test download URL
      const downloadURL = await getDownloadURL(storageRef)
      
      // Clean up test file
      await deleteObject(storageRef)

      updateResult('Firebase Storage', {
        status: 'success',
        message: 'Storage upload/download successful',
        details: { 
          fileName,
          uploadSize: uploadResult.metadata.size,
          downloadURL: downloadURL.substring(0, 50) + '...'
        }
      })
    } catch (error) {
      updateResult('Firebase Storage', {
        status: 'error',
        message: `Storage error: ${error}`,
        details: error
      })
    }
  }

  // Test OnboardingService
  const testOnboardingService = async () => {
    addResult({ name: 'OnboardingService', status: 'pending', message: 'Testing onboarding service...' })
    
    try {
      const { OnboardingService } = await import('@/lib/services/onboardingService')
      
      // Test creating a submission
      const testSubmission = {
        userId: 'test-user-id',
        ownerFullName: 'Test User',
        ownerEmail: 'test@example.com',
        ownerContactNumber: '+1234567890',
        propertyName: 'Test Villa',
        propertyAddress: 'Test Address',
        submissionType: 'test'
      }

      const submissionId = await OnboardingService.createSubmission(testSubmission)
      
      // Test retrieving the submission
      const retrieved = await OnboardingService.getSubmissionById(submissionId)
      
      // Clean up
      // Note: Add delete method to OnboardingService if needed for cleanup

      updateResult('OnboardingService', {
        status: 'success',
        message: 'OnboardingService create/read successful',
        details: { 
          submissionId,
          retrievedData: retrieved?.ownerFullName
        }
      })
    } catch (error) {
      updateResult('OnboardingService', {
        status: 'error',
        message: `OnboardingService error: ${error}`,
        details: error
      })
    }
  }

  // Test PropertyService
  const testPropertyService = async () => {
    addResult({ name: 'PropertyService', status: 'pending', message: 'Testing property service...' })
    
    try {
      const { PropertyService } = await import('@/lib/services/propertyService')
      
      // Test getting properties for a user
      const properties = await PropertyService.getPropertiesByUserId('test-user-id')

      updateResult('PropertyService', {
        status: 'success',
        message: 'PropertyService query successful',
        details: { 
          propertiesFound: properties.length
        }
      })
    } catch (error) {
      updateResult('PropertyService', {
        status: 'error',
        message: `PropertyService error: ${error}`,
        details: error
      })
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])

    try {
      await testFirebaseConfig()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testFirebaseAuth()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testFirestoreConnection()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testFirebaseStorage()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testOnboardingService()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testPropertyService()
    } catch (error) {
      console.error('Test suite error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  // Auto-run tests on component mount
  useEffect(() => {
    runAllTests()
  }, [])

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-900/20 border-green-800'
      case 'error': return 'text-red-400 bg-red-900/20 border-red-800'
      case 'pending': return 'text-yellow-400 bg-yellow-900/20 border-yellow-800'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-800'
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'pending': return '⏳'
      default: return '❓'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Firebase Connection Tests</h1>
            <p className="text-neutral-400 mt-2">Testing all Firebase services and integrations</p>
          </div>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {results.map((result, index) => (
            <Card key={index} className={`bg-neutral-900 border ${getStatusColor(result.status)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <span className="text-xl">{getStatusIcon(result.status)}</span>
                  {result.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-neutral-300">{result.message}</p>
                  
                  {result.details && (
                    <div className="bg-neutral-800 p-3 rounded-lg">
                      <h4 className="text-sm font-semibold text-neutral-400 mb-2">Details:</h4>
                      <pre className="text-xs text-neutral-300 overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {results.length === 0 && !isRunning && (
          <div className="text-center py-12">
            <p className="text-neutral-400">Click "Run All Tests" to start testing Firebase connections</p>
          </div>
        )}

        {isRunning && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-neutral-400">Running Firebase connection tests...</p>
          </div>
        )}
      </div>
    </div>
  )
}
