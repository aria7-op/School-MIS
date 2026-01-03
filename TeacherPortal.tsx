import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTeacherPortalData } from './hooks/useTeacherPortalData';
import TeacherDashboard from './screens/TeacherDashboard';
import ClassManagement from './screens/ClassManagement';
import StudentManagement from './screens/StudentManagement';
import AssignmentManagement from './screens/AssignmentManagement';
import ExamManagement from './screens/ExamManagement';
import AttendanceManagement from './screens/AttendanceManagement';
import GradeManagement from './screens/GradeManagement';

type TabType = 'dashboard' | 'classes' | 'students' | 'assignments' | 'exams' | 'attendance' | 'grades';

const TeacherPortal: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { 
    getTeacherClasses, 
    getTeacherStudents, 
    getTeacherAssignments, 
    getTeacherExams,
    getTeacherAttendance,
    getTeacherGrades,
    getTeacherDashboard,
    loading, 
    error: dataError, 
    refreshAllData 
  } = useTeacherPortalData();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // Check if user is a teacher
  const isTeacher = user?.role === 'TEACHER' || user?.userRole === 'TEACHER';

  // Load data on component mount
  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      const [classesData, studentsData, assignmentsData, examsData, dashboard] = await Promise.all([
        getTeacherClasses(),
        getTeacherStudents(),
        getTeacherAssignments(),
        getTeacherExams(),
        getTeacherDashboard()
      ]);

      if (classesData) setClasses(classesData);
      if (studentsData) setStudents(studentsData);
      if (assignmentsData) setAssignments(assignmentsData);
      if (examsData) setExams(examsData);
      if (dashboard) setDashboardData(dashboard);

    } catch (error) {
      console.error('❌ TeacherPortal: Error loading portal data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAllData();
      await loadPortalData();
    } catch (error) {
      console.error('❌ TeacherPortal: Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout }
      ]
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TeacherDashboard data={dashboardData} classes={classes} students={students} />;
      case 'classes':
        return <ClassManagement classes={classes} onClassSelect={setSelectedClass} selectedClass={selectedClass} />;
      case 'students':
        return <StudentManagement students={students} classes={classes} selectedClass={selectedClass} />;
      case 'assignments':
        return <AssignmentManagement assignments={assignments} classes={classes} selectedClass={selectedClass} />;
      case 'exams':
        return <ExamManagement exams={exams} classes={classes} selectedClass={selectedClass} />;
      case 'attendance':
        return <AttendanceManagement classes={classes} selectedClass={selectedClass} />;
      case 'grades':
        return <GradeManagement classes={classes} selectedClass={selectedClass} />;
      default:
        return <TeacherDashboard data={dashboardData} classes={classes} students={students} />;
    }
  };

  const renderTab = (tab: TabType, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tab, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      <MaterialIcons
        name={icon as any}
        size={24}
        color={activeTab === tab ? '#3B82F6' : '#6B7280'}
      />
      <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (!isAuthenticated || !isTeacher) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorMessage}>
            You must be logged in as a teacher to access this portal.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Teacher Portal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="school" size={32} color="#3B82F6" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Teacher Portal</Text>
            <Text style={styles.headerSubtitle}>
              Welcome back, {user?.firstName} {user?.lastName}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {renderTab('dashboard', 'Dashboard', 'dashboard')}
        {renderTab('classes', 'Classes', 'class')}
        {renderTab('students', 'Students', 'people')}
        {renderTab('assignments', 'Assignments', 'assignment')}
        {renderTab('exams', 'Exams', 'quiz')}
        {renderTab('attendance', 'Attendance', 'check-circle')}
        {renderTab('grades', 'Grades', 'grade')}
      </ScrollView>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: '#3B82F620',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
});

export default TeacherPortal; 