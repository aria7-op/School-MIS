# API Migration Guide - Centralized Secure API Service

## Overview

This guide helps you migrate from the scattered API calls throughout the project to the new centralized, encrypted `SecureApiService`. This ensures all API communications go through a single, secure point that can be easily encrypted and monitored.

## Migration Steps

### 1. Import the New Service

Replace existing API imports with the new secure service:

```typescript
// OLD WAY
import apiService from '../../services/api';
import axios from 'axios';

// NEW WAY
import secureApiService from '../../services/secureApiService';
```

### 2. Replace API Calls

#### Authentication
```typescript
// OLD
const response = await apiService.post('/users/login', credentials);

// NEW
const response = await secureApiService.login(credentials);
```

#### Customer API
```typescript
// OLD
const response = await apiService.get('/customers', { params });

// NEW
const response = await secureApiService.getCustomers(params);
```

#### Student API
```typescript
// OLD
const response = await apiService.get('/students', { params });

// NEW
const response = await secureApiService.getStudents(params);
```

#### Staff API
```typescript
// OLD
const response = await apiService.get('/users', { params });

// NEW
const response = await secureApiService.getStaffMembers(params);
```

#### Finance API
```typescript
// OLD
const response = await apiService.get('/payments', { params });

// NEW
const response = await secureApiService.getPayments(params);
```

### 3. File-by-File Migration

#### Files to Update:

1. **src/features/customers/api.ts** - Replace with direct service calls
2. **src/features/messaging/api.ts** - Replace with direct service calls
3. **src/features/attendance/api.ts** - Replace with direct service calls
4. **src/features/dashboard/components/api.ts** - Replace with direct service calls
5. **src/features/staff/services/staffApi.ts** - Replace with direct service calls
6. **src/features/finance/services/financeApi.ts** - Replace with direct service calls
7. **src/features/teachers/services/teacherApi.ts** - Replace with direct service calls
8. **src/services/api/endpoints.ts** - Replace with direct service calls
9. **src/services/api/client.ts** - Replace with direct service calls

### 4. Hook Updates

Update all hooks that use API calls:

#### src/features/customers/hooks/useCustomerApi.ts
```typescript
// OLD
import apiClient from '../../services/api/client';

// NEW
import secureApiService from '../../services/secureApiService';

// Replace all apiClient calls with secureApiService calls
```

#### src/features/students/hooks/useStudentApi.ts
```typescript
// OLD
import apiService from '../../services/api';

// NEW
import secureApiService from '../../services/secureApiService';

// Replace all apiService calls with secureApiService calls
```

### 5. Context Updates

Update contexts that make API calls:

#### src/contexts/AuthContext.tsx
```typescript
// OLD
const response = await apiService.post('/users/login', credentials);

// NEW
const response = await secureApiService.login(credentials);
```

#### src/contexts/AccessControlContext.tsx
```typescript
// OLD
const response = await apiService.get('/rbac/accessible-components');

// NEW
const response = await secureApiService.fetchAllPermissions();
```

### 6. Screen Updates

Update all screen components:

#### src/features/customers/screens/CustomerScreen.tsx
```typescript
// OLD
const response = await customerApi.getCustomers(params);

// NEW
const response = await secureApiService.getCustomers(params);
```

#### src/features/students/screens/StudentScreen.tsx
```typescript
// OLD
const response = await studentsApiClient.get('/');

// NEW
const response = await secureApiService.getStudents();
```

### 7. Component Updates

Update components that make direct API calls:

#### src/features/finance/screens/AdvancedFinanceDashboard.tsx
```typescript
// OLD
const response = await fetch(`${API_BASE_URL}/payments?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, { headers });

// NEW
const response = await secureApiService.getPayments({
  startDate: dateRange.startDate,
  endDate: dateRange.endDate
});
```

## Security Benefits

### 1. Encryption
- All sensitive data is encrypted before transmission
- Uses AES-256-CBC encryption
- Configurable encryption keys

### 2. Centralized Security
- Single point for security monitoring
- Consistent error handling
- Automatic token management

### 3. Request/Response Interceptors
- Automatic authentication header injection
- Response decryption
- Error handling and retry logic

### 4. Security Headers
- Device type identification
- Client version tracking
- Request timestamping
- Unique request IDs

## Configuration

### Environment Variables
```bash
# Required
REACT_APP_API_BASE_URL=https://sapi.ariadeltatravel.com/api
REACT_APP_API_ENCRYPTION_KEY=your-secure-encryption-key-here

# Optional
REACT_APP_WS_BASE_URL=wss://sapi.ariadeltatravel.com
```

### API Configuration
The service uses `src/services/apiConfig.ts` for all configuration settings including:
- Encryption settings
- Timeout configurations
- Retry logic
- Rate limiting
- Caching settings

## Testing

### Health Check
```typescript
const health = await secureApiService.healthCheck();
console.log('API Health:', health);
```

### Connection Test
```typescript
const status = await secureApiService.getApiStatus();
console.log('API Status:', status);
```

## Error Handling

The new service provides consistent error handling:

```typescript
try {
  const response = await secureApiService.getCustomers();
  // Handle success
} catch (error) {
  // Handle error consistently
  console.error('API Error:', error.message);
}
```

## Migration Checklist

- [ ] Update all import statements
- [ ] Replace direct axios/fetch calls
- [ ] Update all hook files
- [ ] Update all context files
- [ ] Update all screen files
- [ ] Update all component files
- [ ] Test all API endpoints
- [ ] Verify encryption is working
- [ ] Update environment variables
- [ ] Remove old API service files

## Benefits After Migration

1. **Security**: All API calls are encrypted and centralized
2. **Maintainability**: Single point for API logic
3. **Consistency**: Uniform error handling and response format
4. **Monitoring**: Easy to add logging and monitoring
5. **Testing**: Simplified testing with mock service
6. **Performance**: Built-in caching and retry logic

## Next Steps

1. Complete the migration following this guide
2. Test all functionality thoroughly
3. Update documentation
4. Consider adding additional security features
5. Monitor API performance and errors
6. Set up proper logging and monitoring

## Support

If you encounter issues during migration:
1. Check the console for detailed error messages
2. Verify environment variables are set correctly
3. Test individual endpoints using the health check
4. Review the encryption configuration
5. Check network connectivity and CORS settings 