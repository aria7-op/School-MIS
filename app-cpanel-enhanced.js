import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Enhanced memory settings for 2GB RAM
app.use(express.json({
  limit: '5mb', // Increased for 2GB RAM
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'School Management API is running',
    version: '2.0',
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

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'API endpoints are available',
    endpoints: [
      '/api/auth',
      '/api/users',
      '/api/students',
      '/api/teachers',
      '/api/classes',
      '/api/subjects',
      '/api/payments',
      '/api/attendance'
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
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Memory Usage:`);
  console.log(`   RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
  console.log(`   Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
  console.log(`   Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  console.log(`   External: ${Math.round(memUsage.external / 1024 / 1024)}MB`);
  console.log(`⏰ Uptime: ${Math.round(process.uptime())}s`);
});

// Export for testing
export { app, server }; 