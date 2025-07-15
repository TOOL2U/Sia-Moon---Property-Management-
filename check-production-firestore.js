// This script requires authentication with a service account key for production
// For now, let's try using the Firebase CLI to query production Firestore

const { spawn } = require('child_process');

async function checkProductionFirestore() {
  console.log('Checking production Firestore for staff_accounts collection...');
  
  try {
    // Try to get documents from staff_accounts collection using Firebase CLI
    const firestore = spawn('firebase', [
      'firestore:delete',
      '--dry-run',
      'staff_accounts/dummy',
      '--project=operty-b54dc'
    ]);

    let output = '';
    let errorOutput = '';

    firestore.stdout.on('data', (data) => {
      output += data.toString();
    });

    firestore.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    firestore.on('close', (code) => {
      console.log('Firebase CLI output:', output);
      if (errorOutput) {
        console.log('Error output:', errorOutput);
      }
      
      if (output.includes('Permission denied') || errorOutput.includes('Permission denied')) {
        console.log('❌ Access denied - check Firestore security rules');
      } else if (output.includes('Missing or insufficient permissions')) {
        console.log('❌ Insufficient permissions to access Firestore');
      } else {
        console.log('Command completed with exit code:', code);
      }
    });

  } catch (error) {
    console.error('Error running Firebase CLI:', error);
  }
}

checkProductionFirestore();
