import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ClassManagementProps {
  classes: any[];
  onClassSelect: (classId: string | null) => void;
  selectedClass: string | null;
}

const ClassManagement: React.FC<ClassManagementProps> = ({ 
  classes, 
  onClassSelect, 
  selectedClass 
}) => {
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const toggleClassExpansion = (classId: string) => {
    setExpandedClass(expandedClass === classId ? null : classId);
  };

  const renderClassCard = ({ item: cls }: { item: any }) => {
    const isExpanded = expandedClass === cls.id;
    const isSelected = selectedClass === cls.id;
    const studentCount = cls.students?.length || 0;

    return (
      <View style={[styles.classCard, isSelected && styles.selectedClassCard]}>
        <TouchableOpacity
          style={styles.classHeader}
          onPress={() => toggleClassExpansion(cls.id)}
        >
          <View style={styles.classInfo}>
            <Text style={styles.className}>{cls.name}</Text>
            <Text style={styles.classSubject}>{cls.subject}</Text>
            <Text style={styles.classSchedule}>
              {cls.schedule || 'Schedule not set'}
            </Text>
          </View>
          <View style={styles.classActions}>
            <View style={styles.studentCount}>
              <MaterialIcons name="people" size={16} color="#6B7280" />
              <Text style={styles.studentCountText}>{studentCount}</Text>
            </View>
            <MaterialIcons
              name={isExpanded ? 'expand-less' : 'expand-more'}
              size={24}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.classDetails}>
            {/* Class Statistics */}
            <View style={styles.classStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{studentCount}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{cls.assignments?.length || 0}</Text>
                <Text style={styles.statLabel}>Assignments</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{cls.exams?.length || 0}</Text>
                <Text style={styles.statLabel}>Exams</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="people" size={20} color="#3B82F6" />
                <Text style={styles.actionText}>View Students</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="add" size={20} color="#10B981" />
                <Text style={styles.actionText}>Add Assignment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="quiz" size={20} color="#F59E0B" />
                <Text style={styles.actionText}>Create Exam</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="check-circle" size={20} color="#EF4444" />
                <Text style={styles.actionText}>Mark Attendance</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Students */}
            {cls.students && cls.students.length > 0 && (
              <View style={styles.recentStudents}>
                <Text style={styles.sectionTitle}>Recent Students</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {cls.students.slice(0, 5).map((student: any, index: number) => (
                    <View key={index} style={styles.studentItem}>
                      <View style={styles.studentAvatar}>
                        <Text style={styles.studentInitials}>
                          {student.user?.firstName?.charAt(0) || 'S'}
                          {student.user?.lastName?.charAt(0) || 'T'}
                        </Text>
                      </View>
                      <Text style={styles.studentName}>
                        {student.user?.firstName} {student.user?.lastName}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Class Selection Button */}
        <TouchableOpacity
          style={[styles.selectButton, isSelected && styles.selectedButton]}
          onPress={() => onClassSelect(isSelected ? null : cls.id)}
        >
          <Text style={[styles.selectButtonText, isSelected && styles.selectedButtonText]}>
            {isSelected ? 'Selected' : 'Select Class'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!classes || classes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="class" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No Classes Found</Text>
        <Text style={styles.emptyMessage}>
          You haven't been assigned to any classes yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Class Management</Text>
        <Text style={styles.subtitle}>
          Manage your classes and view student information
        </Text>
      </View>

      <FlatList
        data={classes}
        renderItem={renderClassCard}
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
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedClassCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  classSubject: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  classSchedule: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  classActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  studentCountText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  classDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  classStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  recentStudents: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  studentItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  studentName: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    maxWidth: 60,
  },
  selectButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#3B82F6',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedButtonText: {
    color: '#FFFFFF',
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

export default ClassManagement; 