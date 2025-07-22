import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

/**
 * Property Requirements API
 * Manages job requirements templates at the property level
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params
    console.log(`📋 Fetching requirements for property: ${propertyId}`)
    
    const db = getDb()
    const propertyRef = doc(db, 'properties', propertyId)
    const propertyDoc = await getDoc(propertyRef)
    
    if (!propertyDoc.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 })
    }
    
    const propertyData = propertyDoc.data()
    const requirementsTemplate = propertyData.requirementsTemplate || []
    
    console.log(`✅ Retrieved ${requirementsTemplate.length} requirements for property ${propertyId}`)
    
    return NextResponse.json({
      success: true,
      propertyId,
      requirementsTemplate,
      totalRequirements: requirementsTemplate.length,
      requiredCount: requirementsTemplate.filter((req: any) => req.isRequired).length
    })
    
  } catch (error) {
    console.error('❌ Error fetching property requirements:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch property requirements',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params
    const body = await request.json()
    const { requirementsTemplate } = body
    
    console.log(`📋 Updating requirements for property: ${propertyId}`)
    
    if (!Array.isArray(requirementsTemplate)) {
      return NextResponse.json({
        success: false,
        error: 'requirementsTemplate must be an array'
      }, { status: 400 })
    }
    
    // Validate requirements structure
    for (const req of requirementsTemplate) {
      if (!req.id || !req.description || typeof req.isRequired !== 'boolean') {
        return NextResponse.json({
          success: false,
          error: 'Invalid requirement structure. Each requirement must have id, description, and isRequired fields.'
        }, { status: 400 })
      }
      
      if (!['safety', 'cleaning', 'maintenance', 'inspection', 'photo', 'other'].includes(req.category)) {
        return NextResponse.json({
          success: false,
          error: `Invalid category: ${req.category}. Must be one of: safety, cleaning, maintenance, inspection, photo, other`
        }, { status: 400 })
      }
    }
    
    const db = getDb()
    const propertyRef = doc(db, 'properties', propertyId)
    
    // Check if property exists
    const propertyDoc = await getDoc(propertyRef)
    if (!propertyDoc.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 })
    }
    
    // Update property with requirements template
    await updateDoc(propertyRef, {
      requirementsTemplate,
      updatedAt: serverTimestamp()
    })
    
    console.log(`✅ Updated ${requirementsTemplate.length} requirements for property ${propertyId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Property requirements template updated successfully',
      propertyId,
      requirementsTemplate,
      totalRequirements: requirementsTemplate.length,
      requiredCount: requirementsTemplate.filter((req: any) => req.isRequired).length
    })
    
  } catch (error) {
    console.error('❌ Error updating property requirements:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update property requirements',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params
    const body = await request.json()
    const { templateType = 'cleaning' } = body
    
    console.log(`📋 Creating default requirements template for property: ${propertyId}`)
    
    // Default templates based on job type
    const defaultTemplates = {
      cleaning: [
        {
          id: 'safety_walkthrough',
          description: 'Complete safety walkthrough of property',
          isRequired: true,
          category: 'safety',
          estimatedTime: 10,
          notes: 'Check for hazards, emergency exits, and safety equipment'
        },
        {
          id: 'before_photos',
          description: 'Take before photos of all rooms',
          isRequired: true,
          category: 'photo',
          estimatedTime: 5,
          notes: 'Document initial state before cleaning begins'
        },
        {
          id: 'bathroom_cleaning',
          description: 'Clean all bathrooms thoroughly',
          isRequired: true,
          category: 'cleaning',
          estimatedTime: 30,
          notes: 'Include toilets, showers, sinks, mirrors, and floors'
        },
        {
          id: 'kitchen_cleaning',
          description: 'Clean kitchen and appliances',
          isRequired: true,
          category: 'cleaning',
          estimatedTime: 25,
          notes: 'Clean counters, appliances, sink, and floors'
        },
        {
          id: 'vacuum_carpets',
          description: 'Vacuum all carpeted areas',
          isRequired: true,
          category: 'cleaning',
          estimatedTime: 20,
          notes: 'Include all bedrooms and living areas'
        },
        {
          id: 'restock_amenities',
          description: 'Restock guest amenities',
          isRequired: false,
          category: 'other',
          estimatedTime: 10,
          notes: 'Towels, toiletries, coffee, etc.'
        },
        {
          id: 'after_photos',
          description: 'Take after photos of completed work',
          isRequired: true,
          category: 'photo',
          estimatedTime: 5,
          notes: 'Document final state after cleaning completion'
        }
      ],
      maintenance: [
        {
          id: 'safety_equipment',
          description: 'Check all safety equipment',
          isRequired: true,
          category: 'safety',
          estimatedTime: 15,
          notes: 'Smoke detectors, fire extinguishers, emergency lighting'
        },
        {
          id: 'plumbing_check',
          description: 'Test all plumbing fixtures',
          isRequired: true,
          category: 'maintenance',
          estimatedTime: 20,
          notes: 'Check water pressure, leaks, and drainage'
        },
        {
          id: 'electrical_test',
          description: 'Test electrical outlets and lighting',
          isRequired: true,
          category: 'maintenance',
          estimatedTime: 15,
          notes: 'Verify all outlets work and lights function properly'
        },
        {
          id: 'hvac_inspection',
          description: 'Inspect HVAC system',
          isRequired: false,
          category: 'maintenance',
          estimatedTime: 10,
          notes: 'Check filters, vents, and temperature control'
        },
        {
          id: 'damage_documentation',
          description: 'Document any damage or issues found',
          isRequired: true,
          category: 'inspection',
          estimatedTime: 10,
          notes: 'Take photos and detailed notes of any problems'
        }
      ]
    }
    
    const template = defaultTemplates[templateType as keyof typeof defaultTemplates] || defaultTemplates.cleaning
    
    const db = getDb()
    const propertyRef = doc(db, 'properties', propertyId)
    
    // Check if property exists
    const propertyDoc = await getDoc(propertyRef)
    if (!propertyDoc.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 })
    }
    
    // Update property with default template
    await updateDoc(propertyRef, {
      requirementsTemplate: template,
      updatedAt: serverTimestamp()
    })
    
    console.log(`✅ Created default ${templateType} template for property ${propertyId}`)
    
    return NextResponse.json({
      success: true,
      message: `Default ${templateType} requirements template created successfully`,
      propertyId,
      templateType,
      requirementsTemplate: template,
      totalRequirements: template.length,
      requiredCount: template.filter(req => req.isRequired).length
    })
    
  } catch (error) {
    console.error('❌ Error creating default requirements template:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create default requirements template',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
