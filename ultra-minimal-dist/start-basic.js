#!/usr/bin/env node

console.log('🚀 Starting Basic School Management System...');

// Basic mode - moderate optimization
process.env.UV_THREADPOOL_SIZE = '2';
process.env.NODE_OPTIONS = '--max-old-space-size=128';
process.env.ULTRA_MINIMAL = 'true';
process.env.DISABLE_AI = 'true';
process.env.DISABLE_REDIS = 'true';

console.log('📦 Loading basic bundle...');
console.log('💾 Memory limit: 128MB');
console.log('🧵 Thread pool: 2');

try {
  require('./bundle.js');
} catch (error) {
  console.error('❌ Basic start failed:', error.message);
  process.exit(1);
}