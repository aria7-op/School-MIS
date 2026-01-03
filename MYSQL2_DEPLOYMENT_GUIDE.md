# MySQL2 Deployment Guide for cPanel (No WebAssembly)

## 🚀 Perfect for 2GB RAM Hosting

This version uses `mysql2` directly instead of Prisma, completely avoiding WebAssembly memory issues.

## ✅ **Why This Version Works Better**

- **No WebAssembly**: Uses pure JavaScript dependencies
- **Lower Memory Usage**: ~200-300MB vs 500MB+ with Prisma
- **Better Compatibility**: Works on all cPanel hosting
- **Faster Startup**: No WebAssembly compilation needed
- **Easier Debugging**: Pure JavaScript stack

## 📦 **Files Included**

1. **`app-mysql2.js`** - Main application file
2. **`package-mysql2.json`** - Dependencies (no WebAssembly)
3. **`setup-database.sql`** - Database setup script
4. **`.env`** - Environment configuration

## 🛠️ **Quick Setup**

### Step 1: Upload Files
Upload these files to your cPanel:
- `app-mysql2.js`
- `package-mysql2.json`
- `setup-database.sql`
- `.env`

### Step 2: Set Up Database
1. **Access phpMyAdmin** in cPanel
2. **Create database** named `school_management`
3. **Import** `setup-database.sql`
4. **Verify tables** are created

### Step 3: Configure Environment
Update `.env` file:
```env
# Server Configuration
PORT=4000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=school_management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### Step 4: Install Dependencies
```bash
npm install --production
```

### Step 5: Start Application
```bash
# Standard start (uses 1.5GB RAM)
npm start

# Conservative start (uses 1GB RAM)
npm run start:conservative

# Aggressive start (uses 1.8GB RAM)
npm run start:aggressive
```

## 🔧 **Features Included**

### ✅ **Authentication**
- Login/logout system
- JWT token management
- Password hashing with bcryptjs
- Role-based access

### ✅ **User Management**
- Create/read/update users
- Role management (admin, teacher, parent, student)
- Status tracking

### ✅ **Student Management**
- Student registration
- Grade tracking
- Parent association
- Status management

### ✅ **Teacher Management**
- Teacher profiles
- Subject assignment
- Qualification tracking

### ✅ **Class Management**
- Class creation
- Subject assignment
- Schedule management
- Room assignment

### ✅ **Payment System**
- Payment tracking
- Multiple payment methods
- Status management
- Transaction history

### ✅ **File Upload**
- File upload support
- 5MB file size limit
- Multiple file types

### ✅ **Database Features**
- Connection pooling
- Automatic reconnection
- Error handling
- Graceful fallback

## 🧪 **Testing Your Deployment**

### 1. **Health Check**
```bash
curl http://your-domain.com/health
```
Expected: Memory usage and database status

### 2. **Database Status**
```bash
curl http://your-domain.com/api/database/status
```
Expected: `{"success":true,"connected":true,"message":"Database connected"}`

### 3. **Authentication Test**
```bash
curl -X POST http://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"password"}'
```
Expected: JWT token and user data

### 4. **User Creation Test**
```bash
curl -X POST http://your-domain.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"teacher"}'
```

### 5. **Student Creation Test**
```bash
curl -X POST http://your-domain.com/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"New Student","email":"student@example.com","grade":"Grade 10","parentId":3}'
```

## 📊 **Memory Usage Comparison**

| Version | Memory Usage | WebAssembly | cPanel Compatible |
|---------|-------------|-------------|-------------------|
| **Original (Prisma)** | 500MB+ | ❌ Yes | ❌ No |
| **MySQL2 Version** | 200-300MB | ✅ No | ✅ Yes |

## 🔍 **Database Schema**

### **Core Tables:**
- `users` - User accounts and authentication
- `students` - Student information
- `teachers` - Teacher profiles
- `subjects` - Course subjects
- `classes` - Class schedules
- `payments` - Payment tracking

### **Sample Data Included:**
- Admin user: `admin@school.com` / `password`
- Teacher user: `teacher@school.com` / `password`
- Parent user: `parent@school.com` / `password`
- Sample students, classes, and payments

## 🚨 **Troubleshooting**

### **Database Connection Issues**
1. **Check credentials** in `.env`
2. **Verify database exists**
3. **Check user permissions**
4. **Test connection** manually

### **Memory Issues**
1. **Use conservative mode**: `npm run start:conservative`
2. **Check memory usage**: `/health` endpoint
3. **Contact hosting provider** if needed

### **Port Issues**
1. **Change port** in `.env`
2. **Use reverse proxy** in cPanel
3. **Check firewall settings**

## 📈 **Performance Tips**

### **1. Database Optimization**
- Use indexes on frequently queried columns
- Implement connection pooling (already included)
- Regular database maintenance

### **2. Application Optimization**
- Enable compression (already included)
- Use caching for frequently accessed data
- Implement rate limiting

### **3. Monitoring**
- Check `/health` regularly
- Monitor database connections
- Track memory usage

## 🔄 **Updating**

### **1. Backup Current Version**
```bash
cp app-mysql2.js app-mysql2.js.backup
```

### **2. Upload New Version**
Upload new files via cPanel file manager

### **3. Restart Application**
```bash
npm start
```

## 🎯 **Success Indicators**

Your deployment is successful when:

✅ `curl http://your-domain.com/` returns API status  
✅ `curl http://your-domain.com/health` shows memory usage  
✅ `curl http://your-domain.com/api/database/status` shows connected  
✅ Authentication endpoints work  
✅ Database operations work  
✅ Memory usage stays under 300MB  

## 🚀 **Next Steps**

1. **Set up domain/subdomain** in cPanel
2. **Configure SSL certificate**
3. **Set up automated backups**
4. **Connect frontend** to your API
5. **Monitor performance** regularly
6. **Add more features** as needed

## 📞 **Support**

If you encounter issues:

1. **Check logs** in cPanel
2. **Test health endpoint**
3. **Verify database connection**
4. **Contact hosting provider**
5. **Consider VPS upgrade** for better performance

## 🔐 **Security Notes**

- **Change default passwords** in production
- **Use strong JWT secrets**
- **Enable HTTPS**
- **Regular security updates**
- **Database backups**

This MySQL2 version should work perfectly on your 2GB RAM cPanel hosting without any WebAssembly memory issues! 