// Real-World Permission System for Tailoring App
// This maps to actual features and components in your application

export const REAL_WORLD_FEATURES = {
  // Core Features
  DASHBOARD: {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Access to main dashboard and analytics',
    permissions: ['view', 'export', 'customize']
  },

  // Academic Management
  STUDENTS: {
    id: 'students',
    name: 'Student Management',
    description: 'Manage student records, profiles, and information',
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'import', 'bulk_operations']
  },

  TEACHERS: {
    id: 'teachers',
    name: 'Teacher Management',
    description: 'Manage teacher records, assignments, and schedules',
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'import', 'assign_subjects']
  },

  CLASSES: {
    id: 'classes',
    name: 'Class Management',
    description: 'Manage classes, schedules, and enrollments',
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'schedule', 'enroll_students']
  },

  ATTENDANCE: {
    id: 'attendance',
    name: 'Attendance Management',
    description: 'Track and manage student attendance',
    permissions: ['view', 'mark', 'edit', 'export', 'bulk_mark', 'reports']
  },

  EXAMS: {
    id: 'exams',
    name: 'Exam Management',
    description: 'Create and manage exams, grades, and results',
    permissions: ['view', 'create', 'edit', 'delete', 'grade', 'export', 'publish_results']
  },

  // Business Management
  CUSTOMERS: {
    id: 'customers',
    name: 'Customer Management',
    description: 'Manage customer records and relationships',
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'import', 'communications']
  },

  FINANCE: {
    id: 'finance',
    name: 'Financial Management',
    description: 'Manage finances, payments, and accounting',
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'reports', 'budget_management']
  },

  STAFF: {
    id: 'staff',
    name: 'Staff Management',
    description: 'Manage staff records and HR functions',
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'payroll', 'performance']
  },

  // Administrative Features
  SCHOOLS: {
    id: 'schools',
    name: 'School Management',
    description: 'Manage school information and settings',
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'configure', 'multi_branch']
  },

  SETTINGS: {
    id: 'settings',
    name: 'System Settings',
    description: 'Configure system settings and preferences',
    permissions: ['view', 'edit', 'advanced_settings', 'security_settings']
  },

  // Resource Management
  RESOURCES: {
    id: 'resources',
    name: 'Resource Management',
    description: 'Manage educational resources and materials',
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'share', 'organize']
  },

  DOCUMENTS: {
    id: 'documents',
    name: 'Document Management',
    description: 'Manage documents and files',
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'share', 'version_control']
  },

  // Advanced Features
  ADMIN: {
    id: 'admin',
    name: 'Administrative Panel',
    description: 'Advanced administrative functions',
    permissions: ['view', 'system_management', 'user_management', 'security', 'audit_logs']
  },

  OWNERS: {
    id: 'owners',
    name: 'Owner Management',
    description: 'Manage business owners and stakeholders',
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'business_analytics']
  },

  // Quantum Analytics (Advanced Features)
  QUANTUM_EVOLUTION_ANALYTICS: {
    id: 'quantum-evolution-analytics',
    name: 'Evolution Analytics',
    description: 'Quantum evolution-based analytics',
    permissions: ['view', 'run_evolution', 'export_results', 'configure_parameters']
  },

  QUANTUM_SWARM_ANALYTICS: {
    id: 'quantum-swarm-analytics',
    name: 'Swarm Analytics',
    description: 'Quantum swarm intelligence analytics',
    permissions: ['view', 'run_swarm', 'export_results', 'configure_swarm']
  },

  NEUROMORPHIC_ANALYTICS: {
    id: 'neuromorphic-analytics',
    name: 'Neuromorphic Analytics',
    description: 'Brain-inspired computing analytics',
    permissions: ['view', 'run_neuromorphic', 'export_results', 'configure_networks']
  },

  QUANTUM_RL_ANALYTICS: {
    id: 'quantum-rl-analytics',
    name: 'RL Analytics',
    description: 'Quantum reinforcement learning analytics',
    permissions: ['view', 'run_rl', 'export_results', 'configure_agents']
  }
};

