const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Creating resource-optimized bundled production build for cPanel...');

// Clean dist folder
if (fs.existsSync('dist')) {
  fs.removeSync('dist');
}
fs.mkdirSync('dist');

// Pre-generate Prisma client locally to avoid memory issues on cPanel
console.log('🔧 Pre-generating Prisma client locally...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully!');
} catch (error) {
  console.error('❌ Prisma client generation failed:', error.message);
  process.exit(1);
}

// Bundle the application using esbuild with resource optimization
console.log('📦 Bundling application with resource optimization...');
try {
  // Run esbuild with comprehensive external dependencies to prevent missing module errors
  execSync('npx esbuild app.js --bundle --platform=node --target=node24 --outfile=dist/bundle.js --external:bcrypt --external:mysql2 --external:pg-native --external:canvas --external:sharp --external:pg --external:ioredis --external:redis --external:nodemailer --external:twilio --external:aws-sdk --external:googleapis --external:openai --external:cohere-ai --external:@huggingface/inference --external:exceljs --external:stripe --external:sequelize --external:compromise --external:lodash --external:moment --external:uuid --external:validator --external:zod --external:helmet --external:compression --external:morgan --external:multer --external:express-session --external:express-validator --external:express-rate-limit --external:cors --external:jsonwebtoken --external:cloudinary --external:fs-extra --external:socket.io --external:express --external:dotenv --external:openai --external:@huggingface/inference --external:cohere-ai --external:axios --external:node-fetch --external:form-data --external:multipart-form-data --external:ws --external:engine.io --external:socket.io-client --external:socket.io-parser --external:socket.io-adapter --external:socket.io-redis --external:ioredis --external:redis --external:connect-redis --external:express-rate-limit --external:express-slow-down --external:express-brute --external:express-brute-redis --external:express-brute-mongo --external:express-brute-mongoose --external:express-brute-sequelize --external:express-brute-prisma --external:express-brute-typeorm --external:express-brute-knex --external:express-brute-objection --external:express-brute-bookshelf --external:express-brute-waterline --external:express-brute-sails --external:express-brute-loopback --external:express-brute-feathers --external:express-brute-adonis --external:express-brute-fastify --external:express-brute-hapi --external:express-brute-koa --external:express-brute-restify --external:express-brute-polka --external:express-brute-connect --external:express-brute-connect-redis --external:express-brute-connect-mongo --external:express-brute-connect-mongoose --external:express-brute-connect-sequelize --external:express-brute-connect-prisma --external:express-brute-connect-typeorm --external:express-brute-connect-knex --external:express-brute-connect-objection --external:express-brute-connect-bookshelf --external:express-brute-connect-waterline --external:express-brute-connect-sails --external:express-brute-connect-loopback --external:express-brute-connect-feathers --external:express-brute-connect-adonis --external:express-brute-connect-fastify --external:express-brute-connect-hapi --external:express-brute-connect-koa --external:express-brute-connect-restify --external:express-brute-connect-polka --external:express-brute-connect-connect --minify --tree-shaking=true', { stdio: 'inherit' });
  
  console.log('✅ Bundle created successfully!');
} catch (error) {
  console.error('❌ Bundling failed:', error.message);
  process.exit(1);
}

// Create minimal package.json for production
const productionPackage = {
  name: "school-backend-production",
  version: "1.0.0",
  description: "School Management System Backend - Production Build",
  main: "bundle.js",
  engines: {
    node: ">=24.0.0"
  },
  scripts: {
    "start": "node start.js",
    "deploy": "node deploy.js"
  },
  dependencies: {
    "bcrypt": "^6.0.0",
    "mysql2": "^3.6.0",
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    "ioredis": "^5.3.0",
    "compromise": "^14.10.0",
    "zod": "^3.22.0",
    "googleapis": "^128.0.0",
    "cloudinary": "^1.41.0",
    "sequelize": "^6.35.0",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "express-session": "^1.17.3",
    "express-validator": "^7.0.1",
    "express-rate-limit": "^7.1.5",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2",
    "fs-extra": "^11.2.0",
    "lodash": "^4.17.21",
    "moment": "^2.29.4",
    "uuid": "^9.0.1",
    "validator": "^13.11.0",
    "socket.io": "^4.8.1",
    "nodemailer": "^6.9.0",
    "openai": "^4.0.0",
    "@huggingface/inference": "^2.0.0",
    "cohere-ai": "^7.0.0",
    "axios": "^1.6.0"
  }
};

fs.writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2));

// Copy only essential files
fs.copySync('.env', 'dist/.env');
fs.copySync('prisma', 'dist/prisma');

// Copy Prisma files
console.log("📁 Copying Prisma files...");
fs.copyFileSync("prisma/schema.prisma", "dist/prisma/schema.prisma");

// Copy Prisma binaries for the target platform
const prismaBinaries = [
  "libquery_engine-debian-openssl-1.0.x.so.node",
  "query-engine-debian-openssl-1.0.x"
];

// Try to find and copy Prisma binaries from various locations
const possibleBinaryPaths = [
  "node_modules/.prisma/client",
  "node_modules/@prisma/client",
  "generated/prisma"
];

for (const binary of prismaBinaries) {
  let found = false;
  for (const path of possibleBinaryPaths) {
    const binaryPath = `${path}/${binary}`;
    if (fs.existsSync(binaryPath)) {
      console.log(`📦 Copying Prisma binary: ${binary}`);
      // Copy to both root and prisma folder
      fs.copyFileSync(binaryPath, `dist/${binary}`);
      fs.copyFileSync(binaryPath, `dist/prisma/${binary}`);
      found = true;
      break;
    }
  }
  if (!found) {
    console.log(`⚠️  Warning: Could not find Prisma binary: ${binary}`);
  }
}

// Create resource-optimized deployment script
const deployScript = `console.log('🚀 Starting resource-optimized deployment...');

const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install --no-optional --production', { stdio: 'inherit' });
  
  console.log('✅ Deployment completed!');
  console.log('📝 Run "npm start" or "node start.js" to start the application');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}`;

fs.writeFileSync('dist/deploy.js', deployScript);

// Create resource-optimized start script with environment variables
const startScript = `console.log('🚀 Starting resource-optimized application...');

// Set resource limits for cPanel
process.env.UV_THREADPOOL_SIZE = '4'; // Limit thread pool
process.env.NODE_OPTIONS = '--max-old-space-size=512'; // Limit memory usage

try {
  console.log('🚀 Starting application with resource limits...');
  require('./bundle.js');
} catch (error) {
  console.error('❌ Failed to start application:', error.message);
  process.exit(1);
}`;

fs.writeFileSync('dist/start.js', startScript);

// Create resource-optimized environment file
const optimizedEnv = `# Resource-optimized environment for cPanel
NODE_ENV=production
PORT=4000
UV_THREADPOOL_SIZE=4
NODE_OPTIONS=--max-old-space-size=512

# Database
DATABASE_URL=mysql://new:new@localhost:3306/school_management

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Disable features that consume too many resources
REDIS_ENABLED=false
AI_FEATURES_ENABLED=false
WEBSOCKET_ENABLED=true
`;

fs.writeFileSync('dist/.env', optimizedEnv);

// Create README
const readme = `# School Management System - Resource Optimized Bundle

## cPanel Deployment Instructions

### Step 1: Upload Files
Upload all files to your cPanel Node.js app directory.

### Step 2: Install Dependencies
Click "npm install" in cPanel Node.js App Manager.

### Step 3: Start Application
**Option A: Use the start script**
\`\`\`bash
node start-simple.js
\`\`\`

**Option B: Use cPanel "Run JS Script"**
Copy and paste this code into cPanel's "Run JS Script" feature:

\`\`\`javascript
// Direct bundle runner for cPanel "Run JS Script"
console.log('🚀 Starting School Management System...');

// Set resource limits for cPanel
process.env.UV_THREADPOOL_SIZE = '4';
process.env.NODE_OPTIONS = '--max-old-space-size=512';

try {
  console.log('📦 Loading bundled application...');
  require('./bundle.js');
} catch (error) {
  console.error('❌ Failed to start application:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
\`\`\`

## What's Included
- ✅ Single bundled file (bundle.js) with Prisma client included
- ✅ Resource-optimized for cPanel limitations
- ✅ Limited thread pool (4 threads max)
- ✅ Limited memory usage (512MB max)
- ✅ Disabled resource-intensive features
- ✅ No need to run npx prisma generate on cPanel

## Resource Optimizations
- Thread pool limited to 4 threads
- Memory usage limited to 512MB
- Redis features disabled (using memory cache)
- AI features disabled to reduce resource usage
- WebSocket enabled but optimized

## Troubleshooting
If you get thread/resource errors:
1. The app is already optimized for cPanel limits
2. Contact your hosting provider to increase resource limits
3. Try restarting the Node.js app

## Manual Start
If scripts fail, manually run:
\`\`\`bash
UV_THREADPOOL_SIZE=4 NODE_OPTIONS="--max-old-space-size=512" node bundle.js
\`\`\`
`;

fs.writeFileSync('dist/README.md', readme);

console.log('✅ Resource-optimized bundled production build created successfully!');
console.log('📁 Files created in dist/ folder:');
console.log('   - bundle.js (resource-optimized bundled file)');
console.log('   - package.json (minimal dependencies)');
console.log('   - .env (resource-optimized environment)');
console.log('   - prisma/ (database schema)');
console.log('   - deploy.js (deployment script)');
console.log('   - start.js (resource-optimized start script)');
console.log('   - README.md (deployment instructions)');
console.log('📦 Bundle optimized for cPanel resource limits');
console.log('🔧 Thread pool limited to 4, memory limited to 512MB');
console.log('🚀 Resource-intensive features disabled for stability'); 