import { lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../constants';

/**
 * Component Registry
 * Manages component loading and access control
 */

// Map to screens matching the screenshot: Customers, Academic, Finance, Exams, Settings
const Customers = lazy(() => import('../features/customers/screens/CustomersScreen'));
const Academic = lazy(() => import('../features/students/screens/StudentsScreen'));
const Finance = lazy(() => import('../features/finance/screens/FinanceScreen'));
const Exams = lazy(() => import('../features/exams/screens/ExamScreen'));
const Settings = lazy(() => import('../components/admin/SystemSettings'));
const Classes = lazy(() => import('../features/classes/screens/ClassesScreen'));
const Attendance = lazy(() => import('../features/attendance/screens/AttendanceScreen'));
const Teachers = lazy(() => import('../features/teachers/screens/TeachersScreen'));
const ParentPortal = lazy(() => import('../features/parentPortal/ParentPortal'));

/**
 * Loading component
 */
const LoadingComponent = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

/**
 * Access Denied component
 */
const AccessDenied = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="text-6xl mb-4">🚫</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">دسترسی محدود</h2>
      <p className="text-gray-600">شما مجوز دسترسی به این بخش را ندارید.</p>
    </div>
  </div>
);

/**
 * Component Registry
 * Maps component names to their actual components with access control
 */
const COMPONENT_REGISTRY = {
  Customers: {
    component: Customers,
    permissions: [],
    title: 'Customers',
    icon: 'customers'
  },
  Academic: {
    component: Academic,
    permissions: [],
    title: 'Academic',
    icon: 'academic'
  },
  Finance: {
    component: Finance,
    permissions: [],
    title: 'Finance',
    icon: 'finance'
  },
  Exams: {
    component: Exams,
    permissions: [],
    title: 'Exams',
    icon: 'exams'
  },
  Classes: {
    component: Classes,
    permissions: [],
    title: 'Classes',
    icon: 'classes'
  },
  Attendance: {
    component: Attendance,
    permissions: [],
    title: 'Attendance',
    icon: 'attendance'
  },
  Teachers: {
    component: Teachers,
    permissions: [],
    title: 'Teachers',
    icon: 'teachers'
  },
  Settings: {
    component: Settings,
    permissions: [],
    title: 'Settings',
    icon: 'settings'
  },
  ParentPortal: {
    component: ParentPortal,
    permissions: ['PARENT'],
    title: 'Parent Portal',
    icon: 'parent'
  }
};

/**
 * Component Renderer
 * Renders components with access control and error boundaries
 */
export const ComponentRenderer = ({ componentName }) => {
  const { user, hasPermission, hasRole } = useAuth();
  
  // Get component info from registry
  const componentInfo = COMPONENT_REGISTRY[componentName];
  
  if (!componentInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Component Not Found</h2>
          <p className="text-gray-600">Component "{componentName}" does not exist.</p>
        </div>
      </div>
    );
  }

  // Check permissions - handle both role-based and permission-based access
  let hasAccess = false;
  
  if (componentInfo.permissions.length === 0) {
    // No permissions required
    hasAccess = true;
  } else {
    // Check if any of the required permissions/roles are met
    hasAccess = componentInfo.permissions.some(permission => {
      // Check if it's a role (uppercase) or permission (lowercase)
      if (permission === permission.toUpperCase()) {
        // It's a role, use hasRole
        return hasRole(permission);
      } else {
        // It's a permission, use hasPermission
        return hasPermission(permission);
      }
    });
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const Component = componentInfo.component;

  return (
    <Suspense fallback={<LoadingComponent />}>
      <Component />
    </Suspense>
  );
};

/**
 * Get component info
 * @param {string} componentName - Name of the component
 * @returns {Object} Component information
 */
export const getComponentInfo = (componentName) => {
  return COMPONENT_REGISTRY[componentName] || null;
};

/**
 * Get all available components for a user
 * @param {Object} user - User object
 * @param {Function} hasPermission - Permission check function
 * @returns {Array} Available components
 */
export const getAvailableComponents = (user, hasPermission) => {
  if (!user) return [];

  return Object.entries(COMPONENT_REGISTRY)
    .filter(([_, componentInfo]) => {
      return componentInfo.permissions.length === 0 || 
        componentInfo.permissions.some(permission => hasPermission(permission));
    })
    .map(([componentName, componentInfo]) => ({
      name: componentName,
      title: componentInfo.title,
      icon: componentInfo.icon,
      permissions: componentInfo.permissions
    }));
};

export default ComponentRenderer; 