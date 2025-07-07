// Simple test script to check Supabase connection
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Read .env.local file manually since dotenv isn't working
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

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  // Check if environment variables are set
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase environment variables not configured properly');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set' : '❌ Missing');
    return;
  }
  
  console.log('✓ Environment variables found');
  console.log(`URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`ANON KEY: ${supabaseKey.substring(0, 10)}...`);
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✓ Supabase client created');
    
    // Test auth status
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth test failed:', authError.message);
    } else {
      console.log('✓ Auth service is working properly');
      console.log('Session:', authData.session ? 'Active' : 'None');
    }
    
    // Test query to profiles table
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (profilesError) {
      console.error('❌ Database query test failed:', profilesError.message);
    } else {
      console.log('✓ Database query successful');
      console.log('Profiles count:', profilesCount);
    }
    
    // Test storage buckets
    const { data: bucketsData, error: bucketsError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketsError) {
      console.error('❌ Storage test failed:', bucketsError.message);
    } else {
      console.log('✓ Storage service is working properly');
      console.log('Available buckets:', bucketsData.map(b => b.name).join(', '));
    }
    
    console.log('\n✅ All tests completed');
    
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
  }
}

testSupabaseConnection().catch(console.error);

// Export to support ESM
export {};
