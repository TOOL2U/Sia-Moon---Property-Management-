// Environment configuration with proper type safety and validation

// Node environment
export const NODE_ENV = process.env.NODE_ENV || 'development'
export const isProduction = NODE_ENV === 'production'
export const isDevelopment = NODE_ENV === 'development'

// Development bypass flags
export const isDevelopmentBypass = isDevelopment && process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true'
export const isDevelopmentSessionBypass = isDevelopment && process.env.NEXT_PUBLIC_SESSION_BYPASS === 'true'

// Firebase configuration
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validate Firebase configuration
export const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ]
  
  const missing = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])
  
  if (missing.length > 0) {
    console.error('❌ Missing Firebase configuration:', missing)
    return false
  }
  
  return true
}

// OpenAI configuration
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY
export const openaiConfig = {
  apiKey: OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION,
}

// SMTP configuration
export const SMTP_HOST = process.env.SMTP_HOST
export const SMTP_PORT = process.env.SMTP_PORT
export const SMTP_USER = process.env.SMTP_USER
export const SMTP_PASS = process.env.SMTP_PASS

// Cloudinary configuration
export const NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

export const cloudinaryConfig = {
  cloudName: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  apiKey: CLOUDINARY_API_KEY,
  apiSecret: CLOUDINARY_API_SECRET,
}

// Application URLs
export const appConfig = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
}

// Feature flags
export const featureFlags = {
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableDebugMode: isDevelopment || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  enableMockData: isDevelopment && process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true',
}

// Logging configuration
export const logConfig = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  enableConsole: isDevelopment || process.env.ENABLE_CONSOLE_LOGS === 'true',
  enableRemote: isProduction && process.env.ENABLE_REMOTE_LOGS === 'true',
}

// Export environment info for debugging
export const envInfo = {
  NODE_ENV,
  isProduction,
  isDevelopment,
  isDevelopmentBypass,
  isDevelopmentSessionBypass,
  hasFirebaseConfig: validateFirebaseConfig(),
  hasOpenAIConfig: !!openaiConfig.apiKey,
  hasCloudinaryConfig: !!cloudinaryConfig.cloudName,
  baseUrl: appConfig.baseUrl,
  timestamp: new Date().toISOString(),
}

// Log environment info in development
if (isDevelopment) {
  console.log('🔧 Environment Configuration:', envInfo)
}
