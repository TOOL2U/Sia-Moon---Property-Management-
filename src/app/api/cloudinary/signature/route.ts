import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const { folder, transformation, tags } = await request.json()

    const timestamp = Math.round(new Date().getTime() / 1000)

    // Parameters for the signature
    const params = {
      timestamp,
      folder: folder || 'villa-management',
      ...(transformation && { transformation }),
      ...(tags && { tags: Array.isArray(tags) ? tags.join(',') : tags }),
    }

    // Generate the signature
    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET!
    )

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      ...params,
    })
  } catch (error) {
    console.error('Cloudinary signature error:', error)
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    )
  }
}
