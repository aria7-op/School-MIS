# Basic CRM App

A simple Express.js application with basic CRUD operations for Users and Customers.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `env.config` to `.env` and update database settings:
```bash
cp env.config .env
```

### 3. Start the Application
```bash
npm start
```

## 📊 API Endpoints

### Health Check
- `GET /` - Health check

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

## 🔧 Database Configuration

The app connects to your existing `school_management` database and uses the `users` and `customers` tables.

### Required Tables:
- `users` - User management
- `customers` - Customer management

## 📝 Example Requests

### Create User
```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TEACHER"
  }'
```

### Create Customer
```bash
curl -X POST http://localhost:4000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "phone": "+1234567890",
    "source": "WEBSITE",
    "purpose": "ENROLLMENT_INQUIRY"
  }'
```

## 🎯 Features
- ✅ Basic CRUD operations
- ✅ MySQL database connection
- ✅ Error handling
- ✅ CORS enabled
- ✅ Simple and lightweight

## 📁 File Structure
```
basic-crm-app/
├── app.js          # Main application
├── package.json    # Dependencies
├── env.config      # Environment configuration
└── README.md       # This file
``` 