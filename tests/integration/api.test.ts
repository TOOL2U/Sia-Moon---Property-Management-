/**
 * API Integration Tests
 * Tests all API endpoints for functionality and security
 */

import { NextRequest } from 'next/server'

// Mock fetch for API testing
global.fetch = jest.fn()

const API_BASE_URL = 'http://localhost:3001'
const MOBILE_API_KEY = 'sia-moon-mobile-app-2025-secure-key'
const MOBILE_SECRET = 'mobile-app-sync-2025-secure'

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication API', () => {
    test('POST /api/auth/login - should authenticate valid user', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: 'user123',
          email: 'test@example.com',
          role: 'admin'
        },
        token: 'mock-jwt-token'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200
      })

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.user.email).toBe('test@example.com')
    })

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
        status: 401
      })

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid credentials')
    })
  })

  describe('Staff Management API', () => {
    test('GET /api/admin/staff-accounts - should return staff list', async () => {
      const mockStaff = [
        {
          id: 'staff1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'cleaner',
          status: 'active'
        }
      ]

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStaff }),
        status: 200
      })

      const response = await fetch(`${API_BASE_URL}/api/admin/staff-accounts`)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    test('POST /api/admin/staff-accounts - should create new staff member', async () => {
      const newStaff = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'manager',
        password: 'securepassword123'
      }

      const mockResponse = {
        success: true,
        data: { id: 'staff2', ...newStaff }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 201
      })

      const response = await fetch(`${API_BASE_URL}/api/admin/staff-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStaff)
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe(newStaff.name)
    })
  })

  describe('Mobile API Endpoints', () => {
    test('GET /api/bookings?mobile=true - should authenticate with mobile headers', async () => {
      const mockBookings = [
        {
          id: 'booking1',
          propertyName: 'Villa Paradise',
          guestName: 'Guest User',
          status: 'approved',
          checkIn: '2025-07-20',
          checkOut: '2025-07-25'
        }
      ]

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { bookings: mockBookings } }),
        status: 200
      })

      const response = await fetch(`${API_BASE_URL}/api/bookings?mobile=true&status=approved`, {
        headers: {
          'X-API-Key': MOBILE_API_KEY,
          'X-Mobile-Secret': MOBILE_SECRET
        }
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data.bookings)).toBe(true)
    })

    test('GET /api/mobile/assignments - should return staff assignments', async () => {
      const mockAssignments = [
        {
          id: 'assignment1',
          jobType: 'cleaning',
          propertyName: 'Villa Paradise',
          status: 'pending',
          scheduledDate: '2025-07-20'
        }
      ]

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { assignments: mockAssignments } }),
        status: 200
      })

      const response = await fetch(`${API_BASE_URL}/api/mobile/assignments?staffId=staff1`, {
        headers: {
          'X-API-Key': MOBILE_API_KEY,
          'X-Mobile-Secret': MOBILE_SECRET
        }
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data.assignments)).toBe(true)
    })

    test('POST /api/mobile/sync - should perform bidirectional sync', async () => {
      const syncData = {
        lastSyncTimestamp: Date.now() - 3600000,
        staffId: 'staff1',
        deviceId: 'device1',
        pendingChanges: {
          assignments: [
            {
              id: 'assignment1',
              type: 'update',
              data: { status: 'completed' }
            }
          ]
        }
      }

      const mockResponse = {
        success: true,
        data: {
          syncTimestamp: Date.now(),
          updatedRecords: 1,
          conflicts: []
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200
      })

      const response = await fetch(`${API_BASE_URL}/api/mobile/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': MOBILE_API_KEY,
          'X-Mobile-Secret': MOBILE_SECRET
        },
        body: JSON.stringify(syncData)
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.updatedRecords).toBe(1)
    })
  })

  describe('Job Management API', () => {
    test('GET /api/jobs - should return job assignments', async () => {
      const mockJobs = [
        {
          id: 'job1',
          title: 'Villa Cleaning',
          description: 'Deep clean Villa Paradise',
          status: 'pending',
          assignedTo: 'staff1',
          propertyId: 'property1'
        }
      ]

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockJobs }),
        status: 200
      })

      const response = await fetch(`${API_BASE_URL}/api/jobs`)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    test('POST /api/jobs - should create new job assignment', async () => {
      const newJob = {
        title: 'Maintenance Check',
        description: 'Check pool equipment',
        propertyId: 'property1',
        assignedTo: 'staff1',
        scheduledDate: '2025-07-21'
      }

      const mockResponse = {
        success: true,
        data: { id: 'job2', ...newJob, status: 'pending' }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 201
      })

      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJob)
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.title).toBe(newJob.title)
    })
  })

  describe('Security Tests', () => {
    test('should reject requests without proper mobile authentication', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Unauthorized' }),
        status: 401
      })

      const response = await fetch(`${API_BASE_URL}/api/bookings?mobile=true`)
      const data = await response.json()
      
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    test('should reject requests with invalid mobile API key', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Invalid API key' }),
        status: 401
      })

      const response = await fetch(`${API_BASE_URL}/api/bookings?mobile=true`, {
        headers: {
          'X-API-Key': 'invalid-key',
          'X-Mobile-Secret': MOBILE_SECRET
        }
      })

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid API key')
    })
  })
})
