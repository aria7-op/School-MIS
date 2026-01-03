import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../theme';
import { Card, CardContent } from '../../../components/ui/cards/Card';
import { Button } from '../../../components/ui/buttons/Button';
import { Icon } from '../../../components/ui/Icon';
import { LoadingSpinner } from '../../../components/ui/loaders/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useParentData } from '../hooks/useParentData';

interface StudentDetail {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  rollNumber: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  photo?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  address: string;
  enrollmentDate: string;
  status: string;
  attendance: number;
  averageGrade: number;
  subjects: string[];
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
}

const ParentStudentsScreen: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  
  const { getParentChildren, getStudentDetails } = useParentData();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await getParentChildren();
      if (studentsData.success) {
        setStudents(studentsData.data);
        if (studentsData.data.length > 0) {
          setSelectedStudent(studentsData.data[0].id);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load students data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
  };

  const handleContactTeacher = (student: StudentDetail) => {
    if (!student.teacherName) {
      Alert.alert('Error', 'Teacher information not available');
      return;
    }
    
    Alert.alert(
      'Contact Teacher',
      `Would you like to contact ${student.teacherName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => {
          // Handle email action
          if (student.teacherEmail) {
            Linking.openURL(`mailto:${student.teacherEmail}`);
          } else {
            Alert.alert('Error', 'Teacher email not available');
          }
        }},
        { text: 'Call', onPress: () => {
          // Handle call action
          if (student.teacherPhone) {
            Linking.openURL(`tel:${student.teacherPhone}`);
          } else {
            Alert.alert('Error', 'Teacher phone not available');
          }
        }},
      ]
    );
  };

  const handleViewReport = (studentId: string) => {
    // Navigate to detailed report screen
    // TODO: Implement navigation to detailed report screen
    console.log('Navigate to report for student:', studentId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon="school-outline"
        title="No Students Found"
        message="Contact the school administration to link your account with your children."
      />
    );
  }

  const currentStudent = students.find(s => s.id === selectedStudent);

  if (!currentStudent) {
    return (
      <EmptyState
        icon="user-x"
        title="Student Not Found"
        message="The selected student could not be found. Please try refreshing the page."
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Children</Text>
        <Text style={styles.headerSubtitle}>
          Manage and monitor your children's academic progress
        </Text>
      </View>

      {/* Student Selector */}
      {students.length > 1 && (
        <View style={styles.studentSelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorContent}
          >
            {students.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={[
                  styles.studentOption,
                  selectedStudent === student.id && styles.studentOptionSelected
                ]}
                onPress={() => handleStudentSelect(student.id)}
              >
                <Image
                  source={
                    student.photo && student.photo.startsWith('http')
                      ? { uri: student.photo }
                      : undefined
                  }
                  style={styles.studentAvatar}
                />
                <Text style={[
                  styles.studentOptionText,
                  selectedStudent === student.id && styles.studentOptionTextSelected
                ]}>
                  {student.firstName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Selected Student Details */}
      {currentStudent && (
        <View style={styles.studentDetails}>
          {/* Student Header */}
          <Card style={styles.studentHeaderCard}>
            <CardContent>
              <View style={styles.studentHeader}>
                <Image
                  source={
                    currentStudent.photo && currentStudent.photo.startsWith('http')
                      ? { uri: currentStudent.photo }
                      : undefined
                  }
                  style={styles.studentPhoto}
                />
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>
                    {currentStudent.firstName} {currentStudent.lastName}
                  </Text>
                  <Text style={styles.studentGrade}>
                    Grade {currentStudent.grade} • Section {currentStudent.section}
                  </Text>
                  <Text style={styles.studentRoll}>
                    Roll No: {currentStudent.rollNumber || 'N/A'}
                  </Text>
                </View>
                <View style={styles.studentStats}>
                  <Text style={styles.attendanceText}>
                    {currentStudent.attendance || 0}%
                  </Text>
                  <Text style={styles.attendanceLabel}>Attendance</Text>
                  <Text style={styles.gradeText}>
                    {currentStudent.averageGrade}%
                  </Text>
                  <Text style={styles.gradeLabel}>Average</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card style={styles.infoCard}>
            <CardContent>
              <Text style={styles.cardTitle}>Academic Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Enrollment Date:</Text>
                <Text style={styles.infoValue}>{currentStudent.enrollmentDate || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[
                  styles.infoValue,
                  { color: currentStudent.status === 'active' ? theme.colors.success : theme.colors.warning }
                ]}>
                  {currentStudent.status ? 
                    currentStudent.status.charAt(0).toUpperCase() + currentStudent.status.slice(1) : 
                    'N/A'
                  }
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Subjects:</Text>
                <Text style={styles.infoValue}>
                  {currentStudent.subjects && currentStudent.subjects.length > 0 ? 
                    currentStudent.subjects.join(', ') : 
                    'No subjects assigned'
                  }
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card style={styles.infoCard}>
            <CardContent>
              <Text style={styles.cardTitle}>Personal Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date of Birth:</Text>
                <Text style={styles.infoValue}>{currentStudent.dateOfBirth}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender:</Text>
                <Text style={styles.infoValue}>{currentStudent.gender}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Blood Group:</Text>
                <Text style={styles.infoValue}>{currentStudent.bloodGroup || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Emergency Contact:</Text>
                <Text style={styles.infoValue}>{currentStudent.emergencyContact || 'N/A'}</Text>
              </View>
            </CardContent>
          </Card>

          {/* Teacher Information */}
          <Card style={styles.infoCard}>
            <CardContent>
              <Text style={styles.cardTitle}>Class Teacher</Text>
              <View style={styles.teacherInfo}>
                <View style={styles.teacherDetails}>
                  <Text style={styles.teacherName}>{currentStudent.teacherName || 'N/A'}</Text>
                  <Text style={styles.teacherEmail}>{currentStudent.teacherEmail || 'N/A'}</Text>
                  <Text style={styles.teacherPhone}>{currentStudent.teacherPhone || 'N/A'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleContactTeacher(currentStudent)}
                >
                  <Icon name="message-circle" size={20} color={theme.colors.white} />
                  <Text style={styles.contactButtonText}>Contact</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="View Detailed Report"
              onPress={() => handleViewReport(currentStudent.id)}
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
            />
            <Button
              title="View Attendance"
              onPress={() => {
                // TODO: Implement attendance view functionality
                console.log('View attendance for student:', currentStudent.id);
              }}
              style={[styles.actionButton, styles.secondaryButton]}
              textStyle={styles.secondaryButtonText}
            />
            <Button
              title="View Grades"
              onPress={() => {
                // TODO: Implement grades view functionality
                console.log('View grades for student:', currentStudent.id);
              }}
              style={[styles.actionButton, styles.secondaryButton]}
              textStyle={styles.secondaryButtonText}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.9,
  },
  studentSelector: {
    backgroundColor: theme.colors.white,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectorContent: {
    paddingHorizontal: 20,
  },
  studentOption: {
    alignItems: 'center',
    marginRight: 20,
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  studentOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  studentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  studentOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  studentDetails: {
    padding: 20,
  },
  studentHeaderCard: {
    marginBottom: 20,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  studentGrade: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 3,
  },
  studentRoll: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  studentStats: {
    alignItems: 'center',
  },
  attendanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: 2,
  },
  attendanceLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  gradeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  gradeLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  infoCard: {
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  teacherInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 3,
  },
  teacherEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  teacherPhone: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  contactButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  actionButtons: {
    gap: 15,
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ParentStudentsScreen; 