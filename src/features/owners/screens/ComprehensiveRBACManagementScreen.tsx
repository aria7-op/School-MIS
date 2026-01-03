import React, { useState, useEffect } from 'react';
import PermissionManager from '../components/PermissionManager';
import RoleManager from '../components/RoleManager';
import GroupManager from '../components/GroupManager';
import ComprehensivePermissionManager from '../components/ComprehensivePermissionManager';
import RealWorldRoleManager from '../components/RealWorldRoleManager';
import AdvancedPolicyManagement from '../components/AdvancedPolicyManagement';
import UltraAdvancedABACBuilder from '../components/UltraAdvancedABACBuilder';
import UltraAdvancedPermissionMatrix from '../components/UltraAdvancedPermissionMatrix';
import UltraAdvancedFeatureControl from '../components/UltraAdvancedFeatureControl';
import UltraAdvancedRoleAssignment from '../components/UltraAdvancedRoleAssignment';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

interface RBACStats {
  totalPermissions: number;
  totalRoles: number;
  totalGroups: number;
  activeUsers: number;
  recentActivity: number;
}

const ComprehensiveRBACManagementScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<RBACStats>({
    totalPermissions: 0,
    totalRoles: 0,
    totalGroups: 0,
    activeUsers: 0,
    recentActivity: 0
  });

  const tabs = [
    { 
      id: 'overview', 
      label: '📊 Overview', 
      icon: '📊',
      description: 'System overview and analytics'
    },
    { 
      id: 'permissions', 
      label: '🔐 Permissions', 
      icon: '🔐',
      description: 'Manage individual permissions'
    },
    { 
      id: 'comprehensive-permissions', 
      label: '🎯 Advanced Permissions', 
      icon: '🎯',
      description: 'Comprehensive permission management'
    },
    { 
      id: 'roles', 
      label: '👥 Roles', 
      icon: '👥',
      description: 'Manage user roles'
    },
    { 
      id: 'real-world-roles', 
      label: '🌍 Real-World Roles', 
      icon: '🌍',
      description: 'Real-world role assignments'
    },
    { 
      id: 'groups', 
      label: '👨‍👩‍👧‍👦 Groups', 
      icon: '👨‍👩‍👧‍👦',
      description: 'Manage user groups'
    },
    { 
      id: 'policies', 
      label: '📋 Policies', 
      icon: '📋',
      description: 'ABAC policy management'
    },
    { 
      id: 'abac-builder', 
      label: '🏗️ ABAC Builder', 
      icon: '🏗️',
      description: 'Advanced ABAC rule builder'
    },
    { 
      id: 'permission-matrix', 
      label: '📊 Permission Matrix', 
      icon: '📊',
      description: 'Visual permission matrix'
    },
    { 
      id: 'feature-control', 
      label: '⚙️ Feature Control', 
      icon: '⚙️',
      description: 'Feature-level access control'
    },
    { 
      id: 'role-assignment', 
      label: '🔗 Role Assignment', 
      icon: '🔗',
      description: 'Advanced role assignment'
    }
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // This would typically come from your API
      setStats({
        totalPermissions: 45,
        totalRoles: 12,
        totalGroups: 8,
        activeUsers: 156,
        recentActivity: 23
      });
    } catch (error) {
      
    }
  };

  const getTabComponent = (tabId: string) => {
    switch (tabId) {
      case 'overview':
        return <AnalyticsDashboard />;
      case 'permissions':
        return <PermissionManager />;
      case 'comprehensive-permissions':
        return <ComprehensivePermissionManager />;
      case 'roles':
        return <RoleManager />;
      case 'real-world-roles':
        return <RealWorldRoleManager />;
      case 'groups':
        return <GroupManager />;
      case 'policies':
        return <AdvancedPolicyManagement />;
      case 'abac-builder':
        return <UltraAdvancedABACBuilder />;
      case 'permission-matrix':
        return <UltraAdvancedPermissionMatrix />;
      case 'feature-control':
        return <UltraAdvancedFeatureControl />;
      case 'role-assignment':
        return <UltraAdvancedRoleAssignment />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="comprehensive-rbac-management">
      <div className="header">
        <div className="header-content">
          <h1>🔐 Comprehensive RBAC Management</h1>
          <p>Complete Role-Based Access Control system with Groups, Roles, and Permissions</p>
        </div>
        
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">🔐</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalPermissions}</div>
              <div className="stat-label">Permissions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalRoles}</div>
              <div className="stat-label">Roles</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍👩‍👧‍👦</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalGroups}</div>
              <div className="stat-label">Groups</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <div className="stat-number">{stats.activeUsers}</div>
              <div className="stat-label">Active Users</div>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="sidebar">
          <div className="tab-navigation">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                title={tab.description}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="content-area">
          <div className="tab-content">
            {getTabComponent(activeTab)}
          </div>
        </div>
      </div>

      <style>{`
        .comprehensive-rbac-management {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #333;
        }

        .header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 30px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-content {
          text-align: center;
          margin-bottom: 30px;
        }

        .header-content h1 {
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 2.5rem;
          font-weight: 700;
        }

        .header-content p {
          color: #7f8c8d;
          font-size: 1.1rem;
          margin: 0;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 15px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          font-size: 2rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          color: white;
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

        .main-content {
          display: flex;
          min-height: calc(100vh - 200px);
        }

        .sidebar {
          width: 300px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(255, 255, 255, 0.2);
          overflow-y: auto;
        }

        .tab-navigation {
          padding: 20px;
        }

        .tab-button {
          width: 100%;
          padding: 15px 20px;
          margin-bottom: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
          text-align: left;
          font-size: 14px;
          font-weight: 500;
          color: #7f8c8d;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .tab-button:hover {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          transform: translateX(5px);
        }

        .tab-button.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .tab-icon {
          font-size: 1.2rem;
          width: 24px;
          text-align: center;
        }

        .tab-label {
          flex: 1;
        }

        .content-area {
          flex: 1;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          overflow-y: auto;
        }

        .tab-content {
          padding: 30px;
          min-height: 100%;
        }

        @media (max-width: 1024px) {
          .main-content {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          }

          .tab-navigation {
            display: flex;
            overflow-x: auto;
            padding: 15px;
          }

          .tab-button {
            min-width: 200px;
            margin-bottom: 0;
            margin-right: 10px;
          }
        }

        @media (max-width: 768px) {
          .header-content h1 {
            font-size: 2rem;
          }

          .stats-overview {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }

          .stat-card {
            padding: 15px;
          }

          .stat-icon {
            width: 50px;
            height: 50px;
            font-size: 1.5rem;
          }

          .stat-number {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .stats-overview {
            grid-template-columns: 1fr;
          }

          .tab-button {
            min-width: 150px;
            padding: 12px 15px;
            font-size: 12px;
          }

          .tab-icon {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ComprehensiveRBACManagementScreen; 
