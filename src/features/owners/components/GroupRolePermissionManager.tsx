import React, { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';

interface Group {
  id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  priority: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resourceType: string;
  action: string;
  scope: string;
}

interface Assignment {
  id: string;
  groupId?: string;
  roleId?: string;
  permissionId: string;
  scope: string;
  priority: number;
  expiresAt?: string;
}

const GroupRolePermissionManager: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('assignments');

  // Form states
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    groupId: '',
    roleId: '',
    permissionId: '',
    scope: 'SCHOOL',
    priority: 1,
    expiresAt: ''
  });

  const tabs = [
    { id: 'assignments', label: '🔗 Assignments', icon: '🔗' },
    { id: 'group-roles', label: '👥 Group Roles', icon: '👥' },
    { id: 'role-permissions', label: '🔐 Role Permissions', icon: '🔐' },
    { id: 'bulk-assign', label: '📦 Bulk Assign', icon: '📦' },
    { id: 'analytics', label: '📊 Analytics', icon: '📊' }
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsRes, rolesRes, permissionsRes, assignmentsRes] = await Promise.all([
        apiService.getGroups(),
        apiService.getRoles(),
        apiService.getPermissions(),
        apiService.getPermissionAssignments()
      ]);

      setGroups(groupsRes.data || groupsRes);
      setRoles(rolesRes.data || rolesRes);
      setPermissions(permissionsRes.data || permissionsRes);
      setAssignments(assignmentsRes.data || assignmentsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!assignmentForm.permissionId) {
        throw new Error('Permission is required');
      }

      const assignmentData = {
        groupId: assignmentForm.groupId || undefined,
        roleId: assignmentForm.roleId || undefined,
        permissionId: assignmentForm.permissionId,
        scope: assignmentForm.scope,
        priority: assignmentForm.priority,
        expiresAt: assignmentForm.expiresAt || undefined
      };

      await apiService.assignPermission(assignmentData);
      
      setAssignmentForm({
        groupId: '',
        roleId: '',
        permissionId: '',
        scope: 'SCHOOL',
        priority: 1,
        expiresAt: ''
      });
      setShowAssignmentForm(false);
      await loadAllData();
      
      alert('Assignment created successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment');
      
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    setLoading(true);
    setError(null);

    try {
      // Assuming there's a delete assignment endpoint
      await apiService.request(`/rbac/assignments/${id}`, { method: 'DELETE' });
      await loadAllData();
      alert('Assignment deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to delete assignment');
      
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async (assignments: any[]) => {
    setLoading(true);
    setError(null);

    try {
      await apiService.bulkAssignPermissions(assignments);
      await loadAllData();
      alert('Bulk assignment completed successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to perform bulk assignment');
      
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentType = (assignment: Assignment) => {
    if (assignment.groupId && assignment.roleId) return 'Group + Role';
    if (assignment.groupId) return 'Group';
    if (assignment.roleId) return 'Role';
    return 'Direct';
  };

  const getAssignmentTarget = (assignment: Assignment) => {
    const group = groups.find(g => g.id === assignment.groupId);
    const role = roles.find(r => r.id === assignment.roleId);
    const permission = permissions.find(p => p.id === assignment.permissionId);

    if (assignment.groupId && assignment.roleId) {
      return `${group?.name} → ${role?.name}`;
    }
    if (assignment.groupId) {
      return group?.name;
    }
    if (assignment.roleId) {
      return role?.name;
    }
    return 'Direct Assignment';
  };

  const getPermissionName = (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission?.name || 'Unknown Permission';
  };

  return (
    <div className="group-role-permission-manager">
      <div className="header">
        <h2>🔗 Group, Role & Permission Manager</h2>
        <p>Manage relationships between groups, roles, and permissions</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'assignments' && (
          <div className="assignments-tab">
            <div className="section-header">
              <h3>Current Assignments</h3>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAssignmentForm(!showAssignmentForm)}
              >
                {showAssignmentForm ? 'Cancel' : 'Create Assignment'}
              </button>
            </div>

            {showAssignmentForm && (
              <div className="form-container">
                <h4>Create New Assignment</h4>
                <form onSubmit={handleCreateAssignment}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Group (Optional)</label>
                      <select
                        name="groupId"
                        value={assignmentForm.groupId}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, groupId: e.target.value }))}
                      >
                        <option value="">Select Group</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Role (Optional)</label>
                      <select
                        name="roleId"
                        value={assignmentForm.roleId}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, roleId: e.target.value }))}
                      >
                        <option value="">Select Role</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Permission *</label>
                      <select
                        name="permissionId"
                        value={assignmentForm.permissionId}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, permissionId: e.target.value }))}
                        required
                      >
                        <option value="">Select Permission</option>
                        {permissions.map(permission => (
                          <option key={permission.id} value={permission.id}>
                            {permission.name} ({permission.resourceType}.{permission.action})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Scope</label>
                      <select
                        name="scope"
                        value={assignmentForm.scope}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, scope: e.target.value }))}
                      >
                        <option value="OWN">Own</option>
                        <option value="SCHOOL">School</option>
                        <option value="ALL">All</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Priority</label>
                      <input
                        type="number"
                        name="priority"
                        value={assignmentForm.priority}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                        min="1"
                        max="10"
                      />
                    </div>

                    <div className="form-group">
                      <label>Expires At (Optional)</label>
                      <input
                        type="datetime-local"
                        name="expiresAt"
                        value={assignmentForm.expiresAt}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Assignment'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowAssignmentForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="assignments-list">
              {loading ? (
                <div className="loading">Loading assignments...</div>
              ) : assignments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔗</div>
                  <h4>No Assignments Found</h4>
                  <p>Create your first assignment to get started</p>
                </div>
              ) : (
                <div className="assignments-grid">
                  {assignments.map(assignment => (
                    <div key={assignment.id} className="assignment-card">
                      <div className="assignment-header">
                        <span className="assignment-type">{getAssignmentType(assignment)}</span>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                        >
                          Delete
                        </button>
                      </div>
                      <div className="assignment-content">
                        <div className="assignment-target">
                          <strong>Target:</strong> {getAssignmentTarget(assignment)}
                        </div>
                        <div className="assignment-permission">
                          <strong>Permission:</strong> {getPermissionName(assignment.permissionId)}
                        </div>
                        <div className="assignment-details">
                          <span className="detail">
                            <strong>Scope:</strong> {assignment.scope}
                          </span>
                          <span className="detail">
                            <strong>Priority:</strong> {assignment.priority}
                          </span>
                          {assignment.expiresAt && (
                            <span className="detail">
                              <strong>Expires:</strong> {new Date(assignment.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'group-roles' && (
          <div className="group-roles-tab">
            <h3>Group Role Management</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-number">{groups.length}</div>
                  <div className="stat-label">Total Groups</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👤</div>
                <div className="stat-content">
                  <div className="stat-number">{roles.length}</div>
                  <div className="stat-label">Total Roles</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔗</div>
                <div className="stat-content">
                  <div className="stat-number">{assignments.filter(a => a.groupId && a.roleId).length}</div>
                  <div className="stat-label">Group-Role Assignments</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'role-permissions' && (
          <div className="role-permissions-tab">
            <h3>Role Permission Management</h3>
            <div className="permissions-matrix">
              {roles.map(role => (
                <div key={role.id} className="role-permissions-card">
                  <h4>{role.name}</h4>
                  <div className="permissions-list">
                    {assignments
                      .filter(a => a.roleId === role.id)
                      .map(assignment => (
                        <div key={assignment.id} className="permission-item">
                          {getPermissionName(assignment.permissionId)}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bulk-assign' && (
          <div className="bulk-assign-tab">
            <h3>Bulk Assignment</h3>
            <p>Coming soon: Bulk assignment functionality for multiple groups, roles, and permissions.</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <h3>Assignment Analytics</h3>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Assignment Distribution</h4>
                <div className="chart-placeholder">
                  📊 Chart showing assignment distribution
                </div>
              </div>
              <div className="analytics-card">
                <h4>Most Used Permissions</h4>
                <div className="chart-placeholder">
                  📈 Chart showing most assigned permissions
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .group-role-permission-manager {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header h2 {
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .header p {
          color: #7f8c8d;
        }

        .tab-navigation {
          display: flex;
          border-bottom: 2px solid #ecf0f1;
          margin-bottom: 20px;
          overflow-x: auto;
        }

        .tab-button {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #7f8c8d;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tab-button:hover {
          color: #3498db;
        }

        .tab-button.active {
          color: #3498db;
          border-bottom-color: #3498db;
        }

        .tab-icon {
          font-size: 16px;
        }

        .section-header {
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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 5px;
          font-weight: 500;
          color: #2c3e50;
        }

        .form-group input,
        .form-group select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: #3498db;
          color: white;
        }

        .btn-primary:hover {
          background: #2980b9;
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
        }

        .btn-danger {
          background: #e74c3c;
          color: white;
        }

        .btn-sm {
          padding: 5px 10px;
          font-size: 12px;
        }

        .assignments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .assignment-card {
          background: white;
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .assignment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .assignment-type {
          background: #3498db;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .assignment-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .assignment-details {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }

        .detail {
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .stat-icon {
          font-size: 2rem;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #3498db;
          border-radius: 50%;
          color: white;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2c3e50;
        }

        .stat-label {
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .permissions-matrix {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }

        .role-permissions-card {
          background: white;
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          padding: 15px;
        }

        .role-permissions-card h4 {
          margin-bottom: 10px;
          color: #2c3e50;
        }

        .permissions-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .permission-item {
          background: #f8f9fa;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .analytics-card {
          background: white;
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          padding: 20px;
        }

        .chart-placeholder {
          background: #f8f9fa;
          padding: 40px;
          text-align: center;
          border-radius: 4px;
          color: #7f8c8d;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #7f8c8d;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 10px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #7f8c8d;
        }

        .alert {
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .alert-danger {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .assignments-grid {
            grid-template-columns: 1fr;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default GroupRolePermissionManager; 
