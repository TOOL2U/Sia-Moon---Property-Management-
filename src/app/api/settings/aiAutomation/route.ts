import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const settingsRef = doc(db, 'settings', 'aiAutomation')
    const settingsDoc = await getDoc(settingsRef)

    if (settingsDoc.exists()) {
      const settings = settingsDoc.data()
      return NextResponse.json({
        success: true,
        data: settings,
        enabled: settings.enabled || false
      })
    } else {
      // Return default settings if none exist
      const defaultSettings = {
        enabled: false,
        features: {
          bookingAnalysis: false,
          autoRejection: false,
          staffSuggestions: false,
          priceOptimization: false
        },
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      }

      return NextResponse.json({
        success: true,
        data: defaultSettings,
        enabled: false
      })
    }

  } catch (error) {
    console.error('❌ Error fetching AI automation settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch AI automation settings'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enabled, features, updatedBy } = body

    const db = getDb()
    const settingsRef = doc(db, 'settings', 'aiAutomation')

    const settings = {
      enabled: enabled || false,
      features: features || {
        bookingAnalysis: false,
        autoRejection: false,
        staffSuggestions: false,
        priceOptimization: false
      },
      lastUpdated: Timestamp.now(),
      updatedBy: updatedBy || 'admin',
      version: '1.0'
    }

    await setDoc(settingsRef, settings, { merge: true })

    console.log('✅ AI automation settings updated:', settings)

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'AI automation settings updated successfully'
    })

  } catch (error) {
    console.error('❌ Error updating AI automation settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update AI automation settings'
    }, { status: 500 })
  }
}
