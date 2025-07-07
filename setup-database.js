const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://alkogpgjxpshoqsfgqef.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsa29ncGdqeHBzaG9xc2ZncWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM1NTI4MiwiZXhwIjoyMDY2OTMxMjgyfQ._k3fSYzKg51Icssh68tU2izhQO660yTDCUdrQ4-I93Y'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Setting up database...')

  try {
    // Check if profiles table exists first
    console.log('🔍 Checking if profiles table exists...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === '42P01') {
      console.log('❌ Profiles table does not exist. Please create it manually in Supabase dashboard.')
      console.log('📝 SQL to run in Supabase SQL Editor:')
      console.log(`
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'staff', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
      `)
    } else {
      console.log('✅ Profiles table exists')
    }

    // Create a profile for the existing user
    console.log('👤 Creating profile for existing user...')
    const userId = '73baf1bb-db10-4130-a120-471618f602b9'
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: 'shaun@gmail.com',
        full_name: 'Shaun',
        role: 'client'
      })
      .select()

    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
    } else {
      console.log('✅ Profile created successfully:', profileData)
    }

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupDatabase()