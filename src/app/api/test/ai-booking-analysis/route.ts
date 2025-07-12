import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Booking } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'create_test_booking') {
      if (!db) {
        return NextResponse.json({
          success: false,
          error: 'Database not initialized'
        }, { status: 500 });
      }

      // Create a test booking
      const testBooking: Omit<Booking, 'id'> = {
        property_id: '', // Will be matched by AI
        guest_name: 'John Doe',
        guest_email: 'john.doe@example.com',
        guest_phone: '+1234567890',
        check_in: '2025-09-01',
        check_out: '2025-09-05',
        guests: 2,
        status: 'pending',
        total_amount: 1200,
        currency: 'USD',
        source: 'Airbnb',
        notes: 'Villa Sunset Paradise - 2 guests, beach access preferred',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const bookingsRef = collection(db, 'bookings');
      const docRef = await addDoc(bookingsRef, testBooking);
      
      // Now trigger AI analysis
      const aiAnalysisResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai-booking-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: docRef.id
        })
      });

      const aiResult = await aiAnalysisResponse.json();

      return NextResponse.json({
        success: true,
        message: 'Test booking created and AI analysis triggered',
        booking_id: docRef.id,
        ai_analysis: aiResult,
        test_booking: {
          id: docRef.id,
          ...testBooking
        }
      });
    }

    if (action === 'list_recent_bookings') {
      if (!db) {
        return NextResponse.json({
          success: false,
          error: 'Database not initialized'
        }, { status: 500 });
      }

      const bookingsRef = collection(db, 'bookings');
      const snapshot = await getDocs(bookingsRef);
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({
        success: true,
        bookings: bookings.slice(0, 10) // Return only last 10
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ AI Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI Booking Analysis Test API',
    actions: {
      create_test_booking: 'Create a test booking and trigger AI analysis',
      list_recent_bookings: 'List recent bookings for testing'
    },
    usage: {
      create_test_booking: {
        method: 'POST',
        body: { action: 'create_test_booking' }
      },
      list_recent_bookings: {
        method: 'POST',
        body: { action: 'list_recent_bookings' }
      }
    },
    example_webhook_call: {
      description: 'Example of how Make.com can trigger AI analysis',
      url: '/api/ai-booking-analysis',
      method: 'POST',
      body: {
        booking_data: {
          id: 'generated-id',
          property_id: '',
          guest_name: 'Guest Name',
          guest_email: 'guest@example.com',
          check_in: '2025-09-01',
          check_out: '2025-09-05',
          guests: 2,
          status: 'pending',
          total_amount: 1000,
          currency: 'USD',
          source: 'Airbnb',
          notes: 'Property description or hints',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    }
  });
}
