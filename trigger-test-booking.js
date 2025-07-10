#!/usr/bin/env node

/**
 * Test Trigger for Booking Test Webhook
 * 
 * This script simulates Make.com sending parsed booking.com email data
 * to your /api/booking-test endpoint for testing purposes.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'
const ENDPOINT = `${BASE_URL}/api/booking-test`

// Sample booking payloads that simulate different scenarios
const testBookings = [
  {
    name: 'Standard Booking',
    payload: {
      guestName: 'John Smith',
      guestEmail: 'john.smith@gmail.com',
      checkIn: '2025-08-15',
      checkOut: '2025-08-22',
      property: 'Villa Sunset Paradise',
      propertyId: 'villa-sunset-001',
      bookingReference: 'BDC-789456123',
      totalAmount: 2800,
      currency: 'USD',
      guests: 4,
      specialRequests: 'Late check-in around 8 PM, ground floor preferred',
      bookingSource: 'booking.com',
      rawEmailData: {
        subject: 'New booking confirmation - Villa Sunset Paradise',
        from: 'noreply@booking.com',
        receivedAt: new Date().toISOString(),
        messageId: 'msg-12345-booking-com'
      },
      parsedAt: new Date().toISOString()
    }
  },
  {
    name: 'Weekend Getaway',
    payload: {
      guestName: 'Sarah Johnson',
      guestEmail: 'sarah.j.travels@yahoo.com',
      checkIn: '2025-09-06',
      checkOut: '2025-09-08',
      property: 'Ocean View Villa',
      propertyId: 'villa-ocean-002',
      bookingReference: 'BDC-456789012',
      totalAmount: 950,
      currency: 'USD',
      guests: 2,
      specialRequests: 'Honeymoon trip, champagne welcome would be appreciated',
      bookingSource: 'booking.com',
      rawEmailData: {
        subject: 'Booking confirmation - Ocean View Villa',
        from: 'reservations@booking.com',
        receivedAt: new Date().toISOString(),
        messageId: 'msg-67890-booking-com'
      },
      parsedAt: new Date().toISOString()
    }
  },
  {
    name: 'Family Vacation',
    payload: {
      guestName: 'Michael Rodriguez',
      guestEmail: 'mike.rodriguez.family@hotmail.com',
      checkIn: '2025-07-20',
      checkOut: '2025-07-27',
      property: 'Mountain Retreat Villa',
      propertyId: 'villa-mountain-003',
      bookingReference: 'BDC-123456789',
      totalAmount: 4200,
      currency: 'USD',
      guests: 6,
      specialRequests: 'Traveling with children ages 5, 8, and 12. Need high chair and extra towels',
      bookingSource: 'booking.com',
      rawEmailData: {
        subject: 'Your booking is confirmed - Mountain Retreat Villa',
        from: 'confirmations@booking.com',
        receivedAt: new Date().toISOString(),
        messageId: 'msg-11111-booking-com'
      },
      parsedAt: new Date().toISOString(),
      // Additional fields that Make.com might extract
      makeComProcessingId: 'make-scenario-12345',
      emailProcessedAt: new Date().toISOString(),
      extractionConfidence: 0.95
    }
  },
  {
    name: 'Business Trip',
    payload: {
      guestName: 'Emma Chen',
      guestEmail: 'e.chen@techcorp.com',
      checkIn: '2025-08-03',
      checkOut: '2025-08-05',
      property: 'Executive Villa Downtown',
      propertyId: 'villa-executive-004',
      bookingReference: 'BDC-987654321',
      totalAmount: 1600,
      currency: 'USD',
      guests: 1,
      specialRequests: 'Business traveler, need reliable WiFi and quiet workspace',
      bookingSource: 'booking.com',
      rawEmailData: {
        subject: 'Booking confirmed - Executive Villa Downtown',
        from: 'business@booking.com',
        receivedAt: new Date().toISOString(),
        messageId: 'msg-22222-booking-com'
      },
      parsedAt: new Date().toISOString()
    }
  },
  {
    name: 'Minimal Data (Missing Fields)',
    payload: {
      guestName: 'Alex Thompson',
      checkIn: '2025-09-15',
      checkOut: '2025-09-18',
      property: 'Beachfront Villa',
      bookingSource: 'booking.com',
      // Missing: email, propertyId, bookingReference, amount, etc.
      rawEmailData: {
        subject: 'Booking notification',
        from: 'auto@booking.com',
        receivedAt: new Date().toISOString()
      },
      parsedAt: new Date().toISOString()
    }
  }
]

async function sendTestBooking(testCase, delay = 0) {
  if (delay > 0) {
    console.log(`⏳ Waiting ${delay}ms before sending...`)
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  console.log(`\n🚀 Sending: ${testCase.name}`)
  console.log(`📅 Check-in: ${testCase.payload.checkIn} → Check-out: ${testCase.payload.checkOut}`)
  console.log(`👤 Guest: ${testCase.payload.guestName}`)
  console.log(`🏠 Property: ${testCase.payload.property}`)
  console.log(`💰 Amount: ${testCase.payload.totalAmount ? `$${testCase.payload.totalAmount}` : 'Not specified'}`)

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Make.com/Test-Trigger',
        'X-Make-Scenario': 'booking-email-parser-test'
      },
      body: JSON.stringify(testCase.payload)
    })

    const responseData = await response.json()

    if (response.ok) {
      console.log(`✅ Success (${response.status})`)
      console.log(`   Processing time: ${responseData.metadata?.processingTimeMs}ms`)
      console.log(`   Payload size: ${responseData.metadata?.payloadSize} bytes`)
      console.log(`   Firebase stored: ${responseData.metadata?.storedInFirebase ? 'Yes' : 'No'}`)
      if (responseData.metadata?.missingFields) {
        console.log(`   ⚠️ Missing fields: ${responseData.metadata.missingFields.join(', ')}`)
      }
      return { success: true, data: responseData }
    } else {
      console.log(`❌ Failed (${response.status})`)
      console.log(`   Error: ${responseData.error}`)
      return { success: false, error: responseData }
    }

  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function triggerSingleTest(bookingIndex = 0) {
  if (bookingIndex >= testBookings.length) {
    console.log(`❌ Invalid booking index. Available: 0-${testBookings.length - 1}`)
    return
  }

  console.log('🧪 Single Booking Test Trigger')
  console.log(`🔗 Endpoint: ${ENDPOINT}`)
  console.log('=' * 50)

  const result = await sendTestBooking(testBookings[bookingIndex])
  
  console.log('\n📊 Test Result:')
  console.log(`   Status: ${result.success ? 'SUCCESS' : 'FAILED'}`)
  
  if (result.success) {
    console.log('🎉 Test booking sent successfully!')
    console.log('💡 Check your server logs for detailed processing information')
  } else {
    console.log('⚠️ Test failed - check endpoint URL and server status')
  }
}

async function triggerAllTests() {
  console.log('🧪 Multiple Booking Test Trigger')
  console.log(`🔗 Endpoint: ${ENDPOINT}`)
  console.log(`📦 Sending ${testBookings.length} test bookings...`)
  console.log('=' * 50)

  const results = []
  
  for (let i = 0; i < testBookings.length; i++) {
    const result = await sendTestBooking(testBookings[i], i > 0 ? 1000 : 0) // 1 second delay between requests
    results.push({ name: testBookings[i].name, ...result })
  }

  // Summary
  console.log('\n' + '=' * 50)
  console.log('📊 Test Results Summary:')
  
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    console.log(`   ${status} ${index + 1}. ${result.name}`)
  })

  console.log(`\n📈 Overall: ${successful} successful, ${failed} failed`)

  if (failed === 0) {
    console.log('🎉 All test bookings sent successfully!')
    console.log('💡 Check your server logs and Firebase for detailed data')
  } else {
    console.log('⚠️ Some tests failed - check endpoint and server status')
  }

  return { successful, failed, results }
}

async function showAvailableTests() {
  console.log('📋 Available Test Bookings:')
  testBookings.forEach((booking, index) => {
    console.log(`   ${index}. ${booking.name}`)
    console.log(`      Guest: ${booking.payload.guestName}`)
    console.log(`      Dates: ${booking.payload.checkIn} → ${booking.payload.checkOut}`)
    console.log(`      Property: ${booking.payload.property}`)
    console.log('')
  })
}

// Command line interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  console.log('🎯 Booking Test Webhook Trigger')
  console.log(`🔗 Target: ${ENDPOINT}`)
  console.log('')

  switch (command) {
    case 'single':
      const index = parseInt(args[1]) || 0
      await triggerSingleTest(index)
      break
      
    case 'all':
      await triggerAllTests()
      break
      
    case 'list':
      await showAvailableTests()
      break
      
    default:
      console.log('📖 Usage:')
      console.log('   node trigger-test-booking.js single [index]  # Send single test booking (default: 0)')
      console.log('   node trigger-test-booking.js all             # Send all test bookings')
      console.log('   node trigger-test-booking.js list            # List available test bookings')
      console.log('')
      console.log('📝 Examples:')
      console.log('   node trigger-test-booking.js single 0        # Send "Standard Booking"')
      console.log('   node trigger-test-booking.js single 2        # Send "Family Vacation"')
      console.log('   node trigger-test-booking.js all             # Send all 5 test bookings')
      console.log('')
      console.log('🔧 Environment:')
      console.log('   TEST_URL=http://localhost:3000 node trigger-test-booking.js single')
      console.log('   TEST_URL=https://yourdomain.com node trigger-test-booking.js all')
      break
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Trigger failed:', error)
    process.exit(1)
  })
}

module.exports = { triggerSingleTest, triggerAllTests, testBookings }
