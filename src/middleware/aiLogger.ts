import { AILogEntry } from "@/types/ai";

// Database interfaces
interface DatabaseConfig {
  type: 'firestore' | 'mongodb' | 'none'
  connected: boolean
}

// Global database configuration
let dbConfig: DatabaseConfig = {
  type: 'none',
  connected: false
}

/**
 * Initialize database connection for persistent logging
 */
export async function initializeAILogger(): Promise<void> {
  try {
    // Check for Firestore configuration
    if (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_PROJECT_ID) {
      await initializeFirestore()
      dbConfig = { type: 'firestore', connected: true }
      console.log('✅ AI Logger: Firestore initialized')
      return
    }

    // Check for MongoDB configuration
    if (process.env.MONGO_URI || process.env.MONGODB_URI) {
      await initializeMongoDB()
      dbConfig = { type: 'mongodb', connected: true }
      console.log('✅ AI Logger: MongoDB initialized')
      return
    }

    console.log('⚠️ AI Logger: No database configured, using console-only logging')
    dbConfig = { type: 'none', connected: false }

  } catch (error) {
    console.error('❌ AI Logger: Database initialization failed:', error)
    dbConfig = { type: 'none', connected: false }
  }
}

/**
 * Log AI decision to console, API, and persistent storage
 */
export async function logAIDecision(entry: AILogEntry): Promise<void> {
  try {
    // Enhanced console logging with visual indicators
    const escalationIcon = entry.escalation ? '🚨' : '✅'
    const confidenceColor = entry.confidence >= 80 ? '🟢' : entry.confidence >= 60 ? '🟡' : '🔴'

    console.log(`${escalationIcon} [AI:${entry.agent}] ${confidenceColor} ${entry.confidence}% - ${entry.decision}`)

    if (entry.notes) {
      console.log(`   📝 Notes: ${entry.notes}`)
    }

    // Parallel logging to multiple destinations
    const logPromises = [
      sendToLogAPI(entry),
      saveToPersistentStorage(entry)
    ]

    // Wait for all logging operations (but don't fail if some fail)
    await Promise.allSettled(logPromises)

  } catch (error) {
    console.error('❌ AI Logger Error:', error)
    // Fallback to console-only logging if everything fails
    console.log(`[AI:${entry.agent}] (${entry.timestamp})`, entry.decision)
  }
}

/**
 * Send log entry to centralized AI logging API
 */
async function sendToLogAPI(entry: AILogEntry): Promise<void> {
  try {
    // Only call API in server environment, not during build
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      })

      if (!response.ok) {
        throw new Error(`AI Log API error: ${response.status}`)
      }

      const result = await response.json()
      console.log(`📊 AI Log API: ${result.logId}`)
    }
  } catch (error) {
    console.warn('⚠️ AI Log API unavailable:', error)
  }
}

/**
 * Save log entry to persistent storage (Firestore or MongoDB)
 */
async function saveToPersistentStorage(entry: AILogEntry): Promise<void> {
  if (!dbConfig.connected) {
    return // Skip if no database configured
  }

  try {
    const logDocument = {
      ...entry,
      logId: generateLogId(entry),
      createdAt: new Date(),
      processed: false
    }

    switch (dbConfig.type) {
      case 'firestore':
        await saveToFirestore(logDocument)
        break
      case 'mongodb':
        await saveToMongoDB(logDocument)
        break
      default:
        console.warn('⚠️ Unknown database type:', dbConfig.type)
    }

    console.log(`💾 AI Log DB: ${logDocument.logId}`)

  } catch (error) {
    console.error('❌ AI Log Database Error:', error)
  }
}

/**
 * Initialize Firestore connection using Firebase Admin SDK
 */
async function initializeFirestore(): Promise<void> {
  try {
    // Use Firebase Admin SDK for server-side operations
    const admin = await import('firebase-admin')
    const { getFirestore } = await import('firebase-admin/firestore')

    // Initialize Firebase Admin if not already initialized
    if (!admin.default.apps.length) {
      let credential

      // Try to get service account from environment
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
          credential = admin.default.credential.cert(serviceAccount)
        } catch (error) {
          console.warn('⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT, trying file path...')
          credential = admin.default.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT)
        }
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Use default credentials if available
        credential = admin.default.credential.applicationDefault()
      } else {
        throw new Error('No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS')
      }

      admin.default.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      })
    }

    // Test the connection
    const db = getFirestore()
    await db.collection('_test').limit(1).get()

    console.log('🔥 Firebase Admin SDK initialized for AI logging')

  } catch (error) {
    throw new Error(`Firestore Admin initialization failed: ${error}`)
  }
}

/**
 * Initialize MongoDB connection
 */
async function initializeMongoDB(): Promise<void> {
  try {
    // Dynamic import to avoid loading MongoDB in environments where it's not needed
    const { MongoClient } = await import('mongodb')

    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!uri) {
      throw new Error('MongoDB URI not configured')
    }

    const client = new MongoClient(uri)
    await client.connect()

    // Test the connection
    await client.db().admin().ping()

    console.log('🍃 MongoDB initialized for AI logging')

  } catch (error) {
    throw new Error(`MongoDB initialization failed: ${error}`)
  }
}

