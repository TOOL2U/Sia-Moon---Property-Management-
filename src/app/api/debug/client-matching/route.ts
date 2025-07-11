import { NextRequest, NextResponse } from 'next/server'
import { matchClientProfile } from '@/lib/clientMatching'
import { PropertyService } from '@/lib/services/propertyService'

export async function POST(request: NextRequest) {
  try {
    const { propertyName } = await request.json()
    
    if (!propertyName) {
      return NextResponse.json(
        { error: 'Property name is required' },
        { status: 400 }
      )
    }
    
    console.log('🔍 DEBUG: Testing client matching for:', propertyName)
    
    // Get all properties for debugging
    const allProperties = await PropertyService.getAllProperties()
    console.log('🔍 DEBUG: Found', allProperties.length, 'total properties')
    
    // Log all property names for comparison
    console.log('🔍 DEBUG: All property names:')
    allProperties.forEach((prop, index) => {
      console.log(`  ${index + 1}. "${prop.name}" (ID: ${prop.id}, Owner: ${prop.userId})`)
    })
    
    // Test the matching
    const matchResult = await matchClientProfile(propertyName)
    
    console.log('🔍 DEBUG: Match result:', matchResult)
    
    return NextResponse.json({
      success: true,
      searchTerm: propertyName,
      matchResult,
      totalProperties: allProperties.length,
      allProperties: allProperties.map(p => ({
        id: p.id,
        name: p.name,
        userId: p.userId,
        address: p.address
      })),
      debug: {
        exactMatchTest: allProperties.find(p => 
          p.name.toLowerCase().trim() === propertyName.toLowerCase().trim()
        ),
        caseInsensitiveTest: allProperties.filter(p => 
          p.name.toLowerCase().includes(propertyName.toLowerCase())
        )
      }
    })
    
  } catch (error) {
    console.error('❌ DEBUG: Error testing client matching:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test client matching',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get all properties for inspection
    const allProperties = await PropertyService.getAllProperties()
    
    return NextResponse.json({
      success: true,
      totalProperties: allProperties.length,
      properties: allProperties.map(p => ({
        id: p.id,
        name: p.name,
        userId: p.userId,
        address: p.address,
        createdAt: p.createdAt
      }))
    })
    
  } catch (error) {
    console.error('❌ DEBUG: Error getting properties:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get properties',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
