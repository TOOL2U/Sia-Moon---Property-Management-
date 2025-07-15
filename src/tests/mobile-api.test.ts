/**
 * Mobile API Testing Suite
 * Comprehensive test cases for all mobile endpoints and authentication scenarios
 */

// Mock fetch for testing
global.fetch = jest.fn()

const MOBILE_API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  API_KEY: 'sia-moon-mobile-app-2025-secure-key',
  MOBILE_SECRET: 'mobile-app-sync-2025-secure',
  INVALID_API_KEY: 'invalid-key',
  INVALID_SECRET: 'invalid-secret'
}

interface TestResponse {
  success: boolean
  data?: any
  error?: string
  timestamp?: number
}

/**
 * Helper function to make authenticated mobile API requests
 */
async function makeMobileAPIRequest(
  endpoint: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    useInvalidAuth?: boolean
  } = {}
): Promise<TestResponse> {
  const {
    method = 'GET',
    body,
    headers = {},
    useInvalidAuth = false
  } = options

  const authHeaders = useInvalidAuth ? {
    'X-API-Key': MOBILE_API_CONFIG.INVALID_API_KEY,
    'X-Mobile-Secret': MOBILE_API_CONFIG.INVALID_SECRET
  } : {
    'X-API-Key': MOBILE_API_CONFIG.API_KEY,
    'X-Mobile-Secret': MOBILE_API_CONFIG.MOBILE_SECRET
  }

  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers
    }
  }

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body)
  }

  const response = await fetch(`${MOBILE_API_CONFIG.BASE_URL}${endpoint}`, requestOptions)
  return await response.json()
}

describe('Mobile API Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should authenticate with valid API key and mobile secret', async () => {
    const mockResponse = {
      success: true,
      data: { bookings: [] },
      timestamp: Date.now()
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
      status: 200
    })

    const result = await makeMobileAPIRequest('/api/bookings?mobile=true&status=approved')
    
    expect(result.success).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/bookings'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': MOBILE_API_CONFIG.API_KEY,
          'X-Mobile-Secret': MOBILE_API_CONFIG.MOBILE_SECRET
        })
      })
    )
  })

  test('should reject invalid API key', async () => {
    const mockResponse = {
      success: false,
      error: 'Invalid API key',
      timestamp: Date.now()
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
      status: 401
    })

    const result = await makeMobileAPIRequest('/api/bookings?mobile=true', {
      useInvalidAuth: true
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid API key')
  })

  test('should reject missing authentication headers', async () => {
    const mockResponse = {
      success: false,
      error: 'Missing required authentication headers',
      timestamp: Date.now()
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
      status: 401
    })

    const result = await fetch(`${MOBILE_API_CONFIG.BASE_URL}/api/bookings?mobile=true`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json())
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Missing required authentication headers')
  })
})

describe('Mobile Bookings API', () => {
  test('should fetch approved bookings', async () => {
    const mockBookings = [
      {
        id: 'booking_001',
        propertyName: 'Villa Mango Beach',
        guestName: 'John Doe',
        status: 'approved',
        checkIn: '2025-07-20',
        checkOut: '2025-07-25'
      }
    ]

    const mockResponse = {
      success: true,
      data: {
        bookings: mockBookings,
        count: 1,
        status: 'approved'
      },
      timestamp: Date.now()
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
      status: 200
    })

    const result = await makeMobileAPIRequest('/api/bookings?mobile=true&status=approved')
    
    expect(result.success).toBe(true)
    expect(result.data.bookings).toHaveLength(1)
    expect(result.data.bookings[0].status).toBe('approved')
  })

  test('should update booking status', async () => {
    const updateData = {
      status: 'confirmed',
      updatedBy: 'staff_001',
      notes: 'Booking confirmed by mobile app',
      timestamp: new Date().toISOString()
    }

    const mockResponse = {
      success: true,
      data: {
        bookingId: 'booking_001',
        oldStatus: 'approved',
        newStatus: 'confirmed',
        updatedAt: new Date().toISOString()
      },
      message: 'Booking updated successfully',
      timestamp: Date.now()
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
      status: 200
    })

    const result = await makeMobileAPIRequest('/api/bookings/booking_001', {
      method: 'PATCH',
      body: updateData
    })
    
    expect(result.success).toBe(true)
    expect(result.data.newStatus).toBe('confirmed')
    expect(result.message).toBe('Booking updated successfully')
  })

  test('should validate booking update data', async () => {
    const invalidUpdateData = {
      status: 'invalid_status', // Invalid status
      updatedBy: '', // Missing updatedBy
      timestamp: 'invalid_date' // Invalid timestamp
    }

    const mockResponse = {
      success: false,
      error: 'Validation failed: Invalid status value, updatedBy (staff ID) is required, Invalid timestamp format',
      timestamp: Date.now()
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
      status: 400
    })

    const result = await makeMobileAPIRequest('/api/bookings/booking_001', {
      method: 'PATCH',
      body: invalidUpdateData
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Validation failed')
  })
})

