#!/usr/bin/env node

/**
 * Environment variable debug script
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('🔍 Environment Variables Debug:');
console.log('================================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_SIGNUP_WEBHOOK_URL:', process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL);
console.log('NEXT_PUBLIC_MAKE_WEBHOOK_URL:', process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL);
console.log('');

// Simulate what the webhook service would do
const SIGNUP_WEBHOOK_URL = process.env.NEXT_PUBLIC_SIGNUP_WEBHOOK_URL || 'https://hook.eu2.make.com/w2yvka9ab0x4jl58bfdjotra1ehozrqf';
const ONBOARDING_WEBHOOK_URL = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL || 'https://hook.eu2.make.com/b59iga7bj65atyrgo5ej9dwvlujdsupa';

console.log('📌 URLs being used by WebhookService:');
console.log('SIGNUP_WEBHOOK_URL (for new user signups):', SIGNUP_WEBHOOK_URL);
console.log('ONBOARDING_WEBHOOK_URL (for onboarding surveys):', ONBOARDING_WEBHOOK_URL);
console.log('');

console.log('🎯 Your target webhook URL:', 'https://hook.eu2.make.com/w2yvka9ab0x4jl58bfdjotra1ehozrqf');
console.log('❓ Does it match SIGNUP_WEBHOOK_URL?', SIGNUP_WEBHOOK_URL === 'https://hook.eu2.make.com/w2yvka9ab0x4jl58bfdjotra1ehozrqf');
