#!/usr/bin/env node
/**
 * Cleanup Orphaned Calendar Events
 * Remove calendar events that reference non-existent jobs
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch, doc } = require('firebase/firestore');

// Firebase config - should use environment variables in production
const firebaseConfig = {
  apiKey: "[REDACTED - Use environment variable]",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "29070417393",
  appId: "1:29070417393:web:c86616ad2e4b7862b1b7e8"
};

async function cleanupOrphanedCalendarEvents() {
  console.log('🧹 Starting cleanup of orphaned calendar events...\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Get all active jobs
    console.log('📋 Loading active jobs...');
    const jobsRef = collection(db, 'jobs');
    const jobsSnapshot = await getDocs(jobsRef);

    const activeJobIds = new Set();
    jobsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Only keep jobs that are not completed/cancelled
      if (data.status && !['completed', 'cancelled', 'verified'].includes(data.status)) {
        activeJobIds.add(doc.id);
      }
    });

    console.log(`Found ${activeJobIds.size} active jobs\n`);

    // Get all calendar events
    console.log('📅 Loading calendar events...');
    const eventsRef = collection(db, 'calendarEvents');
    const eventsSnapshot = await getDocs(eventsRef);

    console.log(`Found ${eventsSnapshot.size} calendar events\n`);

    // Find orphaned events
    const orphanedEvents = [];
    eventsSnapshot.forEach((doc) => {
      const data = doc.data();

      // Check if this event references a job that no longer exists or is completed
      if (data.sourceType === 'job' && data.sourceId) {
        if (!activeJobIds.has(data.sourceId)) {
          orphanedEvents.push({
            id: doc.id,
            title: data.title,
            jobId: data.sourceId,
            status: data.status
          });
        }
      } else if (data.jobId) {
        // Legacy events that use jobId instead of sourceId
        if (!activeJobIds.has(data.jobId)) {
          orphanedEvents.push({
            id: doc.id,
            title: data.title,
            jobId: data.jobId,
            status: data.status
          });
        }
      }
    });

    console.log(`📊 Analysis:`);
    console.log(`  Active jobs: ${activeJobIds.size}`);
    console.log(`  Total calendar events: ${eventsSnapshot.size}`);
    console.log(`  Orphaned events: ${orphanedEvents.length}\n`);

    if (orphanedEvents.length === 0) {
      console.log('✅ No orphaned events found. Calendar is clean!');
      return;
    }

    // Show orphaned events
    console.log('🗑️  Orphaned events to be removed:');
    orphanedEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.title} (Job: ${event.jobId}, Status: ${event.status})`);
    });

    console.log('\n🔄 Removing orphaned events...');

    // Remove orphaned events in batches
    const batch = writeBatch(db);
    let batchCount = 0;

    for (const event of orphanedEvents) {
      batch.delete(doc(db, 'calendarEvents', event.id));
      batchCount++;

      // Firestore batch limit is 500, so commit in smaller batches
      if (batchCount >= 400) {
        await batch.commit();
        console.log(`✅ Committed batch of ${batchCount} deletions`);
        batchCount = 0;
      }
    }

    // Commit remaining deletions
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} deletions`);
    }

    console.log(`\n✅ Cleanup complete! Removed ${orphanedEvents.length} orphaned calendar events.`);
    console.log('📅 Calendar should now show only active jobs.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

cleanupOrphanedCalendarEvents();
