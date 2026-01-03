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

// Memory optimization: Reduce buffer sizes
app.use(express.json({
  limit: '1mb', // Reduced from 10mb
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Reduced from 10mb

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
const DEFAULT_ALLOWED_HEADERS_ARRAY = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'x-client-version',
  'x-device-type',
  'x-request-id',
  'x-request-timestamp',
  'Accept',
  'Origin',
  'X-Forwarded-For',
  'X-Managed-School-Id',
  'X-Managed-Branch-Id',
  'X-Managed-Course-Id',
  'x-managed-school-id',
  'x-managed-branch-id',
  'x-managed-course-id'
];

const DEFAULT_ALLOWED_HEADERS = DEFAULT_ALLOWED_HEADERS_ARRAY.join(', ');

const mergeAllowedHeaders = (req) => {
  const requested = (req.headers['access-control-request-headers'] || '')
    .split(',')
    .map((header) => header.trim())
    .filter(Boolean);
  const combined = Array.from(new Set([...DEFAULT_ALLOWED_HEADERS_ARRAY, ...requested]));
  return combined.join(', ');
};

app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: (req, callback) => {
    callback(null, mergeAllowedHeaders(req));
  }
}));

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  // Always set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    mergeAllowedHeaders(req)
  );
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  } else {
    next();
  }
});

// Basic routes without heavy imports
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage()
  });
});

// Student Analytics Endpoints
app.get('/api/students/converted', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    // Return mock data since this is the memory-optimized version
    return res.json({
      success: true,
      message: 'Converted students available (mock data)',
      data: {
        students: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            convertedAt: '2024-01-15',
            conversionSource: 'Website'
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            convertedAt: '2024-01-14',
            conversionSource: 'Referral'
          }
        ],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 25,
          totalPages: 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve converted students',
      error: error.message
    });
  }
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

// Set server timeout to 2 minutes
server.timeout = 120000; // 120 seconds
server.keepAliveTimeout = 120000; // 120 seconds

// Start the server with memory limits
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Memory usage: ${JSON.stringify(process.memoryUsage())}`);
  console.log(`⏰ Server timeout: 120 seconds`);
});

// Export for testing
export { app, server }; 