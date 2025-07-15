import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Initialize Firebase Admin (for server-side operations)
if (getApps().length === 0) {
  try {
    // For development, we'll use the client SDK instead
    console.log('Firebase Admin not configured for development')
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    // For development, we'll return configuration info instead
    const config = {
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Email test endpoint - use client-side testing instead',
      config,
      suggestions: [
        'Check Firebase Console → Authentication → Templates',
        'Verify password reset template is enabled',
        'Check sender email configuration',
        'Ensure domain is authorized',
        'Test with existing user account'
      ]
    })

  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Server error during email test'
    }, { status: 500 })
  }
}
