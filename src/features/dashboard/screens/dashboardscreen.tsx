import React from 'react';
import { ScrollView, StyleSheet, View, Platform, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@react-navigation/native';
import StatsCards from '../components/dashboard/StatsCards';
import UpdateToStudentForm from '../components/dashboard/update';
import RecentActivities from '../components/dashboard/RecentActivities';
import AcademicCalendar from '../components/dashboard/AcademicCalendar';
import PerformanceCharts from '../components/dashboard/PerformanceCharts';
import UpcomingExams from '../components/dashboard/UpcomingExams';
// Removed incorrect import of Referral
import { Class } from '../../classes/types';
import Referrals from '../components/dashboard/Referrals';
import CustomerAnalyticsDashboard from '../components/dashboard/CustomerAnalyticsDashboard';
import TodaysSchedule from '../components/dashboard/TodaySchedule';
import Assignments from '../components/dashboard/Assignments';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import secureApiService from '../../../services/secureApiService';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useAuth } from '../../../contexts/AuthContext';

interface Referral {
  id: number;
  customer_id: number;
  purpose: string;
  added_by: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customer_i_d: {
    id: number;
    name: string;
    serial_number: string;
    mobile: string;
    student_status?: string;
  };
}

const MAX_VISIBLE_MINIMIZED = 3;

const DashboardScreen: React.FC = () => { 
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  // State to manage open and minimized update forms
  const [openUpdateForms, setOpenUpdateForms] = React.useState<Referral[]>([]);
  const [minimizedUpdateForms, setMinimizedUpdateForms] = React.useState<Referral[]>([]);

  // Toggle state for each dashboard section
  const [showStatsCards, setShowStatsCards] = React.useState(false);
  const [showAssignments, setShowAssignments] = React.useState(false);
  const [showCustomerAnalytics, setShowCustomerAnalytics] = React.useState(false);
  // Removed showQuickActions state
  const [showRecentActivities, setShowRecentActivities] = React.useState(false);
  const [showUpcomingExams, setShowUpcomingExams] = React.useState(false);
  const [showPerformanceCharts, setShowPerformanceCharts] = React.useState(false);
  const [showReferrals, setShowReferrals] = React.useState(false);
  const [showTodaysSchedule, setShowTodaysSchedule] = React.useState(false);
  const [showAcademicCalendar, setShowAcademicCalendar] = React.useState(false);

const [classes, setClasses] = React.useState<Class[]>([]);
const [assignments, setAssignments] = React.useState<Assignment[]>([]);
const [loading, setLoading] = React.useState({
  classes: false,
  assignments: false,
  stats: false
});
const [error, setError] = React.useState({
  classes: null,
  assignments: null,
  stats: null
});

const [customers, setCustomers] = React.useState([]);
const [customersLoading, setCustomersLoading] = React.useState(true);
const [customersError, setCustomersError] = React.useState<string | null>(null);
const [customersRefreshing, setCustomersRefreshing] = React.useState(false);

const [isBackendAvailable, setIsBackendAvailable] = React.useState(true);

const loadCustomers = async () => {
  // Check if user is authenticated before making API calls
  if (!isAuthenticated || !user) {
    setCustomers([]);
    setCustomersError('User not authenticated');
    return;
  }

  try {
    setCustomersLoading(true);
    
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 5000)
    );

    const response = await Promise.race([
      secureApiService.get('/customers'),
      timeoutPromise
    ]);
    
    const data = response.data;
    
    if (Array.isArray(data)) {
      setCustomers(data);
    } else if (Array.isArray(data?.data)) {
      setCustomers(data.data);
    } else {
      setCustomers([]);
    }
    
    setCustomersError(null);
  } catch (error: any) {

    setCustomersError(null); // Don't show error to user
    setCustomers([]); // Set empty array as fallback
    setIsBackendAvailable(false);
  } finally {
    setCustomersLoading(false);
    setCustomersRefreshing(false);
  }
};

React.useEffect(() => {
  loadCustomers();
}, [isAuthenticated, user]); // Add authentication dependencies

const handleCustomersRefresh = () => {
  setCustomersRefreshing(true);
  loadCustomers();
};

