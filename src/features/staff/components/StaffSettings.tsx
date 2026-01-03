import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const StaffSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    taskReminders: true,
    documentExpiry: true,
    performanceReviews: true
  });
  const [showRoleModal, setShowRoleModal] = useState(false);

  const renderGeneralSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>General Settings</Text>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Default Language</Text>
        <TouchableOpacity style={styles.settingValue}>
          <Text>English</Text>
          <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Time Zone</Text>
        <TouchableOpacity style={styles.settingValue}>
          <Text>UTC+00:00</Text>
          <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Date Format</Text>
        <TouchableOpacity style={styles.settingValue}>
          <Text>MM/DD/YYYY</Text>
          <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNotificationSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      {Object.entries(notifications).map(([key, value]) => (
        <View key={key} style={styles.settingItem}>
          <Text style={styles.settingLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
          <Switch
            value={value}
            onValueChange={(newValue) => setNotifications(prev => ({ ...prev, [key]: newValue }))}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor={value ? '#fff' : '#f4f3f4'}
          />
        </View>
      ))}
    </View>
  );

  const renderRoleManagement = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Role Management</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowRoleModal(true)}>
        <MaterialIcons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Add New Role</Text>
      </TouchableOpacity>
      <View style={styles.roleList}>
        {['Admin', 'Teacher', 'Staff', 'Manager'].map(role => (
          <View key={role} style={styles.roleItem}>
            <Text style={styles.roleName}>{role}</Text>
            <TouchableOpacity style={styles.editButton}>
              <MaterialIcons name="edit" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderIntegrations = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Integrations</Text>
      {['Google Workspace', 'Microsoft 365', 'Slack', 'Zoom'].map(integration => (
        <View key={integration} style={styles.integrationItem}>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationName}>{integration}</Text>
            <Text style={styles.integrationStatus}>Connected</Text>
          </View>
          <TouchableOpacity style={styles.disconnectButton}>
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {['general', 'notifications', 'roles', 'integrations'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={activeTab === tab ? styles.activeTabText : styles.tabText}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <ScrollView style={styles.content}>
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'notifications' && renderNotificationSettings()}
        {activeTab === 'roles' && renderRoleManagement()}
        {activeTab === 'integrations' && renderIntegrations()}
      </ScrollView>

      <Modal visible={showRoleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add New Role</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowRoleModal(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tabButton: { flex: 1, padding: 16, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#007AFF' },
  tabText: { color: '#666', fontWeight: '500' },
  activeTabText: { color: '#007AFF', fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1f2937' },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  settingLabel: { fontSize: 16, color: '#374151' },
  settingValue: { flexDirection: 'row', alignItems: 'center' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, marginBottom: 16 },
  addButtonText: { marginLeft: 8, color: '#fff', fontWeight: '600' },
  roleList: { marginTop: 16 },
  roleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  roleName: { fontSize: 16, color: '#374151' },
  editButton: { padding: 8 },
  integrationItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  integrationInfo: { flex: 1 },
  integrationName: { fontSize: 16, color: '#374151' },
  integrationStatus: { fontSize: 14, color: '#10b981' },
  disconnectButton: { backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  disconnectText: { color: '#ef4444', fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 320 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalButton: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: '600' },
});

export default StaffSettings; 
