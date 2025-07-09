// lib/env.ts

import { z } from "zod";

// Define the schema for environment variables with more flexible validation
const envSchema = z.object({
  // Core Next.js environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Authentication and bypass settings
  NEXT_PUBLIC_BYPASS_AUTH: z.string().optional().transform(val => val === "true"),
  NEXT_PUBLIC_DEV_SESSION_BYPASS: z.string().optional().transform(val => val === "true"),
  NEXT_PUBLIC_VERCEL_ENV: z.string().optional(),

  // Supabase configuration - more flexible URL validation
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().refine(
    (val) => !val || val.startsWith('http') || val.includes('supabase'),
    { message: "Invalid Supabase URL format" }
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Application configuration - more flexible URL validation
  NEXT_PUBLIC_APP_URL: z.string().optional().refine(
    (val) => !val || val.startsWith('http') || val === 'http://localhost:3000',
    { message: "Invalid app URL format" }
  ),

  // Cloudinary configuration
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Email configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().optional().refine(
    (val) => !val || val.includes('@'),
    { message: "Invalid email format" }
  ),
  FROM_NAME: z.string().optional(),
  ADMIN_EMAIL: z.string().optional().refine(
    (val) => !val || val.includes('@'),
    { message: "Invalid email format" }
  ),

  // Webhook configuration - more flexible URL validation
  NEXT_PUBLIC_MAKE_WEBHOOK_URL: z.string().optional().refine(
    (val) => !val || val.startsWith('http'),
    { message: "Invalid webhook URL format" }
  ),
  SYNC_API_KEY: z.string().optional(),

  // Push notifications
  NEXT_PUBLIC_ONESIGNAL_APP_ID: z.string().optional(),
  ONESIGNAL_REST_API_KEY: z.string().optional(),

  // Error logging and monitoring
  ENABLE_ERROR_LOGGING: z.string().optional().transform(val => val === "true"),
  ERROR_WEBHOOK_URL: z.string().optional().refine(
    (val) => !val || val.startsWith('http'),
    { message: "Invalid error webhook URL format" }
  ),
  ERROR_EMAIL_ENDPOINT: z.string().optional().refine(
    (val) => !val || val.startsWith('http'),
    { message: "Invalid error email endpoint URL format" }
  ),
  NEXT_PUBLIC_ERROR_WEBHOOK_URL: z.string().optional().refine(
    (val) => !val || val.startsWith('http'),
    { message: "Invalid public error webhook URL format" }
  ),

  // Feature flags
  ENABLE_BOOKING_SYNC_CRON: z.string().optional().transform(val => val === "true"),
  ENABLE_REPORT_CRON: z.string().optional().transform(val => val === "true"),
});

// Validate the environment variables with better error handling
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });

    // In development, provide helpful guidance
    if (process.env.NODE_ENV === 'development') {
      console.warn('💡 Development tip: Check your .env.local file and ensure all required variables are set');
      console.warn('💡 You can copy .env.example to .env.local and update the values');
    }

    // Use safe defaults for development
    env = envSchema.parse({
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_BYPASS_AUTH: process.env.NEXT_PUBLIC_BYPASS_AUTH || 'false',
      NEXT_PUBLIC_DEV_SESSION_BYPASS: process.env.NEXT_PUBLIC_DEV_SESSION_BYPASS || 'false',
      ...process.env
    });
  } else {
    throw error;
  }
}

// Export typed variables for clean usage across the app
export const NODE_ENV = env.NODE_ENV;
export const NEXT_PUBLIC_BYPASS_AUTH = env.NEXT_PUBLIC_BYPASS_AUTH;
export const NEXT_PUBLIC_DEV_SESSION_BYPASS = env.NEXT_PUBLIC_DEV_SESSION_BYPASS;
export const NEXT_PUBLIC_VERCEL_ENV = env.NEXT_PUBLIC_VERCEL_ENV;

// Supabase
export const NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Application
export const NEXT_PUBLIC_APP_URL = env.NEXT_PUBLIC_APP_URL;

// Cloudinary
export const NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = env.CLOUDINARY_API_SECRET;

// Email
export const SMTP_HOST = env.SMTP_HOST;
export const SMTP_PORT = env.SMTP_PORT;
export const SMTP_USER = env.SMTP_USER;
export const SMTP_PASS = env.SMTP_PASS;
export const FROM_EMAIL = env.FROM_EMAIL;
export const FROM_NAME = env.FROM_NAME;
export const ADMIN_EMAIL = env.ADMIN_EMAIL;

// Webhooks
export const NEXT_PUBLIC_MAKE_WEBHOOK_URL = env.NEXT_PUBLIC_MAKE_WEBHOOK_URL;
export const SYNC_API_KEY = env.SYNC_API_KEY;

// Push notifications
export const NEXT_PUBLIC_ONESIGNAL_APP_ID = env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
export const ONESIGNAL_REST_API_KEY = env.ONESIGNAL_REST_API_KEY;

// Error logging
export const ENABLE_ERROR_LOGGING = env.ENABLE_ERROR_LOGGING;
export const ERROR_WEBHOOK_URL = env.ERROR_WEBHOOK_URL;
export const ERROR_EMAIL_ENDPOINT = env.ERROR_EMAIL_ENDPOINT;
export const NEXT_PUBLIC_ERROR_WEBHOOK_URL = env.NEXT_PUBLIC_ERROR_WEBHOOK_URL;

// Feature flags
export const ENABLE_BOOKING_SYNC_CRON = env.ENABLE_BOOKING_SYNC_CRON;
export const ENABLE_REPORT_CRON = env.ENABLE_REPORT_CRON;

// Helper functions for common environment checks
export const isDevelopment = NODE_ENV === "development";
export const isProduction = NODE_ENV === "production";
export const isTest = NODE_ENV === "test";

// Development bypass checks
export const isDevelopmentBypass = isDevelopment && NEXT_PUBLIC_BYPASS_AUTH && NEXT_PUBLIC_VERCEL_ENV !== "production";
export const isDevelopmentSessionBypass = isDevelopment && NEXT_PUBLIC_DEV_SESSION_BYPASS;

// Supabase configuration check
export const isSupabaseConfigured = !!(NEXT_PUBLIC_SUPABASE_URL && NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Cloudinary configuration check
export const isCloudinaryConfigured = !!(NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

// Email configuration check
export const isEmailConfigured = !!(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

// OneSignal configuration check
export const isOneSignalConfigured = !!(NEXT_PUBLIC_ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY);
