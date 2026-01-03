import React from 'react';

const UsageGuide: React.FC = () => {
  return (
    <div className="usage-guide">
      <h2>🚀 How to Use the Permission Management System</h2>
      
      <div className="guide-section">
        <h3>📋 Step-by-Step Guide</h3>
        
        <div className="step">
          <h4>Step 1: Test API Connection</h4>
          <p>Start with the <strong>"API Test"</strong> tab to verify your backend is working:</p>
          <ul>
            <li>Click the <strong>"API Test"</strong> tab</li>
            <li>Click <strong>"🔍 Test Direct API (No Validation)"</strong> first</li>
            <li>This will show you if the backend is responding correctly</li>
          </ul>
        </div>

        <div className="step">
          <h4>Step 2: Create Permissions</h4>
          <p>Go to the <strong>"Permissions"</strong> tab:</p>
          <ul>
            <li>Click the <strong>"Permissions"</strong> tab</li>
            <li>Click <strong>"Create Permission"</strong> button</li>
            <li>Fill in the required fields:
              <ul>
                <li><strong>Name:</strong> e.g., "student:read"</li>
                <li><strong>Resource Type:</strong> Select from dropdown (e.g., STUDENT)</li>
                <li><strong>Resource ID:</strong> e.g., "student"</li>
                <li><strong>Action:</strong> Select from dropdown (e.g., READ)</li>
                <li><strong>Scope:</strong> Select from dropdown (e.g., ALL)</li>
              </ul>
            </li>
            <li>Click <strong>"Create Permission"</strong></li>
          </ul>
        </div>

        <div className="step">
          <h4>Step 3: Create Roles</h4>
          <p>Go to the <strong>"Roles"</strong> tab:</p>
          <ul>
            <li>Click the <strong>"Roles"</strong> tab</li>
            <li>Click <strong>"Create Role"</strong> button</li>
            <li>Fill in the required fields:
              <ul>
                <li><strong>Name:</strong> e.g., "Data Exporter"</li>
                <li><strong>Type:</strong> Select from dropdown (e.g., STAFF)</li>
                <li><strong>Description:</strong> Optional description</li>
                <li><strong>Priority:</strong> Number (e.g., 1)</li>
                <li><strong>Active:</strong> Checkbox</li>
              </ul>
            </li>
            <li>Click <strong>"Create Role"</strong></li>
          </ul>
        </div>

        <div className="step">
          <h4>Step 4: Create Groups</h4>
          <p>Go to the <strong>"Groups"</strong> tab:</p>
          <ul>
            <li>Click the <strong>"Groups"</strong> tab</li>
            <li>Click <strong>"Create Group"</strong> button</li>
            <li>Fill in the required fields:
              <ul>
                <li><strong>Name:</strong> e.g., "Exporters Group"</li>
                <li><strong>Type:</strong> Select from dropdown (e.g., CUSTOM)</li>
                <li><strong>Description:</strong> Optional description</li>
                <li><strong>Active:</strong> Checkbox</li>
              </ul>
            </li>
            <li>Click <strong>"Create Group"</strong></li>
          </ul>
        </div>
      </div>

      <div className="guide-section">
        <h3>🔧 Troubleshooting</h3>
        
        <div className="troubleshoot">
          <h4>❌ "Name and type are required" Error</h4>
          <p>This means you need to fill in the required fields:</p>
          <ul>
            <li>Make sure you've clicked the "Create" button to show the form</li>
            <li>Fill in the <strong>Name</strong> field</li>
            <li>Select a <strong>Type</strong> from the dropdown</li>
            <li>All other required fields must be filled</li>
          </ul>
        </div>

        <div className="troubleshoot">
          <h4>❌ API Connection Error</h4>
          <p>If the API test fails:</p>
          <ul>
            <li>Make sure your backend is running on <code>https://sapi.ariadeltatravel.com</code></li>
            <li>Check that the backend has the RBAC routes implemented</li>
            <li>Verify the database is connected and migrations are run</li>
          </ul>
        </div>

        <div className="troubleshoot">
          <h4>❌ Forms Not Showing</h4>
          <p>If you don't see the forms:</p>
          <ul>
            <li>Click on the correct tab (Permissions, Roles, or Groups)</li>
            <li>Click the "Create" button to show the form</li>
            <li>Make sure you're not on the "API Test" tab</li>
          </ul>
        </div>
      </div>

      <div className="guide-section">
        <h3>📝 Field Requirements</h3>
        
        <div className="requirements">
          <h4>Permission Fields:</h4>
          <ul>
            <li><strong>Name:</strong> Format "resource:action" (e.g., "student:read")</li>
            <li><strong>Resource Type:</strong> STUDENT, TEACHER, CLASS, SCHOOL, etc.</li>
            <li><strong>Resource ID:</strong> The specific resource identifier</li>
            <li><strong>Action:</strong> CREATE, READ, UPDATE, DELETE, EXPORT, IMPORT</li>
            <li><strong>Scope:</strong> OWN, SCHOOL, ALL, CUSTOM</li>
          </ul>
        </div>

        <div className="requirements">
          <h4>Role Fields:</h4>
          <ul>
            <li><strong>Name:</strong> Human-readable role name</li>
            <li><strong>Type:</strong> SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, etc.</li>
            <li><strong>Description:</strong> Optional description</li>
            <li><strong>Priority:</strong> Number for role hierarchy</li>
            <li><strong>Active:</strong> Whether the role is active</li>
          </ul>
        </div>

        <div className="requirements">
          <h4>Group Fields:</h4>
          <ul>
            <li><strong>Name:</strong> Human-readable group name</li>
            <li><strong>Type:</strong> DEFAULT, CUSTOM, SYSTEM</li>
            <li><strong>Description:</strong> Optional description</li>
            <li><strong>Active:</strong> Whether the group is active</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .usage-guide {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .guide-section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }

        .step, .troubleshoot, .requirements {
          margin-bottom: 20px;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .step h4, .troubleshoot h4, .requirements h4 {
          color: #495057;
          margin-bottom: 10px;
          font-size: 16px;
        }

        .step ul, .troubleshoot ul, .requirements ul {
          margin-left: 20px;
        }

        .step li, .troubleshoot li, .requirements li {
          margin-bottom: 5px;
          line-height: 1.5;
        }

        .step ul ul {
          margin-top: 10px;
          margin-bottom: 10px;
        }

        code {
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }

        strong {
          color: #007bff;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default UsageGuide; 
