import React, { useState, useEffect } from 'react';
import PermissionManager from '../components/PermissionManager';
import RoleManager from '../components/RoleManager';
import GroupManager from '../components/GroupManager';
import SimpleTest from '../components/SimpleTest';
import UsageGuide from '../components/UsageGuide';
import RealWorldRoleManager from '../components/RealWorldRoleManager';
import ComprehensivePermissionManager from '../components/ComprehensivePermissionManager';
import GroupRolePermissionManager from '../components/GroupRolePermissionManager';
import RBACDashboard from '../components/RBACDashboard';

const UltraAdvancedPermissionManagementScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', component: <RBACDashboard /> },
    { id: 'guide', label: '📖 Usage Guide', component: <UsageGuide /> },
    { id: 'test', label: '🧪 API Test', component: <SimpleTest /> },
    { id: 'permissions', label: '🔐 Permissions', component: <PermissionManager /> },
    { id: 'comprehensive-permissions', label: '🎯 Comprehensive Permissions', component: <ComprehensivePermissionManager /> },
    { id: 'roles', label: '👥 Basic Roles', component: <RoleManager /> },
    { id: 'real-world-roles', label: '🌍 Real-World Roles', component: <RealWorldRoleManager /> },
    { id: 'groups', label: '👨‍👩‍👧‍👦 Groups', component: <GroupManager /> },
    { id: 'group-role-permissions', label: '🔗 Group-Role-Permissions', component: <GroupRolePermissionManager /> },
    { id: 'real-world-test', label: '🎯 Real World Test', component: <RealWorldRoleManager /> }
  ];

  // Debug logging
  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
  }, [activeTab]);

  return (
    <div className="ultra-advanced-permission-management">
      <div className="header">
        <h1>Ultra Advanced Permission Management</h1>
        <p>Complete RBAC and ABAC management system with real-world features</p>
      </div>

      <div className="tab-navigation">
        {tabs.map(tab => {

          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {

                setActiveTab(tab.id);
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="tab-content">
        {(() => {
          const activeTabComponent = tabs.find(tab => tab.id === activeTab)?.component;

          return activeTabComponent;
        })()}
      </div>

      <style>{`
        .ultra-advanced-permission-management {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header h1 {
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .header p {
          color: #7f8c8d;
          font-size: 16px;
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
        }

        .tab-button:hover {
          color: #3498db;
        }

        .tab-button.active {
          color: #3498db;
          border-bottom-color: #3498db;
        }

        .tab-content {
          min-height: 400px;
        }

        @media (max-width: 768px) {
          .tab-navigation {
            flex-wrap: wrap;
          }
          
          .tab-button {
            flex: 1;
            min-width: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default UltraAdvancedPermissionManagementScreen; 
