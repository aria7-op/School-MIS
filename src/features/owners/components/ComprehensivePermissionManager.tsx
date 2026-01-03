import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';

// ALL REAL FEATURES AND COMPONENTS FROM YOUR PROJECT
const REAL_FEATURES_AND_COMPONENTS = {
  // Dashboard
  'dashboard': {
    name: 'Dashboard',
    components: [
      'dashboard-view',
      'dashboard-analytics',
      'dashboard-export',
      'dashboard-customize'
    ]
  },

  // Students
  'students': {
    name: 'Students Management',
    components: [
      'students-view',
      'students-create',
      'students-edit',
      'students-delete',
      'students-export',
      'students-import',
      'students-bulk-operations',
      'students-analytics',
      'students-search',
      'students-filter',
      'students-documents',
      'students-attendance',
      'students-performance',
      'students-grades',
      'students-behavior',
      'students-health-records',
      'students-financial'
    ]
  },

  // Teachers
  'teachers': {
    name: 'Teachers Management',
    components: [
      'teachers-view',
      'teachers-create',
      'teachers-edit',
      'teachers-delete',
      'teachers-export',
      'teachers-import',
      'teachers-bulk-operations',
      'teachers-analytics',
      'teachers-search',
      'teachers-filter',
      'teachers-documents',
      'teachers-performance',
      'teachers-schedule',
      'teachers-subjects',
      'teachers-salary',
      'teachers-attendance'
    ]
  },

  // Classes
  'classes': {
    name: 'Classes Management',
    components: [
      'classes-view',
      'classes-create',
      'classes-edit',
      'classes-delete',
      'classes-export',
      'classes-import',
      'classes-bulk-operations',
      'classes-analytics',
      'classes-search',
      'classes-filter',
      'classes-students',
      'classes-subjects',
      'classes-timetable',
      'classes-exams',
      'classes-assignments',
      'classes-attendance',
      'classes-performance'
    ]
  },

  // Staff
  'staff': {
    name: 'Staff Management',
    components: [
      'staff-view',
      'staff-create',
      'staff-edit',
      'staff-delete',
      'staff-export',
      'staff-import',
      'staff-bulk-operations',
      'staff-analytics',
      'staff-search',
      'staff-filter',
      'staff-documents',
      'staff-performance',
      'staff-payroll',
      'staff-attendance',
      'staff-departments'
    ]
  },

  // Visitors
  'visitors': {
    name: 'Visitors Management',
    components: [
      'visitor-list',
      'visitor-form',
      'visitor-analytics',
      'visitor-conversion'
    ]
  },

  // Customers
  'customers': {
    name: 'Visitors Management',
    components: [
      'customers-view',
      'customers-create',
      'customers-edit',
      'customers-delete',
      'customers-export',
      'customers-import',
      'customers-bulk-operations',
      'customers-analytics',
      'customers-search',
      'customers-filter',
      'customers-documents',
      'customers-pipeline',
      'customers-segments',
      'customers-automation',
      'customers-collaboration',
      'customers-support-tickets',
      'customers-tasks'
    ]
  },

  // Finance
  'finance': {
    name: 'Finance Management',
    components: [
      'finance-view',
      'finance-create',
      'finance-edit',
      'finance-delete',
      'finance-export',
      'finance-import',
      'finance-bulk-operations',
      'finance-analytics',
      'finance-search',
      'finance-filter',
      'finance-payments',
      'finance-transactions',
      'finance-budgets',
      'finance-expenses',
      'finance-installments',
      'finance-accounts',
      'finance-payrolls',
      'finance-payroll-analytics',
      'finance-fees',
      'finance-reports'
    ]
  },

  // Attendance
  'attendance': {
    name: 'Attendance Management',
    components: [
      'attendance-view',
      'attendance-mark',
      'attendance-edit',
      'attendance-delete',
      'attendance-export',
      'attendance-import',
      'attendance-bulk-operations',
      'attendance-analytics',
      'attendance-search',
      'attendance-filter',
      'attendance-reports',
      'attendance-bulk-mark'
    ]
  },

  // Exams
  'exams': {
    name: 'Exams Management',
    components: [
      'exams-view',
      'exams-create',
      'exams-edit',
      'exams-delete',
      'exams-export',
      'exams-import',
      'exams-bulk-operations',
      'exams-analytics',
      'exams-search',
      'exams-filter',
      'exams-grade',
      'exams-publish-results',
      'exams-schedule',
      'exams-results'
    ]
  },

  // Resources
  'resources': {
    name: 'Resources Management',
    components: [
      'resources-view',
      'resources-create',
      'resources-edit',
      'resources-delete',
      'resources-export',
      'resources-import',
      'resources-bulk-operations',
      'resources-analytics',
      'resources-search',
      'resources-filter',
      'resources-share',
      'resources-organize'
    ]
  },

  // Documents
  'documents': {
    name: 'Documents Management',
    components: [
      'documents-view',
      'documents-create',
      'documents-edit',
      'documents-delete',
      'documents-export',
      'documents-import',
      'documents-bulk-operations',
      'documents-analytics',
      'documents-search',
      'documents-filter',
      'documents-share',
      'documents-version-control'
    ]
  },

  // Schools
  'schools': {
    name: 'Schools Management',
    components: [
      'schools-view',
      'schools-create',
      'schools-edit',
      'schools-delete',
      'schools-export',
      'schools-import',
      'schools-bulk-operations',
      'schools-analytics',
      'schools-search',
      'schools-filter',
      'schools-configure',
      'schools-multi-branch'
    ]
  },

  // Settings
  'settings': {
    name: 'System Settings',
    components: [
      'settings-view',
      'settings-edit',
      'settings-advanced-settings',
      'settings-security-settings',
      'settings-system-configuration'
    ]
  },

  // Admin
  'admin': {
    name: 'Administrative Panel',
    components: [
      'admin-view',
      'admin-system-management',
      'admin-user-management',
      'admin-security',
      'admin-audit-logs',
      'admin-backup',
      'admin-restore'
    ]
  },

  // Owners
  'owners': {
    name: 'Owners Management',
    components: [
      'owners-view',
      'owners-create',
      'owners-edit',
      'owners-delete',
      'owners-export',
      'owners-import',
      'owners-bulk-operations',
      'owners-analytics',
      'owners-search',
      'owners-filter',
      'owners-business-analytics'
    ]
  },

  // Quantum Analytics
  'quantum-evolution-analytics': {
    name: 'Evolution Analytics',
    components: [
      'quantum-evolution-view',
      'quantum-evolution-run',
      'quantum-evolution-export-results',
      'quantum-evolution-configure-parameters'
    ]
  },

  'quantum-swarm-analytics': {
    name: 'Swarm Analytics',
    components: [
      'quantum-swarm-view',
      'quantum-swarm-run',
      'quantum-swarm-export-results',
      'quantum-swarm-configure-swarm'
    ]
  },

  'neuromorphic-analytics': {
    name: 'Neuromorphic Analytics',
    components: [
      'neuromorphic-view',
      'neuromorphic-run',
      'neuromorphic-export-results',
      'neuromorphic-configure-networks'
    ]
  },

  'quantum-rl-analytics': {
    name: 'RL Analytics',
    components: [
      'quantum-rl-view',
      'quantum-rl-run',
      'quantum-rl-export-results',
      'quantum-rl-configure-agents'
    ]
  }
};

