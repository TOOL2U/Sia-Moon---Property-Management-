/**
 * Create Firebase Auth User with Password using Admin SDK
 * This bypasses the email reset issue on localhost
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with minimal config (no service account needed for local dev)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: 'operty-b54dc'
    });
  } catch (error) {
    console.log('⚠️  Firebase Admin requires service account for user creation');
    console.log('💡 Let me provide a simpler solution...');
    
    // Provide manual solution
    console.log('\n🔧 SIMPLE MANUAL SOLUTION:');
    console.log('Since password reset doesn\'t work on localhost, let\'s create a test user:');
    console.log('');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/operty-b54dc/authentication/users');
    console.log('2. Click "Add user"');
    console.log('3. Email: test@siamoon.com');
    console.log('4. Password: TestPass123!');
    console.log('5. Click "Add user"');
    console.log('6. Copy the UID');
    console.log('7. Update staff document with this UID');
    console.log('');
    console.log('This will give you a working login immediately!');
    
    process.exit(0);
  }
}

const auth = admin.auth();

async function createUserWithPassword() {
  console.log('🔐 Creating Firebase Auth user with password...');
  
  const email = 'test@siamoon.com'; // Use a different email to avoid conflicts
  const password = 'TestPass123!';
  const displayName = 'Test User';
  
  try {
    // Create user with password
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: true
    });
    
    console.log('✅ Successfully created user:', userRecord.uid);
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🆔 UID:', userRecord.uid);
    
    console.log('\n🎉 USER CREATED SUCCESSFULLY!');
    console.log('=' .repeat(40));
    console.log('Now you can:');
    console.log('1. Login with these credentials immediately');
    console.log('2. No email verification needed');
    console.log('3. Works on localhost');
    
    console.log('\n📝 NEXT: Update staff document with this UID');
    console.log(`   UID to use: ${userRecord.uid}`);
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('✅ User already exists, getting UID...');
      const userRecord = await auth.getUserByEmail(email);
      console.log('🆔 Existing UID:', userRecord.uid);
      
      // Update password
      await auth.updateUser(userRecord.uid, {
        password: password
      });
      console.log('✅ Password updated');
      
      console.log('\n🎉 USER READY!');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('🆔 UID:', userRecord.uid);
      
    } else {
      console.error('❌ Error creating user:', error.message);
      
      // Fallback to manual solution
      console.log('\n🔧 FALLBACK: Manual Creation');
      console.log('1. Go to: https://console.firebase.google.com/project/operty-b54dc/authentication/users');
      console.log('2. Click "Add user"');
      console.log(`3. Email: ${email}`);
      console.log(`4. Password: ${password}`);
      console.log('5. Copy the UID and update staff document');
    }
  }
}

createUserWithPassword();
