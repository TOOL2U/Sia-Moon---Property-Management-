// This script creates a SQL executor helper function in Supabase
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

// Create a function to execute SQL directly
async function executeSQL() {
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Required Supabase environment variables not configured properly');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓ Set' : '❌ Missing');
    return;
  }
  
  console.log('Creating SQL helper function...');
  
  // First, create the exec_sql helper function if it doesn't exist
  
  const createHelperFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result JSONB;
    BEGIN
      EXECUTE sql INTO result;
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'error', SQLERRM,
        'detail', SQLSTATE
      );
    END;
    $$;
  `;
  
  try {
    // Create the helper function using raw HTTP request
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        sql: createHelperFunctionSQL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      if (errorText.includes("function already exists")) {
        console.log('✅ Helper function already exists');
      } else {
        console.error('❌ Error creating helper function:', errorText);
      }
    } else {
      console.log('✅ Helper function created successfully');
    }
    
    console.log('\nNow you can use this function to execute SQL directly:');
    console.log(`
Example:
1. Run the add-profile-trigger.js script:
   node add-profile-trigger.js

2. Test if the trigger works correctly:
   node test-profile-creation.js
    `);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

executeSQL().catch(console.error);

// Export to support ESM
export {};
