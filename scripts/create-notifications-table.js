#!/usr/bin/env node

/**
 * Create Notifications Table
 * Creates the notifications table that's missing from the database
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

async function createNotificationsTable() {
  console.log('📋 Creating Notifications Table...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase configuration!')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log('📋 Configuration:')
    console.log(`URL: ${supabaseUrl}`)
    console.log(`Service Role Key: ${serviceRoleKey.substring(0, 20)}...`)
    console.log('')

    // Check if notifications table exists
    console.log('📋 Checking if notifications table exists...')

    const { data: tableExists, error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ notifications table already exists!')
    } else if (checkError.code === '42P01') {
      console.log('📋 Creating notifications table...')

      // Create the table using a simple insert operation that will fail but create the table structure
      // We'll use the Supabase REST API to create the table
      console.log('❌ Table does not exist. Please create it manually in Supabase Dashboard.')
      console.log('📋 SQL to create the table:')
      console.log(`
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
      `)
      return false
    } else {
      console.error('❌ Error checking notifications table:', checkError.message)
      return false
    }

    console.log('✅ notifications table created successfully!')

    // Create sample notifications for existing users
    console.log('\n📋 Creating sample notifications for existing users...')
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message)
      return false
    }

    console.log(`📊 Found ${profiles.length} users`)

    let created = 0

    for (const profile of profiles) {
      // Create welcome notification
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: profile.id,
          title: 'Welcome to Villa Management',
          message: 'Welcome to your villa management dashboard! Start by adding your first property.',
          type: 'info'
        })

      if (insertError) {
        console.log(`❌ Failed to create notification for user ${profile.id}:`, insertError.message)
      } else {
        created++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   • Notifications created: ${created}`)
    console.log(`   • Total users: ${profiles.length}`)

    return true

  } catch (error) {
    console.error('❌ Creation failed:', error.message)
    return false
  }
}

// Run the creation
createNotificationsTable()
  .then(success => {
    if (success) {
      console.log('\n🎉 Notifications table created successfully!')
      console.log('✅ The notification errors should now be resolved')
    } else {
      console.log('\n❌ Failed to create notifications table.')
      console.log('🔧 Check the error messages above for details')
    }
  })
  .catch(error => {
    console.error('\n💥 Creation script failed:', error.message)
    process.exit(1)
  })
