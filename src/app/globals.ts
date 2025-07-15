// Global polyfills that need to run before any other code

// Polyfill for 'self' in server-side environment
if (typeof self === 'undefined') {
  (global as any).self = global;
}

// Ensure webpackChunk is available on the global object
if (typeof self !== 'undefined' && !(self as any).webpackChunk_N_E) {
  (self as any).webpackChunk_N_E = [];
}

if (typeof global !== 'undefined' && !(global as any).webpackChunk_N_E) {
  (global as any).webpackChunk_N_E = [];
}
