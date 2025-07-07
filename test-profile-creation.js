// Test script for profile creation
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Read .env.local file manually
const readEnvFile = () => {
  try {
    const envContents = fs.readFileSync('.env.local', 'utf8');
    const envVars = {};
    
    envContents.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if they exist
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        envVars[key] = value;
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error reading .env.local file:', error.message);
    return {};
  }
}

const envVars = readEnvFile();

async function testProfileCreation() {
  console.log('🧪 Testing Supabase profile creation and authentication flow...');
  
  // Check if environment variables are set
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase environment variables not configured properly');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set' : '❌ Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓ Set' : '❌ Missing (needed for admin operations)');
    return;
  }
  
  try {
    // Create Supabase client with anon key (like in the app)
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create admin client with service role key if available
    const adminClient = serviceRoleKey 
      ? createClient(supabaseUrl, serviceRoleKey) 
      : null;
    console.log('✓ Supabase client created');
    
    // Create a test user with the service key
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'Test123!@#';
    
    console.log(`Creating test user: ${testEmail}`);
    
    // Sign up (create) a new user
    const { data: userData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'client'
        }
      }
    });
    
    if (signupError) {
      console.error('❌ User creation failed:', signupError.message);
      return;
    }
    
    console.log('✓ Test user created successfully');
    console.log('User ID:', userData.user.id);
    
    // Check if profile was automatically created
    console.log('Checking if profile was created...');
    
    // Wait a moment for any triggers to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile not created automatically:', profileError.message);
      
      // Let's try to create the profile manually as a fallback
      console.log('Attempting to create profile manually...');
      
      const { data: insertedProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userData.user.id,
          email: testEmail,
          full_name: 'Test User',
          role: 'client'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Manual profile creation failed:', insertError.message);
      } else {
        console.log('✓ Profile created manually:', insertedProfile);
      }
    } else {
      console.log('✓ Profile created automatically:', profileData);
    }
    
    // Clean up by deleting the test user if service role key is available
    if (adminClient) {
      console.log('Cleaning up test user...');
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id);
      
      if (deleteError) {
        console.error('❌ Failed to delete test user:', deleteError.message);
      } else {
        console.log('✓ Test user deleted successfully');
      }
    } else {
      console.log('⚠️ Test complete - note that test user remains in the database (service role key required for cleanup)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    console.log('🏁 Test completed');
  }
}

// Execute the test
console.log('🚀 Starting Supabase profile creation test...');
testProfileCreation().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

// Export to support ESM
export {};
