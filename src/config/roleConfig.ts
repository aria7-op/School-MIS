// Role-based navigation configuration
export interface RoleConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  permissions: string[];
  features: FeatureConfig[];
}

export interface FeatureConfig {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  screen: string;
  component: any;
  description: string;
  permissions: string[];
  subFeatures?: FeatureConfig[];
  badge?: number;
  isNew?: boolean;
  isBeta?: boolean;
}

// Define all available features
export const ALL_FEATURES: FeatureConfig[] = [
  // Dashboard
  {
    id: 'dashboard',
    name: 'dashboard',
    displayName: 'Dashboard',
    icon: 'view-dashboard',
    screen: 'dashboard',
    component: null, // Will be imported dynamically
    description: 'Main dashboard and overview',
    permissions: ['view_dashboard']
  },

  // Students
  {
    id: 'students',
    name: 'students',
    displayName: 'Students',
    icon: 'account-group',
    screen: 'students',
    component: null,
    description: 'Student management and records',
    permissions: ['view_students', 'manage_students']
  },

  // Teachers
  {
    id: 'teachers',
    name: 'teachers',
    displayName: 'Teachers',
    icon: 'account-tie',
    screen: 'teachers',
    component: null,
    description: 'Teacher management and profiles',
    permissions: ['view_teachers', 'manage_teachers']
  },

  // Staff
  {
    id: 'staff',
    name: 'staff',
    displayName: 'Staff',
    icon: 'briefcase',
    screen: 'staff',
    component: null,
    description: 'Staff management and administration',
    permissions: ['view_staff', 'manage_staff']
  },

  // Customers (CRM)
  {
    id: 'customers',
    name: 'customers',
    displayName: 'Customers',
    icon: 'account',
    screen: 'customers',
    component: null,
    description: 'Customer relationship management',
    permissions: ['view_customers', 'manage_customers']
  },

  // Classes
  {
    id: 'classes',
    name: 'classes',
    displayName: 'Classes',
    icon: 'bookshelf',
    screen: 'classes',
    component: null,
    description: 'Class management and scheduling',
    permissions: ['view_classes', 'manage_classes']
  },

  // Attendance
  {
    id: 'attendance',
    name: 'attendance',
    displayName: 'Attendance',
    icon: 'calendar-check',
    screen: 'attendance',
    component: null,
    description: 'Attendance tracking and management',
    permissions: ['view_attendance', 'manage_attendance']
  },

  // Exams
  {
    id: 'exams',
    name: 'exams',
    displayName: 'Exams',
    icon: 'clipboard-check',
    screen: 'exams',
    component: null,
    description: 'Exam management and results',
    permissions: ['view_exams', 'manage_exams']
  },

  // Finance
  {
    id: 'finance',
    name: 'finance',
    displayName: 'Finance',
    icon: 'currency-usd',
    screen: 'finance',
    component: null,
    description: 'Financial management and accounting',
    permissions: ['view_finance', 'manage_finance']
  },

  // Payments
  {
    id: 'payments',
    name: 'payments',
    displayName: 'Payments',
    icon: 'credit-card',
    screen: 'payments',
    component: null,
    description: 'Payment processing and tracking',
    permissions: ['view_payments', 'manage_payments']
  },

  // Resources
  {
    id: 'resources',
    name: 'resources',
    displayName: 'Resources',
    icon: 'folder',
    screen: 'resources',
    component: null,
    description: 'Resource management and files',
    permissions: ['view_resources', 'manage_resources'],
    subFeatures: [
      {
        id: 'documents',
        name: 'documents',
        displayName: 'Documents',
        icon: 'file-document',
        screen: 'documents',
        component: null,
        description: 'Document management',
        permissions: ['view_documents', 'manage_documents']
      }
    ]
  },

  // Schools
  {
    id: 'schools',
    name: 'schools',
    displayName: 'Schools',
    icon: 'domain',
    screen: 'schools',
    component: null,
    description: 'School management and settings',
    permissions: ['view_schools', 'manage_schools']
  },

  // Admin Panel
  {
    id: 'admin',
    name: 'admin',
    displayName: 'Admin Panel',
    icon: 'shield-crown',
    screen: 'admin',
    component: null,
    description: 'System administration and management',
    permissions: ['view_admin', 'manage_admin']
  },

  // Messaging
  {
    id: 'messaging',
    name: 'messaging',
    displayName: 'Messaging',
            icon: 'chatbubble',
    screen: 'messaging',
    component: null,
    description: 'Real-time messaging and communication',
    permissions: ['view_messaging', 'send_messages', 'manage_conversations']
  },

  // Quantum Analytics
  {
    id: 'quantum-analytics',
    name: 'quantum-analytics',
    displayName: 'Quantum Analytics',
    icon: 'atom',
    screen: 'quantum-analytics',
    component: null,
    description: 'Advanced analytics and insights',
    permissions: ['view_analytics', 'manage_analytics'],
    subFeatures: [
      {
        id: 'quantum-evolution-analytics',
        name: 'quantum-evolution-analytics',
        displayName: 'Evolution Analytics',
        icon: 'dna',
        screen: 'quantum-evolution-analytics',
        component: null,
        description: 'Evolutionary analytics',
        permissions: ['view_evolution_analytics']
      },
      {
        id: 'quantum-swarm-analytics',
        name: 'quantum-swarm-analytics',
        displayName: 'Swarm Analytics',
        icon: 'scatter-plot',
        screen: 'quantum-swarm-analytics',
        component: null,
        description: 'Swarm intelligence analytics',
        permissions: ['view_swarm_analytics']
      },
      {
        id: 'neuromorphic-analytics',
        name: 'neuromorphic-analytics',
        displayName: 'Neuromorphic Analytics',
        icon: 'brain',
        screen: 'neuromorphic-analytics',
        component: null,
        description: 'Neuromorphic computing analytics',
        permissions: ['view_neuromorphic_analytics']
      },
      {
        id: 'quantum-rl-analytics',
        name: 'quantum-rl-analytics',
        displayName: 'RL Analytics',
        icon: 'robot',
        screen: 'quantum-rl-analytics',
        component: null,
        description: 'Reinforcement learning analytics',
        permissions: ['view_rl_analytics']
      }
    ]
  },

  // Reports
  {
    id: 'reports',
    name: 'reports',
    displayName: 'Reports',
    icon: 'chart-line',
    screen: 'reports',
    component: null,
    description: 'Reports and analytics',
    permissions: ['view_reports', 'generate_reports']
  },

  // Settings
  {
    id: 'settings',
    name: 'settings',
    displayName: 'Settings',
    icon: 'cog',
    screen: 'settings',
    component: null,
    description: 'System settings and configuration',
    permissions: ['view_settings', 'manage_settings']
  },

  // Owners
  {
    id: 'owners',
    name: 'owners',
    displayName: 'Owners',
    icon: 'account-star',
    screen: 'owners',
    component: null,
    description: 'Owner management and oversight',
    permissions: ['view_owners', 'manage_owners']
  }
];

