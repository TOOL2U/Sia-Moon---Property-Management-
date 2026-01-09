/**
 * Job Offers API - Phase 5 Auto-Dispatch
 * Handles offer acceptance with atomic transactions for first-accept-wins
 */

import { NextRequest, NextResponse } from 'next/server'
import OfferEngineService from '@/services/OfferEngineService'
import { JobOffer } from '@/types/job-offers'

/**
 * GET /api/offers/staff/{staffId}
 * Get open offers for a staff member (mobile app)
 */
export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url)
    const pathParts = pathname.split('/')
    
    // Extract staffId from URL path
    const staffIndex = pathParts.indexOf('staff')
    if (staffIndex === -1 || !pathParts[staffIndex + 1]) {
      return NextResponse.json({
        success: false,
        error: 'Staff ID is required',
        offers: []
      }, { status: 400 })
    }

    const staffId = pathParts[staffIndex + 1]

    console.log(`📱 Getting offers for staff: ${staffId}`)

    const result = await OfferEngineService.getOffersForStaff(staffId)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to get offers',
        offers: []
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      offers: result.offers,
      count: result.offers.length
    })

  } catch (error) {
    console.error('❌ Error in GET offers:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      offers: []
    }, { status: 500 })
  }
}

/**
 * POST /api/offers
 * Create a new offer (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Basic validation
    if (!body.jobId || !body.propertyId || !body.requiredRole) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: jobId, propertyId, requiredRole'
      }, { status: 400 })
    }

    console.log(`🎯 Creating offer for job: ${body.jobId}`)

    const result = await OfferEngineService.createOffer(body)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      offerId: result.offerId,
      offer: result.offer
    })

  } catch (error) {
    console.error('❌ Error creating offer:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
