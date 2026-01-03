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
  Modal,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTeacherPortalData } from './hooks/useTeacherPortalData';
import TeacherDashboard from './screens/TeacherDashboard';
import ClassManagement from './screens/ClassManagement';
import StudentManagement from './screens/StudentManagement';
import AssignmentManagement from './screens/AssignmentManagement';
import ExamsScreen from './screens/ExamsScreen';
import AttendanceManagement from './screens/AttendanceManagement';
import GradesScreen from './screens/GradesScreen';
import ClassPerformanceComparison from './components/ClassPerformanceComparison';
// Theme removed - using inline colors

// Width variable removed - not needed

type TabType = 'dashboard' | 'classes' | 'students' | 'assignments' | 'exams' | 'attendance' | 'grades' | 'performance';

const TeacherPortal: React.FC = () => {
  const { t, i18n } = useTranslation();
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
  const [showNotifications, setShowNotifications] = useState(false);

  // Check if user is a teacher or school admin (school admins can access teacher portal)
  const isTeacher = user?.role === 'TEACHER' || user?.userRole === 'TEACHER' || user?.role === 'SCHOOL_ADMIN' || user?.userRole === 'SCHOOL_ADMIN';

  // Language options
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fa-AF', name: 'Dari', flag: '🇦🇫' },
    { code: 'ps-AF', name: 'Pashto', flag: '🇦🇫' }
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'en' ? 'ltr' : 'rtl';
  };

  const getCurrentLanguage = () => {
    const current = languages.find(lang => lang.code === i18n.resolvedLanguage);
    return current || languages[0];
  };

  // Debug logging
  useEffect(() => {
    console.log('🔍 TeacherPortal Debug:', {
      isAuthenticated,
      isTeacher,
      userId: user?.id,
      userRole: user?.role,
      hasClasses: !!classes?.length,
      classesCount: classes?.length || 0,
      selectedClass,
      activeTab
    });
  }, [isAuthenticated, isTeacher, user, classes, selectedClass, activeTab]);

  // Monitor selectedClass changes
  useEffect(() => {
    console.log('👥 TeacherPortal: selectedClass changed to:', selectedClass);
  }, [selectedClass]);

  // Monitor activeTab changes
  useEffect(() => {
    console.log('🎯 TeacherPortal: activeTab changed to:', activeTab);
  }, [activeTab, selectedClass]);

  // Load data on component mount
  useEffect(() => {
    console.log('🚀 TeacherPortal: Component mounted, loading portal data');
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      console.log('🔄 TeacherPortal: Loading portal data...');
      
      const [classesData, studentsData, assignmentsData, examsData, dashboard] = await Promise.all([
        getTeacherClasses(),
        getTeacherStudents(),
        getTeacherAssignments(),
        getTeacherExams(),
        getTeacherDashboard()
      ]);

      console.log('📊 TeacherPortal: Classes data received:', classesData);
      console.log('📊 TeacherPortal: Students data received:', studentsData);
      console.log('📊 TeacherPortal: Assignments data received:', assignmentsData);
      console.log('📊 TeacherPortal: Exams data received:', examsData);

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
      t('teacherPortal.auth.logout'),
      t('teacherPortal.auth.confirmLogout'),
      [
        { text: t('teacherPortal.common.cancel'), style: 'cancel' },
        { text: t('teacherPortal.auth.logout'), onPress: logout }
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
        return <ExamsScreen />;
      case 'attendance':
        return <AttendanceManagement classes={classes} selectedClass={selectedClass} />;
      case 'grades':
        return <GradesScreen />;
      case 'performance':
        return <ClassPerformanceComparison classes={classes} selectedClass={selectedClass} onClassSelect={setSelectedClass} />;
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
      <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]} numberOfLines={1}>
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
          <Text style={styles.errorTitle}>{t('teacherPortal.auth.accessDenied')}</Text>
          <Text style={styles.errorMessage}>
            {t('teacherPortal.auth.accessDeniedMessage')}
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
          <Text style={styles.loadingText}>{t('teacherPortal.common.loadingData')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Mobile Header - Simple header for mobile */}
      <View style={styles.mobileHeader}>
        <View style={styles.mobileHeaderLeft}>
          <MaterialIcons name="school" size={24} color="#3B82F6" />
          <Text style={styles.mobileHeaderTitle}>{t('teacherPortal.header.title')}</Text>
        </View>
        <View style={styles.mobileHeaderRight}>
          <View style={styles.mobileLanguagePicker}>
            <Picker
              selectedValue={i18n.resolvedLanguage}
              onValueChange={(itemValue) => changeLanguage(itemValue)}
              style={styles.mobilePicker}
              dropdownIconColor="#6B7280"
            >
              {languages.map((language) => (
                <Picker.Item
                  key={language.code}
                  label={language.name}
                  value={language.code}
                />
              ))}
            </Picker>
          </View>
          <TouchableOpacity 
            style={styles.mobileNotificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <MaterialIcons name="notifications" size={20} color="#6B7280" />
            <View style={styles.mobileNotificationBadge}>
              <Text style={styles.mobileNotificationText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="school" size={32} color="#3B82F6" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('teacherPortal.header.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {t('teacherPortal.header.welcomeBack', { name: `${user?.firstName} ${user?.lastName}` })}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.languagePicker}>
            <Picker
              selectedValue={i18n.resolvedLanguage}
              onValueChange={(itemValue) => changeLanguage(itemValue)}
              style={styles.picker}
              dropdownIconColor="#6B7280"
            >
              {languages.map((language) => (
                <Picker.Item
                  key={language.code}
                  label={language.name}
                  value={language.code}
                />
              ))}
            </Picker>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {renderTab('dashboard', t('teacherPortal.tabs.dashboard'), 'dashboard')}
        {renderTab('classes', t('teacherPortal.tabs.classes'), 'class')}
        {renderTab('students', t('teacherPortal.tabs.students'), 'people')}
        {renderTab('assignments', t('teacherPortal.tabs.assignments'), 'edit_note')}
        {renderTab('exams', t('teacherPortal.tabs.exams'), 'quiz')}
        {renderTab('attendance', t('teacherPortal.tabs.attendance'), 'check-circle')}
        {renderTab('grades', t('teacherPortal.tabs.grades'), 'grade')}
        {renderTab('performance', t('teacherPortal.tabs.performance'), 'trending-up')}
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

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('teacherPortal.notifications.title')}</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.emptyState}>
                <MaterialIcons name="notifications-none" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>
                  {t('teacherPortal.notifications.noNotifications')}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {t('teacherPortal.notifications.checkBackLater')}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 50,
  },
  mobileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mobileHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 6,
    flex: 1,
  },
  mobileHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  mobileLanguagePicker: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minWidth: 70,
  },
  mobilePicker: {
    height: 32,
    width: 70,
    color: '#374151',
    fontSize: 11,
    fontWeight: '500',
  },
  mobileNotificationButton: {
    position: 'relative',
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  mobileNotificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileNotificationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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
    flexWrap: 'wrap',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  languagePicker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: 40,
    width: '100%',
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    width: '100%',
  },
  tabContent: {
    paddingHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    minHeight: 60,
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 1,
    minHeight: 50,
  },
  activeTab: {
    backgroundColor: '#3B82F620',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 11,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default TeacherPortal; 