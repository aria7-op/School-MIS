# Advanced Access Control System - Frontend Integration

This document provides comprehensive documentation for the advanced Role-Based Access Control (RBAC) + Attribute-Based Access Control (ABAC) + File/Component Security system integrated with the React frontend.

## 🏗️ Architecture Overview

The system implements a multi-layered security approach:

- **RBAC (Role-Based Access Control)**: User roles and permissions
- **ABAC (Attribute-Based Access Control)**: Contextual access control
- **File Security**: Granular file access permissions
- **Component Security**: UI component-level access control
- **Real-time Updates**: Live permission updates via WebSocket
- **Caching**: Optimized permission caching for performance

## 📦 Core Components

### 1. API Service (`src/services/api.ts`)
Advanced API client with RBAC integration:
- Automatic token management and refresh
- Contextual request headers
- Error handling and retry logic
- Permission-aware API calls

```typescript
import apiService from '../services/api';

// Generate access token with context
const token = await apiService.generateAccessToken({
  deviceType: 'web',
  location: 'office',
  time: new Date().toISOString()
});

// Check access with context
const result = await apiService.checkAccess('users', 'read', {
  userId: '123',
  deviceType: 'web'
});
```

### 2. Authentication Context (`src/contexts/AuthContext.tsx`)
Advanced authentication with RBAC integration:
- Token management and refresh
- Permission caching
- Contextual authentication
- Role and permission checking

```typescript
import { useAuth } from '../contexts/AuthContext';

const { user, hasPermission, hasRole, login, logout } = useAuth();

// Check permissions
if (hasPermission('users:manage')) {
  // User can manage users
}

// Check roles
if (hasRole('admin')) {
  // User is admin
}
```

### 3. Access Control Context (`src/contexts/AccessControlContext.tsx`)
Comprehensive access control management:
- Component access control
- File permission management
- Data scope validation
- Contextual access checking

```typescript
import { useAccessControl } from '../contexts/AccessControlContext';

const { 
  canAccessComponent, 
  canAccessFile, 
  checkAccess,
  accessibleComponents 
} = useAccessControl();

// Check component access
if (canAccessComponent('dashboard', 'VIEW')) {
  // User can view dashboard
}
```

## 🔧 Advanced Hooks

### 1. Component Access Hook (`useComponentAccess`)
```typescript
import { useComponentAccess } from '../hooks/useAccessControl';

const { hasAccess, loading, error } = useComponentAccess('dashboard', 'VIEW');

if (loading) return <LoadingSpinner />;
if (!hasAccess) return <AccessDenied />;
return <Dashboard />;
```

### 2. File Access Hook (`useFileAccess`)
```typescript
import { useFileAccess } from '../hooks/useAccessControl';

const { hasAccess, loading, error } = useFileAccess('document.pdf', 'READ');

if (loading) return <LoadingSpinner />;
if (!hasAccess) return <AccessDenied />;
return <FileViewer />;
```

### 3. Conditional Rendering Hook (`useConditionalRender`)
```typescript
import { useConditionalRender } from '../hooks/useAccessControl';

const { renderComponentIf, renderPermissionIf, renderRoleIf } = useConditionalRender();

// Component-based rendering
{renderComponentIf('admin-panel', 'VIEW', <AdminPanel />)}

// Permission-based rendering
{renderPermissionIf('users:manage', <UserManagement />)}

// Role-based rendering
{renderRoleIf('admin', <AdminFeatures />)}
```

## 🛡️ Secure Components

### 1. Secure Component Wrapper
```typescript
import SecureComponent from '../components/SecureComponent';

<SecureComponent 
  componentId="financial-dashboard" 
  action="VIEW"
  fallback={<AccessDenied />}
>
  <FinancialDashboard />
</SecureComponent>
```

### 2. Secure File Viewer
```typescript
import SecureFile from '../components/SecureFileViewer';

<SecureFile 
  fileId="confidential-report.pdf"
  fileName="Confidential Report"
  onAccessGranted={(fileInfo) => console.log('Access granted')}
  onAccessDenied={(reason) => console.log('Access denied:', reason)}
>
  <FileViewer />
</SecureFile>
```

### 3. Secure Scope Component
```typescript
import SecureScope from '../components/SecureComponent';

<SecureScope scope="financial-data">
  <FinancialReports />
</SecureScope>
```

## 📋 Policy Management

