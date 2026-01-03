#!/usr/bin/env node

console.log('🚀 Starting Ultra-Minimal CRM App...');

// Absolute minimal configuration for 700KB RAM
process.env.UV_THREADPOOL_SIZE = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=8';
process.env.NODE_NO_WARNINGS = '1';

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

// Minimal middleware
app.use(cors());
app.use(express.json({ limit: '256kb' }));

// Mock database (in-memory to avoid MySQL connection issues)
const mockData = {
  users: [
    { id: 1, username: 'admin', email: 'admin@school.com', firstName: 'Admin', lastName: 'User', role: 'SUPER_ADMIN' },
    { id: 2, username: 'teacher1', email: 'teacher@school.com', firstName: 'John', lastName: 'Doe', role: 'TEACHER' }
  ],
  customers: [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', phone: '+1234567890', source: 'WEBSITE', type: 'PROSPECT' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', phone: '+1234567891', source: 'REFERRAL', type: 'LEAD' }
  ]
};

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Ultra-Minimal CRM API',
    status: 'running',
    memory: '8MB limit',
    timestamp: new Date().toISOString()
  });
});

// ======================
// USER ROUTES
// ======================

app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: mockData.users,
    count: mockData.users.length
  });
});

app.get('/api/users/:id', (req, res) => {
  const user = mockData.users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, data: user });
});

app.post('/api/users', (req, res) => {
  const { username, email, firstName, lastName, role } = req.body;
  if (!username || !email || !firstName || !lastName || !role) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  const newUser = {
    id: mockData.users.length + 1,
    username, email, firstName, lastName, role
  };
  mockData.users.push(newUser);
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser
  });
});

app.put('/api/users/:id', (req, res) => {
  const userIndex = mockData.users.findIndex(u => u.id === parseInt(req.params.id));
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  mockData.users[userIndex] = { ...mockData.users[userIndex], ...req.body };
  res.json({ success: true, message: 'User updated successfully' });
});

app.delete('/api/users/:id', (req, res) => {
  const userIndex = mockData.users.findIndex(u => u.id === parseInt(req.params.id));
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  mockData.users.splice(userIndex, 1);
  res.json({ success: true, message: 'User deleted successfully' });
});

// ======================
// CUSTOMER ROUTES
// ======================

app.get('/api/customers', (req, res) => {
  res.json({
    success: true,
    data: mockData.customers,
    count: mockData.customers.length
  });
});

app.get('/api/customers/:id', (req, res) => {
  const customer = mockData.customers.find(c => c.id === parseInt(req.params.id));
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }
  res.json({ success: true, data: customer });
});

app.post('/api/customers', (req, res) => {
  const { name, email, phone, source, type } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  
  const newCustomer = {
    id: mockData.customers.length + 1,
    name, email, phone, source, type: type || 'PROSPECT'
  };
  mockData.customers.push(newCustomer);
  
  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: newCustomer
  });
});

app.put('/api/customers/:id', (req, res) => {
  const customerIndex = mockData.customers.findIndex(c => c.id === parseInt(req.params.id));
  if (customerIndex === -1) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }
  
  mockData.customers[customerIndex] = { ...mockData.customers[customerIndex], ...req.body };
  res.json({ success: true, message: 'Customer updated successfully' });
});

app.delete('/api/customers/:id', (req, res) => {
  const customerIndex = mockData.customers.findIndex(c => c.id === parseInt(req.params.id));
  if (customerIndex === -1) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }
  
  mockData.customers.splice(customerIndex, 1);
  res.json({ success: true, message: 'Customer deleted successfully' });
});

// ======================
// ERROR HANDLING
// ======================

app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /api/users',
      'GET /api/users/:id',
      'POST /api/users',
      'PUT /api/users/:id',
      'DELETE /api/users/:id',
      'GET /api/customers',
      'GET /api/customers/:id',
      'POST /api/customers',
      'PUT /api/customers/:id',
      'DELETE /api/customers/:id'
    ]
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Ultra-minimal CRM server running on port ${PORT}`);
  console.log(`💾 Memory limit: 8MB`);
  console.log(`🧵 Thread pool: 1`);
  console.log(`🔧 Mode: Ultra-minimal (no database)`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`🎯 Ready to handle requests!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 