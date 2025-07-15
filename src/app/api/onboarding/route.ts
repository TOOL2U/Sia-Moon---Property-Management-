import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API: Processing onboarding submission via Admin SDK')
    
    const data = await request.json()
    
    // Validate required fields
    if (!data.ownerFullName || !data.ownerEmail || !data.propertyName) {
      return NextResponse.json(
        { error: 'Missing required fields: ownerFullName, ownerEmail, propertyName' },
        { status: 400 }
      )
    }

    // Prepare submission data with proper timestamps
    const submissionData = {
      ...data,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      submissionSource: 'wizard_api'
    }

    // Create document in Firestore using Admin SDK
    const docRef = await adminDb.collection('onboarding_submissions').add(submissionData)
    
    console.log('✅ API: Onboarding submission created via Admin SDK:', docRef.id)

    return NextResponse.json({
      success: true,
      submissionId: docRef.id,
      message: 'Onboarding submission created successfully'
    })

  } catch (error: any) {
    console.error('❌ API: Error creating onboarding submission:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to create onboarding submission',
        details: error.message
      },
      { status: 500 }
    )
  }
}
