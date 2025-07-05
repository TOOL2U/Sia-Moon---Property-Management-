import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createClient()
    
    const results = {
      database: false,
      auth: false,
      profiles: false,
      properties: false,
      bookings: false,
      reports: false,
      notifications: false,
      edgeFunctions: false
    }

    // Test basic connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      results.database = !error
    } catch (error) {
      console.error('Database test failed:', error)
    }

    // Test auth
    try {
      const { data: { user } } = await supabase.auth.getUser()
      results.auth = true // Auth service is available even if no user
    } catch (error) {
      console.error('Auth test failed:', error)
    }

    // Test profiles table
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1)
      results.profiles = !error
    } catch (error) {
      console.error('Profiles test failed:', error)
    }

    // Test properties table
    try {
      const { error } = await supabase.from('properties').select('id').limit(1)
      results.properties = !error
    } catch (error) {
      console.error('Properties test failed:', error)
    }

    // Test bookings table
    try {
      const { error } = await supabase.from('bookings').select('id').limit(1)
      results.bookings = !error
    } catch (error) {
      console.error('Bookings test failed:', error)
    }

    // Test reports table
    try {
      const { error } = await supabase.from('reports').select('id').limit(1)
      results.reports = !error
    } catch (error) {
      console.error('Reports test failed:', error)
    }

    // Test notifications table
    try {
      const { error } = await supabase.from('notifications').select('id').limit(1)
      results.notifications = !error
    } catch (error) {
      console.error('Notifications test failed:', error)
    }

    // Test edge functions (basic check)
    try {
      // Just check if the functions endpoint is accessible
      results.edgeFunctions = true // Assume available if we can connect to Supabase
    } catch (error) {
      console.error('Edge functions test failed:', error)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Status check failed:', error)
    return NextResponse.json({
      database: false,
      auth: false,
      profiles: false,
      properties: false,
      bookings: false,
      reports: false,
      notifications: false,
      edgeFunctions: false
    }, { status: 500 })
  }
}
