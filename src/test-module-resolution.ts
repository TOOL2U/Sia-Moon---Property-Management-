// Test file to verify module resolution
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'

console.log('Module resolution test - this file should not have errors')

export async function GET() {
  console.log('DB connection:', !!db)
  return NextResponse.json({ message: 'Test successful' })
}
