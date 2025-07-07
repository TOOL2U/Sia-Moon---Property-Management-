// Script to add the profile creation trigger to Supabase
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
};

const envVars = readEnvFile();

async function addProfileTrigger() {
  console.log('🔧 Adding profile creation trigger to Supabase...');
  
  // Check if environment variables are set
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Required Supabase environment variables not configured properly');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓ Set' : '❌ Missing (required for this operation)');
    return;
  }
  
  try {
    // Create Supabase admin client with service role key
    console.log('🔑 Creating Supabase admin client...');
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Read the SQL file
    console.log('📄 Reading SQL file...');
    const sqlContent = fs.readFileSync('add-profile-trigger.sql', 'utf8');
    
    // Split SQL into separate statements
    const sqlStatements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${sqlStatements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`\n🔄 Executing SQL statement ${i + 1}/${sqlStatements.length}:`);
      console.log(statement);
      
      const { data, error } = await adminClient.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
        if (data) {
          console.log('Result:', data);
        }
      }
    }
    
    console.log('\n🔍 Verifying trigger installation...');
    const { data, error } = await adminClient.rpc('exec_sql', { 
      sql: "SELECT * FROM pg_triggers WHERE tgname = 'on_auth_user_created'" 
    });
    
    if (error) {
      console.error('❌ Error verifying trigger:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ Trigger successfully installed!');
      console.log(data);
    } else {
      console.error('❌ Trigger not found after installation');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Execute the function
addProfileTrigger().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

// Export to support ESM
export {};
