import { NextResponse } from 'next/server'

export async function POST() {
  console.log('🧹 Clearing all authentication cookies...')
  
  const response = NextResponse.json({ 
    success: true, 
    message: 'All authentication cookies cleared' 
  })
  
  // Clear all possible authentication cookies
  response.cookies.set('firebase-auth-token', '', {
    expires: new Date(0),
    path: '/',
  })
  
  response.cookies.set('auth-token', '', {
    expires: new Date(0),
    path: '/',
  })
  
  // Clear any other potential auth cookies
  response.cookies.set('session', '', {
    expires: new Date(0),
    path: '/',
  })
  
  console.log('✅ Authentication cookies cleared successfully')
  
  return response
}

export async function GET() {
  return POST()
}
