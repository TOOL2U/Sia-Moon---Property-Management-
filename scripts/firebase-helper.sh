#!/bin/bash

# Set your Firebase project ID
PROJECT_ID="operty-b54dc"

# The Firebase token from login:ci - REPLACE WITH YOUR ACTUAL TOKEN
FIREBASE_TOKEN="YOUR_FIREBASE_TOKEN_HERE"

echo "Getting Firebase database collections..."

# Function to create a test job
create_test_job() {
  echo "Creating a test job in Firebase..."
  node -e "
    const { initializeApp } = require('firebase/app');
    const { getFirestore, collection, addDoc, updateDoc, doc, serverTimestamp } = require('firebase/firestore');
    const { nanoid } = require('nanoid');

    const firebaseConfig = {
      projectId: '$PROJECT_ID',
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    async function createTestJob() {
      try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const todayFormatted = now.toISOString().split('T')[0];
        const tomorrowFormatted = tomorrow.toISOString().split('T')[0];

        const jobId = \`test_job_\${nanoid(6)}\`;

        // Create test job data
        const testJob = {
          bookingId: \`test_booking_\${nanoid(6)}\`,
          bookingRef: {
            id: \`test_booking_\${nanoid(6)}\`,
            guestName: 'Test Guest',
            propertyName: 'Test Villa',
            checkInDate: todayFormatted,
            checkOutDate: tomorrowFormatted,
            guestCount: 4
          },
          propertyId: \`test_property_\${nanoid(6)}\`,
          propertyRef: {
            id: \`test_property_\${nanoid(6)}\`,
            name: 'Test Villa',
            address: '123 Test Street, Test City',
            coordinates: {
              latitude: 7.9519,
              longitude: 98.3381
            }
          },
          jobType: 'cleaning',
          title: '⚠️ CLI TEST JOB: Villa Cleaning',
          description: 'This test job was created via command line',
          priority: 'medium',
          scheduledDate: todayFormatted,
          scheduledStartTime: '14:00',
          scheduledEndTime: '16:00',
          estimatedDuration: 120,
          deadline: tomorrowFormatted,
          assignedStaffId: 'staff001',
          userId: 'user001',
          assignedStaffRef: {
            id: 'staff001',
            name: 'Test Staff',
            role: 'Maintenance',
            skills: ['cleaning', 'attention_to_detail']
          },
          userRef: {
            userId: 'user001'
          },
          assignedAt: now.toISOString(),
          assignedBy: {
            id: 'cli-admin',
            name: 'CLI Admin'
          },
          status: 'pending',
          statusHistory: [
            {
              status: 'pending',
              timestamp: now.toISOString(),
              updatedBy: 'cli-admin',
              notes: 'Test job created via CLI'
            }
          ],
          requiredSkills: ['cleaning', 'attention_to_detail'],
          specialInstructions: 'This is a CLI test job.',
          location: {
            address: '123 Test Street, Test City',
            coordinates: {
              latitude: 7.9519,
              longitude: 98.3381
            },
            accessInstructions: 'Test villa access code: 1234',
            parkingInstructions: 'Parking available in front of villa'
          },
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
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
        const jobRef = await addDoc(collection(db, 'jobs'), testJob);
        console.log(\`Test job created with ID: \${jobRef.id}\`);

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update to assigned status
        await updateDoc(doc(db, 'jobs', jobRef.id), {
          status: 'assigned',
          assignedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          statusHistory: [
            {
              status: 'pending',
              timestamp: now.toISOString(),
              updatedBy: 'cli-admin',
              notes: 'Test job created via CLI'
            },
            {
              status: 'assigned',
              timestamp: new Date().toISOString(),
              updatedBy: 'cli-admin',
              notes: 'Test job assigned to staff'
            }
          ]
        });
        console.log(\`Job \${jobRef.id} updated to assigned status\`);

        // Create notification
        const notificationData = {
          jobId: jobRef.id,
          staffId: 'staff001',
          userId: 'user001',
          staffName: 'Test Staff',
          staffEmail: 'staff@example.com',
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
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };

        const notificationRef = await addDoc(collection(db, 'staff_notifications'), notificationData);
        console.log(\`Notification created with ID: \${notificationRef.id}\`);

        return {
          success: true,
          jobId: jobRef.id,
          notificationId: notificationRef.id
        };
      } catch (error) {
        console.error('Error creating test job:', error);
        return {
          success: false,
          error: error.message || 'Unknown error'
        };
      }
    }

    createTestJob().then((result) => {
      console.log('Result:', result);
      process.exit(0);
    }).catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  "
}

# Function to verify staff accounts
verify_staff_accounts() {
  echo "Checking staff accounts..."
  node -e "
    const { initializeApp } = require('firebase/app');
    const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

    const firebaseConfig = {
      projectId: '$PROJECT_ID',
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    async function checkStaffAccounts() {
      try {
        console.log('Checking active staff accounts with userIds...');
        const staffCollection = collection(db, 'staff_accounts');
        const staffDocs = await getDocs(query(staffCollection, where('isActive', '==', true)));

        if (staffDocs.empty) {
          console.log('No active staff accounts found!');
          return;
        }

        console.log(`Found ${staffDocs.size} active staff accounts:`);

        staffDocs.forEach(doc => {
          const staff = doc.data();
          console.log(\`\nStaff ID: \${doc.id}\`);
          console.log(\`Name: \${staff.name || 'Not specified'}\`);
          console.log(\`Email: \${staff.email || 'Not specified'}\`);
          console.log(\`User ID: \${staff.userId || 'NOT FOUND - NEEDS SETUP'}\`);
          console.log(\`Is Active: \${staff.isActive === true ? 'Yes' : 'No'}\`);
        });
      } catch (error) {
        console.error('Error checking staff accounts:', error);
      }
    }

    checkStaffAccounts().then(() => process.exit(0)).catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
  "
}

# Function to check recent jobs
check_recent_jobs() {
  echo "Checking recent jobs..."
  node -e "
    const { initializeApp } = require('firebase/app');
    const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

    const firebaseConfig = {
      projectId: '$PROJECT_ID',
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    async function checkRecentJobs() {
      try {
        console.log('Checking recent jobs...');
        const jobsCollection = collection(db, 'jobs');
        const jobsQuery = query(jobsCollection, orderBy('createdAt', 'desc'), limit(5));
        const jobDocs = await getDocs(jobsQuery);

        if (jobDocs.empty) {
          console.log('No jobs found!');
          return;
        }

        console.log(`Found ${jobDocs.size} recent jobs:`);

        jobDocs.forEach(doc => {
          const job = doc.data();
          console.log(\`\nJob ID: \${doc.id}\`);
          console.log(\`Title: \${job.title || 'Not specified'}\`);
          console.log(\`Status: \${job.status || 'Not specified'}\`);
          console.log(\`Assigned Staff ID: \${job.assignedStaffId || 'Not assigned'}\`);
          console.log(\`User ID: \${job.userId || 'Not specified'}\`);
          console.log(\`Created At: \${job.createdAt || 'Not specified'}\`);
        });
      } catch (error) {
        console.error('Error checking recent jobs:', error);
      }
    }

    checkRecentJobs().then(() => process.exit(0)).catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
  "
}

# Function to check notifications
check_notifications() {
  echo "Checking recent notifications..."
  node -e "
    const { initializeApp } = require('firebase/app');
    const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

    const firebaseConfig = {
      projectId: '$PROJECT_ID',
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    async function checkNotifications() {
      try {
        console.log('Checking recent notifications...');
        const notifCollection = collection(db, 'staff_notifications');
        const notifQuery = query(notifCollection, orderBy('createdAt', 'desc'), limit(5));
        const notifDocs = await getDocs(notifQuery);

        if (notifDocs.empty) {
          console.log('No notifications found!');
          return;
        }

        console.log(`Found ${notifDocs.size} recent notifications:`);

        notifDocs.forEach(doc => {
          const notif = doc.data();
          console.log(\`\nNotification ID: \${doc.id}\`);
          console.log(\`Type: \${notif.type || 'Not specified'}\`);
          console.log(\`Job ID: \${notif.jobId || 'Not specified'}\`);
          console.log(\`Staff ID: \${notif.staffId || 'Not specified'}\`);
          console.log(\`User ID: \${notif.userId || 'Not specified'}\`);
          console.log(\`Status: \${notif.status || 'Not specified'}\`);
          console.log(\`Created At: \${notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toISOString() : 'Not specified'}\`);
        });
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    }

    checkNotifications().then(() => process.exit(0)).catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
  "
}

# Main menu
echo "Firebase CLI Helper"
echo "==================="
echo "1. Check staff accounts"
echo "2. Check recent jobs"
echo "3. Check recent notifications"
echo "4. Create a test job"
echo "5. Run all checks"
echo "6. Exit"
echo

read -p "Select an option (1-6): " choice

case $choice in
  1)
    verify_staff_accounts
    ;;
  2)
    check_recent_jobs
    ;;
  3)
    check_notifications
    ;;
  4)
    create_test_job
    ;;
  5)
    verify_staff_accounts
    check_recent_jobs
    check_notifications
    ;;
  6)
    echo "Exiting..."
    exit 0
    ;;
  *)
    echo "Invalid option, exiting..."
    exit 1
    ;;
esac
