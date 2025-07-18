import { NextRequest, NextResponse } from 'next/server'
import { AIJobCreationService } from '@/services/AIJobCreationService'

/**
 * AI Job Creation API
 * Allows triggering AI-powered job creation and assignment
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, options = {} } = body

    switch (action) {
      case 'create_ai_job':
        console.log('🤖 API: Creating AI-generated job...')
        
        const result = await AIJobCreationService.createAIJob({
          jobType: options.jobType || 'cleaning',
          priority: options.priority || 'medium',
          propertyType: options.propertyType || 'villa',
          urgency: options.urgency || 'routine',
          targetStaffEmail: options.targetStaffEmail || 'staff@siamoon.com',
          customPrompt: options.customPrompt
        })
        
        if (result.success) {
          console.log('✅ API: AI job creation completed successfully')
          return NextResponse.json({
            success: true,
            message: result.message,
            data: {
              jobId: result.jobId,
              assignedStaffId: result.assignedStaffId,
              aiAnalysis: result.aiAnalysis,
              timestamp: new Date().toISOString()
            }
          })
        } else {
          console.error('❌ API: AI job creation failed:', result.message)
          return NextResponse.json(
            {
              success: false,
              error: result.message
            },
            { status: 500 }
          )
        }

      case 'create_custom_ai_job':
        console.log('🎨 API: Creating custom AI job with specific requirements...')
        
        const customResult = await AIJobCreationService.createAIJob({
          jobType: options.jobType || 'maintenance',
          priority: options.priority || 'high',
          propertyType: options.propertyType || 'villa',
          urgency: options.urgency || 'urgent',
          targetStaffEmail: options.targetStaffEmail || 'staff@siamoon.com',
          customPrompt: options.customPrompt || 'Create an urgent maintenance job for a luxury villa that requires immediate attention due to guest arrival tomorrow.'
        })
        
        return NextResponse.json({
          success: customResult.success,
          message: customResult.message,
          data: customResult.success ? {
            jobId: customResult.jobId,
            assignedStaffId: customResult.assignedStaffId,
            aiAnalysis: customResult.aiAnalysis,
            timestamp: new Date().toISOString()
          } : null,
          error: customResult.success ? null : customResult.message
        })

      case 'create_emergency_ai_job':
        console.log('🚨 API: Creating emergency AI job...')
        
        const emergencyResult = await AIJobCreationService.createAIJob({
          jobType: options.jobType || 'maintenance',
          priority: 'urgent',
          propertyType: options.propertyType || 'villa',
          urgency: 'emergency',
          targetStaffEmail: options.targetStaffEmail || 'staff@siamoon.com',
          customPrompt: 'Create an emergency job for immediate response. A guest has reported a critical issue that needs urgent attention within the next hour.'
        })
        
        return NextResponse.json({
          success: emergencyResult.success,
          message: emergencyResult.message,
          data: emergencyResult.success ? {
            jobId: emergencyResult.jobId,
            assignedStaffId: emergencyResult.assignedStaffId,
            aiAnalysis: emergencyResult.aiAnalysis,
            timestamp: new Date().toISOString()
          } : null,
          error: emergencyResult.success ? null : emergencyResult.message
        })

      case 'test_ai_scenarios':
        console.log('🧪 API: Running AI job creation test scenarios...')
        
        const scenarios = [
          {
            name: 'Routine Cleaning',
            options: {
              jobType: 'cleaning',
              priority: 'medium',
              urgency: 'routine',
              customPrompt: 'Standard villa cleaning between guest stays'
            }
          },
          {
            name: 'Urgent Maintenance',
            options: {
              jobType: 'maintenance',
              priority: 'high',
              urgency: 'urgent',
              customPrompt: 'Air conditioning unit needs immediate repair before guest arrival'
            }
          },
          {
            name: 'Property Inspection',
            options: {
              jobType: 'inspection',
              priority: 'medium',
              urgency: 'routine',
              customPrompt: 'Monthly property inspection and quality check'
            }
          }
        ]

        const scenarioResults = []
        
        for (const scenario of scenarios) {
          try {
            const scenarioResult = await AIJobCreationService.createAIJob({
              ...scenario.options,
              targetStaffEmail: 'staff@siamoon.com'
            })
            
            scenarioResults.push({
              scenario: scenario.name,
              success: scenarioResult.success,
              jobId: scenarioResult.jobId,
              message: scenarioResult.message
            })
          } catch (error) {
            scenarioResults.push({
              scenario: scenario.name,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }

        return NextResponse.json({
          success: true,
          message: `Completed ${scenarios.length} AI job creation scenarios`,
          data: {
            scenarios: scenarioResults,
            successCount: scenarioResults.filter(r => r.success).length,
            failureCount: scenarioResults.filter(r => !r.success).length,
            timestamp: new Date().toISOString()
          }
        })

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Use "create_ai_job", "create_custom_ai_job", "create_emergency_ai_job", or "test_ai_scenarios"' 
          },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ API Error in ai-job-creation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'status':
        // Get AI job creation system status
        return NextResponse.json({
          success: true,
          data: {
            aiEnabled: !!process.env.OPENAI_API_KEY,
            availableJobTypes: ['cleaning', 'maintenance', 'inspection', 'preparation'],
            availablePriorities: ['low', 'medium', 'high', 'urgent'],
            availableUrgencies: ['routine', 'urgent', 'emergency'],
            testStaffEmail: 'staff@siamoon.com',
            timestamp: new Date().toISOString()
          }
        })

      case 'examples':
        // Get example AI job creation requests
        return NextResponse.json({
          success: true,
          data: {
            examples: [
              {
                name: 'Basic AI Job',
                request: {
                  action: 'create_ai_job',
                  options: {
                    jobType: 'cleaning',
                    priority: 'medium',
                    targetStaffEmail: 'staff@siamoon.com'
                  }
                }
              },
              {
                name: 'Custom AI Job',
                request: {
                  action: 'create_custom_ai_job',
                  options: {
                    jobType: 'maintenance',
                    priority: 'high',
                    customPrompt: 'Pool cleaning system needs urgent maintenance before VIP guest arrival'
                  }
                }
              },
              {
                name: 'Emergency AI Job',
                request: {
                  action: 'create_emergency_ai_job',
                  options: {
                    jobType: 'maintenance',
                    customPrompt: 'Water leak in master bedroom needs immediate attention'
                  }
                }
              }
            ]
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "status" or "examples"' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ API Error in ai-job-creation GET:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
