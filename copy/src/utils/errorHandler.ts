// Comprehensive Error Handler Utility
export const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Unauthorized - Invalid or missing token
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return {
          type: 'AUTH_ERROR',
          message: 'Your session has expired. Please log in again.',
          status: 401
        };

      case 403:
        // Forbidden - Insufficient permissions
        
        return {
          type: 'PERMISSION_ERROR',
          message: 'You do not have permission to perform this action.',
          status: 403
        };

      case 404:
        // Not Found - Resource not found
        
        return {
          type: 'NOT_FOUND',
          message: 'The requested resource was not found.',
          status: 404
        };

      case 422:
        // Validation Error - Invalid request data
        
        const errors = data.details || [];
        const errorMessages = errors.map((e: any) => e.message).join(', ');
        return {
          type: 'VALIDATION_ERROR',
          message: `Validation errors: ${errorMessages}`,
          status: 422,
          details: errors
        };

      case 500:
        // Internal Server Error
        
        return {
          type: 'SERVER_ERROR',
          message: 'An internal server error occurred. Please try again later.',
          status: 500
        };

      default:
        // Other HTTP errors
        
        return {
          type: 'HTTP_ERROR',
          message: data.message || 'An error occurred. Please try again.',
          status: status
        };
    }
  } else if (error.request) {
    // Network error
    
    return {
      type: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection and try again.',
      status: 0
    };
  } else {
    // Other errors
    
    return {
      type: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      status: 0
    };
  }
};

// Permission Error Handler
export const handlePermissionError = (requiredPermission: string, userPermissions: string[]) => {

  return {
    type: 'PERMISSION_ERROR',
    message: `You do not have the required permission: ${requiredPermission}`,
    requiredPermission: requiredPermission,
    userPermissions: userPermissions
  };
};

// Validation Error Handler
export const handleValidationError = (errors: any[]) => {

  const errorMessages = errors.map(error => {
    if (typeof error === 'string') {
      return error;
    }
    return error.message || 'Invalid input';
  }).join(', ');

  return {
    type: 'VALIDATION_ERROR',
    message: `Validation errors: ${errorMessages}`,
    details: errors
  };
};

// Authentication Error Handler
export const handleAuthError = (error: any) => {

  let message = 'Authentication failed.';
  
  if (error.message) {
    message = error.message;
  } else if (error.code === 'INVALID_CREDENTIALS') {
    message = 'Invalid email or password.';
  } else if (error.code === 'TOKEN_EXPIRED') {
    message = 'Your session has expired. Please log in again.';
  } else if (error.code === 'ACCOUNT_LOCKED') {
    message = 'Your account has been locked. Please contact support.';
  }

  return {
    type: 'AUTH_ERROR',
    message: message,
    code: error.code
  };
};

// Rate Limiting Error Handler
export const handleRateLimitError = (error: any) => {

  return {
    type: 'RATE_LIMIT_ERROR',
    message: 'Too many requests. Please wait a moment and try again.',
    retryAfter: error.retryAfter || 60
  };
};

// Error Display Helper
export const displayError = (error: any) => {
  const errorInfo = handleApiError(error);
  
  // In a React Native app, you would use Alert or a custom modal
  if (typeof window !== 'undefined') {
    alert(errorInfo.message);
  }
  
  return errorInfo;
};

// Error Logging Helper
export const logError = (error: any, context?: any) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: error,
    context: context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
  };

  // In production, you would send this to an error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Send to error reporting service (e.g., Sentry, LogRocket)

  }

  return errorInfo;
};

// Retry Helper
export const retryOperation = async (
  operation: () => Promise<any>,
  maxRetries: number = 3,
  delay: number = 1000
) => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};

// Error Boundary Helper
export const createErrorBoundary = (error: Error, errorInfo: any) => {
  const errorData = {
    error: error,
    errorInfo: errorInfo,
    timestamp: new Date().toISOString(),
    stack: error.stack,
    message: error.message
  };

  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {

  }

  return errorData;
};

// Permission Check Helper
export const checkPermission = (
  requiredPermission: string,
  userPermissions: string[],
  userRole?: string
) => {
  // Super admin has all permissions
  if (userRole === 'SUPER_ADMIN' || userRole === 'owner') {
    return true;
  }

  return userPermissions.includes(requiredPermission);
};

// Multiple Permission Check Helper
export const checkMultiplePermissions = (
  requiredPermissions: string[],
  userPermissions: string[],
  requireAll: boolean = false,
  userRole?: string
) => {
  // Super admin has all permissions
  if (userRole === 'SUPER_ADMIN' || userRole === 'owner') {
    return true;
  }

  if (requireAll) {
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  } else {
    return requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
  }
};

// Error Types
export const ERROR_TYPES = {
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];

// Error Response Interface
export interface ErrorResponse {
  type: ErrorType;
  message: string;
  status?: number;
  details?: any;
  code?: string;
  retryAfter?: number;
} 
