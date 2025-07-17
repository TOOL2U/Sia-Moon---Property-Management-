#!/usr/bin/env node

// Set up global polyfills before any other code runs
if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis;
  }
}

if (typeof global !== 'undefined') {
  if (typeof global.self === 'undefined') {
    global.self = global;
  }
}

// Now run the Next.js build
const { spawn } = require('child_process');

const build = spawn('npx', ['next', 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--require ./scripts/polyfill-setup.js'
  }
});

build.on('close', (code) => {
  process.exit(code);
});
