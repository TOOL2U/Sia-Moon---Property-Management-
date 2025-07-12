import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check Firebase environment variables
    const firebaseEnvVars = {
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    }

    // Check which variables are missing
    const missingVars = Object.entries(firebaseEnvVars)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key)

    // Mask sensitive values for security
    const maskedVars = Object.entries(firebaseEnvVars).reduce((acc, [key, value]) => {
      if (value) {
        if (key === 'NEXT_PUBLIC_FIREBASE_API_KEY') {
          acc[key] = `${value.substring(0, 10)}...`
        } else if (key === 'NEXT_PUBLIC_FIREBASE_APP_ID') {
          acc[key] = `${value.substring(0, 20)}...`
        } else {
          acc[key] = value
        }
      } else {
        acc[key] = 'MISSING'
      }
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      firebaseConfig: maskedVars,
      missingVariables: missingVars,
      allVariablesPresent: missingVars.length === 0,
      message: missingVars.length === 0 
        ? 'All Firebase environment variables are present' 
        : `Missing ${missingVars.length} Firebase environment variables`
    })

  } catch (error) {
    console.error('❌ ENV CHECK: Error checking environment:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
