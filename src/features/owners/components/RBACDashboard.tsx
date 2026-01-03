import React, { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';

interface RBACStats {
  totalGroups: number;
  totalRoles: number;
  totalPermissions: number;
  totalAssignments: number;
  activeUsers: number;
  recentActivity: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  color: string;
}

const RBACDashboard: React.FC = () => {
  const [stats, setStats] = useState<RBACStats>({
    totalGroups: 0,
    totalRoles: 0,
    totalPermissions: 0,
    totalAssignments: 0,
    activeUsers: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsRes, rolesRes, permissionsRes, assignmentsRes] = await Promise.all([
        apiService.getGroups(),
        apiService.getRoles(),
        apiService.getPermissions(),
        apiService.getPermissionAssignments()
      ]);

      const groups = groupsRes.data || groupsRes;
      const roles = rolesRes.data || rolesRes;
      const permissions = permissionsRes.data || permissionsRes;
      const assignments = assignmentsRes.data || assignmentsRes;

      setStats({
        totalGroups: groups.length,
        totalRoles: roles.length,
        totalPermissions: permissions.length,
        totalAssignments: assignments.length,
        activeUsers: 156, // Mock data
        recentActivity: 23 // Mock data
      });

      setRecentAssignments(assignments.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      
    } finally {
      setLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'create-group',
      title: 'Create Group',
      description: 'Add a new user group',
      icon: '👨‍👩‍👧‍👦',
      action: () => alert('Navigate to Groups tab to create a new group'),
      color: '#3498db'
    },
    {
      id: 'create-role',
      title: 'Create Role',
      description: 'Add a new user role',
      icon: '👥',
      action: () => alert('Navigate to Roles tab to create a new role'),
      color: '#e74c3c'
    },
    {
      id: 'create-permission',
      title: 'Create Permission',
      description: 'Add a new permission',
      icon: '🔐',
      action: () => alert('Navigate to Permissions tab to create a new permission'),
      color: '#f39c12'
    },
    {
      id: 'assign-permission',
      title: 'Assign Permission',
      description: 'Link permissions to roles/groups',
      icon: '🔗',
      action: () => alert('Navigate to Group-Role-Permissions tab to assign permissions'),
      color: '#9b59b6'
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      description: 'Check RBAC analytics',
      icon: '📊',
      action: () => alert('Navigate to Analytics tab to view detailed analytics'),
      color: '#1abc9c'
    },
    {
      id: 'bulk-operations',
      title: 'Bulk Operations',
      description: 'Perform bulk assignments',
      icon: '📦',
      action: () => alert('Navigate to Bulk Assign tab for bulk operations'),
      color: '#34495e'
    }
  ];

  const getAssignmentType = (assignment: any) => {
    if (assignment.groupId && assignment.roleId) return 'Group + Role';
    if (assignment.groupId) return 'Group';
    if (assignment.roleId) return 'Role';
    return 'Direct';
  };

  const getAssignmentColor = (type: string) => {
    switch (type) {
      case 'Group + Role': return '#9b59b6';
      case 'Group': return '#3498db';
      case 'Role': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="rbac-dashboard">
      <div className="dashboard-header">
        <h1>🔐 RBAC Dashboard</h1>
        <p>Complete overview of your Role-Based Access Control system</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3498db' }}>👨‍👩‍👧‍👦</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalGroups}</div>
            <div className="stat-label">Groups</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e74c3c' }}>👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalRoles}</div>
            <div className="stat-label">Roles</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f39c12' }}>🔐</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalPermissions}</div>
            <div className="stat-label">Permissions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#9b59b6' }}>🔗</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalAssignments}</div>
            <div className="stat-label">Assignments</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#1abc9c' }}>👤</div>
          <div className="stat-content">
            <div className="stat-number">{stats.activeUsers}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#34495e' }}>📈</div>
          <div className="stat-content">
            <div className="stat-number">{stats.recentActivity}</div>
            <div className="stat-label">Recent Activity</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-section">
          <h2>🚀 Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map(action => (
              <div 
                key={action.id} 
                className="quick-action-card"
                style={{ borderLeft: `4px solid ${action.color}` }}
                onClick={action.action}
              >
                <div className="action-icon" style={{ color: action.color }}>
                  {action.icon}
                </div>
                <div className="action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="content-section">
          <h2>📋 Recent Assignments</h2>
          {loading ? (
            <div className="loading">Loading recent assignments...</div>
          ) : recentAssignments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <h4>No Recent Assignments</h4>
              <p>Create your first assignment to see it here</p>
            </div>
          ) : (
            <div className="assignments-list">
              {recentAssignments.map((assignment, index) => {
                const type = getAssignmentType(assignment);
                return (
                  <div key={assignment.id || index} className="assignment-item">
                    <div className="assignment-type" style={{ background: getAssignmentColor(type) }}>
                      {type}
                    </div>
                    <div className="assignment-details">
                      <div className="assignment-target">
                        <strong>Target:</strong> {assignment.groupId ? 'Group' : 'Role'} Assignment
                      </div>
                      <div className="assignment-permission">
                        <strong>Permission:</strong> {assignment.permissionId}
                      </div>
                      <div className="assignment-meta">
                        <span>Scope: {assignment.scope}</span>
                        <span>Priority: {assignment.priority}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="content-section">
          <h2>📊 System Overview</h2>
          <div className="overview-grid">
            <div className="overview-card">
              <h3>🔐 Permission Distribution</h3>
              <div className="chart-placeholder">
                <div className="chart-bar" style={{ height: '60%', background: '#3498db' }}></div>
                <div className="chart-bar" style={{ height: '80%', background: '#e74c3c' }}></div>
                <div className="chart-bar" style={{ height: '40%', background: '#f39c12' }}></div>
                <div className="chart-bar" style={{ height: '90%', background: '#9b59b6' }}></div>
              </div>
              <div className="chart-labels">
                <span>Groups</span>
                <span>Roles</span>
                <span>Permissions</span>
                <span>Assignments</span>
              </div>
            </div>
            <div className="overview-card">
              <h3>🎯 Assignment Types</h3>
              <div className="pie-chart-placeholder">
                <div className="pie-segment" style={{ background: '#3498db', transform: 'rotate(0deg)' }}></div>
                <div className="pie-segment" style={{ background: '#e74c3c', transform: 'rotate(90deg)' }}></div>
                <div className="pie-segment" style={{ background: '#f39c12', transform: 'rotate(180deg)' }}></div>
                <div className="pie-center"></div>
              </div>
              <div className="chart-legend">
                <span>Group Assignments</span>
                <span>Role Assignments</span>
                <span>Direct Assignments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .rbac-dashboard {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .dashboard-header h1 {
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 2.5rem;
        }

        .dashboard-header p {
          color: #7f8c8d;
          font-size: 1.1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: white;
          font-size: 1.5rem;
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #2c3e50;
          line-height: 1;
        }

        .stat-label {
          color: #7f8c8d;
          font-size: 0.9rem;
          margin-top: 5px;
        }

        .dashboard-content {
          display: grid;
          gap: 30px;
        }

        .content-section {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .content-section h2 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 1.5rem;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .quick-action-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .quick-action-card:hover {
          background: #e9ecef;
          transform: translateY(-2px);
        }

        .action-icon {
          font-size: 2rem;
          width: 50px;
          text-align: center;
        }

        .action-content h3 {
          margin: 0 0 5px 0;
          color: #2c3e50;
          font-size: 1.1rem;
        }

        .action-content p {
          margin: 0;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .assignments-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .assignment-item {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .assignment-type {
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .assignment-details {
          flex: 1;
        }

        .assignment-target,
        .assignment-permission {
          margin-bottom: 5px;
          font-size: 0.9rem;
        }

        .assignment-meta {
          display: flex;
          gap: 15px;
          font-size: 0.8rem;
          color: #7f8c8d;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .overview-card {
          text-align: center;
        }

        .overview-card h3 {
          margin-bottom: 20px;
          color: #2c3e50;
        }

        .chart-placeholder {
          height: 200px;
          display: flex;
          align-items: end;
          justify-content: center;
          gap: 20px;
          margin-bottom: 15px;
        }

        .chart-bar {
          width: 40px;
          border-radius: 4px 4px 0 0;
          transition: all 0.3s ease;
        }

        .chart-bar:hover {
          opacity: 0.8;
        }

        .chart-labels {
          display: flex;
          justify-content: center;
          gap: 20px;
          font-size: 0.8rem;
          color: #7f8c8d;
        }

        .pie-chart-placeholder {
          position: relative;
          width: 150px;
          height: 150px;
          margin: 0 auto 20px;
          border-radius: 50%;
          background: conic-gradient(
            #3498db 0deg 120deg,
            #e74c3c 120deg 240deg,
            #f39c12 240deg 360deg
          );
        }

        .pie-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          background: white;
          border-radius: 50%;
        }

        .chart-legend {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 0.8rem;
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
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .alert-danger {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .quick-actions-grid {
            grid-template-columns: 1fr;
          }

          .overview-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-header h1 {
            font-size: 2rem;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .assignment-item {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default RBACDashboard; 
