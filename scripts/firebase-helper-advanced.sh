#!/bin/bash

# Firebase Helper Script
# This script helps with Firebase operations for testing mobile job integration

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}    Firebase Helper for Job Testing ${NC}"
echo -e "${BLUE}===================================${NC}"
echo

# Function to check Firebase CLI installation
check_firebase_cli() {
  echo -e "${BLUE}Checking Firebase CLI...${NC}"
  if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Firebase CLI not found. Please install it:${NC}"
    echo -e "npm install -g firebase-tools"
    exit 1
  fi

  firebase --version
  echo -e "${GREEN}Firebase CLI is installed.${NC}"

  # Check if logged in
  firebase projects:list > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You need to log in to Firebase:${NC}"
    firebase login
  else
    echo -e "${GREEN}You are already logged into Firebase.${NC}"
    firebase projects:list
  fi
}

# Function to create a test staff account with userId
create_test_staff() {
  echo -e "${BLUE}Creating a test staff account with userId...${NC}"

  # Generate a random ID for the staff
  STAFF_ID="test_staff_$(date +%s)"

  # Prompt for email
  read -p "Enter email for the test staff: " EMAIL

  # Check if email is provided
  if [ -z "$EMAIL" ]; then
    echo -e "${RED}Email is required. Aborting.${NC}"
    return 1
  fi

  # Create the staff account
  echo -e "${BLUE}Creating staff account in Firebase...${NC}"

  # First, create a Firebase Auth user
  echo -e "${BLUE}Creating Firebase Auth user...${NC}"
  # This would normally use the Firebase Admin SDK, but we'll use a Node script instead

  # Run the Node.js script to create a staff account
  node scripts/create-staff-with-userid.js ~/.google/service-account.json "$EMAIL"
}

