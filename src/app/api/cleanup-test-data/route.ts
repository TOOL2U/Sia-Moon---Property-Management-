import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'Test endpoints are disabled in production'
    }, { status: 403 })
  }
  
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'Cleanup endpoints are disabled in production'  
    }, { status: 403 })
  }
  
  return NextResponse.json({ success: true })
}