React.useEffect(() => {
  const fetchData = async () => {
    // Check if user is authenticated before making API calls
    if (!isAuthenticated || !user) {
      setClasses([]);
      setAssignments([]);
      return;
    }

    setLoading(prev => ({...prev, classes: true, assignments: true}));
    setError(prev => ({...prev, classes: null, assignments: null}));
    
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      const [classesResponse, assignmentsResponse] = await Promise.race([
        Promise.all([
          secureApiService.get('/classes'),
          secureApiService.get('/assignments')
        ]),
        timeoutPromise
      ]);
      
      const classesData = classesResponse.data;
      const assignmentsData = assignmentsResponse.data;
      
      if (Array.isArray(classesData)) {
        setClasses(classesData);
      } else if (Array.isArray(classesData?.data)) {
        setClasses(classesData.data);
      } else {
        setClasses([]);
      }
      
      if (Array.isArray(assignmentsData)) {
        setAssignments(assignmentsData);
      } else if (Array.isArray(assignmentsData?.data)) {
        setAssignments(assignmentsData.data);
      } else {
        setAssignments([]);
      }
      
    } catch (err: any) {
      // Set fallback data instead of showing errors
      setClasses([]);
      setAssignments([]);
      setIsBackendAvailable(false);
    } finally {
      setLoading(prev => ({...prev, classes: false, assignments: false}));
    }
  };

  fetchData();
}, [isAuthenticated, user]); // Add authentication dependencies
  // Fetch classes
  // React.useEffect(() => {
  //   const fetchClasses = async () => {
  //     try {
  //       const response = await fetch('https://sapi.ariadeltatravel.com/api/AllClasses');
  //       const data = await response.json();
  //       if (Array.isArray(data.data)) {
  //         setClasses(data.data);
  //       }
  //     } catch (err) {
  //       
  //     }
  //   };
  //   fetchClasses();
  // }, []);
  const [showMoreMinimized, setShowMoreMinimized] = React.useState(false);

  // Function to open an update form
  const openUpdateForm = (referral: Referral) => {
    // Check if form is already open or minimized
    const isAlreadyOpen = openUpdateForms.some(r => r.id === referral.id);
    const isMinimized = minimizedUpdateForms.some(r => r.id === referral.id);
    
    if (isAlreadyOpen || isMinimized) {
      // If already open or minimized, maximize it
      maximizeUpdateForm(referral);
    } else {
      // Otherwise open a new form
      setOpenUpdateForms((prev) => [...prev, referral]);
      // Remove from minimized if present
      setMinimizedUpdateForms((prev) => prev.filter(r => r.id !== referral.id));
    }
  };

  // Function to close an update form
  const closeUpdateForm = (referral: Referral) => {
    setOpenUpdateForms((prev) => prev.filter(r => r.id !== referral.id));
    setMinimizedUpdateForms((prev) => prev.filter(r => r.id !== referral.id));
  };

  // Function to minimize an update form
  const minimizeUpdateForm = (referral: Referral) => {
    setOpenUpdateForms((prev) => prev.filter(r => r.id !== referral.id));
    setMinimizedUpdateForms((prev) => {
      if (prev.find(r => r.id === referral.id)) return prev;
      return [...prev, referral];
    });
  };

  // Function to maximize an update form
  const maximizeUpdateForm = (referral: Referral) => {
    setMinimizedUpdateForms((prev) => prev.filter(r => r.id !== referral.id));
    setOpenUpdateForms((prev) => {
      if (prev.find(r => r.id === referral.id)) return prev;
      return [...prev, referral];
    });
  };

  // Handler for updating student data (can be customized)
  const handleUpdateToStudent = async (updatedData: any) => {
    // Implement update logic here, e.g., API call

    // After update, close the form
    closeUpdateForm(updatedData);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {/* Network Status Banner */}
      {!isBackendAvailable && (
        <View style={[styles.networkBanner, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
          <Icon name="wifi-off" size={16} color="#92400e" />
          <Text style={[styles.networkBannerText, { color: '#92400e' }]}>
            Backend server not available. Showing offline mode.
          </Text>
        </View>
      )}
      
      {/* Top Tab Bar */}
      <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.dbTabBarContent}
          style={[styles.dbTabBarScroll, styles.scrollViewScrollbar]}
      >
          <TouchableOpacity style={[styles.dbTab, showStatsCards && styles.dbTabActive]} onPress={() => setShowStatsCards(v => !v)}>
            <Icon name="bar-chart" size={22} color={showStatsCards ? '#fff' : '#6366f1'} />
            <Text style={[styles.dbTabText, showStatsCards && { color: '#fff' }]}>Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dbTab, showAssignments && styles.dbTabActive]} onPress={() => setShowAssignments(v => !v)}>
            <Icon name="assignment" size={22} color={showAssignments ? '#fff' : '#6366f1'} />
            <Text style={[styles.dbTabText, showAssignments && { color: '#fff' }]}>Assignments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dbTab, showCustomerAnalytics && styles.dbTabActive]} onPress={() => setShowCustomerAnalytics(v => !v)}>
            <Icon name="analytics" size={22} color={showCustomerAnalytics ? '#fff' : '#6366f1'} />
            <Text style={[styles.dbTabText, showCustomerAnalytics && { color: '#fff' }]}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dbTab, showRecentActivities && styles.dbTabActive]} onPress={() => setShowRecentActivities(v => !v)}>
            <Icon name="history" size={22} color={showRecentActivities ? '#fff' : '#6366f1'} />
            <Text style={[styles.dbTabText, showRecentActivities && { color: '#fff' }]}>Recent Activities</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dbTab, showUpcomingExams && styles.dbTabActive]} onPress={() => setShowUpcomingExams(v => !v)}>
            <Icon name="event" size={22} color={showUpcomingExams ? '#fff' : '#6366f1'} />
            <Text style={[styles.dbTabText, showUpcomingExams && { color: '#fff' }]}>Upcoming Exams</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dbTab, showPerformanceCharts && styles.dbTabActive]} onPress={() => setShowPerformanceCharts(v => !v)}>
            <Icon name="show-chart" size={22} color={showPerformanceCharts ? '#fff' : '#6366f1'} />
            <Text style={[styles.dbTabText, showPerformanceCharts && { color: '#fff' }]}>Performance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dbTab, showReferrals && styles.dbTabActive]} onPress={() => setShowReferrals(v => !v)}>
            <Icon name="group" size={22} color={showReferrals ? '#fff' : '#6366f1'} />
            <Text style={[styles.dbTabText, showReferrals && { color: '#fff' }]}>Referrals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dbTab, showTodaysSchedule && styles.dbTabActive]} onPress={() => setShowTodaysSchedule(v => !v)}>
            <Icon name="calendar-today" size={22} color={showTodaysSchedule ? '#fff' : '#6366f1'} />
            <Text style={[styles.dbTabText, showTodaysSchedule && { color: '#fff' }]}>Today's Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dbTab, showAcademicCalendar && styles.dbTabActive]} onPress={() => setShowAcademicCalendar(v => !v)}>
            <Icon name="calendar-view-month" size={22} color={showAcademicCalendar ? '#fff' : '#6366f1'} />
            <Text style={[styles.dbTabText, showAcademicCalendar && { color: '#fff' }]}>Calendar</Text>
          </TouchableOpacity>
      </ScrollView>

      {/* Main Content Area */}
      <ScrollView style={styles.scrollViewScrollbar} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={true}>
        {showStatsCards && (
          <View style={styles.sectionWrap}>
            <StatsCards />
          </View>
        )}
        {showAssignments && <View style={styles.sectionWrap}>
          <Assignments 
            data={assignments}
            loading={loading.assignments}
            error={error.assignments}
          />
        </View>}
        {showCustomerAnalytics && <View style={styles.sectionWrap}><CustomerAnalyticsDashboard customers={customers} loading={customersLoading} error={customersError} refreshing={customersRefreshing} onRefresh={handleCustomersRefresh} /></View>}
        {/* Removed QuickActions rendering */}
        {(showRecentActivities || showUpcomingExams) && (
          <View style={[styles.row, styles.sectionWrap]}>
            {showRecentActivities && <RecentActivities style={styles.halfWidth} />}
            {showUpcomingExams && <UpcomingExams style={styles.halfWidth} />}
          </View>
        )}
        {showPerformanceCharts && <View style={styles.sectionWrap}><PerformanceCharts /></View>}
        {showReferrals && <View style={styles.sectionWrap}><Referrals openUpdateForm={openUpdateForm} /></View>}
        {showTodaysSchedule && <View style={styles.sectionWrap}><TodaysSchedule /></View>}
        {showAcademicCalendar && <View style={styles.sectionWrap}><AcademicCalendar /></View>}
      </ScrollView>

      {/* Render open update forms */}
      {openUpdateForms.map((referral) => (
        <UpdateToStudentForm
          key={referral.id}
          referral={referral}
          classes={classes}
          visible={true}
          onClose={() => closeUpdateForm(referral)}
          onUpdate={handleUpdateToStudent}
          isMinimized={false}
          onMinimize={() => minimizeUpdateForm(referral)}
          onMaximize={() => maximizeUpdateForm(referral)}
        />
      ))}

      {/* Render minimized forms as bars at the bottom */}
      {minimizedUpdateForms.length > 0 && (
        <View style={[styles.minimizedBar, { backgroundColor: colors.card, borderTopColor: colors.border, shadowColor: colors.text }]}> 
          {minimizedUpdateForms.slice(0, MAX_VISIBLE_MINIMIZED).map((referral) => (
            <View key={referral.id} style={styles.minimizedFormChip}>
              <TouchableOpacity onPress={() => maximizeUpdateForm(referral)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Icon name="drafts" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.minimizedFormText} numberOfLines={1}>
                  {referral.customer_i_d?.name || 'Draft'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => closeUpdateForm(referral)} style={styles.closeChipButton}>
                <Icon name="close" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {minimizedUpdateForms.length > MAX_VISIBLE_MINIMIZED && (
            <View style={styles.minimizedFormChip}>
              <TouchableOpacity onPress={() => setShowMoreMinimized(true)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Icon name="more-horiz" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.minimizedFormText}>
                  +{minimizedUpdateForms.length - MAX_VISIBLE_MINIMIZED} more
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      {/* Dropdown for more minimized forms */}
      {showMoreMinimized && (
        <View style={[styles.moreMinimizedDropdown, { backgroundColor: colors.card, shadowColor: colors.text }]}>
          {minimizedUpdateForms.slice(MAX_VISIBLE_MINIMIZED).map((referral) => (
            <View key={referral.id} style={styles.dropdownItem}>
              <TouchableOpacity onPress={() => { maximizeUpdateForm(referral); setShowMoreMinimized(false); }} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Icon name="drafts" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {referral.customer_i_d?.name || 'Draft'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => closeUpdateForm(referral)} style={styles.closeChipButton}>
                <Icon name="close" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={() => setShowMoreMinimized(false)} style={styles.dropdownCloseBtn}>
            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width:'95%',
  },
  contentContainer: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
  },
  updateForm: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  updateFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updateFormTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  minimizeButton: {
    padding: 8,
    borderRadius: 8,
  },
  minimizeButtonText: {
  },
  minimizedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 56,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    gap: 8,
  },
  minimizedFormChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 90,
    maxWidth: 180,
  },
  minimizedFormText: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
  closeChipButton: {
    marginLeft: 4,
    padding: 2,
  },
  moreMinimizedDropdown: {
    position: 'absolute',
    bottom: 60,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
    zIndex: 2000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownText: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
  dropdownCloseBtn: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 6,
  },
  // scrollView: {
  //   flex: 1,
  // },
  row: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 16,
  },
  // halfWidth: {
  //   flex: 1,
  //   minWidth: Platform.OS === 'web' ? '48%' : '100%',
  // },
   scrollViewScrollbar: {
    scrollbarWidth: 'thin',
    scrollbarColor: '#4f46e5 transparent',
    // For webkit browsers
    '&::-webkit-scrollbar': {
      width: 8,

    },
    '&::-webkit-scrollbar-thumb': { 
      backgroundColor: '#4f46e5',
      borderRadius: 4,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
  },
  dbTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  // dbTab: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   backgroundColor: '#e5e7eb',
  //   paddingHorizontal: 14,
  //   paddingVertical: 6,
  //   borderRadius: 20,
  //   marginRight: 8,
  //   minWidth: 0,
  //   borderWidth: 1,
  //   borderColor: 'transparent',
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 1 },
  //   shadowOpacity: 0.03,
  //   shadowRadius: 1,
  //   elevation: 1,
  //   minHeight: 32, 
  // },
  dbTabActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowOpacity: 0.08,
  },
  dbTabText: {
    color: '#1e293b',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
    marginRight: 2,
    letterSpacing: 0.1,
  },
  //  dbTabBarScroll: {
  //   maxHeight:70,
  //   overflow:'hidden',
  //   backgroundColor:'#fff',
  // },
  // dbTabBarContent: {
  //   backgroundColor: '#fff',
  //   paddingHorizontal: 12,
  //   paddingVertical: 4,
  //   gap: 4,
  // },
  dbTabBarScroll: {
  maxHeight: 44, // Fixed height instead of maxHeight
  backgroundColor: '#fff',
  },
  dbTabBarContent: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8, // Adjusted padding
    alignItems: 'center', // Ensure items are vertically centered
    height: 44, // Match the parent height
  },
  dbTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 8, // Consistent padding
    borderRadius: 20,
    marginRight: 8,
    height: 32, // Fixed height for tabs
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  networkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 8,
    marginBottom: 16,
  },
  networkBannerText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default DashboardScreen;
