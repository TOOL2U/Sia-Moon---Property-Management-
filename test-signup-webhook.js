#!/usr/bin/env node

/**
 * Test script to simulate the exact signup webhook call from SignUpForm.tsx
 */

const WEBHOOK_URL = 'https://hook.eu2.make.com/w2yvka9ab0x4jl58bfdjotra1ehozrqf';

async function testSignupWebhook() {
  console.log('🔍 Testing EXACT signup webhook payload...');
  console.log('📡 Webhook URL:', WEBHOOK_URL);
  
  // This is the exact payload structure sent by WebhookService.sendSignupConfirmation
  const signupPayload = {
    // User Information
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: undefined, // Often undefined in signup
    role: 'client',
    userId: 'firebase-user-123',

    // Account Details
    account_type: 'standard',
    subscription_plan: 'free',
    referral_source: undefined,
    marketing_consent: true,

    // Business Information (may be undefined)
    company_name: undefined,
    business_type: undefined,
    property_count: undefined,
    experience_level: undefined,
    primary_goals: [],

    // Technical Details
    signup_method: 'web_form',
    device_type: 'desktop',
    browser: 'Chrome',
    ip_address: undefined,
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',

    // Timestamps
    signup_date: new Date().toISOString(),
    email_verified: false,
    profile_completed: false,

    // Preferences
    communication_preferences: ['email'],
    timezone: 'America/New_York',
    language: 'en',

    // Metadata
    source: 'sia_moon_webapp',
    campaign_id: undefined,
    utm_source: 'direct',
    utm_medium: 'website',
    utm_campaign: 'signup_form',

    // System metadata
    submission_type: 'user_signup',
    timestamp: new Date().toISOString(),
    environment: 'development'
  };

  try {
    console.log('📦 Sending signup payload...');
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SiaMoon-PropertyManagement/1.0'
      },
      body: JSON.stringify(signupPayload)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      return false;
    }

    const responseText = await response.text();
    console.log('✅ Response text:', responseText);
    
    console.log('✅ Signup webhook test completed successfully!');
    console.log('');
    console.log('🔍 What to check in Make.com:');
    console.log('1. Go to your Make.com scenario');
    console.log('2. Check the execution history');
    console.log('3. Look for a new execution that just happened');
    console.log('4. Check if the Gmail module executed');
    console.log('5. If Gmail module failed, check the error details');
    console.log('');
    console.log('💡 Common issues:');
    console.log('- Gmail account not properly connected');
    console.log('- Gmail quotas exceeded');
    console.log('- Email template has syntax errors');
    console.log('- Scenario is turned OFF');
    console.log('- Email filters or conditions not met');
    
    return true;
    
  } catch (error) {
    console.error('❌ Signup webhook test failed:', error);
    return false;
  }
}

testSignupWebhook();
