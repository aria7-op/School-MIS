import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface StudentManagementProps {
  students: any[];
  classes: any[];
  selectedClass: string | null;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ 
  students, 
  classes, 
  selectedClass 
}) => {
  const renderStudentItem = ({ item: student }: { item: any }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentInitials}>
            {student.user?.firstName?.charAt(0) || 'S'}
            {student.user?.lastName?.charAt(0) || 'T'}
          </Text>
        </View>
        <View style={styles.studentDetails}>
          <Text style={styles.studentName}>
            {student.user?.firstName} {student.user?.lastName}
          </Text>
          <Text style={styles.studentClass}>
            {student.class?.name || 'No class assigned'}
          </Text>
          <Text style={styles.studentEmail}>
            {student.user?.email || 'No email'}
          </Text>
        </View>
      </View>
      <View style={styles.studentActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="visibility" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="edit" size={20} color="#10B981" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="grade" size={20} color="#F59E0B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!students || students.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="people" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No Students Found</Text>
        <Text style={styles.emptyMessage}>
          {selectedClass ? 'No students in this class.' : 'No students assigned to you yet.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Management</Text>
        <Text style={styles.subtitle}>
          {selectedClass ? `Students in selected class` : 'All your students'}
        </Text>
      </View>

      <FlatList
        data={students}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  listContainer: {
    paddingBottom: 20,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  studentInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  studentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default StudentManagement; 