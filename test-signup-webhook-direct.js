#!/usr/bin/env node

/**
 * Direct test of the signup webhook URL
 * This simulates what happens when a user signs up
 */

const WEBHOOK_URL = 'https://hook.eu2.make.com/w2yvka9ab0x4jl58bfdjotra1ehozrqf';

async function testSignupWebhook() {
  console.log('🚀 Testing signup webhook directly...');
  console.log('📍 Webhook URL:', WEBHOOK_URL);

  // Simulate signup data (similar to what the app sends)
  const signupData = {
    // User Information
    name: 'Test User',
    email: 'test@example.com',
    role: 'client',
    userId: 'test-user-' + Date.now(),

    // Account Details
    account_type: 'standard',
    subscription_plan: 'free',
    marketing_consent: true,

    // Technical Details
    signup_method: 'web_form',
    device_type: 'desktop',
    browser: 'Chrome',
    user_agent: 'Test User Agent',

    // Timestamps
    signup_date: new Date().toISOString(),
    email_verified: false,
    profile_completed: false,

    // Preferences
    communication_preferences: ['email'],
    timezone: 'UTC',
    language: 'en',

    // Metadata
    source: 'sia_moon_webapp',
    utm_source: 'direct',
    utm_medium: 'website',
    utm_campaign: 'signup_form',

    // System metadata
    submission_type: 'user_signup',
    timestamp: new Date().toISOString(),
    environment: 'development',

    // Email template data
    email_template: '<h1>Welcome Test</h1><p>This is a test signup email.</p>',
    email_text: 'Welcome Test - This is a test signup email.',
    email_subject: 'Welcome to Sia Moon Property Management, Test User! 🏡',
    email_from: 'welcome@siamoon.com',
    email_from_name: 'Sia Moon Team',
    email_reply_to: 'support@siamoon.com'
  };

  try {
    console.log('📦 Sending payload:', {
      name: signupData.name,
      email: signupData.email,
      userId: signupData.userId,
      payloadSize: JSON.stringify(signupData).length + ' bytes'
    });

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SiaMoon-PropertyManagement/1.0'
      },
      body: JSON.stringify(signupData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const responseText = await response.text();
      console.log('✅ Webhook response:', responseText);
      console.log('✅ SUCCESS: Signup webhook is working!');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Webhook failed with status:', response.status);
      console.error('❌ Error response:', errorText);
      return false;
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    return false;
  }
}

// Run the test
testSignupWebhook()
  .then(success => {
    if (success) {
      console.log('\n🎉 Signup webhook test completed successfully!');
      console.log('📧 Check your Make.com scenario to see if it received the data.');
    } else {
      console.log('\n💥 Signup webhook test failed!');
      console.log('🔧 Check your Make.com scenario configuration.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });
