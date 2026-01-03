const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Basic CRM App for production...');

async function buildApp() {
  try {
    // Create build directory
    const buildDir = path.join(__dirname, 'build');
    await fs.remove(buildDir);
    await fs.ensureDir(buildDir);

    console.log('📁 Creating build directory...');

    // Copy essential files
    const filesToCopy = [
      'app.js',
      'package.json',
      'env.config',
      'README.md'
    ];

    for (const file of filesToCopy) {
      await fs.copy(path.join(__dirname, file), path.join(buildDir, file));
      console.log(`✅ Copied ${file}`);
    }

    // Create production start script
    const startScript = `#!/usr/bin/env node

console.log('🚀 Starting Basic CRM App (Production Build)...');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.UV_THREADPOOL_SIZE = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=64';

// Load environment variables
require('dotenv').config();

// Start the application
require('./app.js');
`;

    await fs.writeFile(path.join(buildDir, 'start.js'), startScript);
    console.log('✅ Created production start script');

    // Create optimized package.json for production
    const packageJson = {
      name: "basic-crm-app-production",
      version: "1.0.0",
      description: "Basic CRM App - Production Build",
      main: "start.js",
      scripts: {
        start: "node start.js",
        "start:prod": "NODE_ENV=production node start.js"
      },
      dependencies: {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "mysql2": "^3.6.0",
        "dotenv": "^16.3.1"
      },
      engines: {
        node: ">=18.0.0"
      }
    };

    await fs.writeFile(
      path.join(buildDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log('✅ Created production package.json');

    // Create deployment guide
    const deploymentGuide = `# Basic CRM App - Production Build

## 🚀 Quick Deployment

### 1. Upload Files
Upload all files in this build directory to your cPanel Node.js App Manager.

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Configure Environment
Copy env.config to .env and update database settings:
\`\`\`bash
cp env.config .env
\`\`\`

### 4. Start Application
\`\`\`bash
npm start
\`\`\`

## 📊 API Endpoints

### Health Check
- GET / - Health check

### Users
- GET /api/users - Get all users
- GET /api/users/:id - Get user by ID
- POST /api/users - Create new user
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user

### Customers
- GET /api/customers - Get all customers
- GET /api/customers/:id - Get customer by ID
- POST /api/customers - Create new customer
- PUT /api/customers/:id - Update customer
- DELETE /api/customers/:id - Delete customer

## 🔧 Production Features
- ✅ Optimized for production
- ✅ Memory limits set (64MB)
- ✅ Single thread pool
- ✅ Environment variables configured
- ✅ Error handling
- ✅ CORS enabled

## 📝 Example Usage

### Test Health Endpoint
\`\`\`bash
curl http://localhost:4000/
\`\`\`

### Create User
\`\`\`bash
curl -X POST http://localhost:4000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TEACHER"
  }'
\`\`\`

### Create Customer
\`\`\`bash
curl -X POST http://localhost:4000/api/customers \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "phone": "+1234567890",
    "source": "WEBSITE",
    "purpose": "ENROLLMENT_INQUIRY"
  }'
\`\`\`

## 🎯 Build Information
- Build Date: ${new Date().toISOString()}
- Node.js Version: ${process.version}
- Environment: Production
- Memory Limit: 64MB
- Thread Pool: 1
`;

    await fs.writeFile(path.join(buildDir, 'DEPLOYMENT_GUIDE.md'), deploymentGuide);
    console.log('✅ Created deployment guide');

    // Create a simple test script
    const testScript = `#!/usr/bin/env node

console.log('🧪 Testing Basic CRM App...');

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(\`Status: \${res.statusCode}\`);
  res.on('data', (chunk) => {
    console.log('Response:', chunk.toString());
  });
});

req.on('error', (e) => {
  console.log('Test failed - server not running');
});

req.end();
`;

    await fs.writeFile(path.join(buildDir, 'test.js'), testScript);
    console.log('✅ Created test script');

    // Create production .env template
    const envTemplate = `# Production Environment Configuration

# Database Configuration
DB_HOST=localhost
DB_USER=new
DB_PASSWORD=new
DB_NAME=school_management
DB_PORT=3306

# Server Configuration
PORT=4000
NODE_ENV=production

# Production Settings
UV_THREADPOOL_SIZE=1
NODE_OPTIONS=--max-old-space-size=64

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
`;

    await fs.writeFile(path.join(buildDir, '.env.template'), envTemplate);
    console.log('✅ Created .env template');

    console.log('🎉 Build completed successfully!');
    console.log('📁 Build directory: build/');
    console.log('📦 Ready for deployment!');

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildApp(); 