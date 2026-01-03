import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import StaffDashboard from '../components/StaffDashboard';
import StaffList from '../components/StaffList';
import StaffProfileModal from '../components/StaffProfileModal';
import StaffAnalytics from '../components/StaffAnalytics';
import StaffCollaboration from '../components/StaffCollaboration';
import StaffDocuments from '../components/StaffDocuments';
import StaffTasks from '../components/StaffTasks';
import StaffSettings from '../components/StaffSettings';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'directory', label: 'Directory', icon: 'people' },
  { key: 'analytics', label: 'Analytics', icon: 'analytics' },
  { key: 'collaboration', label: 'Collaboration', icon: 'group-work' },
  { key: 'documents', label: 'Documents', icon: 'folder' },
  { key: 'tasks', label: 'Tasks', icon: 'assignment' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

const AdvancedStaffScreen = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StaffDashboard onSelectStaff={staff => { setSelectedStaff(staff); setShowProfile(true); }} />;
      case 'directory':
        return <StaffList onSelectStaff={staff => { setSelectedStaff(staff); setShowProfile(true); }} />;
      case 'analytics':
        return <StaffAnalytics />;
      case 'collaboration':
        return <StaffCollaboration />;
      case 'documents':
        return <StaffDocuments />;
      case 'tasks':
        return <StaffTasks />;
      case 'settings':
        return <StaffSettings />;
      default:
        return <View style={styles.placeholder}><Text>{activeTab} coming soon...</Text></View>;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Advanced Staff Management</Text>
        <Text style={styles.headerSubtitle}>Comprehensive ERP-level staff administration</Text>
      </View>
      
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={activeTab === tab.key ? styles.activeTabText : styles.tabText}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.content}>{renderTab()}</View>
      
      <StaffProfileModal
        visible={showProfile}
        staff={selectedStaff}
        onClose={() => setShowProfile(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0',
    elevation: 2
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#1a1a1a', 
    marginBottom: 4 
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: '#666', 
    fontStyle: 'italic' 
  },
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  tabButton: { 
    flex: 1, 
    padding: 16, 
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'
  },
  activeTab: { 
    borderBottomColor: '#007AFF',
    backgroundColor: '#f0f8ff'
  },
  tabText: { 
    color: '#666', 
    fontWeight: '500',
    fontSize: 12
  },
  activeTabText: { 
    color: '#007AFF', 
    fontWeight: 'bold',
    fontSize: 12
  },
  content: { flex: 1 },
  placeholder: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    elevation: 2
  },
});

export default AdvancedStaffScreen; 
