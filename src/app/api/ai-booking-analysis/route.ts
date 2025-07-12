import { NextRequest, NextResponse } from 'next/server';
import { aiPropertyAgent } from '@/lib/services/aiPropertyAgent';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Booking } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.booking_id && !body.booking_data) {
      return NextResponse.json({
        success: false,
        error: 'Either booking_id or booking_data is required'
      }, { status: 400 });
    }

    let booking: Booking;

    // If booking_id is provided, fetch from database
    if (body.booking_id) {
      if (!db) {
        return NextResponse.json({
          success: false,
          error: 'Database not initialized'
        }, { status: 500 });
      }

      const bookingRef = doc(db, 'bookings', body.booking_id);
      const bookingDoc = await getDoc(bookingRef);
      
      if (!bookingDoc.exists()) {
        return NextResponse.json({
          success: false,
          error: 'Booking not found'
        }, { status: 404 });
      }
      
      booking = {
        id: bookingDoc.id,
        ...bookingDoc.data()
      } as Booking;
    } else {
      // Use provided booking data
      booking = body.booking_data;
    }

    console.log('🤖 Starting AI analysis for booking:', booking.id);

    // Perform AI analysis
    const analysis = await aiPropertyAgent.analyzeBooking(booking);

    console.log('✅ AI analysis completed:', analysis);

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      analysis: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Booking Analysis Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI Booking Analysis API',
    endpoints: {
      POST: 'Analyze a booking with AI',
    },
    usage: {
      post: {
        description: 'Analyze a booking using AI property matching',
        body: {
          booking_id: 'string (optional) - ID of existing booking',
          booking_data: 'object (optional) - Booking data object'
        },
        note: 'Provide either booking_id or booking_data'
      }
    },
    webhook_integration: {
      description: 'This endpoint can be triggered by Make.com webhooks',
      example_payload: {
        booking_data: {
          id: 'booking-123',
          property_id: 'property-456',
          guest_name: 'John Doe',
          guest_email: 'john@example.com',
          check_in: '2025-09-01',
          check_out: '2025-09-05',
          guests: 2,
          status: 'pending',
          total_amount: 1000,
          currency: 'USD',
          source: 'Airbnb',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    }
  });
}
