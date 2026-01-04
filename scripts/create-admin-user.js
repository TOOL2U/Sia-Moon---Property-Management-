#!/usr/bin/env node

/**
 * Script to create an admin user in Firebase
 * This script helps create an admin account when you can't access the login page
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('../sia-moon-sanctuary-firebase-adminsdk-f63dg-4769c08ec3.json');
} catch (error) {
  console.error('❌ Error: Firebase service account key not found!');
  console.log('📝 Please ensure the service account JSON file is in the root directory.');
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://sia-moon-sanctuary-default-rtdb.firebaseio.com'
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
  console.log('🏗️  Admin User Creation Script');
  console.log('================================\n');

  try {
    // Get user input
    const email = await question('Enter admin email (default: admin@siamoon.com): ') || 'admin@siamoon.com';
    const password = await question('Enter admin password (min 6 characters): ');
    const fullName = await question('Enter full name (default: Admin User): ') || 'Admin User';

    if (!password || password.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      rl.close();
      return;
    }

    console.log('\n🔄 Creating admin user...\n');

    // 1. Create or update Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(email);
      console.log('✅ Firebase Auth user already exists:', firebaseUser.uid);
      
      // Update password if user exists
      await auth.updateUser(firebaseUser.uid, { password });
      console.log('✅ Password updated for existing user');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        firebaseUser = await auth.createUser({
          email,
          password,
          displayName: fullName,
          emailVerified: true
        });
        console.log('✅ Firebase Auth user created:', firebaseUser.uid);
      } else {
        throw error;
      }
    }

    // 2. Create/update profile in profiles collection
    const profileRef = db.collection('profiles').doc(firebaseUser.uid);
    const profileDoc = await profileRef.get();

    const profileData = {
      id: firebaseUser.uid,
      email: email.toLowerCase().trim(),
      fullName: fullName,
      role: 'admin',
      isAdmin: true,
      adminLevel: 10,
      properties: [],
      preferences: {
        notifications: true,
        emailUpdates: true
      },
      createdAt: profileDoc.exists ? profileDoc.data().createdAt : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await profileRef.set(profileData, { merge: true });
    console.log('✅ Profile document created/updated in profiles collection');

    // 3. Create/update user in users collection
    const userRef = db.collection('users').doc(firebaseUser.uid);
    const userDoc = await userRef.get();

    const userData = {
      id: firebaseUser.uid,
      email: email.toLowerCase().trim(),
      fullName: fullName,
      role: 'admin',
      isAdmin: true,
      adminLevel: 10,
      createdAt: userDoc.exists ? userDoc.data().createdAt : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData, { merge: true });
    console.log('✅ User document created/updated in users collection');

    // 4. Create staff account entry (optional, for staff management)
    const staffRef = db.collection('staff_accounts').doc(firebaseUser.uid);
    const staffDoc = await staffRef.get();

    const staffData = {
      id: firebaseUser.uid,
      firebaseUid: firebaseUser.uid,
      email: email.toLowerCase().trim(),
      name: fullName,
      role: 'admin',
      status: 'active',
      isActive: true,
      hasCredentials: true,
      assignedProperties: [],
      skills: ['management', 'administration'],
      createdAt: staffDoc.exists ? staffDoc.data().createdAt : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await staffRef.set(staffData, { merge: true });
    console.log('✅ Staff account created/updated');

    console.log('\n🎉 Admin user setup completed successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('\n🔗 Login URL: http://localhost:3000/auth/login\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error(error);
  } finally {
    rl.close();
  }
}

// Run the script
createAdminUser().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
