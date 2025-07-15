// Global polyfills for server-side compatibility

// Polyfill for 'self' in server-side environment
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).self === 'undefined') {
  (globalThis as any).self = globalThis;
}

// Polyfill for Node.js environment
if (typeof global !== 'undefined' && typeof (global as any).self === 'undefined') {
  (global as any).self = global;
}