// Role configurations
export const ROLES: RoleConfig[] = [
  {
    id: 'admin',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access and management',
    color: '#EF4444',
    icon: 'shield-crown',
    permissions: [
      'view_dashboard',
      'view_students', 'manage_students',
      'view_teachers', 'manage_teachers',
      'view_staff', 'manage_staff',
      'view_customers', 'manage_customers',
      'view_classes', 'manage_classes',
      'view_attendance', 'manage_attendance',
      'view_exams', 'manage_exams',
      'view_finance', 'manage_finance',
      'view_payments', 'manage_payments',
      'view_resources', 'manage_resources',
      'view_documents', 'manage_documents',
      'view_schools', 'manage_schools',
      'view_admin', 'manage_admin',
      'view_analytics', 'manage_analytics',
      'view_evolution_analytics',
      'view_swarm_analytics',
      'view_neuromorphic_analytics',
      'view_rl_analytics',
      'view_reports', 'generate_reports',
      'view_settings', 'manage_settings',
      'view_owners', 'manage_owners',
      'view_messaging', 'send_messages', 'manage_conversations'
    ],
    features: [
      'dashboard',
      'students',
      'teachers',
      'staff',
      'customers',
      'classes',
      'attendance',
      'exams',
      'finance',
      'payments',
      'resources',
      'schools',
      'admin',
      'quantum-analytics',
      'reports',
      'settings',
      'owners',
      'messaging'
    ]
  },

  {
    id: 'teacher',
    name: 'teacher',
    displayName: 'Teacher',
    description: 'Academic staff with teaching responsibilities',
    color: '#3B82F6',
    icon: 'account-tie',
    permissions: [
      'view_dashboard',
      'view_students', 'manage_students',
      'view_teachers', 'manage_teachers',
      'view_classes', 'manage_classes',
      'view_attendance', 'manage_attendance',
      'view_exams', 'manage_exams',
      'view_resources', 'manage_resources',
      'view_documents', 'manage_documents',
      'view_reports', 'manage_reports',
      'view_settings', 'manage_settings',
      'view_messaging', 'send_messages',
      'view_customers', 'manage_customers'
    ],
    features: [
      'dashboard',
      'students',
      'teachers',
      'classes',
      'attendance',
      'exams',
      'resources',
      'reports',
      'settings',
      'messaging',
      'customers'
    ]
  },

  {
    id: 'staff',
    name: 'staff',
    displayName: 'Staff',
    description: 'Administrative staff and support',
    color: '#10B981',
    icon: 'briefcase',
    permissions: [
      'view_dashboard',
      'view_students',
      'view_teachers',
      'view_classes',
      'view_attendance',
      'view_exams',
      'view_resources',
      'view_messaging', 'send_messages',
      'view_documents',
      'view_reports',
      'view_settings'
    ],
    features: [
      'dashboard',
      'students',
      'teachers',
      'classes',
      'attendance',
      'exams',
      'resources',
      'reports',
      'settings',
      'messaging'
    ]
  },

  {
    id: 'CRM_MANAGER',
    name: 'CRM_MANAGER',
    displayName: 'CRM Manager',
    description: 'Customer relationship management',
    color: '#F59E0B',
    icon: 'account-group',
    permissions: [
      'view_dashboard',
      'view_customers', 'manage_customers',
      'view_payments', 'manage_payments',
      'view_reports',
      'view_settings',
      'view_messaging', 'send_messages'
    ],
    features: [
      'dashboard',
      'customers',
      'payments',
      'reports',
      'settings',
      'messaging'
    ]
  },

  {
    id: 'finance_manager',
    name: 'finance_manager',
    displayName: 'Finance Manager',
    description: 'Financial management and accounting',
    color: '#8B5CF6',
    icon: 'currency-usd',
    permissions: [
      'view_dashboard',
      'view_finance', 'manage_finance',
      'view_payments', 'manage_payments',
      'view_reports', 'generate_reports',
      'view_settings',
      'view_messaging', 'send_messages'
    ],
    features: [
      'dashboard',
      'finance',
      'payments',
      'reports',
      'settings',
      'messaging'
    ]
  },

  {
    id: 'owner',
    name: 'owner',
    displayName: 'Owner',
    description: 'System owner with full oversight',
    color: '#6366F1',
    icon: 'account-star',
    permissions: [
      'view_dashboard',
      'view_students', 'manage_students',
      'view_teachers', 'manage_teachers',
      'view_staff', 'manage_staff',
      'view_customers', 'manage_customers',
      'view_classes', 'manage_classes',
      'view_attendance', 'manage_attendance',
      'view_exams', 'manage_exams',
      'view_finance', 'manage_finance',
      'view_payments', 'manage_payments',
      'view_resources', 'manage_resources',
      'view_documents', 'manage_documents',
      'view_schools', 'manage_schools',
      'view_analytics', 'manage_analytics',
      'view_evolution_analytics',
      'view_swarm_analytics',
      'view_neuromorphic_analytics',
      'view_rl_analytics',
      'view_reports', 'generate_reports',
      'view_settings', 'manage_settings',
      'view_owners', 'manage_owners',
      'view_messaging', 'send_messages', 'manage_conversations'
    ],
    features: [
      'dashboard',
      'students',
      'teachers',
      'staff',
      'customers',
      'classes',
      'attendance',
      'exams',
      'finance',
      'payments',
      'resources',
      'schools',
      'quantum-analytics',
      'reports',
      'settings',
      'owners',
      'messaging'
    ]
  },

  {
    id: 'student',
    name: 'student',
    displayName: 'Student',
    description: 'Student with limited access to academic features',
    color: '#06B6D4',
    icon: 'account-school',
    permissions: [
      'view_dashboard',
      'view_students', 'manage_students', // student:read, student:update, student:export
      'view_classes',
      'view_attendance',
      'view_exams',
      'view_resources',
      'view_documents',
      'view_messaging', 'send_messages'
    ],
    features: [
      'dashboard',
      'students',
      'classes',
      'attendance',
      'exams',
      'resources',
      'messaging'
    ]
  }
];

