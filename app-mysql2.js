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
import mysql from 'mysql2/promise';
import fs from 'fs';

dotenv.config();

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
};

const requireEnv = (key, guidance) => {
  const value = process.env[key];
  if (!value) {
    const suffix = guidance ? ` (${guidance})` : '';
    throw new Error(`Missing required environment variable: ${key}${suffix}`);
  }
  return value;
};

const createDatabaseSslConfig = () => {
  const requireSsl = toBoolean(process.env.DB_REQUIRE_SSL);
  if (!requireSsl) {
    return undefined;
  }

  const caPath = process.env.DB_SSL_CA_PATH;
  if (!caPath) {
    throw new Error('DB_REQUIRE_SSL is true but DB_SSL_CA_PATH is not set');
  }

  try {
    const ca = fs.readFileSync(caPath, 'utf8');
    return {
      ca,
      rejectUnauthorized: toBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
    };
  } catch (error) {
    throw new Error(`Failed to read DB SSL CA certificate from ${caPath}: ${error.message}`);
  }
};

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

const JWT_SECRET = requireEnv('JWT_SECRET');

// Database connection pool
let dbPool;

// Initialize database connection
async function initializeDatabase() {
  try {
    const dbUser = requireEnv('DB_USER');
    if (dbUser && dbUser.toLowerCase() === 'root') {
      throw new Error('DB_USER must not be "root". Configure a least-privilege database account.');
    }

    const sslConfig = createDatabaseSslConfig();
    dbPool = mysql.createPool({
      host: requireEnv('DB_HOST'),
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: dbUser,
      password: requireEnv('DB_PASSWORD'),
      database: requireEnv('DB_NAME'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // acquireTimeout: 60000, // Removed - not supported by MySQL2
      timeout: 60000,
      reconnect: true,
      multipleStatements: false,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      ssl: sslConfig
    });

    // Test connection
    const connection = await dbPool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // Continue without database for basic functionality
  }
}

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

// Database helper functions
async function query(sql, params = []) {
  if (!dbPool) {
    throw new Error('Database not connected');
  }
  const [rows] = await dbPool.execute(sql, params);
  return rows;
}

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'School Management API is running',
    version: '2.0 MySQL2',
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    database: dbPool ? 'Connected' : 'Not connected'
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
    uptime: `${Math.round(process.uptime())}s`,
    database: dbPool ? 'Connected' : 'Not connected'
  });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!dbPool) {
      // Mock authentication if database not available
      if (email === 'admin@school.com' && password === 'password') {
        const token = jwt.sign(
          { userId: 1, email, role: 'admin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        return res.json({
          success: true,
          message: 'Login successful',
          token,
          user: { id: 1, email, role: 'admin' }
        });
      }
    } else {
      // Database authentication
      const users = await query(
        'SELECT * FROM users WHERE email = ? AND status = "ACTIVE"',
        [email]
      );
      
      if (users.length > 0) {
        const user = users[0];
        const isValidPassword = await bcryptjs.compare(password, user.password);
        
        if (isValidPassword) {
          const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
          );
          
          return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, role: user.role }
          });
        }
      }
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// User management routes
app.get('/api/users', async (req, res) => {
  try {
    if (!dbPool) {
      return res.json({
        success: true,
        message: 'Users endpoint available (database not connected)',
        data: []
      });
    }
    
    const users = await query('SELECT id, name, email, role, status, createdAt FROM users WHERE deletedAt IS NULL');
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!dbPool) {
      // Mock user creation
      const hashedPassword = await bcryptjs.hash(password, 10);
      return res.json({
        success: true,
        message: 'User created successfully (mock)',
        data: { name, email, role, hashedPassword }
      });
    }
    
    // Check if user exists
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    // Insert user
    const result = await query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, "ACTIVE")',
      [name, email, hashedPassword, role]
    );
    
    res.json({
      success: true,
      message: 'User created successfully',
      data: { id: result.insertId, name, email, role }
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
app.get('/api/students', async (req, res) => {
  try {
    if (!dbPool) {
      return res.json({
        success: true,
        message: 'Students endpoint available (database not connected)',
        data: []
      });
    }
    
    const students = await query(`
      SELECT s.*, u.name as parentName, u.email as parentEmail 
      FROM students s 
      LEFT JOIN users u ON s.parentId = u.id 
      WHERE s.deletedAt IS NULL
    `);
    
    res.json({
      success: true,
      message: 'Students retrieved successfully',
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve students',
      error: error.message
    });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, email, grade, parentId, address, phone } = req.body;
    
    if (!dbPool) {
      return res.json({
        success: true,
        message: 'Student created successfully (mock)',
        data: { name, email, grade, parentId, address, phone }
      });
    }
    
    const result = await query(
      'INSERT INTO students (name, email, grade, parentId, address, phone, status) VALUES (?, ?, ?, ?, ?, ?, "ACTIVE")',
      [name, email, grade, parentId, address, phone]
    );
    
    res.json({
      success: true,
      message: 'Student created successfully',
      data: { id: result.insertId, name, email, grade }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Student creation failed',
      error: error.message
    });
  }
});

// Teacher routes
app.get('/api/teachers', async (req, res) => {
  try {
    if (!dbPool) {
      return res.json({
        success: true,
        message: 'Teachers endpoint available (database not connected)',
        data: []
      });
    }
    
    const teachers = await query(`
      SELECT t.*, u.name, u.email 
      FROM teachers t 
      LEFT JOIN users u ON t.userId = u.id 
      WHERE t.deletedAt IS NULL
    `);
    
    res.json({
      success: true,
      message: 'Teachers retrieved successfully',
      data: teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve teachers',
      error: error.message
    });
  }
});

// Class routes
app.get('/api/classes', async (req, res) => {
  try {
    if (!dbPool) {
      return res.json({
        success: true,
        message: 'Classes endpoint available (database not connected)',
        data: []
      });
    }
    
    const classes = await query(`
      SELECT c.*, t.name as teacherName, s.name as subjectName
      FROM classes c 
      LEFT JOIN teachers t ON c.teacherId = t.id
      LEFT JOIN subjects s ON c.subjectId = s.id
      WHERE c.deletedAt IS NULL
    `);
    
    res.json({
      success: true,
      message: 'Classes retrieved successfully',
      data: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve classes',
      error: error.message
    });
  }
});

// Payment routes
app.get('/api/payments', async (req, res) => {
  try {
    if (!dbPool) {
      return res.json({
        success: true,
        message: 'Payments endpoint available (database not connected)',
        data: []
      });
    }
    
    const payments = await query(`
      SELECT p.*, s.name as studentName, u.name as payerName
      FROM payments p 
      LEFT JOIN students s ON p.studentId = s.id
      LEFT JOIN users u ON p.payerId = u.id
      WHERE p.deletedAt IS NULL
      ORDER BY p.createdAt DESC
    `);
    
    res.json({
      success: true,
      message: 'Payments retrieved successfully',
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments',
      error: error.message
    });
  }
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

// Database status endpoint
app.get('/api/database/status', (req, res) => {
  res.json({
    success: true,
    connected: !!dbPool,
    message: dbPool ? 'Database connected' : 'Database not connected'
  });
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'API endpoints are available',
    database: dbPool ? 'Connected' : 'Not connected',
    endpoints: [
      '/api/auth/login',
      '/api/users',
      '/api/students',
      '/api/teachers',
      '/api/classes',
      '/api/payments',
      '/api/upload',
      '/api/database/status'
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

// Initialize database and start server
async function startServer() {
  await initializeDatabase();
  
  server.listen(PORT, () => {
    const memUsage = process.memoryUsage();
    console.log(`🚀 School Management API is running on port ${PORT}`);
    console.log(`📊 Memory Usage:`);
    console.log(`   RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
    console.log(`   Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
    console.log(`   Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    console.log(`   External: ${Math.round(memUsage.external / 1024 / 1024)}MB`);
    console.log(`⏰ Uptime: ${Math.round(process.uptime())}s`);
    console.log(`🔧 Features: MySQL2 Database, Authentication, File Upload`);
    console.log(`💾 Database: ${dbPool ? 'Connected' : 'Not connected'}`);
  });
}

startServer().catch(console.error);

// Export for testing
export { app, server }; 