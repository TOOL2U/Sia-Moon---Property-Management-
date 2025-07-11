const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkLatestBooking() {
  console.log('🔍 CHECKING FOR LATEST BOOKING DATA');
  console.log('='.repeat(50));
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Get the most recent bookings
    console.log('\n📋 Fetching latest bookings from live_bookings collection...');
    const bookingsRef = collection(db, 'live_bookings');
    const bookingsQuery = query(bookingsRef, orderBy('receivedAt', 'desc'), limit(3));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    const recentBookings = [];
    bookingsSnapshot.forEach((doc) => {
      const data = doc.data();
      recentBookings.push({
        id: doc.id,
        villaName: data.villaName,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        price: data.price,
        clientId: data.clientId,
        matchConfidence: data.matchConfidence,
        bookingSource: data.bookingSource,
        receivedAt: data.receivedAt?.toDate?.() || data.receivedAt,
        processedAt: data.processedAt?.toDate?.() || data.processedAt,
        originalPayload: data.originalPayload
      });
    });
    
    console.log(`✅ Found ${recentBookings.length} recent bookings`);
    
    if (recentBookings.length === 0) {
      console.log('❌ No bookings found in database');
      return;
    }
    
    // Show the most recent booking in detail
    const latest = recentBookings[0];
    console.log('\n🏠 MOST RECENT BOOKING:');
    console.log('='.repeat(30));
    console.log(`📋 Booking ID: ${latest.id}`);
    console.log(`🏠 Villa Name: "${latest.villaName}"`);
    console.log(`👤 Guest: ${latest.guestName}`);
    console.log(`📧 Email: ${latest.guestEmail || 'N/A'}`);
    console.log(`📅 Check-in: ${latest.checkInDate}`);
    console.log(`📅 Check-out: ${latest.checkOutDate}`);
    console.log(`💰 Price: ${latest.price}`);
    console.log(`🎯 Client ID: ${latest.clientId || 'NULL - NO MATCH!'}`);
    console.log(`📊 Match Confidence: ${latest.matchConfidence || 0}`);
    console.log(`📡 Source: ${latest.bookingSource}`);
    console.log(`⏰ Received: ${latest.receivedAt}`);
    console.log(`⚙️ Processed: ${latest.processedAt}`);
    
    // Check if this is a Donkey House booking
    if (latest.villaName && latest.villaName.toLowerCase().includes('donkey')) {
      console.log('\n🎉 DONKEY HOUSE BOOKING DETECTED!');
      if (latest.clientId) {
        console.log('✅ CLIENT MATCHING SUCCESSFUL!');
        console.log(`✅ Linked to client: ${latest.clientId}`);
      } else {
        console.log('❌ CLIENT MATCHING FAILED!');
        console.log('❌ No clientId assigned');
      }
    }
    
    // Show original payload if available
    if (latest.originalPayload) {
      console.log('\n📦 ORIGINAL PAYLOAD FROM MAKE.COM:');
      console.log('-'.repeat(40));
      console.log(JSON.stringify(latest.originalPayload, null, 2));
    }
    
    // Show all recent bookings summary
    console.log('\n📋 ALL RECENT BOOKINGS SUMMARY:');
    console.log('-'.repeat(40));
    recentBookings.forEach((booking, index) => {
      const timeAgo = booking.receivedAt ? 
        Math.round((new Date() - new Date(booking.receivedAt)) / (1000 * 60)) : 'Unknown';
      
      console.log(`${index + 1}. "${booking.villaName}" - ${booking.guestName}`);
      console.log(`   Client: ${booking.clientId || 'NO MATCH'} | ${timeAgo} min ago`);
      console.log('');
    });
    
    // Check for very recent bookings (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const veryRecentBookings = recentBookings.filter(b => 
      b.receivedAt && new Date(b.receivedAt) > fiveMinutesAgo
    );
    
    if (veryRecentBookings.length > 0) {
      console.log(`🚨 FOUND ${veryRecentBookings.length} BOOKING(S) FROM LAST 5 MINUTES!`);
      veryRecentBookings.forEach((booking, index) => {
        console.log(`${index + 1}. ${booking.villaName} - ${booking.guestName} (${booking.clientId ? 'MATCHED' : 'NO MATCH'})`);
      });
    } else {
      console.log('⏰ No bookings received in the last 5 minutes');
    }
    
  } catch (error) {
    console.error('❌ Error checking latest booking:', error);
  }
}

// Run the check
checkLatestBooking().then(() => {
  console.log('\n🔍 Latest booking check complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});