/**
 * Save log entry to Firestore using Admin SDK
 */
async function saveToFirestore(logDocument: any): Promise<void> {
  try {
    const { getFirestore } = await import('firebase-admin/firestore')

    const db = getFirestore()
    const logsCollection = db.collection('ai_logs')

    // Add document with auto-generated ID
    const docRef = await logsCollection.add({
      ...logDocument,
      createdAt: new Date(),
      serverTimestamp: new Date().toISOString()
    })

    console.log(`💾 Firestore: Log saved with ID ${docRef.id}`)

  } catch (error) {
    throw new Error(`Firestore save failed: ${error}`)
  }
}

/**
 * Save log entry to MongoDB
 */
async function saveToMongoDB(logDocument: any): Promise<void> {
  try {
    const { MongoClient } = await import('mongodb')

    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    const client = new MongoClient(uri!)

    await client.connect()
    const db = client.db(process.env.MONGO_DB_NAME || 'ai_system')
    const collection = db.collection('ai_logs')

    await collection.insertOne(logDocument)
    await client.close()

  } catch (error) {
    throw new Error(`MongoDB save failed: ${error}`)
  }
}

/**
 * Generate unique log ID for tracking
 */
function generateLogId(entry: AILogEntry): string {
  const timestamp = new Date(entry.timestamp).getTime()
  const agentPrefix = entry.agent.toLowerCase()
  const random = Math.random().toString(36).substring(2, 8)

  return `${agentPrefix}_${timestamp}_${random}`
}

/**
 * Query logs from persistent storage
 */
export async function queryAILogs(filters: {
  agent?: string
  escalation?: boolean
  startDate?: Date
  endDate?: Date
  limit?: number
}): Promise<AILogEntry[]> {
  if (!dbConfig.connected) {
    console.warn('⚠️ No database connected for log querying')
    return []
  }

  try {
    switch (dbConfig.type) {
      case 'firestore':
        return await queryFirestoreLogs(filters)
      case 'mongodb':
        return await queryMongoDBLogs(filters)
      default:
        return []
    }
  } catch (error) {
    console.error('❌ AI Log Query Error:', error)
    return []
  }
}

/**
 * Query logs from Firestore using Admin SDK
 */
async function queryFirestoreLogs(filters: any): Promise<AILogEntry[]> {
  try {
    const { getFirestore } = await import('firebase-admin/firestore')

    const db = getFirestore()
    let query: any = db.collection('ai_logs')

    // Apply filters
    if (filters.agent) {
      query = query.where('agent', '==', filters.agent)
    }
    if (filters.escalation !== undefined) {
      query = query.where('escalation', '==', filters.escalation)
    }
    if (filters.startDate) {
      query = query.where('timestamp', '>=', filters.startDate.toISOString())
    }
    if (filters.endDate) {
      query = query.where('timestamp', '<=', filters.endDate.toISOString())
    }

    // Order and limit
    query = query.orderBy('timestamp', 'desc')
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const querySnapshot = await query.get()
    return querySnapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        timestamp: data.timestamp,
        agent: data.agent,
        decision: data.decision,
        confidence: data.confidence,
        source: data.source,
        escalation: data.escalation,
        notes: data.notes
      } as AILogEntry
    })

  } catch (error) {
    throw new Error(`Firestore query failed: ${error}`)
  }
}

/**
 * Query logs from MongoDB
 */
async function queryMongoDBLogs(filters: any): Promise<AILogEntry[]> {
  try {
    const { MongoClient } = await import('mongodb')

    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    const client = new MongoClient(uri!)

    await client.connect()
    const db = client.db(process.env.MONGO_DB_NAME || 'ai_system')
    const collection = db.collection('ai_logs')

    // Build query
    const mongoQuery: any = {}
    if (filters.agent) mongoQuery.agent = filters.agent
    if (filters.escalation !== undefined) mongoQuery.escalation = filters.escalation
    if (filters.startDate || filters.endDate) {
      mongoQuery.timestamp = {}
      if (filters.startDate) mongoQuery.timestamp.$gte = filters.startDate.toISOString()
      if (filters.endDate) mongoQuery.timestamp.$lte = filters.endDate.toISOString()
    }

    const cursor = collection
      .find(mongoQuery)
      .sort({ timestamp: -1 })
      .limit(filters.limit || 100)

    const results = await cursor.toArray()
    await client.close()

    return results.map(doc => ({
      timestamp: doc.timestamp,
      agent: doc.agent,
      decision: doc.decision,
      confidence: doc.confidence,
      source: doc.source,
      escalation: doc.escalation,
      notes: doc.notes
    }))

  } catch (error) {
    throw new Error(`MongoDB query failed: ${error}`)
  }
}

/**
 * Get database status
 */
export function getDatabaseStatus(): DatabaseConfig {
  return { ...dbConfig }
}
