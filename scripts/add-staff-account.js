// Firebase CLI script to add user to staff_accounts collection
// This script uses the Firebase CLI to add a user to the staff_accounts collection

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

console.log('Staff account data to add:');
console.log(JSON.stringify(staffAccountData, null, 2));
console.log('\nTo add this user to Firestore, run the following Firebase CLI command:');
console.log(`firebase firestore:set staff_accounts/${userId} '${JSON.stringify(staffAccountData)}'`);
