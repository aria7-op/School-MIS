# Environment Configuration Guide

## Overview

The School MIS backend uses environment variables (`.env`) to manage sensitive credentials and configuration. This prevents credentials from being hardcoded and accidentally committed to version control.

## Setup Instructions

### 1. Create Your Local .env File

```bash
# Copy the example file
cp .env.example .env
```

### 2. Configure Database Connection

Choose ONE of these approaches:

**Option A: Using DATABASE_URL (Recommended)**
```env
DATABASE_URL=mysql://username:password@localhost:3306/school_mis
```

**Option B: Using Individual Variables**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=school_app
DB_PASSWORD=your_secure_password
DB_NAME=school_mis
```

### 3. Configure JWT Secret

Generate a strong random key:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

Add to `.env`:
```env
JWT_SECRET=your_generated_secret_here
```

### 4. Configure Encryption Key

Generate a 32-character encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Add to `.env`:
```env
ENCRYPTION_KEY=your_32_character_key_here
```

### 5. Other Important Variables

```env
# Node environment
NODE_ENV=development

# API Port
PORT=4000

# CORS Origins (comma-separated)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## Environment Variables Reference

### Database Configuration
- **DATABASE_URL**: Full connection string (overrides individual DB_* variables)
- **DB_HOST**: Database host (default: localhost)
- **DB_PORT**: Database port (default: 3306)
- **DB_USER**: Database username (must not be root)
- **DB_PASSWORD**: Database password
- **DB_NAME**: Database name
- **DB_REQUIRE_SSL**: Enable SSL (default: false)
- **DB_SSL_CA_PATH**: Path to SSL CA certificate
- **DB_SSL_REJECT_UNAUTHORIZED**: Reject unauthorized SSL (default: true)

### Authentication
- **JWT_SECRET**: Secret key for JWT token signing (required)
- **SESSION_SECRET**: Secret for session management

### Security
- **ENCRYPTION_KEY**: Encryption key for sensitive data (required for file metadata)

### CORS
- **CORS_ALLOWED_ORIGINS**: Comma-separated list of allowed origins

### Content Security Policy
- **CSP_FRAME_ANCESTORS**: Allowed frame ancestors
- **CSP_ALLOW_UNSAFE_INLINE_SCRIPT**: Allow unsafe inline scripts (default: false)
- **CSP_ALLOW_UNSAFE_INLINE_STYLE**: Allow unsafe inline styles (default: false)
- **CSP_ADDITIONAL_SCRIPT_SRC**: Additional script sources
- **CSP_ADDITIONAL_STYLE_SRC**: Additional style sources
- **CSP_ADDITIONAL_IMG_SRC**: Additional image sources
- **CSP_ADDITIONAL_FONT_SRC**: Additional font sources
- **CSP_ADDITIONAL_CONNECT_SRC**: Additional connect sources
- **CSP_REPORT_URI**: CSP violation report URI

### File Upload
- **MAX_FILE_SIZE**: Maximum file size in bytes (default: 52428800 = 50MB)
- **UPLOAD_PATH**: Directory for file uploads (default: ./uploads)
- **ALLOWED_EXTENSIONS**: Comma-separated allowed file extensions
- **ALLOWED_MIME_TYPES**: Comma-separated allowed MIME types

### Cache (Redis)
- **REDIS_ENABLED**: Enable Redis cache (default: false)
- **REDIS_URL**: Redis connection URL

### Email
- **SMTP_HOST**: SMTP server host
- **SMTP_PORT**: SMTP server port
- **SMTP_USER**: SMTP username
- **SMTP_PASSWORD**: SMTP password
- **SMTP_FROM_NAME**: Sender name
- **SMTP_FROM_EMAIL**: Sender email

### Logging
- **LOG_LEVEL**: Log level (debug, info, warn, error)
- **LOG_FORMAT**: Log format (combined, short, dev)

### Rate Limiting
- **RATE_LIMIT_WINDOW_MS**: Rate limit window in milliseconds
- **RATE_LIMIT_MAX_REQUESTS**: Max requests per window

### Pagination
- **DEFAULT_PAGE_SIZE**: Default pagination size
- **MAX_PAGE_SIZE**: Maximum pagination size

### Feature Flags
- **ENABLE_EMAIL_NOTIFICATIONS**: Enable email notifications
- **ENABLE_SMS_NOTIFICATIONS**: Enable SMS notifications
- **ENABLE_AUDIT_LOGGING**: Enable audit logging
- **ENABLE_EXCEL_EXPORT**: Enable Excel export

### External Services
- **STRIPE_SECRET_KEY**: Stripe secret key
- **STRIPE_PUBLISHABLE_KEY**: Stripe publishable key
- **STRIPE_WEBHOOK_SECRET**: Stripe webhook secret
- **GOOGLE_DRIVE_API_KEY**: Google Drive API key
- **GOOGLE_DRIVE_REFRESH_TOKEN**: Google Drive refresh token

## Security Best Practices

1. **Never commit `.env` to version control** - it's already in .gitignore
2. **Use strong secrets** - Generate using cryptographically secure methods
3. **Rotate secrets regularly** - Especially in production
4. **Use different secrets per environment** - Dev, staging, and production should have different values
5. **Limit file permissions** - `chmod 600 .env` on Unix systems
6. **Don't log sensitive values** - The app masks sensitive headers in logs
7. **Review `.env.example`** - Keep it updated but never commit real secrets

## Deployment

### For Production
1. Set all environment variables on your hosting platform
2. Never commit `.env` files
3. Use strong, randomly generated secrets
4. Consider using a secrets management service (HashiCorp Vault, AWS Secrets Manager, etc.)

### For CPanel/Shared Hosting
Set environment variables in:
- `.htaccess`: `SetEnv VAR_NAME value`
- PHP script: `putenv('VAR_NAME=value');`
- Or via cPanel control panel

### For Docker
```dockerfile
# In Dockerfile
ENV NODE_ENV=production
COPY .env.production /app/.env
```

Or use Docker secrets:
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - DB_HOST=${DB_HOST}
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
```

## Troubleshooting

### Missing Required Environment Variables
```
Error: Missing required environment variable: JWT_SECRET
```
**Solution**: Add the variable to your `.env` file

### Database Connection Failed
```
Error: database:connection-failed
```
**Check**:
- Database credentials in `.env`
- Database host is accessible
- Database user is not "root"
- Database exists and user has permissions

### Invalid SSL Certificate
```
Error: Failed to read DB SSL CA certificate
```
**Solution**: Ensure DB_SSL_CA_PATH points to valid certificate file

## Development Setup

For local development, use the included `.env` file:
```bash
npm install
npm run dev
```

The development environment:
- Uses SQLite/MySQL locally
- Enables all debug logging
- Allows localhost CORS origins
- Disables email/SMS notifications
- Disables Redis caching
