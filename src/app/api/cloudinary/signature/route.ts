import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import cloudinary from '@/lib/cloudinary'
import { z } from 'zod'

// Input validation schema
const CloudinaryRequestSchema = z.object({
  folder: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  transformation: z.string().max(500).optional(),
  tags: z.union([
    z.string().max(200),
    z.array(z.string().max(50)).max(10)
  ]).optional()
})

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE USER
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ Cloudinary API - Authentication failed:', authError?.message)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. VALIDATE INPUT
    const body = await request.json()
    const validatedData = CloudinaryRequestSchema.parse(body)

    // 3. SCOPE TO USER
    const timestamp = Math.round(new Date().getTime() / 1000)
    const sanitizedFolder = `villa-management/${user.id}/${validatedData.folder || 'uploads'}`

    const params = {
      timestamp,
      folder: sanitizedFolder, // USER-SCOPED FOLDER
      ...(validatedData.transformation && { transformation: validatedData.transformation }),
      ...(validatedData.tags && {
        tags: Array.isArray(validatedData.tags)
          ? validatedData.tags.join(',')
          : validatedData.tags
      }),
    }

    // Generate the signature
    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET!
    )

    console.log(`✅ Cloudinary signature generated for user: ${user.id}`)

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      ...params,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Cloudinary API - Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('❌ Cloudinary signature error:', error)
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    )
  }
}
