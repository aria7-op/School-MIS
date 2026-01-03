import React, { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';

interface Role {
  id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  isSystem: boolean;
  isDefault: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

const RoleManager: React.FC = () => {
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
    priority: 0
  });

  // Role types as per guide
  const roleTypes = [
    'SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 
    'STAFF', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN'
  ];

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

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Debug: Log the form data

      // Validate required fields
      if (!formData.name || !formData.type) {
        const errorMsg = 'Name and type are required';
        
        setError(errorMsg);
        return;
      }

      const roleData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        isActive: formData.isActive,
        isSystem: formData.isSystem,
        isDefault: formData.isDefault,
        priority: formData.priority
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
        priority: 0
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

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
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
        priority: formData.priority
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
        priority: 0
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
      priority: role.priority
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
      priority: 0
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="role-manager">
      <div className="header">
        <h2>Role Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Role'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingRole) && (
        <div className="form-container">
          <h3>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
          <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Data Exporter"
                  required
                />
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Role Type</option>
                  {roleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Role description"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
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
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isSystem"
                    checked={formData.isSystem}
                    onChange={handleInputChange}
                  />
                  System Role
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                  />
                  Default Role
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
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
          </form>
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
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id}>
                    <td>{role.name}</td>
                    <td>{role.description}</td>
                    <td>
                      <span className={`badge badge-${role.type.toLowerCase()}`}>
                        {role.type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${role.isActive ? 'active' : 'inactive'}`}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{role.priority}</td>
                    <td>{new Date(role.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .role-manager {
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

        .badge-super_admin { background: #dc3545; color: white; }
        .badge-school_admin { background: #fd7e14; color: white; }
        .badge-teacher { background: #20c997; color: white; }
        .badge-student { background: #6f42c1; color: white; }
        .badge-staff { background: #6c757d; color: white; }
        .badge-parent { background: #17a2b8; color: white; }
        .badge-accountant { background: #28a745; color: white; }
        .badge-librarian { background: #ffc107; color: #212529; }

        .badge-active { background: #d4edda; color: #155724; }
        .badge-inactive { background: #f8d7da; color: #721c24; }

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

export default RoleManager; 
