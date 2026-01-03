import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';
import { REAL_WORLD_FEATURES, REAL_WORLD_ROLES, PERMISSION_CATEGORIES, getFeaturePermissions } from '../../../utils/realWorldPermissions';

interface Role {
  id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  isSystem: boolean;
  isDefault: boolean;
  priority: number;
  features: Array<{
    featureId: string;
    permissions: string[];
  }>;
  createdAt: string;
  updatedAt: string;
}

const RealWorldRoleManager: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form state for creating/editing roles
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    isActive: true,
    isSystem: false,
    isDefault: false,
    priority: 0,
    features: [] as Array<{ featureId: string; permissions: string[] }>
  });

  // Role types based on real-world roles
  const roleTypes = Object.keys(REAL_WORLD_ROLES);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getRoles();
      setRoles(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
      
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!formData.name || !formData.type) {
      setError('Name and type are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const roleData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        isActive: formData.isActive,
        isSystem: formData.isSystem,
        isDefault: formData.isDefault,
        priority: formData.priority,
        features: formData.features
      };

      const response = await apiService.createRole(roleData);

      // Reset form and reload
      setFormData({
        name: '',
        description: '',
        type: '',
        isActive: true,
        isSystem: false,
        isDefault: false,
        priority: 0,
        features: []
      });
      setShowCreateForm(false);
      await loadRoles();
      
      alert('Role created successfully!');
    } catch (err: any) {
      
      setError(err.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    setLoading(true);
    setError(null);

    try {
      const roleData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        isActive: formData.isActive,
        isSystem: formData.isSystem,
        isDefault: formData.isDefault,
        priority: formData.priority,
        features: formData.features
      };

      await apiService.updateRole(editingRole.id, roleData);
      
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        type: '',
        isActive: true,
        isSystem: false,
        isDefault: false,
        priority: 0,
        features: []
      });
      await loadRoles();
      
      alert('Role updated successfully!');
    } catch (err: any) {
      
      setError(err.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    setLoading(true);
    setError(null);

    try {
      await apiService.deleteRole(id);
      await loadRoles();
      alert('Role deleted successfully!');
    } catch (err: any) {
      
      setError(err.message || 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      type: role.type,
      isActive: role.isActive,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      priority: role.priority,
      features: role.features || []
    });
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      type: '',
      isActive: true,
      isSystem: false,
      isDefault: false,
      priority: 0,
      features: []
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureToggle = (featureId: string, permission: string) => {
    setFormData(prev => {
      const existingFeature = prev.features.find(f => f.featureId === featureId);
      
      if (existingFeature) {
        const updatedPermissions = existingFeature.permissions.includes(permission)
          ? existingFeature.permissions.filter(p => p !== permission)
          : [...existingFeature.permissions, permission];
        
        const updatedFeatures = prev.features.map(f => 
          f.featureId === featureId 
            ? { ...f, permissions: updatedPermissions }
            : f
        );
        
        return { ...prev, features: updatedFeatures };
      } else {
        return {
          ...prev,
          features: [...prev.features, { featureId, permissions: [permission] }]
        };
      }
    });
  };

  const hasPermission = (featureId: string, permission: string) => {
    const feature = formData.features.find(f => f.featureId === featureId);
    return feature ? feature.permissions.includes(permission) : false;
  };

  const getFeatureDisplayName = (featureId: string) => {
    const feature = Object.values(REAL_WORLD_FEATURES).find(f => f.id === featureId);
    return feature ? feature.name : featureId;
  };

  const getPermissionDisplayName = (permission: string) => {
    const permissionNames: { [key: string]: string } = {
      'view': 'View',
      'create': 'Create',
      'edit': 'Edit',
      'delete': 'Delete',
      'export': 'Export',
      'import': 'Import',
      'grade': 'Grade',
      'mark': 'Mark',
      'schedule': 'Schedule',
      'publish': 'Publish',
      'share': 'Share',
      'organize': 'Organize',
      'reports': 'Reports',
      'bulk_operations': 'Bulk Operations',
      'assign_subjects': 'Assign Subjects',
      'enroll_students': 'Enroll Students',
      'bulk_mark': 'Bulk Mark',
      'publish_results': 'Publish Results',
      'bulk_update': 'Bulk Update',
      'calculate_gpa': 'Calculate GPA',
      'conflict_resolution': 'Conflict Resolution',
      'communications': 'Communications',
      'budget_management': 'Budget Management',
      'refund': 'Refund',
      'payroll': 'Payroll',
      'performance': 'Performance',
      'multi_branch': 'Multi Branch',
      'advanced_settings': 'Advanced Settings',
      'security_settings': 'Security Settings',
      'schedule': 'Schedule',
      'custom_reports': 'Custom Reports',
      'analytics': 'Analytics',
      'targeted': 'Targeted',
      'version_control': 'Version Control',
      'curriculum_planning': 'Curriculum Planning',
      'system_management': 'System Management',
      'user_management': 'User Management',
      'security': 'Security',
      'audit_logs': 'Audit Logs',
      'business_analytics': 'Business Analytics',
      'run_analytics': 'Run Analytics',
      'export_results': 'Export Results',
      'configure_models': 'Configure Models',
      'run_evolution': 'Run Evolution',
      'configure_parameters': 'Configure Parameters',
      'run_swarm': 'Run Swarm',
      'configure_swarm': 'Configure Swarm',
      'run_neuromorphic': 'Run Neuromorphic',
      'configure_networks': 'Configure Networks',
      'run_rl': 'Run RL',
      'configure_agents': 'Configure Agents'
    };
    return permissionNames[permission] || permission;
  };

  return (
    <div className="real-world-role-manager">
      <div className="header">
        <h2>🌍 Real-World Role Management</h2>
        <button 
          style={{
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Role'}
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          border: '1px solid #FCA5A5'
        }}>
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingRole) && (
        <div style={{
          backgroundColor: '#F8F9FA',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #E9ECEF'
        }}>
          <h3>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
          
          <div className="form-section">
            <h4>Basic Information</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Data Entry Staff"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Role description"
                  rows={3}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Role Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Role Type</option>
                  {roleTypes.map(type => (
                    <option key={type} value={type}>
                      {REAL_WORLD_ROLES[type as keyof typeof REAL_WORLD_ROLES]?.name || type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  />
                  Active
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isSystem}
                    onChange={(e) => handleInputChange('isSystem', e.target.checked)}
                  />
                  System Role
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  />
                  Default Role
                </label>
              </div>
            </div>
          </div>

          {/* Feature Permissions */}
          <div className="form-section">
            <h4>Feature Permissions</h4>
            
            {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
              <div key={categoryKey} className="category-container">
                <h5 className="category-title">{category.name}</h5>
                
                {category.features.map(featureId => {
                  const feature = Object.values(REAL_WORLD_FEATURES).find(f => f.id === featureId);
                  if (!feature) return null;

                  return (
                    <div key={featureId} className="feature-container">
                      <div className="feature-header">
                        <h6 className="feature-name">{feature.name}</h6>
                        <p className="feature-description">{feature.description}</p>
                      </div>
                      
                      <div className="permissions-container">
                        {feature.permissions.map(permission => (
                          <button
                            key={permission}
                            onClick={() => handleFeatureToggle(featureId, permission)}
                            style={{
                              backgroundColor: hasPermission(featureId, permission) ? '#007AFF' : '#F3F4F6',
                              color: hasPermission(featureId, permission) ? 'white' : '#374151',
                              border: '1px solid #D1D5DB',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              margin: '2px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            {getPermissionDisplayName(permission)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={editingRole ? handleUpdateRole : handleCreateRole}
              disabled={loading}
              style={{
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                marginRight: '10px'
              }}
            >
              {loading ? 'Saving...' : (editingRole ? 'Update Role' : 'Create Role')}
            </button>
            
            {editingRole && (
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="roles-list">
        <h3>Existing Roles</h3>
        
        {loading ? (
          <div className="loading">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="no-data">No roles found</div>
        ) : (
          <div className="roles-grid">
            {roles.map(role => (
              <div key={role.id} className="role-card">
                <div className="role-header">
                  <div className="role-info">
                    <h4 className="role-name">{role.name}</h4>
                    <p className="role-description">{role.description}</p>
                    <div className="role-meta">
                      <span className={`status-badge ${role.isActive ? 'active' : 'inactive'}`}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="role-type">{role.type}</span>
                      <span className="role-priority">Priority: {role.priority}</span>
                    </div>
                  </div>
                  
                  <div className="role-actions">
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleEdit(role)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Feature Summary */}
                {role.features && role.features.length > 0 && (
                  <div className="features-summary">
                    <h5>Features ({role.features.length})</h5>
                    <div className="features-list">
                      {role.features.slice(0, 5).map(feature => (
                        <span key={feature.featureId} className="feature-badge">
                          {getFeatureDisplayName(feature.featureId)}
                          <span className="feature-count">({feature.permissions.length} perms)</span>
                        </span>
                      ))}
                      {role.features.length > 5 && (
                        <span className="more-features">+{role.features.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .real-world-role-manager {
          padding: 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .form-container {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-section h4 {
          color: #2c3e50;
          margin-bottom: 12px;
          font-size: 16px;
          font-weight: 600;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          margin-bottom: 0;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
        }

        .category-container {
          margin-bottom: 20px;
        }

        .category-title {
          color: #374151;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .feature-container {
          background: #f9fafb;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
        }

        .feature-header {
          margin-bottom: 8px;
        }

        .feature-name {
          color: #1f2937;
          margin-bottom: 4px;
          font-size: 14px;
          font-weight: 600;
        }

        .feature-description {
          color: #6b7280;
          font-size: 12px;
          margin: 0;
        }

        .permissions-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .permission-button {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          font-size: 11px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .permission-button.active {
          background: #6366f1;
          border-color: #6366f1;
          color: white;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .roles-list {
          margin-top: 20px;
        }

        .roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .role-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .role-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .role-info {
          flex: 1;
        }

        .role-name {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .role-description {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #6b7280;
        }

        .role-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .role-type {
          font-size: 12px;
          color: #6366f1;
          font-weight: 500;
        }

        .role-priority {
          font-size: 12px;
          color: #6b7280;
        }

        .role-actions {
          display: flex;
          gap: 6px;
        }

        .features-summary {
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .features-summary h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .features-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .feature-badge {
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          color: #374151;
          font-weight: 500;
        }

        .feature-count {
          color: #6b7280;
          margin-left: 4px;
        }

        .more-features {
          font-size: 11px;
          color: #6366f1;
          font-style: italic;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-outline-primary {
          background: transparent;
          color: #007bff;
          border: 1px solid #007bff;
        }

        .btn-outline-danger {
          background: transparent;
          color: #dc3545;
          border: 1px solid #dc3545;
        }

        .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
        }

        .alert {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .alert-danger {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .loading, .no-data {
          text-align: center;
          padding: 20px;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default RealWorldRoleManager; 
