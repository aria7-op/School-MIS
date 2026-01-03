#!/usr/bin/env node

console.log('🚀 Starting Ultra-Minimal School Management System...');

// Extreme memory optimization for 700KB RAM
process.env.UV_THREADPOOL_SIZE = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=64';
process.env.ULTRA_MINIMAL = 'true';
process.env.DISABLE_AI = 'true';
process.env.DISABLE_REDIS = 'true';

// Disable heavy features
process.env.DISABLE_WEBSOCKET = 'false'; // Keep WebSocket for messaging
process.env.DISABLE_FILE_UPLOAD = 'true';
process.env.DISABLE_EMAIL = 'true';
process.env.DISABLE_PAYMENT = 'true';

console.log('📦 Loading ultra-minimal bundle...');
console.log('💾 Memory limit: 64MB');
console.log('🧵 Thread pool: 1');

try {
  require('./bundle.js');
} catch (error) {
  console.error('❌ Failed to start:', error.message);
  process.exit(1);
}