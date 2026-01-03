# cPanel Deployment Guide

## Memory Optimization for cPanel

This guide helps you deploy the school management system on cPanel with memory constraints.

## Quick Setup

1. **Upload the optimized files:**
   - `app-cpanel.js` (memory-optimized main file)
   - `package-cpanel.json` (minimal dependencies)
   - `.env` (your environment configuration)

2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

## Memory Optimization Features

### 1. Reduced Memory Limits
- `--max-old-space-size=256`: Limits heap memory to 256MB
- `--max-semi-space-size=64`: Limits semi-space to 64MB

### 2. Optimized Request Limits
- JSON body limit: 1MB (reduced from 10MB)
- URL-encoded body limit: 1MB (reduced from 10MB)

### 3. Minimal Dependencies
Only essential packages included:
- express: Web framework
- cors: Cross-origin resource sharing
- dotenv: Environment variables

## Environment Configuration

Create a `.env` file with minimal configuration:

```env
# Server Configuration
PORT=4000
NODE_ENV=production

# Database Configuration (if needed)
DATABASE_URL="mysql://username:password@localhost:3306/database"

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

## Troubleshooting

### Memory Issues
If you still get memory errors:

1. **Use minimal memory settings:**
   ```bash
   npm run start:minimal
   ```

2. **Contact your hosting provider** to increase memory limits

3. **Use a VPS or dedicated server** for better performance

### WebAssembly Issues
The original app uses Prisma which requires WebAssembly. For cPanel:

1. **Use the simplified version** (`app-cpanel.js`)
2. **Remove Prisma dependencies** if not needed
3. **Use a different database client** (mysql2 directly)

## Performance Monitoring

Check memory usage:
```bash
curl http://your-domain.com/health
```

## Alternative: Full Application

If you need the full application with all features:

1. **Contact your hosting provider** to increase memory limits
2. **Use a VPS or dedicated server**
3. **Consider using a different hosting provider** that supports Node.js better

## File Structure for cPanel

```
your-app/
├── app-cpanel.js          # Memory-optimized main file
├── package-cpanel.json    # Minimal dependencies
├── .env                   # Environment variables
└── node_modules/          # Installed dependencies
```

## Deployment Steps

1. **Upload files** to your cPanel file manager
2. **SSH into your server** (if available)
3. **Navigate to your app directory**
4. **Install dependencies:**
   ```bash
   npm install --production
   ```
5. **Start the application:**
   ```bash
   npm start
   ```
6. **Set up a domain/subdomain** to point to your app
7. **Configure reverse proxy** if needed

## Testing

Test your deployment:
```bash
curl http://your-domain.com/
# Should return: {"message":"API is running"}

curl http://your-domain.com/health
# Should return memory usage and status
``` 