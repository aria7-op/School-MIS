# 🚀 Ultra-Minimal School Management System

## 📦 For 700KB RAM Constraint

### Step 1: Upload to cPanel
1. Upload this folder to your cPanel Node.js app directory
2. Extract all files

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Application

**Option A: Ultra-Minimal (64MB memory)**
```bash
npm start
```

**Option B: Basic (128MB memory)**
```bash
npm run start:basic
```

**Option C: Emergency (32MB memory)**
```bash
npm run start:emergency
```

### 🔧 Troubleshooting

If you get memory errors:
1. Try Emergency mode first
2. Contact hosting provider to increase memory
3. Use SSH if available

If you get thread errors:
- All modes use single thread
- Should work on any hosting

### 📊 Memory Usage
- **Emergency**: 32MB max
- **Ultra-Minimal**: 64MB max  
- **Basic**: 128MB max

### ✅ Features Available
- ✅ All API endpoints
- ✅ Database operations
- ✅ Authentication
- ✅ User management
- ✅ Student/Teacher management
- ✅ Basic messaging
- ❌ AI features (disabled)
- ❌ File uploads (disabled)
- ❌ Email notifications (disabled)
- ❌ Payment processing (disabled)

### 🎯 Optimizations Applied
- Single thread operation
- Minimal memory usage
- Disabled heavy features
- Optimized bundle size
- Externalized dependencies