# Function to run direct Firestore operations using Node.js
run_firestore_query() {
  echo -e "${BLUE}Running a direct Firestore query...${NC}"

  # Create a temporary script
  TMP_SCRIPT=$(mktemp)

  cat > "$TMP_SCRIPT" << 'EOF'
const admin = require('firebase-admin');
const serviceAccount = require(process.argv[2]);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function queryFirestore() {
  const collectionName = process.argv[3];
  const limit = parseInt(process.argv[4] || '10');

  try {
    console.log(`Querying ${collectionName} collection (limit ${limit})...`);

    const snapshot = await db.collection(collectionName).limit(limit).get();

    if (snapshot.empty) {
      console.log(`No documents found in ${collectionName}`);
      return;
    }

    console.log(`Found ${snapshot.size} documents:`);
    snapshot.forEach(doc => {
      console.log(`\nDocument ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  } catch (error) {
    console.error('Error querying Firestore:', error);
  }
}

queryFirestore()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
EOF

  read -p "Enter collection name to query: " COLLECTION
  read -p "Enter limit (default 10): " LIMIT
  LIMIT=${LIMIT:-10}

  node "$TMP_SCRIPT" ~/.google/service-account.json "$COLLECTION" "$LIMIT"

  # Clean up the temporary script
  rm "$TMP_SCRIPT"
}

# Function to create test job using the Firebase service
create_test_job() {
  echo -e "${BLUE}Creating a test job in Firebase...${NC}"

  # Create a temporary script
  TMP_SCRIPT=$(mktemp)

  cat > "$TMP_SCRIPT" << 'EOF'
const admin = require('firebase-admin');
const serviceAccount = require(process.argv[2]);
const { v4: uuidv4 } = require('uuid');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestJob() {
  const staffId = process.argv[3];
  const userId = process.argv[4];
  const staffName = process.argv[5] || 'Test Staff';
  const staffEmail = process.argv[6] || 'test@example.com';

  if (!staffId || !userId) {
    console.error('Staff ID and User ID are required');
    return false;
  }

  try {
    console.log(`Creating test job for staff ${staffName} (${staffId}) with userId: ${userId}`);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Format dates
    const todayFormatted = now.toISOString().split('T')[0];
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];

    // Create test job data
    const testJob = {
      // Booking Reference
      bookingId: `test_booking_${uuidv4().substring(0, 6)}`,
      bookingRef: {
        id: `test_booking_${uuidv4().substring(0, 6)}`,
        guestName: 'Test Guest',
        propertyName: 'Test Villa',
        checkInDate: todayFormatted,
        checkOutDate: tomorrowFormatted,
        guestCount: 4
      },

      // Property Reference
      propertyId: `test_property_${uuidv4().substring(0, 6)}`,
      propertyRef: {
        id: `test_property_${uuidv4().substring(0, 6)}`,
        name: 'Test Villa',
        address: '123 Test Street, Test City',
        coordinates: {
          latitude: 7.9519,
          longitude: 98.3381
        }
      },

      // Job Details
      jobType: 'cleaning',
      title: '⚠️ CLI TEST JOB: Villa Cleaning',
      description: 'This is a test job created by the Firebase helper script',
      priority: 'medium',

      // Scheduling
      scheduledDate: todayFormatted,
      scheduledStartTime: '14:00',
      scheduledEndTime: '16:00',
      estimatedDuration: 120,
      deadline: tomorrowFormatted,

      // Staff Assignment
      assignedStaffId: staffId,
      userId: userId,
      assignedStaffRef: {
        id: staffId,
        name: staffName,
        role: 'Staff',
        skills: ['cleaning', 'attention_to_detail']
      },
      userRef: {
        userId: userId
      },

      // Assignment Details
      assignedAt: now.toISOString(),
      assignedBy: {
        id: 'admin',
        name: 'CLI Admin'
      },

      // Job Status
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: now.toISOString(),
          updatedBy: 'admin',
          notes: 'Test job created by CLI'
        }
      ],

      // Requirements
      requiredSkills: ['cleaning', 'attention_to_detail'],
      specialInstructions: 'This is a test job created by the Firebase helper script',

      // Location & Access
      location: {
        address: '123 Test Street, Test City',
        coordinates: {
          latitude: 7.9519,
          longitude: 98.3381
        },
        accessInstructions: 'Test villa access code: 1234',
        parkingInstructions: 'Parking available in front of villa'
      },

      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),

      // Mobile Sync Optimization
      syncVersion: 1,
      mobileOptimized: {
        essentialData: {
          title: '⚠️ CLI TEST JOB: Villa Cleaning',
          address: '123 Test Street, Test City',
          scheduledTime: '14:00',
          priority: 'medium'
        }
      },

      notificationSent: true,
      mobileNotificationPending: true
    };

    // Save to Firebase
    console.log('Saving test job to Firebase...');
    const jobRef = await db.collection('jobs').add(testJob);
    console.log(`Test job created with ID: ${jobRef.id}`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update to assigned status
    await jobRef.update({
      status: 'assigned',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        status: 'assigned',
        timestamp: new Date().toISOString(),
        updatedBy: 'admin',
        notes: 'Test job assigned to staff'
      })
    });
    console.log(`Job ${jobRef.id} updated to assigned status`);

    // Create notification
    const notificationData = {
      jobId: jobRef.id,
      staffId: staffId,
      userId: userId,
      staffName: staffName,
      staffEmail: staffEmail,
      jobTitle: testJob.title,
      jobType: testJob.jobType,
      priority: testJob.priority,
      propertyName: testJob.propertyRef.name,
      propertyAddress: testJob.location.address,
      scheduledDate: testJob.scheduledDate,
      scheduledStartTime: testJob.scheduledStartTime,
      estimatedDuration: testJob.estimatedDuration,
      specialInstructions: testJob.specialInstructions,
      type: 'job_assigned',
      status: 'pending',
      readAt: null,
      actionRequired: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    const notificationRef = await db.collection('staff_notifications').add(notificationData);
    console.log(`Notification created with ID: ${notificationRef.id}`);

    return {
      success: true,
      jobId: jobRef.id,
      notificationId: notificationRef.id
    };
  } catch (error) {
    console.error('Error creating test job:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

createTestJob()
  .then(result => {
    console.log('Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
EOF

  # Install required packages
  npm install --no-save firebase-admin uuid

  read -p "Enter staff ID: " STAFF_ID
  read -p "Enter user ID: " USER_ID
  read -p "Enter staff name (or press Enter for default): " STAFF_NAME
  STAFF_NAME=${STAFF_NAME:-"Test Staff"}
  read -p "Enter staff email (or press Enter for default): " STAFF_EMAIL
  STAFF_EMAIL=${STAFF_EMAIL:-"test@example.com"}

  node "$TMP_SCRIPT" ~/.google/service-account.json "$STAFF_ID" "$USER_ID" "$STAFF_NAME" "$STAFF_EMAIL"

  # Clean up the temporary script
  rm "$TMP_SCRIPT"
}

# Function to check staff notifications
check_staff_notifications() {
  echo -e "${BLUE}Checking staff notifications...${NC}"

  # Create a temporary script
  TMP_SCRIPT=$(mktemp)

  cat > "$TMP_SCRIPT" << 'EOF'
const admin = require('firebase-admin');
const serviceAccount = require(process.argv[2]);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkStaffNotifications() {
  const staffId = process.argv[3];

  if (!staffId) {
    console.error('Staff ID is required');
    return false;
  }

  try {
    console.log(`Checking notifications for staff ${staffId}...`);

    const snapshot = await db.collection('staff_notifications')
      .where('staffId', '==', staffId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    if (snapshot.empty) {
      console.log(`No notifications found for staff ${staffId}`);
      return;
    }

    console.log(`Found ${snapshot.size} notifications for staff ${staffId}:`);
    snapshot.forEach(doc => {
      const notification = doc.data();
      console.log(`\nNotification ID: ${doc.id}`);
      console.log(`Type: ${notification.type || 'Not specified'}`);
      console.log(`Job ID: ${notification.jobId || 'Not specified'}`);
      console.log(`Status: ${notification.status || 'Not specified'}`);

      // Format createdAt timestamp if it exists
      if (notification.createdAt) {
        const timestamp = notification.createdAt.toDate();
        console.log(`Created At: ${timestamp.toISOString()}`);
      }
    });
  } catch (error) {
    console.error('Error checking staff notifications:', error);
  }
}

checkStaffNotifications()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
EOF

  read -p "Enter staff ID to check notifications: " STAFF_ID

  node "$TMP_SCRIPT" ~/.google/service-account.json "$STAFF_ID"

  # Clean up the temporary script
  rm "$TMP_SCRIPT"
}

# Function to check if a staff account has a userId
check_staff_userid() {
  echo -e "${BLUE}Checking if staff account has a userId...${NC}"

  # Create a temporary script
  TMP_SCRIPT=$(mktemp)

  cat > "$TMP_SCRIPT" << 'EOF'
const admin = require('firebase-admin');
const serviceAccount = require(process.argv[2]);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function checkStaffUserId() {
  const staffId = process.argv[3];

  if (!staffId) {
    console.error('Staff ID is required');
    return false;
  }

  try {
    console.log(`Checking staff account ${staffId}...`);

    const staffDoc = await db.collection('staff_accounts').doc(staffId).get();

    if (!staffDoc.exists) {
      console.log(`Staff account ${staffId} does not exist`);
      return;
    }

    const staffData = staffDoc.data();
    console.log(`Staff Name: ${staffData.name || 'Not specified'}`);
    console.log(`Staff Email: ${staffData.email || 'Not specified'}`);

    if (!staffData.userId) {
      console.log(`\nThis staff account does NOT have a userId`);
      return;
    }

    console.log(`\nThis staff account has userId: ${staffData.userId}`);

    // Try to get the auth user
    try {
      const userRecord = await auth.getUser(staffData.userId);
      console.log('\nFound matching Firebase Auth user:');
      console.log(`Email: ${userRecord.email}`);
      console.log(`Display Name: ${userRecord.displayName}`);
      console.log(`Verified: ${userRecord.emailVerified ? 'Yes' : 'No'}`);
    } catch (authError) {
      console.log(`\nCould not find matching Firebase Auth user: ${authError.message}`);
    }
  } catch (error) {
    console.error('Error checking staff userId:', error);
  }
}

checkStaffUserId()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
EOF

  read -p "Enter staff ID to check: " STAFF_ID

  node "$TMP_SCRIPT" ~/.google/service-account.json "$STAFF_ID"

  # Clean up the temporary script
  rm "$TMP_SCRIPT"
}

# Main menu
show_menu() {
  echo
  echo -e "${BLUE}Firebase Helper Menu:${NC}"
  echo "1. Check Firebase CLI installation"
  echo "2. Create a test staff account with userId"
  echo "3. Check if staff account has a userId"
  echo "4. Create a test job"
  echo "5. Check staff notifications"
  echo "6. Run a Firestore query"
  echo "0. Exit"
  echo
  read -p "Enter your choice: " choice

  case $choice in
    1) check_firebase_cli ;;
    2) create_test_staff ;;
    3) check_staff_userid ;;
    4) create_test_job ;;
    5) check_staff_notifications ;;
    6) run_firestore_query ;;
    0) echo -e "${GREEN}Goodbye!${NC}"; exit 0 ;;
    *) echo -e "${RED}Invalid choice${NC}" ;;
  esac

  # Return to menu
  read -p "Press Enter to continue..."
  show_menu
}

# Start the script
show_menu
