import React, { useState } from 'react';
import apiService from '../../../services/apiService';

const SimpleTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testCreatePermission = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const permissionData = {
        name: "test:read",
        description: "Test permission for reading",
        resourceType: "TEST",
        resourceId: "test",
        action: "READ",
        scope: "ALL"
      };

      const response = await apiService.createPermission(permissionData);
      setResult(`✅ Permission created successfully!\n${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Error creating permission: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateRole = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const roleData = {
        name: "Test Role",
        description: "A test role for testing",
        type: "STAFF",
        isActive: true,
        isSystem: false,
        isDefault: false,
        priority: 1
      };

      const response = await apiService.createRole(roleData);
      setResult(`✅ Role created successfully!\n${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Error creating role: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateGroup = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const groupData = {
        name: "Test Group",
        description: "A test group for testing",
        type: "CUSTOM",
        isActive: true
      };

      const response = await apiService.createGroup(groupData);
      setResult(`✅ Group created successfully!\n${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Error creating group: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetPermissions = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await apiService.getPermissions();
      setResult(`✅ Permissions loaded successfully!\n${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Error loading permissions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetRoles = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await apiService.getRoles();
      setResult(`✅ Roles loaded successfully!\n${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Error loading roles: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetGroups = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await apiService.getGroups();
      setResult(`✅ Groups loaded successfully!\n${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Error loading groups: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Direct API test without validation
  const testDirectAPI = async () => {
    setLoading(true);
    setResult('');
    
    try {
      // Test direct fetch to see what the backend actually expects
      const response = await fetch('https://sapi.ariadeltatravel.com/api/rbac/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: "Direct Test Role",
          description: "Testing direct API call",
          type: "STAFF",
          isActive: true,
          isSystem: false,
          isDefault: false,
          priority: 1
        })
      });

      const data = await response.json();
      setResult(`🔍 Direct API Response:\nStatus: ${response.status}\n${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Direct API Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-test">
      <h2>API Test Panel</h2>
      <p>Test all API endpoints to ensure they work correctly with the backend.</p>

      <div className="test-buttons">
        <button 
          onClick={testDirectAPI}
          disabled={loading}
          className="btn btn-warning"
        >
          🔍 Test Direct API (No Validation)
        </button>

        <button 
          onClick={testCreatePermission}
          disabled={loading}
          className="btn btn-primary"
        >
          Test Create Permission
        </button>

        <button 
          onClick={testCreateRole}
          disabled={loading}
          className="btn btn-primary"
        >
          Test Create Role
        </button>

        <button 
          onClick={testCreateGroup}
          disabled={loading}
          className="btn btn-primary"
        >
          Test Create Group
        </button>

        <button 
          onClick={testGetPermissions}
          disabled={loading}
          className="btn btn-secondary"
        >
          Test Get Permissions
        </button>

        <button 
          onClick={testGetRoles}
          disabled={loading}
          className="btn btn-secondary"
        >
          Test Get Roles
        </button>

        <button 
          onClick={testGetGroups}
          disabled={loading}
          className="btn btn-secondary"
        >
          Test Get Groups
        </button>
      </div>

      {loading && (
        <div className="loading">
          Testing API endpoint...
        </div>
      )}

      {result && (
        <div className="result">
          <h3>Result:</h3>
          <pre>{result}</pre>
        </div>
      )}

      <style jsx>{`
        .simple-test {
          padding: 20px;
          max-width: 800px;
        }

        .test-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 20px 0;
        }

        .btn {
          padding: 10px 20px;
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

        .btn-warning {
          background: #ffc107;
          color: #212529;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 20px;
          color: #6c757d;
          font-style: italic;
        }

        .result {
          margin-top: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        }

        .result pre {
          background: #fff;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #dee2e6;
          overflow-x: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      `}</style>
    </div>
  );
};

export default SimpleTest; 
