/**
 * Jest test setup file
 */

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  credential: {
    cert: jest.fn()
  },
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn()
  }))
}))

// Mock Next.js modules  
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn()
  }
}))

// Global test timeout
jest.setTimeout(30000)
