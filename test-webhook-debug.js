#!/usr/bin/env node

/**
 * Debug script to test webhook functionality
 */

const WEBHOOK_URL = 'https://hook.eu2.make.com/w2yvka9ab0x4jl58bfdjotra1ehozrqf';

async function testWebhook() {
  console.log('🔍 Testing webhook:', WEBHOOK_URL);
  
  const testPayload = {
    // User Information
    name: 'Test User',
    email: 'test@example.com',
    role: 'client',
    userId: 'test-123',
    
    // Account Details
    account_type: 'standard',
    subscription_plan: 'free',
    marketing_consent: true,
    
    // Technical Details
    signup_method: 'web_form',
    device_type: 'desktop',
    browser: 'Chrome',
    user_agent: 'Mozilla/5.0 (Test)',
    
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
    utm_source: 'test',
    utm_medium: 'debug',
    utm_campaign: 'webhook_test',
    
    // System metadata
    submission_type: 'user_signup',
    timestamp: new Date().toISOString(),
    environment: 'development'
  };

  try {
    console.log('📦 Sending payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SiaMoon-PropertyManagement/1.0 (Debug)'
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      return;
    }

    const responseText = await response.text();
    console.log('✅ Response text:', responseText);
    
    console.log('✅ Webhook test completed successfully!');
    
  } catch (error) {
    console.error('❌ Webhook test failed:', error);
  }
}

testWebhook();
