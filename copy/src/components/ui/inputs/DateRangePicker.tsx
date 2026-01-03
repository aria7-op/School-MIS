import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Components
import { Icon } from '../Icon';

// Constants
import { COLORS, SPACING, FONTS } from '../../../theme';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  placeholder?: string;
  style?: any;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date range...',
  style
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      if (pickerMode === 'start') {
        onChange({
          startDate: selectedDate,
          endDate: value.endDate
        });
      } else {
        onChange({
          startDate: value.startDate,
          endDate: selectedDate
        });
      }
    }
  };

  const handleStartDatePress = () => {
    setPickerMode('start');
    setShowPicker(true);
  };

  const handleEndDatePress = () => {
    setPickerMode('end');
    setShowPicker(true);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString();
  };

  const getDisplayText = () => {
    if (!value.startDate && !value.endDate) {
      return placeholder;
    }
    
    const startText = value.startDate ? formatDate(value.startDate) : 'Start Date';
    const endText = value.endDate ? formatDate(value.endDate) : 'End Date';
    
    return `${startText} - ${endText}`;
  };

  const clearDates = () => {
    onChange({ startDate: null, endDate: null });
  };

  return (
    <View style={[styles.container, style]}>
      {/* Trigger Button */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          <Icon name="event" size={16} color={COLORS.textSecondary} />
          <Text style={[
            styles.triggerText,
            (!value.startDate && !value.endDate) && styles.placeholderText
          ]}>
            {getDisplayText()}
          </Text>
          <Icon name="arrow-drop-down" size={20} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Date Selection */}
            <View style={styles.dateSelection}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={handleStartDatePress}
              >
                <Text style={styles.dateLabel}>Start Date</Text>
                <Text style={styles.dateValue}>
                  {value.startDate ? formatDate(value.startDate) : 'Select'}
                </Text>
              </TouchableOpacity>

              <View style={styles.dateSeparator}>
                <Icon name="arrow-forward" size={16} color={COLORS.textSecondary} />
              </View>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={handleEndDatePress}
              >
                <Text style={styles.dateLabel}>End Date</Text>
                <Text style={styles.dateValue}>
                  {value.endDate ? formatDate(value.endDate) : 'Select'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={clearDates}
              >
                <Text style={styles.actionButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.applyButton]}
                onPress={() => setIsOpen(false)}
              >
                <Text style={[styles.actionButtonText, styles.applyButtonText]}>
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker */}
      {showPicker && (
        <DateTimePicker
          value={pickerMode === 'start' ? (value.startDate || new Date()) : (value.endDate || new Date())}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={pickerMode === 'start' ? value.endDate || undefined : undefined}
          minimumDate={pickerMode === 'end' ? value.startDate || undefined : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  trigger: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  triggerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: '90%',
    padding: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  dateSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dateButton: {
    flex: 1,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  dateLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  dateValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  dateSeparator: {
    marginHorizontal: SPACING.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  applyButtonText: {
    color: COLORS.white,
  },
}); 
