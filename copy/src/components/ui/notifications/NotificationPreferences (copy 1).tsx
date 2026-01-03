import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNotifications } from '../../../contexts/NotificationContext';
import { NotificationPreferences as NotificationPreferencesType, NotificationType } from '../../../types/notifications';

interface NotificationPreferencesProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  visible,
  onClose
}) => {
  const { preferences, updatePreferences } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferencesType | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handlePreferenceChange = (key: keyof NotificationPreferencesType, value: any) => {
    if (!localPreferences) return;
    setLocalPreferences(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleQuietHoursChange = (key: 'enabled' | 'start' | 'end', value: any) => {
    if (!localPreferences) return;
    setLocalPreferences(prev => {
      if (!prev) return null;
      return {
        ...prev,
        quietHours: {
          ...prev.quietHours,
          [key]: value
        }
      };
    });
  };

  const handleTypeToggle = (type: NotificationType) => {
    if (!localPreferences) return;
    setLocalPreferences(prev => {
      if (!prev) return null;
      return {
        ...prev,
        types: {
          ...prev.types,
          [type]: !prev.types[type]
        }
      };
    });
  };

  const handleSave = async () => {
    if (!localPreferences) return;
    
    try {
      await updatePreferences(localPreferences);
      Alert.alert('Success', 'Notification preferences updated successfully');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all notification preferences to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultPreferences: NotificationPreferencesType = {
              email: true,
              push: true,
              inApp: true,
              quietHours: {
                enabled: false,
                start: '22:00',
                end: '08:00'
              },
              types: {} as Record<NotificationType, boolean>
            };
            setLocalPreferences(defaultPreferences);
          }
        }
      ]
    );
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(null);
    if (selectedTime) {
      const timeString = selectedTime.toTimeString().slice(0, 5);
      if (showTimePicker === 'start') {
        handleQuietHoursChange('start', timeString);
      } else if (showTimePicker === 'end') {
        handleQuietHoursChange('end', timeString);
      }
    }
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const notificationTypes: { label: string; value: NotificationType; icon: string }[] = [
    { label: 'Student Notifications', value: 'STUDENT_CREATED', icon: 'person' },
    { label: 'Payment Notifications', value: 'PAYMENT_RECEIVED', icon: 'payment' },
    { label: 'Exam Notifications', value: 'EXAM_SCHEDULED', icon: 'event' },
    { label: 'Attendance Notifications', value: 'ATTENDANCE_MARKED', icon: 'check-circle' },
    { label: 'System Notifications', value: 'SYSTEM_UPDATE', icon: 'system-update' },
    { label: 'Class Notifications', value: 'CLASS_CREATED', icon: 'class' },
    { label: 'Teacher Notifications', value: 'TEACHER_CREATED', icon: 'school' },
    { label: 'Visitor Notifications', value: 'CUSTOMER_CREATED', icon: 'people' }
  ];

  if (!localPreferences) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Notification Preferences</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Delivery Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Methods</Text>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <MaterialIcons name="notifications" size={20} color="#3B82F6" />
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceLabel}>In-App Notifications</Text>
                  <Text style={styles.preferenceDescription}>
                    Show notifications within the app
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.inApp}
                onValueChange={(value) => handlePreferenceChange('inApp', value)}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <MaterialIcons name="push-notification" size={20} color="#10B981" />
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceLabel}>Push Notifications</Text>
                  <Text style={styles.preferenceDescription}>
                    Show notifications on device
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.push}
                onValueChange={(value) => handlePreferenceChange('push', value)}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <MaterialIcons name="email" size={20} color="#F59E0B" />
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceLabel}>Email Notifications</Text>
                  <Text style={styles.preferenceDescription}>
                    Send notifications via email
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.email}
                onValueChange={(value) => handlePreferenceChange('email', value)}
                trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Quiet Hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <MaterialIcons name="schedule" size={20} color="#8B5CF6" />
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceLabel}>Enable Quiet Hours</Text>
                  <Text style={styles.preferenceDescription}>
                    Pause notifications during specified hours
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.quietHours.enabled}
                onValueChange={(value) => handleQuietHoursChange('enabled', value)}
                trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {localPreferences.quietHours.enabled && (
              <View style={styles.quietHoursContainer}>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker('start')}
                >
                  <MaterialIcons name="schedule" size={16} color="#6B7280" />
                  <Text style={styles.timeButtonText}>
                    Start: {formatTime(localPreferences.quietHours.start)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker('end')}
                >
                  <MaterialIcons name="schedule" size={16} color="#6B7280" />
                  <Text style={styles.timeButtonText}>
                    End: {formatTime(localPreferences.quietHours.end)}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Notification Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
            <Text style={styles.sectionDescription}>
              Choose which types of notifications you want to receive
            </Text>
            
            {notificationTypes.map((type) => (
              <View key={type.value} style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <MaterialIcons name={type.icon as any} size={20} color="#6B7280" />
                  <View style={styles.preferenceText}>
                    <Text style={styles.preferenceLabel}>{type.label}</Text>
                  </View>
                </View>
                <Switch
                  value={localPreferences.types[type.value] !== false}
                  onValueChange={() => handleTypeToggle(type.value)}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset to Default</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceText: {
    marginLeft: 12,
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  quietHoursContainer: {
    marginTop: 12,
    gap: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default NotificationPreferences; 