### 1. Policy Creation
```typescript
const policy = {
  name: 'Financial Data Access',
  description: 'Allow access to financial data for managers',
  resource: 'financial-data',
  action: 'read',
  conditions: {
    role: 'manager',
    time: 'business-hours',
    location: 'office'
  },
  effect: 'allow',
  priority: 1
};

await apiService.createPolicy(policy);
```

### 2. Policy Evaluation
```typescript
const result = await apiService.evaluatePolicy({
  policy: policy,
  context: {
    userId: '123',
    role: 'manager',
    time: '09:00',
    location: 'office'
  }
});
```

## 👥 Role Management

### 1. Role Creation
```typescript
const role = {
  name: 'Manager',
  description: 'Department manager role',
  permissions: ['users:read', 'users:write', 'reports:view'],
  parentRole: 'User'
};

await apiService.post('/rbac/roles', role);
```

### 2. Role Assignment
```typescript
await apiService.assignRoleToUser({
  userId: '123',
  roleId: 'manager-role',
  assignedBy: 'admin'
});
```

## 🔍 Debug Tools

### 1. Access Control Debug Component
```typescript
import AccessControlDebug from '../components/AccessControlDebug';

<AccessControlDebug />
```

### 2. Debug Hook
```typescript
import { useAccessControlDebug } from '../hooks/useAccessControl';

const { user, accessibleComponents, filePermissions, debugInfo } = useAccessControlDebug();
```

## 🚀 Integration Guide

### 1. Setup Environment Variables
```bash
# .env
REACT_APP_API_BASE_URL=http://localhost:4000/api
REACT_APP_ACCESS_TOKEN_KEY=frontend_access_token
```

### 2. Wrap App with Providers
```typescript
import { AuthProvider } from './contexts/AuthContext';
import { AccessControlProvider } from './contexts/AccessControlContext';

function App() {
  return (
    <AuthProvider>
      <AccessControlProvider>
        <YourApp />
      </AccessControlProvider>
    </AuthProvider>
  );
}
```

### 3. Use Secure Components
```typescript
// Replace regular components with secure versions
<SecureComponent componentId="dashboard" action="VIEW">
  <Dashboard />
</SecureComponent>

<SecureFile fileId="document.pdf" action="READ">
  <FileViewer />
</SecureFile>
```

### 4. Implement Conditional Rendering
```typescript
const { renderComponentIf, renderPermissionIf } = useConditionalRender();

{renderComponentIf('admin-panel', 'VIEW', <AdminPanel />)}
{renderPermissionIf('users:manage', <UserManagement />)}
```

## 🔐 Security Best Practices

### 1. Always Validate on Both Frontend and Backend
```typescript
// Frontend check (for UX)
if (hasPermission('users:delete')) {
  showDeleteButton();
}

// Backend validation (for security)
const result = await apiService.checkAccess('users', 'delete', context);
if (!result.allowed) {
  throw new Error('Access denied');
}
```

### 2. Use Contextual Access Control
```typescript
const context = {
  deviceType: 'web',
  location: 'office',
  time: new Date().toISOString(),
  userAgent: navigator.userAgent
};

const result = await checkAccess('sensitive-data', 'read', context);
```

### 3. Implement Proper Error Handling
```typescript
try {
  const result = await checkAccess(resource, action, context);
  if (!result.allowed) {
    showAccessDenied(result.reason);
  }
} catch (error) {
  showError('Access check failed');
}
```

### 4. Cache Permissions Appropriately
```typescript
// Use the caching built into the hooks
const { hasAccess } = useComponentAccess('dashboard', 'VIEW');

// Or implement custom caching
const cachedResult = permissionCache.get(cacheKey);
if (cachedResult && !isExpired(cachedResult)) {
  return cachedResult;
}
```

## 📊 Performance Optimization

### 1. Permission Caching
- Built-in caching in hooks
- Configurable TTL
- Automatic cache invalidation

### 2. Lazy Loading
```typescript
const SecureComponent = React.lazy(() => import('./SecureComponent'));

<Suspense fallback={<Loading />}>
  <SecureComponent componentId="heavy-component" action="VIEW">
    <HeavyComponent />
  </SecureComponent>
</Suspense>
```

### 3. Optimized Access Checks
```typescript
// Quick validation without API call
const quickCheck = validateAccess(resource, action, context);

// Detailed check with API call
const detailedCheck = await checkAccess(resource, action, context);
```

## 🧪 Testing

