/**
 * AI Settings Reset API Route
 * Handles resetting AI settings to defaults
 */

import { NextRequest, NextResponse } from 'next/server'
import AISettingsService from '@/services/AISettingsService'

/**
 * POST /api/ai/settings/reset
 * Reset AI settings to defaults
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { updatedBy } = body

    console.log('⚙️ AI Settings Reset API: Resetting to defaults...')

    const defaultSettings = await AISettingsService.resetToDefaults(updatedBy || 'admin')

    console.log('✅ AI Settings Reset API: Settings reset to defaults')

    return NextResponse.json({
      success: true,
      settings: defaultSettings,
      message: 'AI settings reset to defaults successfully'
    })

  } catch (error) {
    console.error('❌ AI Settings Reset API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset AI settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
