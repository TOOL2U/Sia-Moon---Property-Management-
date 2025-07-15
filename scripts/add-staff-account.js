// Simple approach: Let's use the API endpoint we created
const fetch = require('node-fetch');

// User ID to add to staff_accounts
const userId = 'VPPtbGl8WhMicZURHOgQ9BUzJd02';

// Staff account data
const staffAccountData = {
  firebaseUid: userId,
  name: 'Admin User',
  email: 'admin@siamoon.com',
  phone: '+1234567890',
  address: '123 Admin Street, Admin City',
  role: 'admin',
  status: 'active',
  assignedProperties: [],
  skills: ['management', 'administration'],
  hasCredentials: true,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  lastModifiedBy: 'system'
};

console.log('🔄 Adding user to staff_accounts collection...');
console.log('User ID:', userId);
console.log('Staff account data:', JSON.stringify(staffAccountData, null, 2));

// Since we have development rules that allow all access, let's just add the data directly
// We'll create a simple script that outputs the data for manual addition
console.log('\n📋 To add this user to Firestore manually:');
console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/operty-b54dc/firestore');
console.log('2. Navigate to the staff_accounts collection');
console.log('3. Add a new document with ID:', userId);
console.log('4. Copy and paste the following data:');
console.log('\n--- COPY THIS DATA ---');
console.log(JSON.stringify(staffAccountData, null, 2));
console.log('--- END DATA ---\n');

console.log('✅ Instructions provided for manual addition to Firestore');
