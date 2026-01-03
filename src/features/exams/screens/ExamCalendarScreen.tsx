import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import ExamCalendar from '../components/ExamCalendar';
import ExamDetailsModal from '../components/ExamDetailsModal';
import ExamFormModal from '../components/ExamFormModal';
import { Exam, CreateExamData } from '../services/examApi';
import { useExamApi } from '../hooks/useExamApi';

const ExamCalendarScreen: React.FC = () => {
  const { colors, dark } = useTheme();
  const { user } = useAuth();
  const { createExam, updateExam, deleteExam } = useExamApi();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showExamDetails, setShowExamDetails] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';
  const canCreateExam = isAdmin || user?.role === 'TEACHER';

  const handleDateSelect = (date: Date, exams: Exam[]) => {
    setSelectedDate(date);
    if (exams.length === 0 && canCreateExam) {
      // Show option to create exam on empty date
      Alert.alert(
        'Empty Date',
        `No exams scheduled for ${date.toLocaleDateString()}. Would you like to create an exam?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create Exam',
            onPress: () => handleCreateExamForDate(date)
          }
        ]
      );
    }
  };

  const handleExamPress = (exam: Exam) => {
    setSelectedExam(exam);
    setShowExamDetails(true);
  };

  const handleCreateExamForDate = (date: Date) => {
    setSelectedDate(date);
    setEditingExam(null);
    setShowExamForm(true);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setShowExamForm(true);
    setShowExamDetails(false);
  };

  const handleDeleteExam = (exam: Exam) => {
    Alert.alert(
      'Delete Exam',
      `Are you sure you want to delete "${exam.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteExam(exam.id);
            if (result) {
              Alert.alert('Success', 'Exam deleted successfully');
              setShowExamDetails(false);
              setSelectedExam(null);
            }
          }
        }
      ]
    );
  };

  const handleExamSubmit = async (data: CreateExamData) => {
    try {
      // If we have a selected date but no specific start date in data, use selected date
      const examData = {
        ...data,
        startDate: data.startDate || (selectedDate ? selectedDate.toISOString() : new Date().toISOString()),
        endDate: data.endDate || (selectedDate ? 
          new Date(selectedDate.getTime() + 2 * 60 * 60 * 1000).toISOString() : // 2 hours later
          new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        )
      };

      if (editingExam) {
        const result = await updateExam(editingExam.id, examData);
        if (result) {
          Alert.alert('Success', 'Exam updated successfully');
        }
      } else {
        const result = await createExam(examData);
        if (result) {
          Alert.alert('Success', 'Exam created successfully');
        }
      }
      
      setShowExamForm(false);
      setEditingExam(null);
      setSelectedDate(null);
    } catch (error) {
      console.error('Exam submit error:', error);
    }
  };

  const handleQuickCreateExam = () => {
    setSelectedDate(new Date());
    setEditingExam(null);
    setShowExamForm(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Exam Calendar
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
            {isAdmin ? 'Admin View - Manage exam schedules' : 'View scheduled exams'}
          </Text>
        </View>
        
        {canCreateExam && (
          <TouchableOpacity
            style={[styles.quickCreateButton, { backgroundColor: colors.primary }]}
            onPress={handleQuickCreateExam}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.quickCreateText}>Quick Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Instructions for Admin */}
      {isAdmin && (
        <View style={[styles.instructionsCard, { backgroundColor: colors.card }]}>
          <View style={styles.instructionItem}>
            <View style={[styles.instructionDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.instructionText, { color: colors.text }]}>
              Green dates are available for scheduling
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={[styles.instructionDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.instructionText, { color: colors.text }]}>
              Tap any date to view details or create exams
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={[styles.instructionDot, { backgroundColor: '#F59E42' }]} />
            <Text style={[styles.instructionText, { color: colors.text }]}>
              Colored dots indicate different exam types
            </Text>
          </View>
        </View>
      )}

      {/* Calendar Component */}
      <View style={styles.calendarContainer}>
        <ExamCalendar
          onDateSelect={handleDateSelect}
          onExamPress={handleExamPress}
        />
      </View>

      {/* Modals */}
      <ExamDetailsModal
        visible={showExamDetails}
        exam={selectedExam}
        onClose={() => {
          setShowExamDetails(false);
          setSelectedExam(null);
        }}
        onEdit={() => handleEditExam(selectedExam!)}
        onDelete={() => handleDeleteExam(selectedExam!)}
      />

      <ExamFormModal
        visible={showExamForm}
        exam={editingExam}
        onClose={() => {
          setShowExamForm(false);
          setEditingExam(null);
          setSelectedDate(null);
        }}
        onSubmit={handleExamSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  quickCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  quickCreateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  instructionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  instructionText: {
    fontSize: 14,
    flex: 1,
  },
  calendarContainer: {
    flex: 1,
  },
});

export default ExamCalendarScreen;