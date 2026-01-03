import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Exam, CreateExamData } from '../services/examApi';

interface ExamFormModalProps {
  visible: boolean;
  exam?: Exam | null;
  onClose: () => void;
  onSubmit: (data: CreateExamData) => void;
}

const ExamFormModal: React.FC<ExamFormModalProps> = ({
  visible,
  exam,
  onClose,
  onSubmit
}) => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState<CreateExamData>({
    name: '',
    code: '',
    type: 'MIDTERM',
    startDate: '',
    endDate: '',
    description: '',
    totalMarks: 100,
    passingMarks: 40
  });

  useEffect(() => {
    if (exam) {
      setFormData({
        name: exam.name,
        code: exam.code,
        type: exam.type,
        startDate: exam.startDate.split('T')[0],
        endDate: exam.endDate.split('T')[0],
        description: exam.description || '',
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        termId: exam.termId,
        classId: exam.classId,
        subjectId: exam.subjectId
      });
    } else {
      setFormData({
        name: '',
        code: '',
        type: 'MIDTERM',
        startDate: '',
        endDate: '',
        description: '',
        totalMarks: 100,
        passingMarks: 40
      });
    }
  }, [exam, visible]);

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    onSubmit({
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString()
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {exam ? 'Edit Exam' : 'Create Exam'}
          </Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Exam Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter exam name"
                placeholderTextColor={colors.text + '60'}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Exam Code *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={formData.code}
                onChangeText={(text) => setFormData(prev => ({ ...prev, code: text }))}
                placeholder="Enter exam code"
                placeholderTextColor={colors.text + '60'}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Type</Text>
              <View style={styles.typeButtons}>
                {['MIDTERM', 'FINAL', 'QUIZ', 'ASSIGNMENT', 'PROJECT', 'PRACTICAL'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      { backgroundColor: colors.card },
                      formData.type === type && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type: type as any }))}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      { color: formData.type === type ? '#fff' : colors.text }
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.startDate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, startDate: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text + '60'}
                />
              </View>
              <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.endDate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, endDate: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text + '60'}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Total Marks</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.totalMarks.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, totalMarks: parseInt(text) || 0 }))}
                  placeholder="100"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text + '60'}
                />
              </View>
              <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Passing Marks</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={formData.passingMarks.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, passingMarks: parseInt(text) || 0 }))}
                  placeholder="40"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text + '60'}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter exam description"
                placeholderTextColor={colors.text + '60'}
                multiline
                numberOfLines={4}
              />
            </View>
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
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ExamFormModal;