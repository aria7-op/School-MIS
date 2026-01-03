import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Exam } from '../services/examApi';

interface ExamDetailsModalProps {
  visible: boolean;
  exam: Exam | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ExamDetailsModal: React.FC<ExamDetailsModalProps> = ({
  visible,
  exam,
  onClose,
  onEdit,
  onDelete
}) => {
  const { colors } = useTheme();

  if (!exam) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Exam Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={onEdit} style={styles.headerAction}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.headerAction}>
              <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.details}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Name:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{exam.name}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Code:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{exam.code}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Type:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{exam.type}</Text>
              </View>
              
              {exam.description && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Description:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{exam.description}</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule</Text>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Start Date:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(exam.startDate)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>End Date:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(exam.endDate)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Grading</Text>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Total Marks:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{exam.totalMarks}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Passing Marks:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{exam.passingMarks}</Text>
              </View>
            </View>

            {(exam.class || exam.subject || exam.term) && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Academic Details</Text>
                
                {exam.class && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Class:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{exam.class.name}</Text>
                  </View>
                )}
                
                {exam.subject && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Subject:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{exam.subject.name}</Text>
                  </View>
                )}
                
                {exam.term && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Term:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{exam.term.name}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerAction: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  details: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
});

export default ExamDetailsModal;