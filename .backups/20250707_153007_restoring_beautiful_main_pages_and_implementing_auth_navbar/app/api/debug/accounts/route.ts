import { NextResponse } from 'next/server'
import DatabaseService from '@/lib/dbService'

export async function GET() {
  try {
    // Get all users from the database
    const { data: users, error } = await DatabaseService.getAllUsers()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the response for easy viewing
    const accountsInfo = {
      total_accounts: users?.length || 0,
      accounts: users?.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        // Don't expose password hash for security
        has_password: !!user.password_hash
      })) || []
    }

    return NextResponse.json(accountsInfo, { status: 200 })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' }, 
      { status: 500 }
    )
  }
}
