import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { useFeatureList, useComponentList, useGranularConditionalRender } from '../hooks/useGranularAccess';
import SecureFeature from './SecureFeature';
import SecureComponent from './SecureComponent';
import AdvancedRoleManagement from './AdvancedRoleManagement';

// Example Component for Students Feature
const StudentsFeature: React.FC = () => {
  const { renderComponentIf } = useGranularConditionalRender();

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Students Management
      </Text>

      {/* Student List - accessible to all roles with student access */}
      {renderComponentIf('student-list', 'view', 
        <View style={{ backgroundColor: '#E3F2FD', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#1976D2' }}>Student List</Text>
          <Text style={{ color: '#666' }}>View all students in the system</Text>
        </View>
      )}

      {/* Student Details - restricted to teachers and admins */}
      {renderComponentIf('student-details', 'view',
        <View style={{ backgroundColor: '#E8F5E8', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#2E7D32' }}>Student Details</Text>
          <Text style={{ color: '#666' }}>Detailed student information</Text>
        </View>
      )}

      {/* Student Edit - restricted to admins only */}
      {renderComponentIf('student-edit', 'edit',
        <View style={{ backgroundColor: '#FFF3E0', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#E65100' }}>Edit Student</Text>
          <Text style={{ color: '#666' }}>Modify student information</Text>
        </View>
      )}

      {/* Student Delete - admin only */}
      {renderComponentIf('student-delete', 'delete',
        <View style={{ backgroundColor: '#FFE5E5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#D32F2F' }}>Delete Student</Text>
          <Text style={{ color: '#666' }}>Remove student from system</Text>
        </View>
      )}
    </View>
  );
};

// Example Component for Teachers Feature
const TeachersFeature: React.FC = () => {
  const { renderComponentIf } = useGranularConditionalRender();

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Teachers Management
      </Text>

      {/* Teacher List - accessible to admins */}
      {renderComponentIf('teacher-list', 'view',
        <View style={{ backgroundColor: '#E3F2FD', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#1976D2' }}>Teacher List</Text>
          <Text style={{ color: '#666' }}>View all teachers in the system</Text>
        </View>
      )}

      {/* Teacher Details - admin only */}
      {renderComponentIf('teacher-details', 'view',
        <View style={{ backgroundColor: '#E8F5E8', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#2E7D32' }}>Teacher Details</Text>
          <Text style={{ color: '#666' }}>Detailed teacher information</Text>
        </View>
      )}

      {/* Teacher Performance - admin only */}
      {renderComponentIf('teacher-performance', 'view',
        <View style={{ backgroundColor: '#FFF3E0', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#E65100' }}>Teacher Performance</Text>
          <Text style={{ color: '#666' }}>Performance metrics and analytics</Text>
        </View>
      )}

      {/* Teacher Salary - admin only */}
      {renderComponentIf('teacher-salary', 'view',
        <View style={{ backgroundColor: '#F3E5F5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#7B1FA2' }}>Teacher Salary</Text>
          <Text style={{ color: '#666' }}>Salary information and management</Text>
        </View>
      )}
    </View>
  );
};

// Example Component for Admin Feature
const AdminFeature: React.FC = () => {
  const { renderComponentIf } = useGranularConditionalRender();

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Admin Panel
      </Text>

      {/* System Settings - admin only */}
      {renderComponentIf('system-settings', 'view',
        <View style={{ backgroundColor: '#E3F2FD', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#1976D2' }}>System Settings</Text>
          <Text style={{ color: '#666' }}>Configure system parameters</Text>
        </View>
      )}

      {/* User Management - admin only */}
      {renderComponentIf('user-management', 'view',
        <View style={{ backgroundColor: '#E8F5E8', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#2E7D32' }}>User Management</Text>
          <Text style={{ color: '#666' }}>Manage all users in the system</Text>
        </View>
      )}

      {/* Role Management - admin only */}
      {renderComponentIf('role-management', 'view',
        <View style={{ backgroundColor: '#FFF3E0', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#E65100' }}>Role Management</Text>
          <Text style={{ color: '#666' }}>Create and manage user roles</Text>
        </View>
      )}

      {/* System Logs - admin only */}
      {renderComponentIf('system-logs', 'view',
        <View style={{ backgroundColor: '#FFE5E5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#D32F2F' }}>System Logs</Text>
          <Text style={{ color: '#666' }}>View system activity logs</Text>
        </View>
      )}
    </View>
  );
};

// Main Granular Access Example Component
export const GranularAccessExample: React.FC = () => {
  const { user } = useAuth();
  const { accessibleFeatures, loading } = useFeatureList();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [showRoleManagement, setShowRoleManagement] = useState(false);

  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeature(featureId);
  };

  const renderFeatureContent = () => {
    switch (selectedFeature) {
      case 'students':
        return <StudentsFeature />;
      case 'teachers':
        return <TeachersFeature />;
      case 'admin':
        return <AdminFeature />;
      default:
        return (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, color: '#666' }}>Select a feature to view</Text>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading accessible features...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      {/* Header */}
      <View style={{ backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
              Granular Access Control Demo
            </Text>
            <Text style={{ color: '#666', fontSize: 14 }}>
              User: {user?.firstName} {user?.lastName} ({user?.role})
            </Text>
          </View>
          
          {(user?.role === 'admin' || user?.role === 'owner') && (
            <TouchableOpacity
              style={{
                backgroundColor: '#007AFF',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
              onPress={() => setShowRoleManagement(true)}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Manage Roles</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Feature Navigation */}
      <View style={{ backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
          Accessible Features ({accessibleFeatures.length})
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {accessibleFeatures.map(feature => (
            <TouchableOpacity
              key={feature.id}
              style={{
                padding: 12,
                marginRight: 8,
                borderRadius: 8,
                backgroundColor: selectedFeature === feature.id ? '#007AFF' : '#F0F0F0',
                minWidth: 100,
                alignItems: 'center',
              }}
              onPress={() => handleFeatureSelect(feature.id)}
            >
              <Text style={{ fontSize: 16, marginBottom: 4 }}>{feature.icon}</Text>
              <Text style={{ 
                fontSize: 12, 
                color: selectedFeature === feature.id ? 'white' : '#666',
                textAlign: 'center',
              }}>
                {feature.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Feature Content */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {selectedFeature ? (
          <SecureFeature 
            featureId={selectedFeature} 
            action="view"
            showAccessInfo={true}
          >
            {renderFeatureContent()}
          </SecureFeature>
        ) : (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 16 }}>
              Welcome to the Granular Access Control Demo
            </Text>
            <Text style={{ color: '#666', textAlign: 'center', lineHeight: 20 }}>
              This demonstrates how different roles can access different features and components.
              Select a feature from the navigation above to see role-based access control in action.
            </Text>
            
            <View style={{ marginTop: 24, padding: 16, backgroundColor: 'white', borderRadius: 8 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Available Features:</Text>
              {accessibleFeatures.map(feature => (
                <Text key={feature.id} style={{ color: '#666', marginBottom: 4 }}>
                  • {feature.name} - {feature.description}
                </Text>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Role Management Modal */}
      {showRoleManagement && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          zIndex: 1000,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Role Management</Text>
            <TouchableOpacity
              style={{
                padding: 8,
                borderRadius: 4,
                backgroundColor: '#6C757D',
              }}
              onPress={() => setShowRoleManagement(false)}
            >
              <Text style={{ color: 'white' }}>Close</Text>
            </TouchableOpacity>
          </View>
          <AdvancedRoleManagement />
        </View>
      )}
    </View>
  );
};

// Access Control Summary Component
export const AccessControlSummary: React.FC = () => {
  const { user } = useAuth();
  const { accessibleFeatures, allFeatures } = useFeatureList();
  const { accessibleComponents, allComponents } = useComponentList();

  return (
    <View style={{ padding: 16, backgroundColor: 'white', borderRadius: 8, margin: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        Access Control Summary
      </Text>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>User Information:</Text>
        <Text style={{ color: '#666' }}>Name: {user?.firstName} {user?.lastName}</Text>
        <Text style={{ color: '#666' }}>Role: {user?.role}</Text>
        <Text style={{ color: '#666' }}>Email: {user?.email}</Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Feature Access:</Text>
        <Text style={{ color: '#666' }}>
          Accessible: {accessibleFeatures.length} / {allFeatures.length}
        </Text>
        {accessibleFeatures.map(feature => (
          <Text key={feature.id} style={{ color: '#2E7D32', fontSize: 12 }}>
            ✅ {feature.name}
          </Text>
        ))}
        {allFeatures.filter(f => !accessibleFeatures.some(af => af.id === f.id)).map(feature => (
          <Text key={feature.id} style={{ color: '#D32F2F', fontSize: 12 }}>
            ❌ {feature.name}
          </Text>
        ))}
      </View>

      <View>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Component Access:</Text>
        <Text style={{ color: '#666' }}>
          Accessible: {accessibleComponents.length} / {allComponents.length}
        </Text>
        {accessibleComponents.slice(0, 5).map(component => (
          <Text key={component.id} style={{ color: '#2E7D32', fontSize: 12 }}>
            ✅ {component.name}
          </Text>
        ))}
        {accessibleComponents.length > 5 && (
          <Text style={{ color: '#666', fontSize: 12 }}>
            ... and {accessibleComponents.length - 5} more
          </Text>
        )}
      </View>
    </View>
  );
};

export default GranularAccessExample; 
