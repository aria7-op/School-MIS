import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useExamApi } from '../hooks/useExamApi';

interface ExamBulkActionsModalProps {
  visible: boolean;
  selectedExams: string[];
  onClose: () => void;
  onComplete: () => void;
}

const ExamBulkActionsModal: React.FC<ExamBulkActionsModalProps> = ({
  visible,
  selectedExams,
  onClose,
  onComplete
}) => {
  const { colors } = useTheme();
  const { bulkDeleteExams, exportExams } = useExamApi();

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Exams',
      `Are you sure you want to delete ${selectedExams.length} exam(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await bulkDeleteExams(selectedExams);
            if (result) {
              Alert.alert('Success', `${result.success} exam(s) deleted successfully`);
              onComplete();
            }
          }
        }
      ]
    );
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const blob = await exportExams(format, { 
        // Note: This would need to be implemented to filter by selected exams
        // For now, it exports all exams
      });
      
      // Create download link (web) or handle file saving (mobile)
      if (blob) {
        Alert.alert('Success', `Exams exported successfully as ${format.toUpperCase()}`);
        onComplete();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export exams');
    }
  };

  const actions = [
    {
      id: 'delete',
      title: 'Delete Selected',
      subtitle: `Delete ${selectedExams.length} exam(s)`,
      icon: 'trash-outline',
      color: '#EF4444',
      onPress: handleBulkDelete
    },
    {
      id: 'export-csv',
      title: 'Export as CSV',
      subtitle: 'Download exam data as CSV file',
      icon: 'document-text-outline',
      color: '#10B981',
      onPress: () => handleExport('csv')
    },
    {
      id: 'export-json',
      title: 'Export as JSON',
      subtitle: 'Download exam data as JSON file',
      icon: 'code-outline',
      color: '#3B82F6',
      onPress: () => handleExport('json')
    }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Bulk Actions
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.selectedInfo}>
            <Text style={[styles.selectedText, { color: colors.text + '80' }]}>
              {selectedExams.length} exam(s) selected
            </Text>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.actions}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.actionItem, { backgroundColor: colors.background }]}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                    <Ionicons name={action.icon as any} size={20} color={action.color} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>
                      {action.title}
                    </Text>
                    <Text style={[styles.actionSubtitle, { color: colors.text + '60' }]}>
                      {action.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.text + '40'} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  selectedText: {
    fontSize: 14,
  },
  content: {
    maxHeight: 400,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
  },
});

export default ExamBulkActionsModal;