### 1. Unit Tests
```typescript
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';

test('shows component when user has permission', () => {
  render(
    <AuthProvider>
      <SecureComponent componentId="test" action="VIEW">
        <TestComponent />
      </SecureComponent>
    </AuthProvider>
  );
  
  expect(screen.getByText('Test Component')).toBeInTheDocument();
});
```

### 2. Integration Tests
```typescript
test('access control integration', async () => {
  const result = await apiService.checkAccess('users', 'read', {
    userId: 'test-user',
    role: 'admin'
  });
  
  expect(result.allowed).toBe(true);
});
```

## 🔧 Configuration

### 1. Access Control Settings
```typescript
// Configure access control behavior
const accessControlConfig = {
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 3,
  timeout: 10000,
  enableDebug: process.env.NODE_ENV === 'development'
};
```

### 2. Policy Configuration
```typescript
// Configure policy evaluation
const policyConfig = {
  enableContextualAccess: true,
  enableTimeBasedAccess: true,
  enableLocationBasedAccess: true,
  enableDeviceBasedAccess: true
};
```

## 📈 Monitoring and Logging

### 1. Access Logs
```typescript
// Log access attempts
const logAccess = async (resource, action, context, result) => {
  await apiService.post('/access-logs', {
    resource,
    action,
    context,
    result,
    timestamp: new Date().toISOString()
  });
};
```

### 2. Performance Monitoring
```typescript
// Monitor access check performance
const measureAccessCheck = async (resource, action, context) => {
  const start = performance.now();
  const result = await checkAccess(resource, action, context);
  const duration = performance.now() - start;
  
  // Log performance metrics
  logPerformance('access_check', duration, { resource, action });
  
  return result;
};
```

## 🚨 Error Handling

### 1. Access Denied Handling
```typescript
const handleAccessDenied = (reason) => {
  showToast('Access denied', 'error');
  logAccessDenied(reason);
  redirectToLogin();
};
```

### 2. Network Error Handling
```typescript
const handleNetworkError = (error) => {
  if (error.code === 'NETWORK_ERROR') {
    showOfflineMode();
  } else {
    showError('Access check failed');
  }
};
```

## 📚 API Reference

### Core Methods

#### `apiService.generateAccessToken(context)`
Generate RBAC access token with context.

#### `apiService.checkAccess(resource, action, context)`
Check access with contextual information.

#### `apiService.checkFileAccess(fileId, action, context)`
Check file access permissions.

#### `apiService.createPolicy(policy)`
Create new access control policy.

#### `apiService.evaluatePolicy(policy, context)`
Evaluate policy with context.

### Hook Methods

#### `useComponentAccess(componentId, action)`
Hook for component access control.

#### `useFileAccess(fileId, action)`
Hook for file access control.

#### `useConditionalRender()`
Hook for conditional rendering based on permissions.

#### `useAdvancedAccess()`
Advanced access control hook with caching.

## 🔄 Migration Guide

### From Basic Auth to Advanced RBAC

1. **Replace basic auth checks**:
```typescript
// Before
if (user.role === 'admin') {
  // Show admin features
}

// After
if (hasPermission('admin:features')) {
  // Show admin features
}
```

2. **Add secure components**:
```typescript
// Before
<AdminPanel />

// After
<SecureComponent componentId="admin-panel" action="VIEW">
  <AdminPanel />
</SecureComponent>
```

3. **Implement contextual access**:
```typescript
// Before
const canAccess = user.role === 'manager';

// After
const canAccess = await checkAccess('data', 'read', {
  deviceType: 'web',
  location: 'office',
  time: new Date().toISOString()
});
```

## 🎯 Best Practices Summary

1. **Always use secure components** for sensitive features
2. **Implement contextual access control** for dynamic permissions
3. **Cache permissions appropriately** for performance
4. **Validate on both frontend and backend** for security
5. **Use proper error handling** for user experience
6. **Monitor access patterns** for security insights
7. **Test thoroughly** with different user roles and contexts
8. **Document access patterns** for maintenance

## 🔗 Related Documentation

- [Backend RBAC Guide](./guideaccess.txt)
- [API Documentation](./api-docs.md)
- [Security Guidelines](./security-guidelines.md)
- [Performance Optimization](./performance.md)

---

This advanced access control system provides enterprise-grade security with comprehensive RBAC, ABAC, and contextual access control capabilities, ensuring your application remains secure and performant at scale. 