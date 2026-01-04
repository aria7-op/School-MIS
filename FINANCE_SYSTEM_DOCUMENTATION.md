# School Management System - Finance Module Documentation

## Overview

The Finance Module is a comprehensive financial management system designed for educational institutions. It handles student payments, fee structures, balance calculations, refunds, installments, expenses, income tracking, and complete financial analytics.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Components](#core-components)
3. [Payment System](#payment-system)
4. [Fee Structure Management](#fee-structure-management)
5. [Balance & Dues Calculation](#balance--dues-calculation)
6. [Payment Status Management](#payment-status-management)
7. [API Endpoints](#api-endpoints)
8. [Frontend Integration](#frontend-integration)
9. [Database Schema](#database-schema)
10. [Features & Capabilities](#features--capabilities)
11. [Security & Permissions](#security--permissions)
12. [Installation & Setup](#installation--setup)

---

## System Architecture

### Backend Architecture

The finance system follows a layered architecture:

```
┌─────────────────────────────────────┐
│           Frontend (React)          │
├─────────────────────────────────────┤
│         API Layer (Express)         │
├─────────────────────────────────────┤
│       Service Layer (Business)      │
├─────────────────────────────────────┤
│       Data Layer (Prisma/MySQL)     │
└─────────────────────────────────────┘
```

### Key Directories

```
School-MIS/
├── src/features/finance/           # Frontend React components
│   ├── components/                 # UI components
│   ├── hooks/                      # React Query hooks
│   ├── services/                   # API service calls
│   ├── screens/                    # Page components
│   └── types/                      # TypeScript definitions
├── controllers/                    # Backend controllers
│   ├── paymentController.js        # Payment operations
│   └── studentBalanceController.js  # Balance calculations
├── services/                       # Business logic services
│   ├── studentBalanceService.js    # Balance calculations
│   ├── paymentGatewayService.js    # Payment processing
│   └── financeAnalyticsService.js  # Analytics
├── routes/                         # API routes
│   ├── finance.js                  # Finance endpoints
│   ├── payments.js                 # Payment endpoints
│   └── studentBalance.js           # Balance endpoints
└── models/                         # Database models
    └── Payment.js                  # Payment model
```

---

## Core Components

### 1. Payment Management
- **Student Payments**: Record and track student fee payments
- **Payment Methods**: Support for cash, card, bank transfer, mobile payments, checks, and scholarships
- **Payment Statuses**: Comprehensive status tracking (PAID, UNPAID, PARTIALLY_PAID, OVERDUE, etc.)
- **Installments**: Break down payments into manageable installments
- **Refunds**: Process payment refunds with approval workflows

### 2. Fee Structure System
- **Dynamic Fee Structures**: Create flexible fee structures for different classes
- **Fee Items**: Individual fee components (tuition, transport, lab fees, etc.)
- **Optional vs Mandatory**: Mark certain fees as optional
- **Due Dates**: Set due dates for each fee item
- **Class Assignment**: Assign fee structures to specific classes

### 3. Balance & Dues Management
- **Real-time Balance**: Calculate student balances in real-time
- **Overdue Detection**: Automatically identify overdue payments
- **Dues Tracking**: Track outstanding amounts and overdue periods
- **Prepayment Support**: Handle advance payments and credits
- **Monthly Tracking**: Track payments month by month

### 4. Financial Analytics
- **Revenue Tracking**: Monitor total revenue and payment trends
- **Expense Management**: Track and categorize school expenses
- **Budget Management**: Create and monitor budgets
- **Profit & Loss**: Generate P&L statements
- **Payment Analytics**: Detailed payment method analysis and trends

### 5. Payroll System
- **Salary Management**: Handle teacher and staff salaries
- **Allowances & Deductions**: Manage various salary components
- **Monthly Payroll**: Generate monthly payroll reports
- **Payment Status**: Track payroll payment status

---

## Payment System

### Payment Workflow

```
Student Selection → Fee Structure Loading → Balance Calculation → 
Payment Recording → Status Update → Receipt Generation → Notification
```

### Payment Types

1. **Standard Payments**
   - One-time full payments
   - Partial payments
   - Advance payments (prepayments)

2. **Installment Payments**
   - Fixed installment plans
   - Flexible scheduling
   - Automatic due date tracking

3. **Refund Processing**
   - Full refunds
   - Partial refunds
   - Approval workflow
   - Multiple refund methods

### Payment Methods Supported

| Method | Description | Status |
|--------|-------------|---------|
| CASH | Physical cash payments | ✅ Active |
| CARD | Credit/Debit card payments | ✅ Active |
| BANK_TRANSFER | Bank transfers | ✅ Active |
| MOBILE_PAYMENT | Mobile wallet payments | ✅ Active |
| CHECK | Check payments | ✅ Active |
| SCHOLARSHIP | Scholarship awards | ✅ Active |

### Payment Status Lifecycle

```
PENDING → PROCESSING → PAID
    ↓         ↓
OVERDUE   CANCELLED
    ↓
REFUNDED
```

**Status Definitions:**
- **PENDING**: Payment initiated but not confirmed
- **PROCESSING**: Payment being processed by gateway
- **PAID**: Payment successfully completed
- **UNPAID**: No payment received (0% of expected)
- **PARTIALLY_PAID**: Partial payment received (>0% but <100%)
- **OVERDUE**: Payment past due date and still unpaid/partial
- **CANCELLED**: Payment cancelled
- **REFUNDED**: Payment refunded (fully or partially)
- **CLEARED**: Balance exactly zero (paid in full)
- **PREPAID**: Payment exceeds expected amount (advance)

---

## Fee Structure Management

### Fee Structure Components

```typescript
interface FeeStructure {
  id: string;
  name: string;
  description: string;
  schoolId: number;
  isDefault: boolean;
  items: FeeItem[];
  assignedClasses: Class[];
}

interface FeeItem {
  id: string;
  name: string;
  amount: number;
  isOptional: boolean;
  dueDate?: string;
  category: string;
}
```

### Fee Categories

1. **Academic Fees**
   - Tuition Fees
   - Registration Fees
   - Examination Fees

2. **Facility Fees**
   - Laboratory Fees
   - Library Fees
   - Computer Lab Fees

3. **Service Fees**
   - Transport Fees
   - Hostel Fees
   - Food Services

4. **Other Fees**
   - Sports Fees
   - Activity Fees
   - Material Fees

### Fee Assignment Process

```
Create Fee Structure → Add Fee Items → Set Amounts → 
Assign to Classes → Set as Default → Activate
```

---

## Balance & Dues Calculation

### Balance Calculation Formula

```
Balance = Expected Fees - Total Paid + Discounts - Fines

Where:
- Expected Fees = Sum of all fee items for student's class
- Total Paid = Sum of all confirmed payments
- Discounts = Sum of all applied discounts
- Fines = Sum of all late payment fines
```

### Student Balance Service

The `studentBalanceService.js` provides comprehensive balance calculations:

#### Key Methods

1. **calculateExpectedFees(studentId, schoolId)**
   - Fetches student's class and fee structure
   - Calculates total expected fees
   - Returns fee breakdown

2. **calculateTotalPayments(studentId, schoolId, options)**
   - Sums all confirmed payments
   - Supports date filtering
   - Month-by-month payment tracking

3. **calculateStudentBalance(studentId, schoolId)**
   - Complete balance calculation
   - Includes expected vs paid comparison
   - Returns payment percentage

4. **calculateDues(studentId, schoolId)**
   - Identifies overdue payments
   - Calculates days/months overdue
   - Lists unpaid months

### Balance Status Types

| Status | Condition | Description |
|--------|-----------|-------------|
| DUE | Balance > 0 | Student owes money |
| PREPAID | Balance < 0 | Student has credit |
| CLEARED | Balance = 0 | No outstanding amount |

### Dues Management Features

- **Automatic Overdue Detection**: Identifies overdue payments based on due dates
- **Monthly Gap Analysis**: Finds months with missing payments
- **Overdue Duration**: Calculates how long payments have been overdue
- **Priority Sorting**: Sorts dues by amount and overdue duration

---

## Payment Status Management

### Automatic Status Updates

The system includes `autoUpdatePaymentStatuses()` function that:

1. **Checks Due Dates**: Compares payment due dates with current date
2. **Updates Overdue Status**: Marks payments as OVERDUE when past due date
3. **Calculates Payment Percentage**: Determines if payment is complete, partial, or unpaid
4. **Handles Prepayments**: Identifies and tracks advance payments
5. **Updates Bulk Statuses**: Processes multiple payments efficiently

### Status Update Triggers

- **Scheduled Updates**: Daily automatic status updates
- **Manual Updates**: Admin can trigger status updates
- **Payment Events**: Status updates after payment recording
- **Due Date Changes**: Updates when due dates are modified

### Status-Based Filtering

All payment lists support filtering by status:
- Filter by single status (e.g., only OVERDUE)
- Filter by multiple statuses
- Exclude certain statuses
- Status-based reporting

---

## API Endpoints

### Finance Routes (`/api/finance`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/analytics` | GET | Get finance analytics data | Admin, Accountant |
| `/dashboard` | GET | Get finance dashboard data | Admin, Accountant |
| `/reports` | GET | Get available reports | Admin, Accountant |
| `/reports/generate` | POST | Generate finance report | Admin, Accountant |

### Payment Routes (`/api/payments`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/` | GET | Get all payments | Admin, Accountant |
| `/` | POST | Create new payment | Admin, Accountant |
| `/:id` | GET | Get payment by ID | Admin, Accountant |
| `/:id` | PUT | Update payment | Admin, Accountant |
| `/:id` | DELETE | Delete payment | Admin, Accountant |
| `/:id/status` | PATCH | Update payment status | Admin, Accountant |
| `/student/:studentId` | GET | Get student payments | Admin, Accountant |
| `/parent/:parentId` | GET | Get parent payments | Admin, Accountant |
| `/overdue/list` | GET | Get overdue payments | Admin, Accountant |
| `/dashboard/summary` | GET | Get dashboard summary | Admin, Accountant |
| `/dashboard/recent` | GET | Get recent payments | Admin, Accountant |
| `/dashboard/upcoming` | GET | Get upcoming payments | Admin, Accountant |
| `/bulk/create` | POST | Create bulk payments | Admin, Accountant |
| `/bulk/update-status` | POST | Bulk update status | Admin, Accountant |

### Student Balance Routes (`/api/students`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/:studentId/balance` | GET | Get student balance | Admin, Accountant |
| `/:studentId/expected-fees` | GET | Get expected fees | Admin, Accountant |
| `/:studentId/dues` | GET | Get dues information | Admin, Accountant |
| `/with-dues` | GET | Get students with dues | Admin, Accountant |

### Refund Routes (`/api/refunds`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/` | GET | Get all refunds | Admin, Accountant |
| `/` | POST | Create new refund | Admin, Accountant |
| `/:id` | GET | Get refund by ID | Admin, Accountant |
| `/:id` | PUT | Update refund | Admin, Accountant |
| `/:id` | DELETE | Delete refund | Admin, Accountant |
| `/:id/process` | POST | Process refund | Admin, Accountant |
| `/:id/cancel` | POST | Cancel refund | Admin, Accountant |
| `/payment/:paymentId` | GET | Get refunds by payment | Admin, Accountant |
| `/statistics` | GET | Get refund statistics | Admin, Accountant |
| `/analytics` | GET | Get refund analytics | Admin, Accountant |

### Installment Routes (`/api/installments`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/` | GET | Get all installments | Admin, Accountant |
| `/` | POST | Create new installment | Admin, Accountant |
| `/:id` | GET | Get installment by ID | Admin, Accountant |
| `/:id` | PUT | Update installment | Admin, Accountant |
| `/:id` | DELETE | Delete installment | Admin, Accountant |
| `/:id/pay` | PATCH | Mark as paid | Admin, Accountant |
| `/:id/overdue` | PATCH | Mark as overdue | Admin, Accountant |
| `/payment/:paymentId` | GET | Get installments by payment | Admin, Accountant |
| `/overdue` | GET | Get overdue installments | Admin, Accountant |
| `/upcoming` | GET | Get upcoming installments | Admin, Accountant |

---

## Frontend Integration

### React Components Structure

```
src/features/finance/
├── components/
│   ├── AddPaymentModal.tsx          # Payment creation modal
│   ├── PaymentBill.tsx              # Payment receipt/bill
│   ├── PaymentList.tsx              # Payment list component
│   ├── PaymentAnalytics.tsx         # Analytics charts
│   ├── PaymentReports.tsx            # Reports component
│   ├── PaymentAudit.tsx              # Audit trail
│   ├── PaymentModal.tsx              # General payment modal
│   ├── RecordPaymentModal.tsx        # Record payment modal
│   ├── StudentPaymentSelector.tsx    # Student selection
│   ├── PaymentTrendsChart.tsx        # Trends visualization
│   ├── EnhancedPaymentBill.tsx       # Enhanced bill display
│   └── FinanceHeader.tsx             # Finance section header
├── screens/
│   ├── FinanceScreen.tsx             # Main finance screen
│   ├── FinanceDashboardScreen.tsx    # Dashboard screen
│   ├── DynamicFinanceScreen.tsx      # Dynamic finance screen
│   ├── AdvancedFinanceScreen.tsx     # Advanced features
│   ├── UltraAdvancedFinanceDashboard.tsx # Premium dashboard
│   ├── AdvancedFinanceDashboard.tsx  # Advanced dashboard
│   └── PaymentManagementScreen.tsx  # Payment management
├── hooks/
│   ├── useFinance.ts                 # General finance hook
│   ├── useFinanceApi.ts              # API integration hook
│   └── useStudentBalance.ts          # Student balance hook
├── services/
│   ├── financeService.ts             # Main finance service
│   ├── financeApi.ts                 # API calls
│   ├── comprehensiveFinanceApi.ts    # Comprehensive API
│   └── paymentService.ts             # Payment service
└── types/
    ├── finance.d.ts                  # TypeScript definitions
    ├── finance.ts                    # Type definitions
    └── payment.ts                    # Payment types
```

### Key Frontend Features

#### 1. Smart Payment Form
- **Auto-fill Amount**: Automatically fills expected payment amount
- **Balance Display**: Shows current student balance in real-time
- **Payment History**: Displays recent payment history
- **Overdue Warnings**: Highlights overdue payments
- **Progress Bar**: Visual payment completion percentage

#### 2. Student Financial Overview
- **Complete Balance**: Expected vs paid comparison
- **Fee Structure**: Shows assigned fee structure
- **Payment Status**: Current payment status with color coding
- **Monthly Breakdown**: Month-by-month payment tracking

#### 3. Advanced Analytics
- **Revenue Trends**: Monthly/ yearly revenue charts
- **Payment Methods**: Breakdown by payment method
- **Overdue Analysis**: Overdue payment trends
- **Class Performance**: Payment completion by class

#### 4. Comprehensive Reporting
- **Payment Reports**: Detailed payment reports
- **Dues Reports**: Outstanding dues reports
- **Refund Reports**: Refund analysis reports
- **Profit & Loss**: Financial performance reports

### React Query Integration

The frontend uses React Query for efficient data fetching and caching:

```typescript
// Student balance hook
const useStudentBalance = (studentId: string) => {
  return useQuery({
    queryKey: ['studentBalance', studentId],
    queryFn: () => financeService.getStudentBalance(studentId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!studentId
  });
};

// Expected fees hook
const useStudentExpectedFees = (studentId: string) => {
  return useQuery({
    queryKey: ['expectedFees', studentId],
    queryFn: () => financeService.getExpectedFees(studentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!studentId
  });
};
```

---

## Database Schema

### Core Tables

#### Payments Table
```sql
CREATE TABLE payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  studentId BIGINT NOT NULL,
  parentId BIGINT,
  feeStructureId VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  fine DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  paymentDate DATE NOT NULL,
  dueDate DATE,
  status ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED', 'UNPAID', 'PARTIALLY_PAID', 'PROCESSING', 'CLEARED', 'PREPAID'),
  method ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'SCHOLARSHIP'),
  type VARCHAR(255),
  transactionId VARCHAR(255),
  remarks TEXT,
  metadata JSON,
  isRecurring BOOLEAN DEFAULT FALSE,
  recurringFrequency VARCHAR(255),
  nextPaymentDate DATE,
  schoolId BIGINT NOT NULL,
  createdBy BIGINT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL
);
```

#### Fee Structures Table
```sql
CREATE TABLE fee_structures (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  isDefault BOOLEAN DEFAULT FALSE,
  schoolId BIGINT NOT NULL,
  createdBy BIGINT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL
);
```

#### Fee Items Table
```sql
CREATE TABLE fee_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  feeStructureId BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  isOptional BOOLEAN DEFAULT FALSE,
  dueDate DATE,
  category VARCHAR(255),
  schoolId BIGINT NOT NULL,
  createdBy BIGINT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL
);
```

#### Students Table (Finance Fields)
```sql
-- Additional finance-related fields in students table
ALTER TABLE students 
ADD COLUMN expectedFees DECIMAL(10,2) DEFAULT 0,
ADD COLUMN balanceStatus ENUM('DUE', 'PREPAID', 'CLEARED') DEFAULT 'DUE',
ADD COLUMN paymentPercentage DECIMAL(5,2) DEFAULT 0;
```

### Relationships

```
Students (1) → (Many) Payments
FeeStructures (1) → (Many) FeeItems
FeeStructures (1) → (Many) Students
Classes (1) → (Many) FeeStructures
Schools (1) → (Many) All Finance Tables
```

---

## Features & Capabilities

### 🎯 Core Features

#### Payment Management
- ✅ **Multi-Method Support**: Cash, Card, Bank Transfer, Mobile, Check, Scholarship
- ✅ **Installment Plans**: Flexible payment scheduling
- ✅ **Refund Processing**: Complete refund workflow with approvals
- ✅ **Bulk Operations**: Process multiple payments simultaneously
- ✅ **Receipt Generation**: Automatic receipt creation
- ✅ **Payment History**: Complete transaction history

#### Balance & Dues
- ✅ **Real-time Balance**: Live balance calculations
- ✅ **Overdue Detection**: Automatic overdue identification
- ✅ **Dues Management**: Comprehensive dues tracking
- ✅ **Prepayment Support**: Handle advance payments
- ✅ **Monthly Tracking**: Month-by-month payment analysis
- ✅ **Payment Percentage**: Visual completion tracking

#### Fee Structures
- ✅ **Dynamic Structures**: Flexible fee configuration
- ✅ **Class Assignment**: Assign fees to specific classes
- ✅ **Optional Fees**: Mark certain fees as optional
- ✅ **Due Date Management**: Set individual due dates
- ✅ **Fee Categories**: Organize fees by categories
- ✅ **Default Structures**: Set default fee structures

#### Analytics & Reporting
- ✅ **Revenue Analytics**: Comprehensive revenue tracking
- ✅ **Payment Trends**: Visual trend analysis
- ✅ **Method Analysis**: Payment method breakdown
- ✅ **Class Performance**: Payment completion by class
- ✅ **Overdue Reports**: Detailed overdue analysis
- ✅ **Financial Dashboard**: Complete financial overview

#### Advanced Features
- ✅ **Automatic Status Updates**: Smart status management
- ✅ **Notification System**: Payment notifications
- ✅ **Audit Trail**: Complete audit logging
- ✅ **Data Export**: Export to various formats
- ✅ **Search & Filter**: Advanced search capabilities
- ✅ **Role-Based Access**: Permission-based access control

### 🔧 Technical Features

#### Performance
- ✅ **Caching**: Smart caching for balance calculations
- ✅ **Optimized Queries**: Efficient database queries
- ✅ **Batch Processing**: Handle bulk operations efficiently
- ✅ **Lazy Loading**: Load data on demand
- ✅ **Pagination**: Handle large datasets efficiently

#### Security
- ✅ **Authentication**: Secure user authentication
- ✅ **Authorization**: Role-based permissions
- ✅ **Data Validation**: Input validation and sanitization
- ✅ **Audit Logging**: Complete activity tracking
- ✅ **Secure APIs**: Protected API endpoints

#### Integration
- ✅ **React Integration**: Seamless frontend integration
- ✅ **API Documentation**: Complete API documentation
- ✅ **Error Handling**: Comprehensive error management
- ✅ **TypeScript Support**: Full TypeScript integration
- ✅ **Responsive Design**: Mobile-friendly interface

---

## Security & Permissions

### Role-Based Access Control

| Role | Payment Access | Balance Access | Refund Access | Analytics Access |
|------|----------------|----------------|---------------|------------------|
| SUPER_ADMIN | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| SCHOOL_ADMIN | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| ACCOUNTANT | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| TEACHER | 👁️ View Only | 👁️ View Only | ❌ None | 👁️ Limited |
| PARENT | 👁️ Own Children | 👁️ Own Children | ❌ None | ❌ None |
| STUDENT | 👁️ Own | 👁️ Own | ❌ None | ❌ None |

### Permission Levels

#### Payment Permissions
- **CREATE_PAYMENT**: Create new payments
- **UPDATE_PAYMENT**: Modify existing payments
- **DELETE_PAYMENT**: Remove payments
- **VIEW_PAYMENTS**: View payment lists
- **PROCESS_REFUNDS**: Process refund requests

#### Balance Permissions
- **VIEW_BALANCE**: View student balances
- **VIEW_DUES**: View outstanding dues
- **EXPORT_BALANCE**: Export balance data
- **UPDATE_STATUS**: Update payment statuses

#### Analytics Permissions
- **VIEW_ANALYTICS**: Access financial analytics
- **GENERATE_REPORTS**: Create financial reports
- **EXPORT_DATA**: Export financial data
- **VIEW_DASHBOARD**: Access finance dashboard

### Security Features

1. **Authentication**
   - JWT token-based authentication
   - Session management
   - Multi-factor authentication support

2. **Data Protection**
   - Input validation and sanitization
   - SQL injection prevention
   - XSS protection
   - CSRF protection

3. **Audit Trail**
   - Complete activity logging
   - User action tracking
   - Data change history
   - Access logs

4. **API Security**
   - Rate limiting
   - Request validation
   - Response encryption
   - CORS configuration

---

## Payment Gateway Integration

### Supported Payment Gateways

The finance system integrates with multiple payment gateways for secure online payments:

| Gateway | Status | Features | Configuration |
|---------|--------|----------|---------------|
| **Stripe** | ✅ Active | Cards, Apple Pay, Google Pay | API Key, Webhook Secret |
| **PayPal** | ✅ Active | PayPal Balance, Cards | Client ID, Secret |
| **Razorpay** | ✅ Active | UPI, Cards, Net Banking | Key ID, Key Secret |
| **Paytm** | ✅ Active | Paytm Wallet, UPI, Cards | Merchant ID, API Key |
| **Cashfree** | ✅ Active | Net Banking, UPI, Cards | App ID, Secret Key |
| **Custom** | ✅ Active | Custom gateway integration | Custom implementation |

### Payment Gateway Service Architecture

```javascript
class PaymentGatewayService {
  constructor() {
    this.gateways = {
      STRIPE: this.processStripePayment.bind(this),
      PAYPAL: this.processPayPalPayment.bind(this),
      RAZORPAY: this.processRazorpayPayment.bind(this),
      PAYTM: this.processPaytmPayment.bind(this),
      CASHFREE: this.processCashfreePayment.bind(this),
      CUSTOM: this.processCustomPayment.bind(this)
    };
  }
}
```

### Gateway Configuration

```env
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# PayPal Configuration
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-secret"

# Razorpay Configuration
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your-razorpay-secret"

# Paytm Configuration
PAYTM_MERCHANT_ID="your-merchant-id"
PAYTM_MERCHANT_KEY="your-merchant-key"

# Cashfree Configuration
CASHFREE_APP_ID="your-app-id"
CASHFREE_SECRET_KEY="your-secret-key"
```

### Payment Processing Flow

```
Initiate Payment → Gateway Selection → Process Payment → 
Webhook Handling → Update Status → Send Notification
```

### Webhook Integration

Each gateway supports webhook notifications for:
- Payment success/failure
- Refund processing
- Subscription updates
- Dispute notifications

### Security Features

- **PCI DSS Compliance**: Secure card data handling
- **Tokenization**: Card token storage
- **3D Secure**: Additional authentication layer
- **Fraud Detection**: Built-in fraud prevention
- **SSL Encryption**: End-to-end encryption

---

## Advanced Fee Structure Features

### Enhanced Fee Item Properties

```typescript
interface AdvancedFeeItem {
  id: string;
  name: string;
  amount: number;
  taxRate: number;           // 0-100% tax rate
  discountable: boolean;     // Can be discounted
  optional: boolean;         // Optional fee
  frequency: FeeFrequency;   // Payment frequency
  dueDate?: Date;           // Individual due date
  lateFee?: LateFeeConfig;  // Late fee configuration
  prerequisites?: string[];   // Required fee items
  installments?: number;     // Number of installments
  gracePeriod?: number;     // Days before late fee
}
```

### Fee Frequencies

| Frequency | Description | Use Case |
|-----------|-------------|----------|
| **ONE_TIME** | Single payment | Registration, Admission |
| **MONTHLY** | Monthly recurring | Tuition, Hostel |
| **QUARTERLY** | Every 3 months | Term fees |
| **YEARLY** | Annual payment | Annual fees |
| **SEMESTER** | Academic semester | Semester fees |

### Late Fee Configuration

```typescript
interface LateFeeConfig {
  type: 'FIXED' | 'PERCENTAGE';  // Fee calculation type
  value: number;                 // Fixed amount or percentage
  cap?: number;                  // Maximum late fee amount
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'; // Accumulation frequency
  gracePeriod: number;           // Grace period in days
}
```

### Tax Management

- **Tax Rates**: 0-100% configurable tax rates
- **Tax Calculation**: Automatic tax inclusion in total
- **Tax Reporting**: Separate tax reporting
- **Multi-Tax Support**: Multiple tax categories
- **Tax Exemptions**: Tax-exempt fee items

### Discount System

- **Early Bird Discounts**: Discount for early payments
- **Sibling Discounts**: Discounts for multiple siblings
- **Scholarship Discounts**: Merit-based reductions
- **Bulk Discounts**: Volume-based discounts
- **Custom Discounts**: Admin-defined discounts

### Fee Validation Rules

```javascript
const feeValidationRules = {
  amount: { min: 0, max: 1000000 },
  taxRate: { min: 0, max: 100 },
  discountable: { type: 'boolean' },
  frequency: { enum: ['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'SEMESTER'] },
  lateFee: {
    type: { enum: ['FIXED', 'PERCENTAGE'] },
    value: { min: 0 },
    cap: { min: 0, optional: true }
  }
};
```

---

## Budget Management Module

### Budget Categories

| Category | Description | Typical Allocation |
|----------|-------------|-------------------|
| **Academic Programs** | Teaching, curriculum, learning materials | 40-50% |
| **Infrastructure** | Buildings, maintenance, utilities | 20-30% |
| **Technology** | IT equipment, software, licenses | 10-15% |
| **Staff Development** | Training, workshops, certifications | 5-10% |
| **Student Activities** | Sports, clubs, events | 5-10% |
| **Administrative** | Office supplies, administrative costs | 5-10% |

### Budget Structure

```typescript
interface Budget {
  id: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: Date;
  endDate: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Budget Tracking Features

- **Real-time Tracking**: Live budget vs actual spending
- **Utilization Alerts**: Notifications when budget limits approached
- **Variance Analysis**: Compare planned vs actual spending
- **Historical Trends**: Budget performance over time
- **Department Breakdown**: Budget allocation by department

### Budget Workflow

```
Budget Planning → Allocation → Spending Tracking → 
Variance Analysis → Reporting → Adjustments
```

### Budget Reports

- **Budget vs Actual**: Comparison reports
- **Utilization Reports**: Percentage usage analysis
- **Variance Reports**: Deviation analysis
- **Forecast Reports**: Future budget predictions
- **Department Reports**: Department-wise budget analysis

---

## Hostel Fee Integration

### Hostel Fee Structure

```typescript
interface HostelFee {
  id: string;
  hostelId: string;
  roomTypeId: string;
  feeType: 'ACCOMMODATION' | 'MESS' | 'UTILITIES' | 'MAINTENANCE';
  amount: number;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  dueDate: number; // Day of month
  lateFee?: LateFeeConfig;
  amenities?: string[];
  capacity: number;
  occupied: number;
}
```

### Room Type Categories

| Room Type | Features | Typical Monthly Fee |
|-----------|----------|-------------------|
| **Single Room** | Private room, attached bath | $500-800 |
| **Double Sharing** | Shared room, common bath | $300-500 |
| **Triple Sharing** | 3-person room, common bath | $200-350 |
| **Dormitory** | Multiple beds, common facilities | $100-200 |

### Hostel Fee Components

1. **Accommodation Fees**
   - Room rent based on room type
   - Facility charges (AC, non-AC)
   - Maintenance charges

2. **Mess Fees**
   - Food charges (3 meals/day)
   - Special diet charges
   - Festival charges

3. **Utility Fees**
   - Electricity charges
   - Water charges
   - Internet charges

4. **Other Fees**
   - Laundry charges
   - Security deposit
   - Hostel admission fee

### Resident Billing System

```javascript
class HostelBillingService {
  async calculateMonthlyFee(residentId, month) {
    const resident = await this.getResident(residentId);
    const room = await this.getRoom(resident.roomId);
    
    let totalFee = room.baseFee;
    
    // Add utility charges
    totalFee += this.calculateUtilities(residentId, month);
    
    // Add mess charges
    totalFee += this.calculateMessCharges(residentId, month);
    
    // Apply discounts if any
    totalFee = this.applyDiscounts(totalFee, resident);
    
    return totalFee;
  }
}
```

### Hostel Payment Integration

- **Monthly Billing**: Automatic monthly fee generation
- **Late Fee Calculation**: Automatic late fee for delayed payments
- **Vacation Billing**: Adjusted billing for vacation periods
- **Guest Charges**: Additional charges for guests
- **Damage Charges**: Charges for room damages

---

## Validation & Business Rules

### Fee Validation System

```javascript
const feeValidationSchema = Joi.object({
  name: Joi.string().max(100).required(),
  amount: Joi.number().positive().required(),
  taxRate: Joi.number().min(0).max(100).default(0),
  discountable: Joi.boolean().default(false),
  optional: Joi.boolean().default(false),
  frequency: Joi.string().valid('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'SEMESTER').required(),
  dueDate: Joi.date().optional(),
  lateFee: Joi.object({
    type: Joi.string().valid('FIXED', 'PERCENTAGE').required(),
    value: Joi.number().positive().required(),
    cap: Joi.number().positive().optional()
  }).optional()
});
```

### Payment Validation Rules

```javascript
const paymentValidationRules = {
  amount: {
    min: 1,
    max: 1000000,
    message: 'Amount must be between 1 and 1,000,000'
  },
  paymentDate: {
    type: 'date',
    message: 'Valid payment date required'
  },
  method: {
    enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CHECK', 'SCHOLARSHIP'],
    message: 'Valid payment method required'
  },
  studentId: {
    required: true,
    message: 'Student ID is required'
  }
};
```

### Business Logic Validation

1. **Payment Amount Validation**
   - Cannot exceed outstanding amount (unless prepayment)
   - Minimum payment amount validation
   - Currency validation

2. **Date Validation**
   - Payment date cannot be future date
   - Due date must be after payment date
   - Academic year validation

3. **Student Status Validation**
   - Active student status check
   - Class assignment validation
   - Fee structure assignment check

4. **Installment Validation**
   - Installment amount cannot exceed total
   - Due date sequence validation
   - Payment schedule validation

### Error Handling

```javascript
class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.statusCode = 400;
  }
}

class BusinessRuleError extends Error {
  constructor(message, rule) {
    super(message);
    this.name = 'BusinessRuleError';
    this.rule = rule;
    this.statusCode = 422;
  }
}
```

---

## Audit & Notification Systems

### Audit Logging System

```typescript
interface AuditLog {
  id: string;
  userId: string;
  schoolId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT';
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

### Audit Events Tracked

| Event Type | Description | Data Captured |
|------------|-------------|---------------|
| **Payment Created** | New payment recorded | Amount, method, student |
| **Payment Updated** | Payment details modified | Old vs new values |
| **Refund Processed** | Refund initiated/completed | Refund amount, reason |
| **Fee Structure Modified** | Fee structure changes | Old vs new structure |
| **Balance Calculated** | Balance calculation performed | Input parameters, result |
| **Export Performed** | Data export operation | Export type, filters |
| **Login Attempts** | User authentication | Success/failure, IP |

### Notification System

```typescript
interface Notification {
  id: string;
  type: 'PAYMENT_DUE' | 'PAYMENT_RECEIVED' | 'OVERDUE' | 'REFUND' | 'SYSTEM';
  title: string;
  message: string;
  recipientId: string;
  recipientType: 'STUDENT' | 'PARENT' | 'ADMIN' | 'TEACHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  channels: ('EMAIL' | 'SMS' | 'PUSH' | 'IN_APP')[];
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt?: Date;
  metadata?: Record<string, any>;
}
```

### Notification Triggers

1. **Payment Notifications**
   - Payment confirmation
   - Payment failure
   - Overdue reminders
   - Prepayment alerts

2. **System Notifications**
   - Fee structure updates
   - Balance changes
   - System maintenance
   - Security alerts

3. **Administrative Notifications**
   - Large payment alerts
   - Unusual activity detection
   - Report generation completed
   - Data export completed

### Notification Channels

| Channel | Use Case | Configuration |
|---------|----------|---------------|
| **Email** | Detailed notifications | SMTP settings, templates |
| **SMS** | Urgent alerts | SMS gateway, templates |
| **Push** | Mobile app notifications | FCM/APNS configuration |
| **In-App** | Real-time notifications | WebSocket connection |

---

## Document Generation & Export

### Document Types

| Document Type | Format | Use Case |
|---------------|--------|----------|
| **Payment Receipt** | PDF | Payment confirmation |
| **Fee Statement** | PDF | Student fee summary |
| **Balance Report** | Excel/PDF | Outstanding dues |
| **Financial Report** | Excel/PDF | Comprehensive reports |
| **Tax Invoice** | PDF | Tax-compliant invoice |
| **Refund Receipt** | PDF | Refund confirmation |

### File Generation Service

```javascript
class FileGenerationService {
  async generatePaymentReceipt(paymentId, format = 'PDF') {
    const payment = await this.getPayment(paymentId);
    const student = await this.getStudent(payment.studentId);
    const school = await this.getSchool(payment.schoolId);
    
    const template = this.loadTemplate('payment-receipt');
    const data = { payment, student, school };
    
    switch (format) {
      case 'PDF':
        return this.generatePDF(template, data);
      case 'Excel':
        return this.generateExcel(template, data);
      default:
        throw new Error('Unsupported format');
    }
  }
}
```

### Export Capabilities

1. **Data Export Formats**
   - Excel (.xlsx)
   - CSV (.csv)
   - PDF (.pdf)
   - JSON (.json)

2. **Report Types**
   - Payment summary reports
   - Student balance reports
   - Fee collection reports
   - Overdue payment reports
   - Refund reports
   - Financial analytics reports

3. **Custom Report Builder**
   - Drag-and-drop report builder
   - Custom field selection
   - Filter and sorting options
   - Scheduled report generation
   - Email delivery options

### Template System

- **Template Engine**: Handlebars for dynamic templates
- **Template Management**: Upload and manage templates
- **Multi-language Support**: Templates in multiple languages
- **Branding**: School logo and colors
- **Digital Signatures**: Authorized signatures

---

## Caching & Performance

### Cache Strategy

```javascript
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
    
    // Cache TTL settings
    this.ttlSettings = {
      studentBalance: 2 * 60 * 1000,      // 2 minutes
      feeStructures: 5 * 60 * 1000,       // 5 minutes
      paymentAnalytics: 10 * 60 * 1000,    // 10 minutes
      schoolSettings: 30 * 60 * 1000,     // 30 minutes
    };
  }
}
```

### Cache Types

| Cache Type | TTL | Purpose |
|------------|-----|---------|
| **Student Balance** | 2 minutes | Recent balance calculations |
| **Fee Structures** | 5 minutes | Fee structure data |
| **Payment Analytics** | 10 minutes | Analytics data |
| **School Settings** | 30 minutes | Configuration data |
| **User Sessions** | 24 hours | Authentication data |

### Performance Optimizations

1. **Database Optimizations**
   - Indexed queries for fast lookups
   - Batch operations for bulk processing
   - Connection pooling for database efficiency
   - Query optimization for complex calculations

2. **API Optimizations**
   - Response compression
   - Request rate limiting
   - Pagination for large datasets
   - Lazy loading for related data

3. **Frontend Optimizations**
   - React Query for efficient data fetching
   - Virtual scrolling for large lists
   - Component memoization
   - Bundle splitting for faster loading

### Monitoring & Metrics

```javascript
const performanceMetrics = {
  responseTime: 'Average API response time',
  cacheHitRate: 'Cache effectiveness percentage',
  databaseQueryTime: 'Database query performance',
  memoryUsage: 'Server memory consumption',
  errorRate: 'API error frequency'
};
```

---

## Installation & Setup

### Prerequisites

- Node.js 16+
- MySQL 8.0+
- Prisma ORM
- React 18+
- TypeScript

### Setup Steps

#### 1. Backend Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start development server
npm run dev
```

#### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd copy

# Install dependencies
npm install

# Start development server
npm start
```

#### 3. Finance Module Configuration

```javascript
// Add finance routes to main app
import financeRoutes from './routes/finance.js';
import paymentRoutes from './routes/payments.js';
import studentBalanceRoutes from './routes/studentBalance.js';

app.use('/api/finance', financeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', studentBalanceRoutes);
```

#### 4. Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/school_db"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# File Upload
UPLOAD_DIR="uploads/payments"
MAX_FILE_SIZE="10485760" # 10MB

# Payment Gateway (optional)
PAYMENT_GATEWAY_API_KEY="your-api-key"
PAYMENT_GATEWAY_SECRET="your-secret"

# Email (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-password"
```

### Testing

#### Backend Tests

```bash
# Run payment controller tests
npm test -- paymentController

# Run student balance service tests
npm test -- studentBalanceService

# Run all finance tests
npm test -- finance
```

#### Frontend Tests

```bash
# Run finance component tests
npm test -- finance

# Run integration tests
npm test -- integration:finance
```

#### API Testing

```bash
# Test student balance endpoint
curl -X GET http://localhost:3000/api/students/1/balance \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test payment creation
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentId": 1,
    "amount": 50000,
    "method": "CASH",
    "paymentDate": "2024-01-15"
  }'
```

---

## Conclusion

The Finance Module provides a comprehensive financial management solution for educational institutions. With its robust architecture, extensive features, and secure implementation, it handles all aspects of school financial operations from student payments to complete financial analytics.

### Key Strengths

1. **Comprehensive Coverage**: Handles all financial operations
2. **Real-time Processing**: Live balance and status updates
3. **Flexible Configuration**: Adaptable to different fee structures
4. **Advanced Analytics**: Deep financial insights
5. **Secure Implementation**: Enterprise-grade security
6. **User-Friendly Interface**: Intuitive and responsive design
7. **Scalable Architecture**: Handles growing institutional needs

### Future Enhancements

- Mobile app integration
- Advanced AI-powered analytics
- Multi-currency support
- Integration with accounting systems
- Automated payment reminders
- Parent portal enhancements
- Advanced reporting features

This documentation provides a complete understanding of the finance system's architecture, features, and implementation. For specific implementation details or troubleshooting, refer to the respective component documentation or contact the development team.
