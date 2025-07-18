// Server-side polyfill for self
if (typeof self === 'undefined') {
  global.self = global;
}
