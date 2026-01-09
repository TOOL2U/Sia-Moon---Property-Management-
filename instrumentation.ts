/**
 * Next.js Instrumentation File
 * This file runs before any other code in the application
 * Perfect for setting up global polyfills
 */

// Polyfill for 'self' in server-side environment
if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis as any
  }
}

if (typeof global !== 'undefined') {
  if (typeof (global as any).self === 'undefined') {
    ;(global as any).self = global
  }
}

// Export register function for Next.js instrumentation
export async function register() {
  // Server-side polyfills
  if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis as any
  }
  
  if (typeof global !== 'undefined' && typeof (global as any).self === 'undefined') {
    ;(global as any).self = global
  }
  
  console.log('✅ Instrumentation: Global polyfills loaded')
}

