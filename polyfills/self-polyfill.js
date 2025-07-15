// Polyfill for 'self' in server-side environment
if (typeof self === 'undefined') {
  global.self = global;
}
