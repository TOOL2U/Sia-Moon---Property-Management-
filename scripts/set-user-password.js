/**
 * Set Password for Firebase Auth User
 * Uses Firebase CLI to set password for the created user
 */

const { execSync } = require('child_process');

async function setUserPassword() {
  console.log('🔐 Setting password for Firebase Auth user...');
  
  const uid = 'shaun_siamoon_user_001';
  const email = 'shaun@siamoon.com';
  const password = 'TestPass123!';
  
  try {
    // Create a user with password using Firebase CLI
    console.log('📝 Creating user with password...');
    
    // First, let's delete the existing user and recreate with password
    const userWithPassword = {
      "users": [
        {
          "localId": uid,
          "email": email,
          "emailVerified": true,
          "displayName": "Shaun Ducker",
          "disabled": false,
          "passwordHash": Buffer.from(password).toString('base64'),
          "salt": "",
          "version": 1
        }
      ]
    };
    
    // Write to file
    require('fs').writeFileSync('user-with-password.json', JSON.stringify(userWithPassword, null, 2));
    
    console.log('📤 Importing user with password...');
    
    // Import with password hash
    const result = execSync('firebase auth:import user-with-password.json --hash-algo STANDARD_SCRYPT --project operty-b54dc', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Result:', result);
    
    // Clean up
    require('fs').unlinkSync('user-with-password.json');
    
    console.log('🎉 Password set successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 UID: ${uid}`);
    
  } catch (error) {
    console.error('❌ Error setting password:', error.message);
    
    console.log('\n🔧 ALTERNATIVE: Set password manually');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/operty-b54dc/authentication/users');
    console.log(`2. Find user: ${email}`);
    console.log('3. Click the user to edit');
    console.log('4. Set password to: TestPass123!');
    console.log(`5. Note the UID: ${uid}`);
  }
}

setUserPassword();
