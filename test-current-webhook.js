#!/usr/bin/env node

/**
 * Test the ACTUAL webhook URL from environment
 */

require('dotenv').config({ path: '.env.local' });

const WEBHOOK_URL = process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL;

async function testCurrentWebhook() {
  console.log('🚀 Testing current webhook URL from environment...');
  console.log('📍 Webhook URL:', WEBHOOK_URL);

  if (!WEBHOOK_URL) {
    console.error('❌ NEXT_PUBLIC_SIGNUP_WEBHOOK_URL not found in .env.local!');
    return false;
  }

  const testData = {
    name: 'Environment Test User',
    email: 'envtest@example.com',
    userId: 'env-test-' + Date.now(),
    signup_date: new Date().toISOString(),
    submission_type: 'user_signup',
    environment: 'development',
    source: 'environment_test'
  };

  try {
    console.log('📦 Sending test payload...');

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SiaMoon-PropertyManagement/1.0'
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log('✅ Webhook response:', responseText);
      console.log('✅ SUCCESS: Your webhook URL is working correctly!');
      return true;
    } else {
      console.error('❌ Webhook failed with status:', response.status);
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return false;
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    return false;
  }
}

testCurrentWebhook()
  .then(success => {
    if (success) {
      console.log('\n🎉 Your webhook configuration is correct!');
      console.log('📧 The signup form should be sending webhooks to Make.com.');
    } else {
      console.log('\n💥 Webhook test failed!');
      console.log('🔧 Check your Make.com scenario and webhook URL.');
    }
  });