const ComprehensivePermissionManager: React.FC = () => {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [permissionName, setPermissionName] = useState('');
  const [permissionDescription, setPermissionDescription] = useState('');

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPermissions();
      setPermissions(response.data || response);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleComponentToggle = (componentId: string) => {
    setSelectedComponents(prev => 
      prev.includes(componentId) 
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };

  const handleCreatePermission = async () => {
    if (!permissionName || selectedFeatures.length === 0 || selectedComponents.length === 0) {
      alert('Please provide permission name and select at least one feature and component');
      return;
    }

    setLoading(true);
    try {
      const permissionData = {
        name: permissionName,
        description: permissionDescription,
        features: selectedFeatures,
        components: selectedComponents
      };

      await apiService.createPermission(permissionData);
      
      // Reset form
      setPermissionName('');
      setPermissionDescription('');
      setSelectedFeatures([]);
      setSelectedComponents([]);
      setShowCreateForm(false);
      
      await loadPermissions();
      alert('Permission created successfully!');
    } catch (error) {
      
      alert('Failed to create permission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h2>🔐 Comprehensive Permission Management</h2>
        <button
          style={{
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Permission'}
        </button>
      </div>

      {/* Create Permission Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: '#F8F9FA',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #E9ECEF'
        }}>
          <h3>Create New Permission</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Permission Name *
            </label>
            <input
              type="text"
              value={permissionName}
              onChange={(e) => setPermissionName(e.target.value)}
              placeholder="e.g., Student Management Access"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Description
            </label>
            <textarea
              value={permissionDescription}
              onChange={(e) => setPermissionDescription(e.target.value)}
              placeholder="Permission description"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>Select Features and Components</h4>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Choose which features and components this permission will grant access to:
            </p>
          </div>

          {/* Features and Components Selection */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {Object.entries(REAL_FEATURES_AND_COMPONENTS).map(([featureId, feature]) => (
              <div key={featureId} style={{ marginBottom: '20px', border: '1px solid #E9ECEF', borderRadius: '6px', padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(featureId)}
                    onChange={() => handleFeatureToggle(featureId)}
                    style={{ marginRight: '10px' }}
                  />
                  <h5 style={{ margin: 0, fontWeight: '600', color: '#374151' }}>
                    {feature.name}
                  </h5>
                </div>
                
                <div style={{ marginLeft: '25px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                    {feature.components.map(componentId => (
                      <div key={componentId} style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedComponents.includes(componentId)}
                          onChange={() => handleComponentToggle(componentId)}
                          style={{ marginRight: '8px' }}
                        />
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>
                          {componentId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              onClick={handleCreatePermission}
              disabled={loading}
              style={{
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create Permission'}
            </button>
          </div>
        </div>
      )}

      {/* Existing Permissions */}
      <div>
        <h3>Existing Permissions</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading permissions...</div>
        ) : permissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No permissions found</div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {permissions.map(permission => (
              <div key={permission.id} style={{
                border: '1px solid #E9ECEF',
                borderRadius: '6px',
                padding: '15px',
                backgroundColor: 'white'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>{permission.name}</h4>
                {permission.description && (
                  <p style={{ margin: '0 0 10px 0', color: '#6B7280', fontSize: '14px' }}>
                    {permission.description}
                  </p>
                )}
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                  Features: {permission.features?.length || 0} | Components: {permission.components?.length || 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensivePermissionManager; 
