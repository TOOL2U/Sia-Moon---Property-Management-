// Global polyfills that need to run before any other code

// Common DOM element polyfill
const createDOMElement = () => ({
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
  appendChild: () => {},
  removeChild: () => {},
  insertBefore: () => {},
  style: {},
  classList: {
    add: () => {},
    remove: () => {},
    contains: () => false,
    toggle: () => false,
  },
})

// Common document polyfill
const createDocumentPolyfill = () => ({
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  getElementsByClassName: () => [],
  getElementsByTagName: () => [],
  createElement: createDOMElement,
  createTextNode: () => ({}),
  body: createDOMElement(),
  head: createDOMElement(),
  documentElement: createDOMElement(),
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})

// Common window polyfill
const createWindowPolyfill = () => ({
  location: {
    href: '',
    origin: '',
    protocol: 'https:',
    hostname: 'localhost',
    pathname: '/',
    search: '',
    hash: '',
  },
  document: createDocumentPolyfill(),
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
  requestAnimationFrame: (callback: FrameRequestCallback) => {
    return setTimeout(callback, 16)
  },
  cancelAnimationFrame: (id: number) => {
    clearTimeout(id)
  },
})

// Comprehensive polyfill for 'self' in server-side environment
if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis as any
  }
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = createWindowPolyfill() as any
  }
  if (typeof globalThis.document === 'undefined') {
    globalThis.document = createDocumentPolyfill() as any
  }
}

if (typeof global !== 'undefined') {
  if (typeof (global as any).self === 'undefined') {
    ;(global as any).self = global
  }
  if (typeof (global as any).window === 'undefined') {
    ;(global as any).window = createWindowPolyfill()
  }
  if (typeof (global as any).document === 'undefined') {
    ;(global as any).document = createDocumentPolyfill()
  }
}

// Legacy check for older environments
if (typeof self === 'undefined' && typeof global !== 'undefined') {
  ;(global as any).self = global
}

// Ensure webpackChunk is available on the global object
if (typeof self !== 'undefined' && !(self as any).webpackChunk_N_E) {
  ;(self as any).webpackChunk_N_E = []
}

if (typeof global !== 'undefined' && !(global as any).webpackChunk_N_E) {
  ;(global as any).webpackChunk_N_E = []
}

if (
  typeof globalThis !== 'undefined' &&
  !(globalThis as any).webpackChunk_N_E
) {
  ;(globalThis as any).webpackChunk_N_E = []
}
