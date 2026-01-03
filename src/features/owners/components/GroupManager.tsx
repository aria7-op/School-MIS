import React, { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';

interface Group {
  id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const GroupManager: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // Form state for creating/editing groups
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    isActive: true
  });

  // Group types as per guide
  const groupTypes = ['DEFAULT', 'CUSTOM', 'SYSTEM'];

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getGroups();
      setGroups(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Failed to load groups');
      
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.type) {
        throw new Error('Name and type are required');
      }

      const groupData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        isActive: formData.isActive
      };

      await apiService.createGroup(groupData);
      
      // Reset form and reload
      setFormData({
        name: '',
        description: '',
        type: '',
        isActive: true
      });
      setShowCreateForm(false);
      await loadGroups();
      
      alert('Group created successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
      
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    setLoading(true);
    setError(null);

    try {
      const groupData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        isActive: formData.isActive
      };

      await apiService.updateGroup(editingGroup.id, groupData);
      
      setEditingGroup(null);
      setFormData({
        name: '',
        description: '',
        type: '',
        isActive: true
      });
      await loadGroups();
      
      alert('Group updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update group');
      
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    setLoading(true);
    setError(null);

    try {
      await apiService.deleteGroup(id);
      await loadGroups();
      alert('Group deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to delete group');
      
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      type: group.type,
      isActive: group.isActive
    });
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setFormData({
      name: '',
      description: '',
      type: '',
      isActive: true
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
    <div className="group-manager">
      <div className="header">
        <h2>Group Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Group'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingGroup) && (
        <div className="form-container">
          <h3>{editingGroup ? 'Edit Group' : 'Create New Group'}</h3>
          <form onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Exporters Group"
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
                  <option value="">Select Group Type</option>
                  {groupTypes.map(type => (
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
                placeholder="Group description"
                rows={3}
              />
            </div>

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

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingGroup ? 'Update Group' : 'Create Group')}
              </button>
              {editingGroup && (
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

      {/* Groups List */}
      <div className="groups-list">
        <h3>Existing Groups</h3>
        
        {loading ? (
          <div className="loading">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="no-data">No groups found</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>{group.description}</td>
                    <td>
                      <span className={`badge badge-${group.type.toLowerCase()}`}>
                        {group.type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${group.isActive ? 'active' : 'inactive'}`}>
                        {group.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(group.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(group)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteGroup(group.id)}
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
        .group-manager {
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

        .badge-default { background: #e2e3e5; color: #383d41; }
        .badge-custom { background: #d1ecf1; color: #0c5460; }
        .badge-system { background: #f8d7da; color: #721c24; }

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

export default GroupManager; 
