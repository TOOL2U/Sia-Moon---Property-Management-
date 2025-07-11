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

async function checkTestLogs() {
  console.log('🔍 CHECKING BOOKING TEST LOGS FOR RECENT ACTIVITY');
  console.log('='.repeat(60));
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Check booking test logs
    console.log('\n📋 Fetching latest test logs...');
    const logsRef = collection(db, 'booking_test_logs');
    const logsQuery = query(logsRef, orderBy('receivedAt', 'desc'), limit(5));
    const logsSnapshot = await getDocs(logsQuery);
    
    const recentLogs = [];
    logsSnapshot.forEach((doc) => {
      const data = doc.data();
      recentLogs.push({
        id: doc.id,
        payload: data.payload,
        extractedInfo: data.extractedInfo,
        clientMatch: data.clientMatch,
        dataFlowResult: data.dataFlowResult,
        receivedAt: data.receivedAt?.toDate?.() || data.receivedAt,
        source: data.source,
        type: data.type,
        version: data.version
      });
    });
    
    console.log(`✅ Found ${recentLogs.length} recent test logs`);
    
    if (recentLogs.length === 0) {
      console.log('❌ No test logs found');
      return;
    }
    
    // Show recent activity
    console.log('\n📋 RECENT API ACTIVITY:');
    console.log('-'.repeat(40));
    recentLogs.forEach((log, index) => {
      const timeAgo = log.receivedAt ? 
        Math.round((new Date() - new Date(log.receivedAt)) / (1000 * 60)) : 'Unknown';
      
      const villaName = log.extractedInfo?.villaName || log.payload?.property || 'Unknown';
      const guestName = log.extractedInfo?.guestName || log.payload?.guestName || 'Unknown';
      
      console.log(`${index + 1}. ${villaName} - ${guestName}`);
      console.log(`   Source: ${log.source} | Type: ${log.type} | ${timeAgo} min ago`);
      
      if (log.clientMatch) {
        console.log(`   ✅ Client Match: ${log.clientMatch.clientId} (${log.clientMatch.confidence})`);
      } else {
        console.log(`   ❌ No client match`);
      }
      
      if (log.dataFlowResult) {
        console.log(`   📊 Data Flow: ${log.dataFlowResult.success ? 'SUCCESS' : 'FAILED'}`);
        if (log.dataFlowResult.bookingId) {
          console.log(`   🆔 Booking ID: ${log.dataFlowResult.bookingId}`);
        }
      }
      console.log('');
    });
    
    // Check for very recent activity (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const veryRecentLogs = recentLogs.filter(l => 
      l.receivedAt && new Date(l.receivedAt) > tenMinutesAgo
    );
    
    if (veryRecentLogs.length > 0) {
      console.log(`🚨 FOUND ${veryRecentLogs.length} API CALL(S) FROM LAST 10 MINUTES!`);
      veryRecentLogs.forEach((log, index) => {
        const villaName = log.extractedInfo?.villaName || log.payload?.property || 'Unknown';
        const success = log.dataFlowResult?.success ? 'SUCCESS' : 'FAILED';
        console.log(`${index + 1}. ${villaName} - ${success}`);
      });
      
      // Show the most recent in detail
      const latest = veryRecentLogs[0];
      console.log('\n🔍 MOST RECENT API CALL DETAILS:');
      console.log('='.repeat(40));
      console.log('Payload received:');
      console.log(JSON.stringify(latest.payload, null, 2));
      
      if (latest.extractedInfo) {
        console.log('\nExtracted info:');
        console.log(JSON.stringify(latest.extractedInfo, null, 2));
      }
      
      if (latest.clientMatch) {
        console.log('\nClient match result:');
        console.log(JSON.stringify(latest.clientMatch, null, 2));
      }
      
    } else {
      console.log('⏰ No API calls received in the last 10 minutes');
      console.log('💡 If you just sent the email, it might take a few minutes to process');
    }
    
  } catch (error) {
    console.error('❌ Error checking test logs:', error);
  }
}

// Run the check
checkTestLogs().then(() => {
  console.log('\n🔍 Test logs check complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});