// Helper functions
export const getRoleById = (roleId: string): RoleConfig | undefined => {
  return ROLES.find(role => role.id === roleId);
};

export const getRoleByName = (roleName: string): RoleConfig | undefined => {
  return ROLES.find(role => role.name === roleName);
};

export const getFeaturesForRole = (roleId: string): FeatureConfig[] => {
  const role = getRoleById(roleId);
  if (!role) return [];

  return ALL_FEATURES.filter(feature => 
    role.features.includes(feature.id)
  );
};

export const hasPermission = (roleId: string, permission: string): boolean => {
  const role = getRoleById(roleId);
  if (!role) return false;
  
  return role.permissions.includes(permission);
};

export const canAccessFeature = (roleId: string, featureId: string): boolean => {
  const role = getRoleById(roleId);
  if (!role) return false;
  
  return role.features.includes(featureId);
};

export const getFeatureById = (featureId: string): FeatureConfig | undefined => {
  return ALL_FEATURES.find(feature => feature.id === featureId);
};

export const getSubFeatures = (featureId: string): FeatureConfig[] => {
  const feature = getFeatureById(featureId);
  return feature?.subFeatures || [];
};

// Default role
export const DEFAULT_ROLE = 'admin';

// Role selection storage key
export const ROLE_STORAGE_KEY = 'selected_role'; 
