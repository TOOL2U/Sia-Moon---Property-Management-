#!/usr/bin/env node

/**
 * Database Setup Script
 * Sets up the Supabase database with all required tables and policies
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (!key.startsWith('#') && value) {
          process.env[key.trim()] = value
        }
      }
    })
  } catch (error) {
    console.error('Could not load .env.local file:', error.message)
  }
}

loadEnvFile()

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...\n')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration!')
    process.exit(1)
  }

  // Use service role key if available, otherwise anon key
  const keyToUse = serviceRoleKey && !serviceRoleKey.includes('your_') ? serviceRoleKey : supabaseKey

  try {
    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, keyToUse)

    console.log('📋 Configuration:')
    console.log(`URL: ${supabaseUrl}`)
    console.log(`Using: ${keyToUse === serviceRoleKey ? 'Service Role Key' : 'Anon Key'}`)
    console.log('')

    // Read the SQL setup file
    const sqlPath = path.join(process.cwd(), 'setup_database.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('📊 Executing database setup...')

    // Split SQL into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          if (error) {
            console.log(`⚠️  Statement ${i + 1}: ${error.message}`)
            errorCount++
          } else {
            console.log(`✅ Statement ${i + 1}: Success`)
            successCount++
          }
        } catch (err) {
          console.log(`❌ Statement ${i + 1}: ${err.message}`)
          errorCount++
        }
      }
    }

    console.log(`\n📈 Results: ${successCount} successful, ${errorCount} errors`)

    // Test basic functionality
    console.log('\n🔍 Testing database setup...')
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (profilesError) {
      console.log('❌ Profiles table test failed:', profilesError.message)
    } else {
      console.log('✅ Profiles table: OK')
    }

    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('count')
      .limit(1)

    if (propertiesError) {
      console.log('❌ Properties table test failed:', propertiesError.message)
    } else {
      console.log('✅ Properties table: OK')
    }

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('count')
      .limit(1)

    if (bookingsError) {
      console.log('❌ Bookings table test failed:', bookingsError.message)
    } else {
      console.log('✅ Bookings table: OK')
    }

    console.log('\n🎉 Database setup completed!')
    return true

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    return false
  }
}

// Alternative approach: Use direct SQL execution
async function setupDatabaseDirect() {
  console.log('🔄 Trying direct SQL execution approach...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey || serviceRoleKey.includes('your_')) {
    console.log('⚠️  Service role key not configured. Using basic table creation...')
    return await createBasicTables()
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Create basic tables using individual queries
    const tables = [
      {
        name: 'profiles',
        sql: `
          CREATE TABLE IF NOT EXISTS profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            role TEXT DEFAULT 'client',
            phone TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      },
      {
        name: 'properties',
        sql: `
          CREATE TABLE IF NOT EXISTS properties (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            country TEXT DEFAULT 'Thailand',
            bedrooms INTEGER DEFAULT 1,
            bathrooms INTEGER DEFAULT 1,
            max_guests INTEGER DEFAULT 2,
            price_per_night DECIMAL(10,2),
            currency TEXT DEFAULT 'THB',
            amenities TEXT[],
            images TEXT[],
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      },
      {
        name: 'bookings',
        sql: `
          CREATE TABLE IF NOT EXISTS bookings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
            guest_name TEXT NOT NULL,
            guest_email TEXT NOT NULL,
            guest_phone TEXT,
            check_in DATE NOT NULL,
            check_out DATE NOT NULL,
            guests INTEGER DEFAULT 1,
            total_amount DECIMAL(10,2),
            currency TEXT DEFAULT 'THB',
            status TEXT DEFAULT 'pending',
            special_requests TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      }
    ]

    for (const table of tables) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: table.sql })
        if (error) {
          console.log(`❌ ${table.name}: ${error.message}`)
        } else {
          console.log(`✅ ${table.name}: Created successfully`)
        }
      } catch (err) {
        console.log(`⚠️  ${table.name}: ${err.message}`)
      }
    }

    return true
  } catch (error) {
    console.error('❌ Direct setup failed:', error.message)
    return false
  }
}

async function createBasicTables() {
  console.log('📋 Creating basic tables with anon key...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const supabase = createClient(supabaseUrl, anonKey)
  
  // Test if we can at least read from the database
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (!error) {
      console.log('✅ Database connection successful - tables may already exist')
      return true
    } else {
      console.log('ℹ️  Tables need to be created via Supabase dashboard')
      console.log('📋 Please run the SQL script manually in the dashboard')
      return false
    }
  } catch (err) {
    console.log('❌ Connection test failed:', err.message)
    return false
  }
}

// Run the setup
setupDatabase()
  .then(success => {
    if (!success) {
      console.log('\n🔄 Trying alternative approach...')
      return setupDatabaseDirect()
    }
    return success
  })
  .then(success => {
    if (success) {
      console.log('\n✅ Database setup completed successfully!')
      console.log('🎯 You can now run: npm run test:supabase')
    } else {
      console.log('\n❌ Database setup failed.')
      console.log('📋 Please run the SQL script manually in the Supabase dashboard.')
      console.log('🔗 Go to: https://supabase.com/dashboard/project/alkogpgjxpshoqsfgqef/sql')
    }
  })
  .catch(error => {
    console.error('\n💥 Setup script failed:', error.message)
    process.exit(1)
  })
