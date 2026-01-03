import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../../../contexts/TranslationContext';

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  attendance: 'present' | 'absent' | 'leave' | 'late';
  lastAttendance?: string;
}

interface Class {
  class_name: string;
  class_code: string;
  room_num: string;
  students?: Student[];
  timing: string;
  added_by: number;
  students_amount: string;
  enrolled_students: string;
  students_type: string;
}

// Dummy student data
const dummyStudents: Student[] = [
  { id: 1, name: 'John Doe', rollNumber: '001', attendance: 'present', lastAttendance: '2023-05-20' },
  { id: 2, name: 'Jane Smith', rollNumber: '002', attendance: 'absent', lastAttendance: '2023-05-19' },
  { id: 3, name: 'Robert Johnson', rollNumber: '003', attendance: 'late', lastAttendance: '2023-05-20' },
  { id: 4, name: 'Emily Davis', rollNumber: '004', attendance: 'leave', lastAttendance: '2023-05-18' },
  { id: 5, name: 'Michael Wilson', rollNumber: '005', attendance: 'present', lastAttendance: '2023-05-20' },
  { id: 6, name: 'Sarah Brown', rollNumber: '006', attendance: 'present', lastAttendance: '2023-05-20' },
  { id: 7, name: 'David Miller', rollNumber: '007', attendance: 'absent', lastAttendance: '2023-05-19' },
];

// Dummy class data
const dummyClassData: Class = {
  class_name: 'Mathematics 101',
  class_code: 'MATH101',
  room_num: 'B-205',
  students: dummyStudents,
  timing: '09:00 AM - 10:30 AM',
  added_by: 1,
  students_amount: '50',
  enrolled_students: '35',
  students_type: 'Regular',
};

const AttendanceStatus = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const getStatusColor = () => {
    switch(status) {
      case 'present': return '#4CAF50';
      case 'absent': return '#F44336';
      case 'late': return '#FFC107';
      case 'leave': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
      <MaterialIcons 
        name={
          status === 'present' ? 'check-circle' :
          status === 'absent' ? 'cancel' :
          status === 'late' ? 'alarm' : 'beach-access'
        } 
        size={14} 
        color="white" 
      />
      <Text style={styles.statusText}>{t(status)}</Text>
    </View>
  );
};

const StatsCard = ({ icon, value, label, color }: { icon: string, value: number, label: string, color: string }) => (
  <View style={[styles.statCard, { backgroundColor: color }]}>
    <MaterialIcons name={icon} size={20} color="white" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ClassSummary = ({ classData = dummyClassData }: { classData?: Class }) => {
  const { t } = useTranslation();
  if (!classData) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="class" size={48} color="#ccc" />
        <Text style={styles.emptyStateText}>{t('noClassSelected')}</Text>
      </View>
    );
  }

  const students = classData.students || [];
  const presentCount = students.filter(s => s.attendance === 'present').length;
  const absentCount = students.filter(s => s.attendance === 'absent').length;
  const lateCount = students.filter(s => s.attendance === 'late').length;
  const leaveCount = students.filter(s => s.attendance === 'leave').length;
  const attendancePercentage = students.length > 0 
    ? Math.round((presentCount / students.length) * 100) 
    : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>

      {/* Class Details */}
      <View style={styles.detailsContainer}>
           {/* Class Header */}
        <View style={styles.classHeader}>
        <View style={styles.classIcon}>
          <MaterialIcons name="school" size={27} color="#3F51B5" />
        </View>
        <View style={styles.classHeaderText}>
          <Text style={styles.classTitle}>{classData.class_name}</Text>
          <Text style={styles.classSubtitle}>{t('studentsTypeClass', { type: classData.students_type })}</Text>
        </View>
      </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="code" size={20} color="#666" />
          <Text style={styles.detailText}>{t('classCode')}: {classData.class_code}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="meeting-room" size={20} color="#666" />
          <Text style={styles.detailText}>{t('room')}: {classData.room_num}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="people" size={20} color="#666" />
          <Text style={styles.detailText}>
            {t('studentsEnrolled', { enrolled: classData.enrolled_students, total: classData.students_amount })}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="access-time" size={20} color="#666" />
          <Text style={styles.detailText}>{t('time')}: {classData.timing}</Text>
        </View>
      </View>

      {/* Attendance Stats */}
      <Text style={styles.sectionTitle}>{t('attendanceSummary')}</Text>
      <View style={styles.attendanceStats}>
        <View style={styles.attendancePercentage}>
          <Text style={styles.percentageText}>{attendancePercentage}%</Text>
          <Text style={styles.percentageLabel}>{t('todaysAttendance')}</Text>
        </View>
        
        <View style={styles.statsRow}>
          <StatsCard icon="check-circle" value={presentCount} label={t('present')} color="#4CAF50" />
          <StatsCard icon="cancel" value={absentCount} label={t('absent')} color="#F44336" />
          <StatsCard icon="alarm" value={lateCount} label={t('late')} color="#FFC107" />
          <StatsCard icon="beach-access" value={leaveCount} label={t('leave')} color="#2196F3" />
        </View>
      </View>

      {/* Students List */}
      <Text style={styles.sectionTitle}>{t('studentsList', { count: students.length, total: classData.students_amount })}</Text>
      
      <FlatList
        data={students}
        scrollEnabled={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.studentRow}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.studentRoll}>{t('roll')}: {item.rollNumber}</Text>
            </View>
            <View style={styles.studentAttendance}>
              {item.lastAttendance && (
                <Text style={styles.lastAttendance}>{t('lastAttendance')}: {item.lastAttendance}</Text>
              )}
              <AttendanceStatus status={item.attendance} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <MaterialIcons name="group-off" size={48} color="#ddd" />
            <Text style={styles.emptyListText}>{t('noStudentsInClass')}</Text>
          </View>
        }
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    marginTop:-10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop:20,
    marginBottom: 30,
  },
  classIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  classHeaderText: {
    flex: 1,
  },
  classTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  classSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    paddingVertical:20,
    paddingHorizontal:30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginBottom: 16,
    marginTop: 8,
  },
  attendanceStats: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  attendancePercentage: {
    alignItems: 'center',
    marginBottom: 16,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3F51B5',
  },
  percentageLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: -8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    minWidth: 80,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  studentRoll: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  studentAttendance: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  lastAttendance: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyListText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
  },
});

export default ClassSummary;