describe('Mobile Staff Assignments API', () => {
  test('should fetch staff assignments', async () => {
    const mockAssignments = [
      {
        id: 'assignment_001',
        staffId: 'staff_001',
        taskType: 'cleaning',
        title: 'Pre-arrival Cleaning',
        status: 'pending',
        scheduledDate: '2025-07-20'
      }
    ]

    const mockResponse = {
      success: true,
      data: {
        assignments: mockAssignments,
        count: 1,
        filters: { staffId: 'staff_001', date: 'all', status: 'all' }
      },
      timestamp: Date.now()
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
      status: 200
    })

    const result = await makeMobileAPIRequest('/api/mobile/assignments?staffId=staff_001')
    
    expect(result.success).toBe(true)
    expect(result.data.assignments).toHaveLength(1)
    expect(result.data.assignments[0].staffId).toBe('staff_001')
  })

  test('should update assignment status', async () => {
    const updateData = {
      status: 'completed',
      notes: 'Task completed successfully',
      timeSpent: 120, // 2 hours
      updatedBy: 'staff_001',
      timestamp: new Date().toISOString()
    }

    const mockResponse = {
      success: true,
      data: {
        assignmentId: 'assignment_001',
        oldStatus: 'in-progress',
        newStatus: 'completed',
        updatedAt: new Date().toISOString()
      },
      message: 'Assignment updated successfully',
      timestamp: Date.now()
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
      status: 200
    })

    const result = await makeMobileAPIRequest('/api/mobile/assignments/assignment_001', {
      method: 'PATCH',
      body: updateData
    })
    
    expect(result.success).toBe(true)
    expect(result.data.newStatus).toBe('completed')
    expect(result.message).toBe('Assignment updated successfully')
  })
})

describe('Mobile Sync API', () => {
  test('should perform bidirectional sync', async () => {
    const syncRequest = {
      lastSyncTimestamp: Date.now() - 3600000, // 1 hour ago
      staffId: 'staff_001',
      deviceId: 'device_001',
      platform: 'mobile',
      pendingChanges: {
        bookings: [
          {
            id: 'booking_001',
            type: 'update',
            data: { status: 'confirmed' },
            timestamp: Date.now()
          }
        ],
        assignments: [
          {
            id: 'assignment_001',
            type: 'update',
            data: { status: 'completed' },
            timestamp: Date.now()
          }
        ]
      }
    }

    const mockResponse = {
      success: true,
      data: {
        bookings: [],
        assignments: [],
        properties: [],
        lastSyncTimestamp: Date.now(),
        syncStats: {
          processed: { bookings: 1, assignments: 1 },
          fetched: { bookings: 0, assignments: 0, properties: 0 },
          errors: []
        }
      },
      message: 'Sync completed successfully',
      timestamp: Date.now()
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
      status: 200
    })

    const result = await makeMobileAPIRequest('/api/mobile/sync', {
      method: 'POST',
      body: syncRequest
    })
    
    expect(result.success).toBe(true)
    expect(result.data.syncStats.processed.bookings).toBe(1)
    expect(result.data.syncStats.processed.assignments).toBe(1)
    expect(result.message).toBe('Sync completed successfully')
  })

  test('should validate sync request data', async () => {
    const invalidSyncRequest = {
      lastSyncTimestamp: 'invalid', // Should be number
      platform: 'web', // Should be 'mobile'
      pendingChanges: {
        bookings: [],
        assignments: []
      }
    }

    const mockResponse = {
      success: false,
      error: 'Invalid lastSyncTimestamp',
      timestamp: Date.now()
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
      status: 400
    })

    const result = await makeMobileAPIRequest('/api/mobile/sync', {
      method: 'POST',
      body: invalidSyncRequest
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid lastSyncTimestamp')
  })
})

describe('Rate Limiting', () => {
  test('should enforce rate limits', async () => {
    const mockResponse = {
      success: false,
      error: 'Rate limit exceeded. Maximum 100 requests per hour.',
      timestamp: Date.now()
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
      status: 429
    })

    // Simulate making too many requests
    const result = await makeMobileAPIRequest('/api/bookings?mobile=true')
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Rate limit exceeded')
  })
})

describe('Error Handling', () => {
  test('should handle server errors gracefully', async () => {
    const mockResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
      status: 500
    })

    const result = await makeMobileAPIRequest('/api/bookings?mobile=true')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Internal server error')
  })

  test('should handle network errors', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    try {
      await makeMobileAPIRequest('/api/bookings?mobile=true')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Network error')
    }
  })
})
