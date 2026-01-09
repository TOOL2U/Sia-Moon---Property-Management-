/**
 * Offer Acceptance API - Phase 5 Auto-Dispatch  
 * CRITICAL: Atomic transaction for first-accept-wins behavior
 * Prevents race conditions and double assignments
 */

import { NextRequest, NextResponse } from 'next/server'
import OfferEngineService from '@/services/OfferEngineService'

/**
 * POST /api/offers/{offerId}/accept
 * Accept an offer - ATOMIC TRANSACTION for first-accept-wins
 * This endpoint is called by the mobile app when staff accepts an offer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { offerId: string } }
) {
  try {
    const { offerId } = params
    const body = await request.json()
    
    if (!offerId) {
      return NextResponse.json({
        success: false,
        error: 'Offer ID is required'
      }, { status: 400 })
    }

    if (!body.staffId) {
      return NextResponse.json({
        success: false,
        error: 'Staff ID is required'
      }, { status: 400 })
    }

    console.log(`🎯 Offer acceptance attempt: ${offerId} by staff ${body.staffId}`)

    // CRITICAL: This uses atomic Firestore transaction
    // Only one staff member can successfully accept - first wins
    const result = await OfferEngineService.acceptOffer(offerId, body.staffId)

    if (!result.success) {
      console.log(`❌ Offer acceptance failed: ${result.error}`)
      
      // Return appropriate status codes for different failure reasons
      if (result.error?.includes('no longer available') || 
          result.error?.includes('already assigned') ||
          result.error?.includes('expired')) {
        return NextResponse.json({
          success: false,
          error: result.error,
          reason: 'offer_unavailable'
        }, { status: 409 }) // Conflict - offer was taken by someone else
      }

      if (result.error?.includes('not eligible')) {
        return NextResponse.json({
          success: false,
          error: result.error,
          reason: 'not_eligible'
        }, { status: 403 }) // Forbidden - staff not eligible
      }

      return NextResponse.json({
        success: false,
        error: result.error,
        reason: 'unknown_error'
      }, { status: 500 })
    }

    console.log(`✅ Offer ${offerId} successfully accepted by staff ${body.staffId}`)

    return NextResponse.json({
      success: true,
      message: 'Offer accepted successfully',
      assignedJobId: result.assignedJobId,
      staffId: body.staffId
    })

  } catch (error) {
    console.error('❌ Critical error in offer acceptance:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error during acceptance',
      reason: 'server_error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/offers/{offerId}/accept  
 * Cancel an offer (admin override)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { offerId: string } }
) {
  try {
    const { offerId } = params
    const body = await request.json()
    
    if (!offerId) {
      return NextResponse.json({
        success: false,
        error: 'Offer ID is required'
      }, { status: 400 })
    }

    const cancelReason = body.cancelReason || 'Admin cancellation'
    const cancelledBy = body.cancelledBy || 'admin'

    console.log(`🛑 Admin cancelling offer: ${offerId}`)

    const result = await OfferEngineService.cancelOffer(offerId, cancelReason, cancelledBy)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Offer cancelled successfully'
    })

  } catch (error) {
    console.error('❌ Error cancelling offer:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
