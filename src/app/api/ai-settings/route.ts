import { NextRequest, NextResponse } from "next/server"
import { getAISettings, updateAISettings, resetAISettings, getAISettingsChangelog } from "@/lib/ai/aiSettings"

/**
 * GET /api/ai-settings
 * Fetch current AI configuration settings
 */
export async function GET(req: NextRequest) {
  try {
    console.log('⚙️ AI Settings API: Processing GET request...')
    
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'settings'
    
    if (type === 'changelog') {
      // Get settings changelog
      console.log('📋 AI Settings API: Getting changelog...')
      
      const changelog = await getAISettingsChangelog()
      
      return NextResponse.json({
        success: true,
        data: changelog,
        metadata: {
          type: 'changelog',
          count: changelog.length,
          generatedAt: new Date().toISOString()
        }
      })
      
    } else {
      // Get current settings
      console.log('⚙️ AI Settings API: Getting current settings...')
      
      const settings = await getAISettings()
      
      return NextResponse.json({
        success: true,
        data: settings,
        metadata: {
          type: 'settings',
          generatedAt: new Date().toISOString()
        }
      })
    }
    
  } catch (error) {
    console.error('❌ AI Settings API: Error processing GET request:', error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to get AI settings",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/ai-settings
 * Update AI configuration settings
 */
export async function POST(req: NextRequest) {
  try {
    console.log('⚙️ AI Settings API: Processing POST request...')
    
    const body = await req.json()
    const { settings, updatedBy, reason, action } = body
    
    // Handle different actions
    if (action === 'reset') {
      console.log('🔄 AI Settings API: Resetting to defaults...')
      
      const result = await resetAISettings(updatedBy)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: "AI settings reset to defaults successfully",
          data: result.settings,
          version: result.version
        })
      } else {
        return NextResponse.json({
          success: false,
          error: "Failed to reset AI settings"
        }, { status: 500 })
      }
    }
    
    // Validate required fields for update
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({
        success: false,
        error: "Missing or invalid settings object"
      }, { status: 400 })
    }
    
    console.log('💾 AI Settings API: Updating settings...')
    
    // Update settings
    const result = await updateAISettings(settings, updatedBy, reason)
    
    if (result.success) {
      console.log(`✅ AI Settings API: Settings updated to version ${result.version}`)
      
      return NextResponse.json({
        success: true,
        message: "AI settings updated successfully",
        data: result.settings,
        version: result.version
      })
    } else {
      console.log('❌ AI Settings API: Validation errors:', result.errors)
      
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: result.errors
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ AI Settings API: Error processing POST request:', error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to update AI settings",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/ai-settings
 * Partial update of AI settings (for individual field updates)
 */
export async function PUT(req: NextRequest) {
  try {
    console.log('⚙️ AI Settings API: Processing PUT request...')
    
    const body = await req.json()
    const { field, value, updatedBy, reason } = body
    
    // Validate required fields
    if (!field || value === undefined) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: field, value"
      }, { status: 400 })
    }
    
    console.log(`🔧 AI Settings API: Updating field '${field}' to '${value}'`)
    
    // Create partial settings object
    const partialSettings = { [field]: value }
    
    // Update settings
    const result = await updateAISettings(
      partialSettings, 
      updatedBy, 
      reason || `Updated ${field} to ${value}`
    )
    
    if (result.success) {
      console.log(`✅ AI Settings API: Field '${field}' updated successfully`)
      
      return NextResponse.json({
        success: true,
        message: `AI setting '${field}' updated successfully`,
        data: result.settings,
        version: result.version,
        updatedField: field,
        newValue: value
      })
    } else {
      console.log('❌ AI Settings API: Validation errors:', result.errors)
      
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: result.errors
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ AI Settings API: Error processing PUT request:', error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to update AI setting",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/ai-settings
 * Reset specific settings or clear changelog
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const confirm = searchParams.get('confirm')
    
    if (confirm !== 'true') {
      return NextResponse.json({
        success: false,
        error: "Missing confirmation parameter. Add ?confirm=true to proceed."
      }, { status: 400 })
    }
    
    if (action === 'reset') {
      console.log('🔄 AI Settings API: Resetting settings via DELETE...')
      
      const result = await resetAISettings('system')
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: "AI settings reset to defaults successfully",
          data: result.settings,
          version: result.version
        })
      } else {
        return NextResponse.json({
          success: false,
          error: "Failed to reset AI settings"
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: "Invalid action. Supported actions: reset"
    }, { status: 400 })
    
  } catch (error) {
    console.error('❌ AI Settings API: Error processing DELETE request:', error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to process DELETE request",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
