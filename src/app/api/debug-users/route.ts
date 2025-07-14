import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const email = searchParams.get('email')

    if (action === 'check-email' && email) {
      // For development, we'll return information about what to check
      return NextResponse.json({
        success: true,
        message: 'Use client-side Firebase Auth to check email existence',
        instructions: [
          'Firebase Auth user listing requires Admin SDK',
          'Use fetchSignInMethodsForEmail() on client side',
          'Check Firestore collections for profile data',
          'Verify localStorage for any cached data'
        ],
        email,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      message: 'User debug API endpoint',
      availableActions: [
        'check-email - Check if email exists in Firebase Auth'
      ],
      usage: '/api/debug-users?action=check-email&email=user@example.com'
    })

  } catch (error) {
    console.error('Debug users API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Server error during user debug'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, email } = await request.json()

    if (action === 'cleanup-user' && email) {
      // This would require Firebase Admin SDK for server-side user management
      return NextResponse.json({
        success: false,
        message: 'User cleanup requires Firebase Admin SDK configuration',
        instructions: [
          'Set up Firebase Admin SDK with service account',
          'Use admin.auth().getUserByEmail() to check existence',
          'Use admin.auth().deleteUser() to remove users',
          'Clean up Firestore documents manually'
        ]
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action or missing parameters'
    }, { status: 400 })

  } catch (error) {
    console.error('Debug users POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Server error during user debug'
    }, { status: 500 })
  }
}
