/**
 * AI Settings API Route
 * Handles AI configuration and settings management
 */

import { NextRequest, NextResponse } from 'next/server'
import AISettingsService from '@/services/AISettingsService'

/**
 * GET /api/ai/settings
 * Get current AI settings
 */
export async function GET(request: NextRequest) {
  try {
    console.log('⚙️ AI Settings API: Getting current settings...')

    const settings = await AISettingsService.getSettings()

    console.log('✅ AI Settings API: Settings retrieved successfully')

    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error) {
    console.error('❌ AI Settings API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get AI settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/ai/settings
 * Update AI settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings, updatedBy } = body

    console.log('⚙️ AI Settings API: Updating settings...')

    // Validate required fields
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: settings'
      }, { status: 400 })
    }

    // Update settings
    await AISettingsService.updateSettings(settings, updatedBy || 'admin')

    console.log('✅ AI Settings API: Settings updated successfully')

    return NextResponse.json({
      success: true,
      message: 'AI settings updated successfully'
    })

  } catch (error) {
    console.error('❌ AI Settings API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update AI settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/settings/reset
 * Reset settings to defaults
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { updatedBy } = body

    console.log('⚙️ AI Settings API: Resetting to defaults...')

    const defaultSettings = await AISettingsService.resetToDefaults(updatedBy || 'admin')

    console.log('✅ AI Settings API: Settings reset to defaults')

    return NextResponse.json({
      success: true,
      settings: defaultSettings,
      message: 'AI settings reset to defaults'
    })

  } catch (error) {
    console.error('❌ AI Settings API Error:', error)
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
