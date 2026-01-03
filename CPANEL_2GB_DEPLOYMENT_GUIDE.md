# cPanel Deployment Guide for 2GB RAM

## 🚀 Optimized for 2GB RAM Hosting

This guide helps you deploy the school management system on cPanel with 2GB RAM, avoiding WebAssembly memory issues.

## 📦 Available Versions

### 1. **Basic Version** (`app-cpanel.js`)
- Minimal features
- Very low memory usage
- Good for testing

### 2. **Enhanced Version** (`app-cpanel-enhanced.js`)
- Better memory management
- Health monitoring
- Good for production

### 3. **Full Version** (`app-cpanel-full.js`) ⭐ **RECOMMENDED**
- Full features without WebAssembly
- Authentication, file upload, user management
- Optimized for 2GB RAM

## 🛠️ Quick Setup

### Step 1: Choose Your Version

**For Full Features (Recommended):**
```bash
# Use these files:
- app-cpanel-full.js
- package-cpanel-full.json
- .env
```

**For Basic Setup:**
```bash
# Use these files:
- app-cpanel-enhanced.js
- package-cpanel-2gb.json
- .env
```

### Step 2: Upload to cPanel

1. **Upload files** to your cPanel file manager
2. **SSH into your server** (if available)
3. **Navigate to your app directory**

### Step 3: Install Dependencies

```bash
# For full version
npm install --production

# Or if using the basic version
npm install --production
```

### Step 4: Start the Application

```bash
# Standard start (uses 1.5GB RAM)
npm start

# Conservative start (uses 1GB RAM)
npm run start:conservative

# Aggressive start (uses 1.8GB RAM)
npm run start:aggressive
```

## 🔧 Memory Optimization Features

### Memory Allocation
- **Standard**: 1.5GB heap, 256MB semi-space
- **Conservative**: 1GB heap, 128MB semi-space  
- **Aggressive**: 1.8GB heap, 512MB semi-space

### Request Limits
- JSON body: 10MB (increased for 2GB RAM)
- File upload: 5MB
- URL-encoded: 10MB

### Security Features
- Helmet.js for security headers
- Compression for better performance
- Rate limiting available
- Input validation

## 📊 Monitoring

### Health Check
```bash
curl http://your-domain.com/health
```

### Memory Usage
```bash
curl http://your-domain.com/
```

### API Status
```bash
curl http://your-domain.com/api/status
```

## 🔐 Environment Configuration

Create `.env` file:
```env
# Server Configuration
PORT=4000
NODE_ENV=production

# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/database"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Security
ENCRYPTION_KEY=your-encryption-key
```

## 🧪 Testing Your Deployment

### 1. Basic Health Check
```bash
curl http://your-domain.com/
# Expected: {"message":"School Management API is running","version":"2.0 Full",...}
```

### 2. Authentication Test
```bash
curl -X POST http://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"password"}'
```

### 3. File Upload Test
```bash
curl -X POST http://your-domain.com/api/upload \
  -F "file=@test.txt"
```

### 4. User Creation Test
```bash
curl -X POST http://your-domain.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"teacher"}'
```

## 🚨 Troubleshooting

### Memory Issues
If you get memory errors:

1. **Use conservative mode:**
   ```bash
   npm run start:conservative
   ```

2. **Check memory usage:**
   ```bash
   curl http://your-domain.com/health
   ```

3. **Contact hosting provider** to increase limits

### WebAssembly Issues
The original app uses Prisma which requires WebAssembly. Solutions:

1. **Use the provided versions** (no WebAssembly)
2. **Use mysql2 directly** instead of Prisma
3. **Contact hosting provider** for WebAssembly support

### Port Issues
If port 4000 is blocked:

1. **Change port in .env:**
   ```env
   PORT=3000
   ```

2. **Use reverse proxy** in cPanel

## 📈 Performance Tips

### 1. Use PM2 (if available)
```bash
npm install -g pm2
pm2 start app-cpanel-full.js --name "school-api"
pm2 save
pm2 startup
```

### 2. Enable Compression
Already included in the full version

### 3. Use CDN for Static Files
Upload static files to CDN

### 4. Database Optimization
- Use connection pooling
- Optimize queries
- Use indexes

## 🔄 Updating

### 1. Backup Current Version
```bash
cp app-cpanel-full.js app-cpanel-full.js.backup
```

### 2. Upload New Version
Upload new files via cPanel file manager

### 3. Restart Application
```bash
npm start
```

## 📞 Support

If you encounter issues:

1. **Check logs** in cPanel
2. **Test health endpoint**
3. **Contact hosting provider**
4. **Consider VPS upgrade** for better performance

## 🎯 Success Indicators

Your deployment is successful when:

✅ `curl http://your-domain.com/` returns API status  
✅ `curl http://your-domain.com/health` shows memory usage  
✅ Authentication endpoints work  
✅ File upload works  
✅ Memory usage stays under 1.5GB  

## 🚀 Next Steps

1. **Set up domain/subdomain** in cPanel
2. **Configure SSL certificate**
3. **Set up database** (if needed)
4. **Connect frontend** to your API
5. **Monitor performance** regularly 