import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NotificationFilters, NotificationStatus, NotificationType, NotificationPriority } from '../../../types/notifications';

interface NotificationFiltersModalProps {
  visible: boolean;
  filters: NotificationFilters;
  onClose: () => void;
  onApply: (filters: NotificationFilters) => void;
}

const NotificationFiltersModal: React.FC<NotificationFiltersModalProps> = ({
  visible,
  filters,
  onClose,
  onApply
}) => {
  const [localFilters, setLocalFilters] = useState<NotificationFilters>(filters);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof NotificationFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const resetFilters: NotificationFilters = {
      page: 1,
      limit: 20
    };
    setLocalFilters(resetFilters);
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(null);
    if (selectedDate) {
      const dateString = selectedDate.toISOString();
      if (showDatePicker === 'from') {
        handleFilterChange('dateFrom', dateString);
      } else if (showDatePicker === 'to') {
        handleFilterChange('dateTo', dateString);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Select date';
    return new Date(dateString).toLocaleDateString();
  };

  const statusOptions: { label: string; value: NotificationStatus }[] = [
    { label: 'All', value: undefined as any },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Read', value: 'READ' },
    { label: 'Archived', value: 'ARCHIVED' }
  ];

  const priorityOptions: { label: string; value: NotificationPriority }[] = [
    { label: 'All', value: undefined as any },
    { label: 'Urgent', value: 'URGENT' },
    { label: 'High', value: 'HIGH' },
    { label: 'Normal', value: 'NORMAL' },
    { label: 'Low', value: 'LOW' }
  ];

  const typeOptions: { label: string; value: NotificationType }[] = [
    { label: 'All', value: undefined as any },
    { label: 'Student', value: 'STUDENT_CREATED' },
    { label: 'Payment', value: 'PAYMENT_RECEIVED' },
    { label: 'Exam', value: 'EXAM_SCHEDULED' },
    { label: 'Attendance', value: 'ATTENDANCE_MARKED' },
    { label: 'System', value: 'SYSTEM_UPDATE' }
  ];

  const renderFilterSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderOptionButton = (
    options: { label: string; value: any }[],
    currentValue: any,
    onChange: (value: any) => void,
    key: string
  ) => (
    <View style={styles.optionsContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value || 'all'}
          style={[
            styles.optionButton,
            currentValue === option.value && styles.optionButtonActive
          ]}
          onPress={() => onChange(option.value)}
        >
          <Text
            style={[
              styles.optionText,
              currentValue === option.value && styles.optionTextActive
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filter Notifications</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderFilterSection(
            'Status',
            renderOptionButton(
              statusOptions,
              localFilters.status,
              (value) => handleFilterChange('status', value),
              'status'
            )
          )}

          {renderFilterSection(
            'Priority',
            renderOptionButton(
              priorityOptions,
              localFilters.priority,
              (value) => handleFilterChange('priority', value),
              'priority'
            )
          )}

          {renderFilterSection(
            'Type',
            renderOptionButton(
              typeOptions,
              localFilters.type,
              (value) => handleFilterChange('type', value),
              'type'
            )
          )}

          {renderFilterSection(
            'Date Range',
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker('from')}
              >
                <MaterialIcons name="calendar-today" size={16} color="#6B7280" />
                <Text style={styles.dateButtonText}>
                  From: {formatDate(localFilters.dateFrom)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker('to')}
              >
                <MaterialIcons name="calendar-today" size={16} color="#6B7280" />
                <Text style={styles.dateButtonText}>
                  To: {formatDate(localFilters.dateTo)}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {renderFilterSection(
            'Entity',
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Entity Type</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., student, visitor"
                value={localFilters.entityType || ''}
                onChangeText={(text) => handleFilterChange('entityType', text)}
              />
            </View>
          )}

          {renderFilterSection(
            'Entity ID',
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Entity ID</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter entity ID"
                value={localFilters.entityId || ''}
                onChangeText={(text) => handleFilterChange('entityId', text)}
              />
            </View>
          )}

          {renderFilterSection(
            'Results per Page',
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Limit</Text>
              <TextInput
                style={styles.textInput}
                placeholder="20"
                value={localFilters.limit?.toString() || ''}
                onChangeText={(text) => handleFilterChange('limit', parseInt(text) || 20)}
                keyboardType="numeric"
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
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
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  dateContainer: {
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
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
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default NotificationFiltersModal; 
