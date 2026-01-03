import React, { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';

interface Permission {
  id: string;
  name: string;
  description: string;
  resourceType: string;
  resourceId: string;
  action: string;
  scope: string;
  createdAt: string;
  updatedAt: string;
}

const PermissionManager: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  // Form state for creating/editing permissions
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resourceType: '',
    resourceId: '',
    action: '',
    scope: ''
  });

  // Resource types and actions as per guide
  const resourceTypes = [
    'STUDENT', 'TEACHER', 'CLASS', 'SCHOOL', 'FINANCE', 'LIBRARY', 
    'REPORT', 'SETTING', 'USER', 'ROLE', 'GROUP', 'PERMISSION'
  ];

  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT'];
  const scopes = ['OWN', 'SCHOOL', 'ALL', 'CUSTOM'];

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getPermissions();
      setPermissions(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Failed to load permissions');
      
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.resourceType || !formData.resourceId || !formData.action || !formData.scope) {
        throw new Error('All fields are required');
      }

      const permissionData = {
        name: formData.name,
        description: formData.description,
        resourceType: formData.resourceType,
        resourceId: formData.resourceId,
        action: formData.action,
        scope: formData.scope
      };

      await apiService.createPermission(permissionData);
      
      // Reset form and reload
      setFormData({
        name: '',
        description: '',
        resourceType: '',
        resourceId: '',
        action: '',
        scope: ''
      });
      setShowCreateForm(false);
      await loadPermissions();
      
      alert('Permission created successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to create permission');
      
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermission) return;

    setLoading(true);
    setError(null);

    try {
      const permissionData = {
        name: formData.name,
        description: formData.description,
        resourceType: formData.resourceType,
        resourceId: formData.resourceId,
        action: formData.action,
        scope: formData.scope
      };

      await apiService.updatePermission(editingPermission.id, permissionData);
      
      setEditingPermission(null);
      setFormData({
        name: '',
        description: '',
        resourceType: '',
        resourceId: '',
        action: '',
        scope: ''
      });
      await loadPermissions();
      
      alert('Permission updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update permission');
      
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;

    setLoading(true);
    setError(null);

    try {
      await apiService.deletePermission(id);
      await loadPermissions();
      alert('Permission deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to delete permission');
      
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name,
      description: permission.description,
      resourceType: permission.resourceType,
      resourceId: permission.resourceId,
      action: permission.action,
      scope: permission.scope
    });
  };

  const handleCancelEdit = () => {
    setEditingPermission(null);
    setFormData({
      name: '',
      description: '',
      resourceType: '',
      resourceId: '',
      action: '',
      scope: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="permission-manager">
      <div className="header">
        <h2>Permission Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Permission'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingPermission) && (
        <div className="form-container">
          <h3>{editingPermission ? 'Edit Permission' : 'Create New Permission'}</h3>
          <form onSubmit={editingPermission ? handleUpdatePermission : handleCreatePermission}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., student:read"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Permission description"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Resource Type *</label>
                <select
                  name="resourceType"
                  value={formData.resourceType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Resource Type</option>
                  {resourceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Resource ID *</label>
                <input
                  type="text"
                  name="resourceId"
                  value={formData.resourceId}
                  onChange={handleInputChange}
                  placeholder="e.g., student, teacher"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Action *</label>
                <select
                  name="action"
                  value={formData.action}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Action</option>
                  {actions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Scope *</label>
                <select
                  name="scope"
                  value={formData.scope}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Scope</option>
                  {scopes.map(scope => (
                    <option key={scope} value={scope}>{scope}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingPermission ? 'Update Permission' : 'Create Permission')}
              </button>
              {editingPermission && (
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Permissions List */}
      <div className="permissions-list">
        <h3>Existing Permissions</h3>
        
        {loading ? (
          <div className="loading">Loading permissions...</div>
        ) : permissions.length === 0 ? (
          <div className="no-data">No permissions found</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Resource</th>
                  <th>Action</th>
                  <th>Scope</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map(permission => (
                  <tr key={permission.id}>
                    <td>{permission.name}</td>
                    <td>{permission.description}</td>
                    <td>{permission.resourceType}/{permission.resourceId}</td>
                    <td>
                      <span className={`badge badge-${permission.action.toLowerCase()}`}>
                        {permission.action}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${permission.scope.toLowerCase()}`}>
                        {permission.scope}
                      </span>
                    </td>
                    <td>{new Date(permission.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(permission)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeletePermission(permission.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .permission-manager {
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

        .form-group {
          margin-bottom: 15px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
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

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .table-container {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        .table th,
        .table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .table th {
          background: #f8f9fa;
          font-weight: 600;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .badge-create { background: #d4edda; color: #155724; }
        .badge-read { background: #d1ecf1; color: #0c5460; }
        .badge-update { background: #fff3cd; color: #856404; }
        .badge-delete { background: #f8d7da; color: #721c24; }
        .badge-export { background: #e2e3e5; color: #383d41; }
        .badge-import { background: #d1ecf1; color: #0c5460; }

        .badge-own { background: #d4edda; color: #155724; }
        .badge-school { background: #fff3cd; color: #856404; }
        .badge-all { background: #d1ecf1; color: #0c5460; }
        .badge-custom { background: #f8d7da; color: #721c24; }

        .actions {
          display: flex;
          gap: 5px;
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

export default PermissionManager; 
