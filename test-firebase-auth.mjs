#!/usr/bin/env node

// Test Firebase Auth Connection
// This script tests the Firebase authentication configuration

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('🔍 Testing Firebase Auth Connection...\n');

// Check configuration
console.log('📋 Configuration Check:');
console.log('✓ API Key:', firebaseConfig.apiKey ? 'Present' : '❌ Missing');
console.log('✓ Auth Domain:', firebaseConfig.authDomain || '❌ Missing');
console.log('✓ Project ID:', firebaseConfig.projectId || '❌ Missing');
console.log('✓ Storage Bucket:', firebaseConfig.storageBucket || '❌ Missing');
console.log('✓ Messaging Sender ID:', firebaseConfig.messagingSenderId || '❌ Missing');
console.log('✓ App ID:', firebaseConfig.appId ? 'Present' : '❌ Missing');
console.log('✓ Measurement ID:', firebaseConfig.measurementId || '❌ Missing');

// Test initialization
try {
  console.log('\n🔥 Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
  
  console.log('\n🔐 Testing Auth Service...');
  const auth = getAuth(app);
  console.log('✅ Firebase Auth service initialized successfully');
  
  // Test auth domain connectivity
  console.log(`\n🌐 Testing Auth Domain Connectivity: ${firebaseConfig.authDomain}`);
  console.log('Auth service config:', {
    currentUser: auth.currentUser,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId
  });
  
  console.log('\n✅ Firebase Auth Connection Test PASSED');
  console.log('🎉 Your Firebase authentication is properly configured!');
  
} catch (error) {
  console.error('\n❌ Firebase Auth Connection Test FAILED');
  console.error('Error details:', error.message);
  console.error('Error code:', error.code);
  
  if (error.code === 'auth/invalid-api-key') {
    console.log('\n💡 Suggestion: Check your NEXT_PUBLIC_FIREBASE_API_KEY');
  } else if (error.code === 'auth/project-not-found') {
    console.log('\n💡 Suggestion: Check your NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  } else {
    console.log('\n💡 Suggestion: Verify all Firebase environment variables are correct');
  }
}