// Real-World Role Types
export const REAL_WORLD_ROLES = {
  'data-entry-staff': {
    name: 'Data Entry Staff',
    description: 'Basic data entry and record keeping',
    features: ['dashboard', 'students', 'teachers', 'classes'],
    permissions: ['view', 'create', 'edit']
  },
  'teacher': {
    name: 'Teacher',
    description: 'Academic staff with teaching responsibilities',
    features: ['dashboard', 'students', 'classes', 'attendance', 'exams'],
    permissions: ['view', 'create', 'edit', 'grade', 'mark']
  },
  'principal': {
    name: 'Principal',
    description: 'School principal with administrative oversight',
    features: ['dashboard', 'students', 'teachers', 'classes', 'staff', 'finance', 'schools'],
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'reports']
  },
  'admin': {
    name: 'Administrator',
    description: 'System administrator with full access',
    features: ['dashboard', 'students', 'teachers', 'classes', 'staff', 'finance', 'admin', 'settings'],
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'import', 'system_management']
  },
  'owner': {
    name: 'Owner',
    description: 'Business owner with complete system access',
    features: Object.keys(REAL_WORLD_FEATURES),
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'import', 'system_management', 'business_analytics']
  },
  'finance-manager': {
    name: 'Finance Manager',
    description: 'Financial management and accounting',
    features: ['dashboard', 'finance', 'customers', 'staff'],
    permissions: ['view', 'create', 'edit', 'export', 'reports', 'budget_management']
  },
  'hr-manager': {
    name: 'HR Manager',
    description: 'Human resources and staff management',
    features: ['dashboard', 'staff', 'teachers', 'students'],
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'payroll', 'performance']
  },
  'academic-coordinator': {
    name: 'Academic Coordinator',
    description: 'Academic program coordination',
    features: ['dashboard', 'students', 'teachers', 'classes', 'exams', 'attendance'],
    permissions: ['view', 'create', 'edit', 'export', 'schedule', 'enroll_students']
  }
};

// Permission Categories for Organization
export const PERMISSION_CATEGORIES = {
  'academic': {
    name: 'Academic Management',
    features: ['students', 'teachers', 'classes', 'attendance', 'exams']
  },
  'business': {
    name: 'Business Management',
    features: ['customers', 'finance', 'staff']
  },
  'administration': {
    name: 'Administration',
    features: ['schools', 'settings', 'admin', 'owners']
  },
  'resources': {
    name: 'Resources & Documents',
    features: ['resources', 'documents']
  },
  'analytics': {
    name: 'Advanced Analytics',
    features: ['quantum-evolution-analytics', 'quantum-swarm-analytics', 'neuromorphic-analytics', 'quantum-rl-analytics']
  }
};

// Helper Functions
export const getFeaturePermissions = (featureId: string) => {
  const feature = Object.values(REAL_WORLD_FEATURES).find(f => f.id === featureId);
  return feature?.permissions || [];
};

export const getRoleFeatures = (roleName: string) => {
  const role = REAL_WORLD_ROLES[roleName as keyof typeof REAL_WORLD_ROLES];
  return role?.features || [];
};

export const canAccessFeature = (userRole: string, featureId: string, permission: string = 'view') => {
  const role = REAL_WORLD_ROLES[userRole as keyof typeof REAL_WORLD_ROLES];
  if (!role) return false;
  
  const hasFeature = role.features.includes(featureId);
  const hasPermission = role.permissions.includes(permission);
  
  return hasFeature && hasPermission;
};

export const getAllFeatures = () => {
  return Object.values(REAL_WORLD_FEATURES);
};

export const getAllRoles = () => {
  return Object.entries(REAL_WORLD_ROLES).map(([key, role]) => ({
    id: key,
    name: role.name,
    description: role.description
  }));
}; 
