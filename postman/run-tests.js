#!/usr/bin/env node

import {exec} from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const config = {
  collection: './Class_Management_API.postman_collection.json',
  environment: './Class_Management_API_Environment.postman_environment.json',
  resultsDir: './results',
  iterations: 1,
  delay: 100
};

// Create results directory if it doesn't exist
if (!fs.existsSync(config.resultsDir)) {
  fs.mkdirSync(config.resultsDir, { recursive: true });
}

// Newman command
const newmanCommand = `newman run "${config.collection}" \
  --environment "${config.environment}" \
  --iterations ${config.iterations} \
  --delay ${config.delay} \
  --reporters cli,json,html \
  --reporter-json-export "${config.resultsDir}/results.json" \
  --reporter-html-export "${config.resultsDir}/report.html"`;

console.log('🚀 Starting Class Management API Tests...');
console.log('📋 Collection:', config.collection);
console.log('🌍 Environment:', config.environment);
console.log('🔄 Iterations:', config.iterations);
console.log('⏱️  Delay:', config.delay + 'ms');
console.log('📊 Results Directory:', config.resultsDir);
console.log('');

// Run Newman
exec(newmanCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error running tests:', error);
    process.exit(1);
  }
  
  if (stderr) {
    console.error('⚠️  Warnings:', stderr);
  }
  
  console.log('✅ Test Results:');
  console.log(stdout);
  
  // Check if results file exists and show summary
  const resultsFile = path.join(config.resultsDir, 'results.json');
  if (fs.existsSync(resultsFile)) {
    try {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      console.log('\n📈 Test Summary:');
      console.log('Total Requests:', results.run.stats.requests.total);
      console.log('Failed Requests:', results.run.stats.requests.failed);
      console.log('Total Tests:', results.run.stats.assertions.total);
      console.log('Failed Tests:', results.run.stats.assertions.failed);
      console.log('Total Test Scripts:', results.run.stats.testScripts.total);
      console.log('Failed Test Scripts:', results.run.stats.testScripts.failed);
      console.log('Total Prerequest Scripts:', results.run.stats.prerequestScripts.total);
      console.log('Failed Prerequest Scripts:', results.run.stats.prerequestScripts.failed);
      console.log('Total Assertions:', results.run.stats.assertions.total);
      console.log('Failed Assertions:', results.run.stats.assertions.failed);
      console.log('Total Response Time:', results.run.stats.responseTimes.total + 'ms');
      console.log('Average Response Time:', results.run.stats.responseTimes.average + 'ms');
      console.log('Min Response Time:', results.run.stats.responseTimes.min + 'ms');
      console.log('Max Response Time:', results.run.stats.responseTimes.max + 'ms');
      
      if (results.run.stats.requests.failed > 0) {
        console.log('\n❌ Some tests failed!');
        process.exit(1);
      } else {
        console.log('\n✅ All tests passed!');
      }
    } catch (parseError) {
      console.error('❌ Error parsing results:', parseError);
    }
  }
  
  console.log('\n📄 HTML Report generated at:', path.join(config.resultsDir, 'report.html'));
  console.log('📄 JSON Results saved at:', path.join(config.resultsDir, 'results.json'));
}); 