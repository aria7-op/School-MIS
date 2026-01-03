#!/usr/bin/env node

console.log('🚨 Starting Emergency Mode School Management System...');

// Emergency mode - absolute minimum
process.env.UV_THREADPOOL_SIZE = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=32';
process.env.ULTRA_MINIMAL = 'true';
process.env.DISABLE_AI = 'true';
process.env.DISABLE_REDIS = 'true';
process.env.DISABLE_WEBSOCKET = 'true';
process.env.DISABLE_FILE_UPLOAD = 'true';
process.env.DISABLE_EMAIL = 'true';
process.env.DISABLE_PAYMENT = 'true';

console.log('📦 Loading emergency bundle...');
console.log('💾 Memory limit: 32MB');
console.log('🧵 Thread pool: 1');

try {
  require('./bundle.js');
} catch (error) {
  console.error('❌ Emergency start failed:', error.message);
  process.exit(1);
}