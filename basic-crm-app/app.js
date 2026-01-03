const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'new',
  password: process.env.DB_PASSWORD || 'new',
  database: process.env.DB_NAME || 'school_management',
  port: process.env.DB_PORT || 3306
};

let db;

// Connect to database
async function connectDB() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Basic CRM API is running',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// ======================
// USER ROUTES
// ======================

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM users LIMIT 100');
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, firstName, lastName, role, schoolId } = req.body;
    
    if (!username || !email || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const [result] = await db.execute(
      'INSERT INTO users (username, email, firstName, lastName, role, schoolId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [username, email, firstName, lastName, role, schoolId || 1, 'ACTIVE']
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { id: result.insertId, username, email, firstName, lastName, role }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, email, firstName, lastName, role, status } = req.body;
    
    const [result] = await db.execute(
      'UPDATE users SET username = ?, email = ?, firstName = ?, lastName = ?, role = ?, status = ?, updatedAt = NOW() WHERE id = ?',
      [username, email, firstName, lastName, role, status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// ======================
// CUSTOMER ROUTES
// ======================

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM customers LIMIT 100');
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
});

// Get customer by ID
app.get('/api/customers/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
});

// Create customer
app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, phone, gender, source, purpose, department, type, schoolId } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const serialNumber = `CUST-${Date.now()}`;

    const [result] = await db.execute(
      'INSERT INTO customers (name, serialNumber, email, phone, gender, source, purpose, department, type, schoolId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [name, serialNumber, email, phone, gender, source, purpose, department, type || 'PROSPECT', schoolId || 1]
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { id: result.insertId, name, serialNumber, email, phone }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
});

// Update customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, email, phone, gender, source, purpose, department, type } = req.body;
    
    const [result] = await db.execute(
      'UPDATE customers SET name = ?, email = ?, phone = ?, gender = ?, source = ?, purpose = ?, department = ?, type = ?, updatedAt = NOW() WHERE id = ?',
      [name, email, phone, gender, source, purpose, department, type, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
});

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM customers WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
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
  console.log(`✅ Basic CRM server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`🎯 Ready to handle requests!`);
});

// Connect to database on startup
connectDB(); 