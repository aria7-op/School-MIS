import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AttendanceStatus } from '../types';

interface AttendanceFormProps {
  initialStatus?: AttendanceStatus;
  initialNotes?: string;
  onSubmit: (status: AttendanceStatus, notes: string) => void;
  onCancel?: () => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  initialStatus = 'present',
  initialNotes = '',
  onSubmit,
  onCancel,
}) => {
  const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [showNotes, setShowNotes] = useState(false);

  const statusOptions: { value: AttendanceStatus; label: string; icon: string; color: string }[] = [
    { value: 'present', label: 'Present', icon: 'check-circle', color: '#4CAF50' },
    { value: 'absent', label: 'Absent', icon: 'cancel', color: '#F44336' },
    { value: 'late', label: 'Late', icon: 'schedule', color: '#FFC107' },
    { value: 'excused', label: 'Excused', icon: 'assignment-turned-in', color: '#9C27B0' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.statusButton,
              status === option.value && { backgroundColor: `${option.color}20`, borderColor: option.color },
            ]}
            onPress={() => setStatus(option.value)}
          >
            <MaterialIcons
              name={option.icon}
              size={24}
              color={option.color}
              style={styles.statusIcon}
            />
            <Text style={[styles.statusText, { color: option.color }]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.notesToggle}
        onPress={() => setShowNotes(!showNotes)}
      >
        <Text style={styles.notesToggleText}>
          {showNotes ? 'Hide Notes' : 'Add Notes'}
        </Text>
        <MaterialIcons
          name={showNotes ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color="#3f51b5"
        />
      </TouchableOpacity>

      {showNotes && (
        <View style={styles.notesContainer}>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes (optional)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      )}

      <View style={styles.buttonContainer}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => onSubmit(status, notes)}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesToggleText: {
    color: '#3f51b5',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: 12,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3f51b5',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AttendanceForm;
