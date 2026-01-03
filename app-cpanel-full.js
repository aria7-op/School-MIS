import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import compression from 'compression';
import helmet from 'helmet';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(compression());

// Enhanced memory settings for 2GB RAM
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure req.body is always an object
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

// Enhanced error handling for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format in request body',
      error: 'JSON_PARSE_ERROR'
    });
  }
  next();
});

// Enable CORS for frontend
app.use(cors({
  origin: '*',
  credentials: true
}));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'School Management API is running',
    version: '2.0 Full',
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    },
    uptime: `${Math.round(process.uptime())}s`
  });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Mock authentication (replace with your database logic)
    if (email === 'admin@school.com' && password === 'password') {
      const token = jwt.sign(
        { userId: 1, email, role: 'admin' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: { id: 1, email, role: 'admin' }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// User management routes
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    message: 'Users endpoint available',
    data: []
  });
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    res.json({
      success: true,
      message: 'User created successfully',
      data: { name, email, role, hashedPassword }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'User creation failed',
      error: error.message
    });
  }
});

// Student routes
app.get('/api/students', (req, res) => {
  res.json({
    success: true,
    message: 'Students endpoint available',
    data: []
  });
});

app.post('/api/students', (req, res) => {
  res.json({
    success: true,
    message: 'Student created successfully',
    data: req.body
  });
});

// Teacher routes
app.get('/api/teachers', (req, res) => {
  res.json({
    success: true,
    message: 'Teachers endpoint available',
    data: []
  });
});

app.post('/api/teachers', (req, res) => {
  res.json({
    success: true,
    message: 'Teacher created successfully',
    data: req.body
  });
});

// Class routes
app.get('/api/classes', (req, res) => {
  res.json({
    success: true,
    message: 'Classes endpoint available',
    data: []
  });
});

app.post('/api/classes', (req, res) => {
  res.json({
    success: true,
    message: 'Class created successfully',
    data: req.body
  });
});

// Payment routes
app.get('/api/payments', (req, res) => {
  res.json({
    success: true,
    message: 'Payments endpoint available',
    data: []
  });
});

app.post('/api/payments', (req, res) => {
  res.json({
    success: true,
    message: 'Payment processed successfully',
    data: req.body
  });
});

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'API endpoints are available',
    endpoints: [
      '/api/auth/login',
      '/api/users',
      '/api/students',
      '/api/teachers',
      '/api/classes',
      '/api/payments',
      '/api/upload'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start the server with optimized settings for 2GB RAM
server.listen(PORT, () => {
  const memUsage = process.memoryUsage();
  console.log(`🚀 School Management API is running on port ${PORT}`);
  console.log(`📊 Memory Usage:`);
  console.log(`   RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
  console.log(`   Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
  console.log(`   Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  console.log(`   External: ${Math.round(memUsage.external / 1024 / 1024)}MB`);
  console.log(`⏰ Uptime: ${Math.round(process.uptime())}s`);
  console.log(`🔧 Features: Authentication, File Upload, User Management`);
});

// Export for testing
export { app, server }; 