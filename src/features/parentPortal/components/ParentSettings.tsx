import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ParentSettingsProps {
  studentId: string;
  studentName: string;
}

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  value: 'public' | 'private' | 'friends';
}

const ParentSettings: React.FC<ParentSettingsProps> = ({
  studentId,
  studentName,
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'privacy' | 'security'>('profile');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editField, setEditField] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');

  // Mock parent data - replace with actual API calls
  const [parentProfile, setParentProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, City, State 12345',
    emergencyContact: 'Jane Doe',
    emergencyPhone: '+1 (555) 987-6543',
    language: 'English',
    timezone: 'Eastern Time',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: '1',
      title: 'Grade Updates',
      description: 'Receive notifications when new grades are posted',
      enabled: true,
    },
    {
      id: '2',
      title: 'Attendance Alerts',
      description: 'Get notified about attendance issues',
      enabled: true,
    },
    {
      id: '3',
      title: 'Assignment Due Dates',
      description: 'Reminders for upcoming assignments',
      enabled: false,
    },
    {
      id: '4',
      title: 'School Announcements',
      description: 'Important school-wide announcements',
      enabled: true,
    },
    {
      id: '5',
      title: 'Fee Payment Reminders',
      description: 'Payment due date notifications',
      enabled: true,
    },
    {
      id: '6',
      title: 'Parent-Teacher Meeting',
      description: 'Meeting schedule updates',
      enabled: true,
    },
  ]);

  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    {
      id: '1',
      title: 'Profile Visibility',
      description: 'Who can see your profile information',
      value: 'private',
    },
    {
      id: '2',
      title: 'Student Information',
      description: 'Control access to student details',
      value: 'private',
    },
    {
      id: '3',
      title: 'Academic Progress',
      description: 'Share academic achievements',
      value: 'friends',
    },
  ]);

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    sessionTimeout: '30 minutes',
    passwordExpiry: '90 days',
  });

  const handleNotificationToggle = (id: string) => {
    setNotificationSettings(prev =>
      prev.map(setting =>
        setting.id === id
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  const handlePrivacyChange = (id: string, value: 'public' | 'private' | 'friends') => {
    setPrivacySettings(prev =>
      prev.map(setting =>
        setting.id === id
          ? { ...setting, value }
          : setting
      )
    );
  };

  const handleSecurityToggle = (setting: keyof typeof securitySettings, value?: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value !== undefined ? value : !prev[setting],
    }));
  };

  const handleEditProfile = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue);
    setShowEditModal(true);
  };

  const handleSaveProfile = () => {
    if (editValue.trim()) {
      setParentProfile(prev => ({
        ...prev,
        [editField]: editValue.trim(),
      }));
      setShowEditModal(false);
      setEditValue('');
      Alert.alert('Success', 'Profile updated successfully!');
    }
  };

  const getPrivacyIcon = (value: string): string => {
    switch (value) {
      case 'public':
        return 'globe';
      case 'private':
        return 'lock-closed';
      case 'friends':
        return 'people';
      default:
        return 'ellipse';
    }
  };

  const getPrivacyColor = (value: string): string => {
    switch (value) {
      case 'public':
        return '#10b981';
      case 'private':
        return '#ef4444';
      case 'friends':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const renderProfileSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      
      {Object.entries(parentProfile).map(([key, value]) => (
        <View key={key} style={styles.profileItem}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileLabel}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </Text>
            <Text style={styles.profileValue}>{value}</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditProfile(key, value)}
          >
            <Ionicons name="pencil" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderNotificationsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notification Preferences</Text>
      
      {notificationSettings.map(setting => (
        <View key={setting.id} style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{setting.title}</Text>
            <Text style={styles.settingDescription}>{setting.description}</Text>
          </View>
          <Switch
            value={setting.enabled}
            onValueChange={() => handleNotificationToggle(setting.id)}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={setting.enabled ? '#3b82f6' : '#9ca3af'}
          />
        </View>
      ))}
    </View>
  );

  const renderPrivacySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Privacy & Sharing</Text>
      
      {privacySettings.map(setting => (
        <View key={setting.id} style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{setting.title}</Text>
            <Text style={styles.settingDescription}>{setting.description}</Text>
          </View>
          <View style={styles.privacySelector}>
            {(['private', 'friends', 'public'] as const).map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.privacyOption,
                  setting.value === option && styles.privacyOptionActive,
                ]}
                onPress={() => handlePrivacyChange(setting.id, option)}
              >
                <Ionicons
                  name={getPrivacyIcon(option) as any}
                  size={16}
                  color={setting.value === option ? 'white' : getPrivacyColor(option)}
                />
                <Text
                  style={[
                    styles.privacyOptionText,
                    setting.value === option && styles.privacyOptionTextActive,
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderSecuritySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security Settings</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
          <Text style={styles.settingDescription}>
            Add an extra layer of security to your account
          </Text>
        </View>
        <Switch
          value={securitySettings.twoFactorAuth}
          onValueChange={() => handleSecurityToggle('twoFactorAuth')}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={securitySettings.twoFactorAuth ? '#3b82f6' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Login Notifications</Text>
          <Text style={styles.settingDescription}>
            Get notified of new login attempts
          </Text>
        </View>
        <Switch
          value={securitySettings.loginNotifications}
          onValueChange={() => handleSecurityToggle('loginNotifications')}
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={securitySettings.loginNotifications ? '#3b82f6' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Session Timeout</Text>
          <Text style={styles.settingDescription}>
            Automatically log out after inactivity
          </Text>
        </View>
        <Text style={styles.settingValue}>{securitySettings.sessionTimeout}</Text>
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Password Expiry</Text>
          <Text style={styles.settingDescription}>
            How often to change your password
          </Text>
        </View>
        <Text style={styles.settingValue}>{securitySettings.passwordExpiry}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parent Settings</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'profile' && styles.activeTab]}
          onPress={() => setActiveSection('profile')}
        >
          <Ionicons
            name="person"
            size={20}
            color={activeSection === 'profile' ? '#3b82f6' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeSection === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeSection === 'notifications' && styles.activeTab]}
          onPress={() => setActiveSection('notifications')}
        >
          <Ionicons
            name="notifications"
            size={20}
            color={activeSection === 'notifications' ? '#3b82f6' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeSection === 'notifications' && styles.activeTabText]}>
            Notifications
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeSection === 'privacy' && styles.activeTab]}
          onPress={() => setActiveSection('privacy')}
        >
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={activeSection === 'privacy' ? '#3b82f6' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeSection === 'privacy' && styles.activeTabText]}>
            Privacy
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeSection === 'security' && styles.activeTab]}
          onPress={() => setActiveSection('security')}
        >
          <Ionicons
            name="lock-closed"
            size={20}
            color={activeSection === 'security' ? '#3b82f6' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeSection === 'security' && styles.activeTabText]}>
            Security
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeSection === 'profile' && renderProfileSection()}
        {activeSection === 'notifications' && renderNotificationsSection()}
        {activeSection === 'privacy' && renderPrivacySection()}
        {activeSection === 'security' && renderSecuritySection()}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Enter ${editField.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
    margin: 20,
    marginTop: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileInfo: {
    flex: 1,
    marginRight: 16,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    color: '#111827',
  },
  editButton: {
    padding: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  settingValue: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  privacySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  privacyOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  privacyOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 4,
  },
  privacyOptionTextActive: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default ParentSettings; 