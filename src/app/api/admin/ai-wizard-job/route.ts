import { NextRequest, NextResponse } from 'next/server'
import { AIWizardJobCreationService } from '@/services/AIWizardJobCreationService'

/**
 * AI Wizard Job Creation API
 * Creates comprehensive jobs using AI with wizard workflow and intelligent staff assignment
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, options = {} } = body

    switch (action) {
      case 'create_wizard_job':
        console.log('🧙‍♂️ API: Creating AI wizard job with intelligent assignment...')
        
        const result = await AIWizardJobCreationService.createAIJobViaWizard({
          jobType: options.jobType || 'cleaning',
          priority: options.priority || 'medium',
          urgency: options.urgency || 'routine',
          customPrompt: options.customPrompt,
          targetStaffEmail: options.targetStaffEmail || 'staff@siamoon.com'
        })
        
        if (result.success) {
          console.log('✅ API: AI wizard job creation completed successfully')
          return NextResponse.json({
            success: true,
            message: result.message,
            data: {
              jobId: result.jobId,
              assignedStaffId: result.assignedStaffId,
              assignedStaffName: result.assignedStaffName,
              wizardData: result.wizardData,
              assignmentAnalysis: result.assignmentAnalysis,
              timestamp: new Date().toISOString()
            }
          })
        } else {
          console.error('❌ API: AI wizard job creation failed:', result.message)
          return NextResponse.json(
            {
              success: false,
              error: result.message
            },
            { status: 500 }
          )
        }

      case 'create_comprehensive_cleaning':
        console.log('🧹 API: Creating comprehensive AI cleaning job...')
        
        const cleaningResult = await AIWizardJobCreationService.createAIJobViaWizard({
          jobType: 'cleaning',
          priority: 'medium',
          urgency: 'routine',
          customPrompt: 'Create a comprehensive villa cleaning job between guest stays with detailed checklist and quality standards'
        })
        
        return NextResponse.json({
          success: cleaningResult.success,
          message: cleaningResult.message,
          data: cleaningResult.success ? {
            jobId: cleaningResult.jobId,
            assignedStaffId: cleaningResult.assignedStaffId,
            assignedStaffName: cleaningResult.assignedStaffName,
            wizardData: cleaningResult.wizardData,
            assignmentAnalysis: cleaningResult.assignmentAnalysis,
            timestamp: new Date().toISOString()
          } : null,
          error: cleaningResult.success ? null : cleaningResult.message
        })

      case 'create_urgent_maintenance':
        console.log('🔧 API: Creating urgent AI maintenance job...')
        
        const maintenanceResult = await AIWizardJobCreationService.createAIJobViaWizard({
          jobType: 'maintenance',
          priority: 'high',
          urgency: 'urgent',
          customPrompt: 'Create an urgent maintenance job for villa systems that requires immediate attention before guest arrival'
        })
        
        return NextResponse.json({
          success: maintenanceResult.success,
          message: maintenanceResult.message,
          data: maintenanceResult.success ? {
            jobId: maintenanceResult.jobId,
            assignedStaffId: maintenanceResult.assignedStaffId,
            assignedStaffName: maintenanceResult.assignedStaffName,
            wizardData: maintenanceResult.wizardData,
            assignmentAnalysis: maintenanceResult.assignmentAnalysis,
            timestamp: new Date().toISOString()
          } : null,
          error: maintenanceResult.success ? null : maintenanceResult.message
        })

      case 'create_property_inspection':
        console.log('🔍 API: Creating AI property inspection job...')
        
        const inspectionResult = await AIWizardJobCreationService.createAIJobViaWizard({
          jobType: 'inspection',
          priority: 'medium',
          urgency: 'routine',
          customPrompt: 'Create a thorough property inspection job with detailed checklist for quality assurance and maintenance identification'
        })
        
        return NextResponse.json({
          success: inspectionResult.success,
          message: inspectionResult.message,
          data: inspectionResult.success ? {
            jobId: inspectionResult.jobId,
            assignedStaffId: inspectionResult.assignedStaffId,
            assignedStaffName: inspectionResult.assignedStaffName,
            wizardData: inspectionResult.wizardData,
            assignmentAnalysis: inspectionResult.assignmentAnalysis,
            timestamp: new Date().toISOString()
          } : null,
          error: inspectionResult.success ? null : inspectionResult.message
        })

      case 'create_guest_preparation':
        console.log('🏨 API: Creating AI guest preparation job...')
        
        const preparationResult = await AIWizardJobCreationService.createAIJobViaWizard({
          jobType: 'preparation',
          priority: 'high',
          urgency: 'urgent',
          customPrompt: 'Create a comprehensive guest preparation job for VIP arrival including all amenities, welcome setup, and final quality checks'
        })
        
        return NextResponse.json({
          success: preparationResult.success,
          message: preparationResult.message,
          data: preparationResult.success ? {
            jobId: preparationResult.jobId,
            assignedStaffId: preparationResult.assignedStaffId,
            assignedStaffName: preparationResult.assignedStaffName,
            wizardData: preparationResult.wizardData,
            assignmentAnalysis: preparationResult.assignmentAnalysis,
            timestamp: new Date().toISOString()
          } : null,
          error: preparationResult.success ? null : preparationResult.message
        })

      case 'test_wizard_scenarios':
        console.log('🧪 API: Running AI wizard test scenarios...')
        
        const scenarios = [
          {
            name: 'Comprehensive Cleaning',
            options: {
              jobType: 'cleaning',
              priority: 'medium',
              customPrompt: 'Standard villa cleaning between guest stays'
            }
          },
          {
            name: 'Urgent Maintenance',
            options: {
              jobType: 'maintenance',
              priority: 'high',
              urgency: 'urgent',
              customPrompt: 'Pool filtration system needs immediate repair'
            }
          },
          {
            name: 'Quality Inspection',
            options: {
              jobType: 'inspection',
              priority: 'medium',
              customPrompt: 'Monthly property inspection and quality assessment'
            }
          }
        ]

        const scenarioResults = []
        
        for (const scenario of scenarios) {
          try {
            const scenarioResult = await AIWizardJobCreationService.createAIJobViaWizard(scenario.options)
            
            scenarioResults.push({
              scenario: scenario.name,
              success: scenarioResult.success,
              jobId: scenarioResult.jobId,
              assignedStaff: scenarioResult.assignedStaffName,
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
          message: `Completed ${scenarios.length} AI wizard scenarios`,
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
            error: 'Invalid action. Use "create_wizard_job", "create_comprehensive_cleaning", "create_urgent_maintenance", "create_property_inspection", "create_guest_preparation", or "test_wizard_scenarios"' 
          },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ API Error in ai-wizard-job:', error)
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
        return NextResponse.json({
          success: true,
          data: {
            aiWizardEnabled: !!process.env.OPENAI_API_KEY,
            intelligentAssignmentEnabled: true,
            mobileIntegrationEnabled: true,
            availableJobTypes: ['cleaning', 'maintenance', 'inspection', 'preparation'],
            availablePriorities: ['low', 'medium', 'high', 'urgent'],
            availableUrgencies: ['routine', 'urgent', 'emergency'],
            testStaffEmail: 'staff@siamoon.com',
            timestamp: new Date().toISOString()
          }
        })

      case 'capabilities':
        return NextResponse.json({
          success: true,
          data: {
            features: [
              'AI-powered job generation using OpenAI GPT-4',
              'Wizard-style comprehensive job creation',
              'Intelligent staff assignment with confidence scoring',
              'Real-time mobile notifications with URGENT priority',
              'Complete workflow integration with existing systems',
              'Quality checklist and supply requirement generation',
              'Property and guest information management',
              'Scheduling optimization and deadline management'
            ],
            workflow: [
              '1. AI generates comprehensive job data',
              '2. Intelligent staff assignment analyzes best match',
              '3. Job created via existing wizard workflow',
              '4. URGENT mobile notification sent to assigned staff',
              '5. Real-time synchronization with mobile app',
              '6. Complete job lifecycle tracking'
            ]
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "status" or "capabilities"' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ API Error in ai-wizard-job GET:', error)
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
