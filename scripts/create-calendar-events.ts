import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';

async function createCalendarEventsFromExistingBookings() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  }

  const db = getFirestore();
  
  console.log('\n📅 CREATING CALENDAR EVENTS FROM EXISTING BOOKINGS...\n');
  
  // Get all bookings
  const bookingsSnapshot = await db.collection('bookings').get();
  console.log(`Found ${bookingsSnapshot.size} bookings`);
  
  let eventsCreated = 0;
  
  for (const bookingDoc of bookingsSnapshot.docs) {
    const booking = bookingDoc.data();
    console.log(`\n📋 Processing booking: ${bookingDoc.id}`);
    console.log(`   Guest: ${booking.guestName}`);
    console.log(`   Property: ${booking.propertyName}`);
    
    // 1. Create check-in calendar event
    const checkInEvent = {
      title: `Check-in: ${booking.guestName}`,
      description: `Guest arrival at ${booking.propertyName}`,
      start: booking.checkInDate,
      end: Timestamp.fromDate(new Date(booking.checkInDate.toDate().getTime() + 2 * 60 * 60 * 1000)), // +2 hours
      type: 'check-in',
      bookingId: bookingDoc.id,
      propertyId: booking.propertyId,
      propertyName: booking.propertyName,
      guestName: booking.guestName,
      status: 'confirmed',
      color: '#10b981', // green
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    await db.collection('calendar_events').add(checkInEvent);
    console.log(`   ✅ Created check-in event`);
    eventsCreated++;
    
    // 2. Create check-out calendar event
    const checkOutEvent = {
      title: `Check-out: ${booking.guestName}`,
      description: `Guest departure from ${booking.propertyName}`,
      start: booking.checkOutDate,
      end: Timestamp.fromDate(new Date(booking.checkOutDate.toDate().getTime() + 2 * 60 * 60 * 1000)), // +2 hours
      type: 'check-out',
      bookingId: bookingDoc.id,
      propertyId: booking.propertyId,
      propertyName: booking.propertyName,
      guestName: booking.guestName,
      status: 'confirmed',
      color: '#ef4444', // red
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    await db.collection('calendar_events').add(checkOutEvent);
    console.log(`   ✅ Created check-out event`);
    eventsCreated++;
    
    // 3. Create calendar events for associated jobs
    if (booking.createdJobIds && booking.createdJobIds.length > 0) {
      console.log(`   Found ${booking.createdJobIds.length} associated jobs`);
      
      for (const jobId of booking.createdJobIds) {
        const jobDoc = await db.collection('jobs').doc(jobId).get();
        
        if (jobDoc.exists) {
          const job = jobDoc.data()!;
          
          const jobEvent = {
            title: job.title,
            description: job.description || `${job.jobType} - ${booking.propertyName}`,
            start: job.scheduledDate || job.dueDate,
            end: job.scheduledEndDate || Timestamp.fromDate(new Date((job.scheduledDate || job.dueDate).toDate().getTime() + 4 * 60 * 60 * 1000)), // +4 hours
            type: 'job',
            jobType: job.jobType,
            jobId: jobId,
            bookingId: bookingDoc.id,
            propertyId: booking.propertyId,
            propertyName: booking.propertyName,
            assignedStaff: job.assignedStaffName || 'Unassigned',
            assignedStaffId: job.assignedTo || null,
            status: job.status,
            color: job.status === 'completed' ? '#10b981' : 
                   job.status === 'assigned' ? '#3b82f6' : 
                   job.status === 'in_progress' ? '#8b5cf6' : '#fbbf24',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };
          
          await db.collection('calendar_events').add(jobEvent);
          console.log(`   ✅ Created job event: ${job.title}`);
          eventsCreated++;
        }
      }
    }
  }
  
  console.log(`\n✅ MIGRATION COMPLETE!`);
  console.log(`   Total calendar events created: ${eventsCreated}`);
  console.log(`   Breakdown:`);
  console.log(`     - Check-in events: ${bookingsSnapshot.size}`);
  console.log(`     - Check-out events: ${bookingsSnapshot.size}`);
  console.log(`     - Job events: ${eventsCreated - (bookingsSnapshot.size * 2)}`);
  
  // Verify calendar_events collection
  const calendarSnapshot = await db.collection('calendar_events').get();
  console.log(`\n📊 Calendar events now in database: ${calendarSnapshot.size}`);
}

createCalendarEventsFromExistingBookings();
