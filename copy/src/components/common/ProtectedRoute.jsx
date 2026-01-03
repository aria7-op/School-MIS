import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants';

/**
 * Protected Route Component
 * Wraps routes that require authentication and specific permissions
 */
const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  requiredRole = null,
  fallbackPath = ROUTES.LOGIN,
  showUnauthorized = true 
}) => {
  const { isAuthenticated, isLoading, user, hasAllPermissions, getUserRole } = useAuth();
  const location = useLocation();

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role requirement
  if (requiredRole && getUserRole() !== requiredRole) {
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have the required role to access this page.
            </p>
            <p className="text-sm text-gray-500">
              Required role: {requiredRole} | Your role: {getUserRole()}
            </p>
          </div>
        </div>
      );
    }
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Check permissions requirement
  if (requiredPermissions.length > 0 && !hasAllPermissions(requiredPermissions)) {
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have the required permissions to access this page.
            </p>
            <div className="text-sm text-gray-500">
              <p className="mb-2">Required permissions:</p>
              <ul className="list-disc list-inside">
                {requiredPermissions.map(permission => (
                  <li key={permission}>{permission}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Render children if all checks pass
  return children;
};

/**
 * Admin Route Component
 * Route that only allows admin users
 */
export const AdminRoute = ({ children, fallbackPath = ROUTES.DASHBOARD }) => (
  <ProtectedRoute 
    requiredRole="ADMIN" 
    fallbackPath={fallbackPath}
    children={children}
  />
);

/**
 * Operator Route Component
 * Route that allows admin and operator users
 */
export const OperatorRoute = ({ children, fallbackPath = ROUTES.DASHBOARD }) => {
  const { isAdmin, isOperator } = useAuth();
  
  if (!isAdmin() && !isOperator()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            This page is only accessible to administrators and operators.
          </p>
        </div>
      </div>
    );
  }
  
  return children;
};

/**
 * Permission Route Component
 * Route that requires specific permissions
 */
export const PermissionRoute = ({ 
  children, 
  permissions = [], 
  fallbackPath = ROUTES.DASHBOARD 
}) => (
  <ProtectedRoute 
    requiredPermissions={permissions}
    fallbackPath={fallbackPath}
    children={children}
  />
);

/**
 * Public Route Component
 * Route that redirects authenticated users to dashboard
 */
export const PublicRoute = ({ children, redirectTo = ROUTES.DASHBOARD }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute; 