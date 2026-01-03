import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import useStaffApi, { 
  Staff, 
  StaffStats, 
  StaffAnalytics, 
  StaffPerformance, 
  StaffDashboard,
  StaffReport,
  StaffComparison,
  CacheStats,
  EmployeeIdSuggestion
} from '../hooks/useStaffApi';
import StaffForm from '../components/StaffForm';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import BulkOperations from '../components/BulkOperations';
import {
  Box,
  VStack,
  HStack,
  Icon,
  useToast,
  Fab,
  Text,
  Button,
  Card,
  Spinner,
  Badge,
  Progress,
  FlatList,
  Avatar,
  Pressable,
  Modal,
  FormControl,
  Input,
  TextArea,
  Select,
  Checkbox,
  IconButton,
  Divider,
  ScrollView as NBScrollView,
} from 'native-base';
import StaffDashboardComponent from '../components/StaffDashboard';
import StaffList from '../components/StaffList';
import StaffAnalyticsComponent from '../components/StaffAnalytics';
import StaffProfileModal from '../components/StaffProfileModal';
import StaffPerformanceComponent from '../components/StaffPerformance';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;

const STAFF_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'list', label: 'Staff List', icon: 'people' },
  { key: 'analytics', label: 'Analytics', icon: 'analytics' },
  { key: 'performance', label: 'Performance', icon: 'trending-up' },
  { key: 'documents', label: 'Documents', icon: 'folder' },
  { key: 'tasks', label: 'Tasks', icon: 'assignment' },
  { key: 'collaboration', label: 'Collaboration', icon: 'group-work' },
  { key: 'comparison', label: 'Comparison', icon: 'compare' },
  { key: 'bulk', label: 'Bulk', icon: 'playlist-add' },
  { key: 'export', label: 'Export', icon: 'file-download' },
  { key: 'cache', label: 'Cache', icon: 'cached' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

const StaffScreen: React.FC = () => {
  const {
    loading,
    error,
    // Basic CRUD
    createStaff,
    getStaff,
    getStaffById,
    updateStaff,
    deleteStaff,
    restoreStaff,
    // Statistics & Analytics
    getStaffStats,
    getStaffAnalytics,
    getStaffPerformance,
    getStaffDashboard,
    // Bulk Operations
    bulkCreateStaff,
    bulkUpdateStaff,
    bulkDeleteStaff,
    // Search & Filter
    searchStaff,
    // Export & Import
    exportStaff,
    importStaff,
    // Utility Endpoints
    getEmployeeIdSuggestions,
    getStaffCountByDepartment,
    getStaffCountByDesignation,
    getStaffBySchool,
    getStaffByDepartment,
    // Advanced Features
    generateStaffReport,
    compareStaff,
    // Cache Management
    getCacheStats,
    warmCache,
    clearCache,
  } = useStaffApi();

  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showStaffDetails, setShowStaffDetails] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showCacheManagement, setShowCacheManagement] = useState(false);
  const [showStaffComparison, setShowStaffComparison] = useState(false);
  const [showStaffReport, setShowStaffReport] = useState(false);
  const [showEmployeeIdSuggestions, setShowEmployeeIdSuggestions] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Advanced data states
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
  const [staffAnalytics, setStaffAnalytics] = useState<StaffAnalytics | null>(null);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance | null>(null);
  const [staffDashboard, setStaffDashboard] = useState<StaffDashboard | null>(null);
  const [staffReport, setStaffReport] = useState<StaffReport | null>(null);
  const [staffComparison, setStaffComparison] = useState<StaffComparison | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [employeeIdSuggestions, setEmployeeIdSuggestions] = useState<EmployeeIdSuggestion | null>(null);
  const [departmentStats, setDepartmentStats] = useState<any>(null);
  const [designationStats, setDesignationStats] = useState<any>(null);

  // Collaboration, Documents, and Tasks states
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [collaborationData, setCollaborationData] = useState<any>(null);
  const [documentsData, setDocumentsData] = useState<any>(null);
  const [tasksData, setTasksData] = useState<any>(null);

  const toast = useToast();

  // Load initial data
  useEffect(() => {
    loadStaffData();
    loadAdvancedData();
  }, []);

  // Filter staff based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = staff.filter(s => 
        s.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.designation?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStaff(filtered);
    } else {
      setFilteredStaff(staff);
    }
  }, [searchQuery, staff]);

  const loadStaffData = async () => {
    try {

      const response = await getStaff({
        include: 'department,attendances,payrolls',
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      if (response && response.data) {

        setStaff(response.data);
        setFilteredStaff(response.data);
      } else {
        console.warn('⚠️ No staff data received');
        setStaff([]);
        setFilteredStaff([]);
      }
    } catch (err: any) {
      
      toast.show({
        description: `Failed to load staff: ${err.message}`,
        status: 'error'
      });
    }
  };

  const loadAdvancedData = async () => {
    try {

      // Load various statistics and analytics
      const [stats, deptStats, desigStats, cache] = await Promise.all([
        getStaffStats(1), // Get stats for first staff member as example
        getStaffCountByDepartment(),
        getStaffCountByDesignation(),
        getCacheStats()
      ]);
      
      setStaffStats(stats);
      setDepartmentStats(deptStats);
      setDesignationStats(desigStats);
      setCacheStats(cache);

    } catch (err: any) {
      
      toast.show({
        description: `Failed to load advanced data: ${err.message}`,
        status: 'error'
      });
    }
  };

  // Collaboration, Documents, and Tasks API calls
  const loadCollaborationData = async (staffId: number) => {
    try {
      // This would be implemented in the backend
      const response = await fetch(`/api/staff/${staffId}/collaboration`);
      const data = await response.json();
      setCollaborationData(data);
    } catch (err) {
      
    }
  };

  const loadDocumentsData = async (staffId: number) => {
    try {
      // This would be implemented in the backend
      const response = await fetch(`/api/staff/${staffId}/documents`);
      const data = await response.json();
      setDocumentsData(data);
    } catch (err) {
      
    }
  };

  const loadTasksData = async (staffId: number) => {
    try {
      // This would be implemented in the backend
      const response = await fetch(`/api/staff/${staffId}/tasks`);
      const data = await response.json();
      setTasksData(data);
    } catch (err) {
      
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadStaffData(), loadAdvancedData()]);
      toast.show({
        description: 'Data refreshed successfully',
        status: 'success'
      });
    } catch (err: any) {
      toast.show({
        description: `Failed to refresh: ${err.message}`,
        status: 'error'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateStaff = async (staffData: any) => {
    try {

      await createStaff(staffData);
      setShowStaffForm(false);
      await loadStaffData();
      toast.show({ 
        description: 'Staff member created successfully',
        status: 'success'
      });
    } catch (err: any) {
      
      Alert.alert('Error', err.message);
    }
  };

  const handleUpdateStaff = async (id: number, staffData: any) => {
    try {

      await updateStaff(id, staffData);
      setShowStaffForm(false);
      setSelectedStaff(null);
      await loadStaffData();
      toast.show({ 
        description: 'Staff member updated successfully',
        status: 'success'
      });
    } catch (err: any) {
      
      Alert.alert('Error', err.message);
    }
  };

  const handleDeleteStaff = async (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this staff member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {

              await deleteStaff(id);
              await loadStaffData();
              toast.show({ 
                description: 'Staff member deleted successfully',
                status: 'success'
              });
            } catch (err: any) {
              
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleRestoreStaff = async (id: number) => {
    try {

      await restoreStaff(id);
      await loadStaffData();
      toast.show({ 
        description: 'Staff member restored successfully',
        status: 'success'
      });
    } catch (err: any) {
      
      Alert.alert('Error', err.message);
    }
  };

  const handleSearch = async (query: string) => {
    try {

      const results = await searchStaff(query);
      if (results && results.data) {
        setFilteredStaff(results.data);
      }
    } catch (err: any) {
      
      // Fallback to local search
      const filtered = staff.filter(s => 
        s.firstName?.toLowerCase().includes(query.toLowerCase()) ||
        s.lastName?.toLowerCase().includes(query.toLowerCase()) ||
        s.email?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredStaff(filtered);
    }
  };

  const handleStaffDetails = async (staffMember: Staff) => {
    try {

      setSelectedStaff(staffMember);
      
      // Load detailed analytics for the selected staff member
      const [analytics, performance, dashboard] = await Promise.all([
        getStaffAnalytics(staffMember.id, '30d'),
        getStaffPerformance(staffMember.id),
        getStaffDashboard(staffMember.id)
      ]);
      
      setStaffAnalytics(analytics);
      setStaffPerformance(performance);
      setStaffDashboard(dashboard);
      setShowStaffDetails(true);
    } catch (err: any) {
      
      setShowStaffDetails(true); // Still show basic details
      toast.show({
        description: `Failed to load detailed analytics: ${err.message}`,
        status: 'error'
      });
    }
  };

  const handleGenerateReport = async () => {
    try {

      const report = await generateStaffReport();
      setStaffReport(report);
      setShowStaffReport(true);
      toast.show({ 
        description: 'Staff report generated successfully',
        status: 'success'
      });
    } catch (err: any) {
      
      Alert.alert('Error', err.message);
    }
  };

  const handleCompareStaff = async (staffIds: number[]) => {
    try {

      const comparison = await compareStaff(staffIds);
      setStaffComparison(comparison);
      setShowStaffComparison(true);
    } catch (err: any) {
      
      Alert.alert('Error', err.message);
    }
  };

  const handleGetEmployeeIdSuggestions = async (designation?: string) => {
    try {

      const suggestions = await getEmployeeIdSuggestions(designation);
      setEmployeeIdSuggestions(suggestions);
      setShowEmployeeIdSuggestions(true);
    } catch (err: any) {
      
      Alert.alert('Error', err.message);
    }
  };

  const handleWarmCache = async () => {
    try {

      await warmCache({});
      toast.show({ 
        description: 'Cache warmed successfully',
        status: 'success'
      });
      await loadAdvancedData(); // Refresh cache stats
    } catch (err: any) {
      
      Alert.alert('Error', err.message);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Confirm Clear Cache',
      'Are you sure you want to clear the cache? This will temporarily slow down the application.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {

              await clearCache();
              toast.show({ 
                description: 'Cache cleared successfully',
                status: 'success'
              });
              await loadAdvancedData(); // Refresh cache stats
            } catch (err: any) {
              
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleViewStaff = (staff: any) => {
    handleStaffDetails(staff);
  };

  const handleEditStaff = (staff: any) => {
    setSelectedStaff(staff);
    setShowStaffForm(true);
  };

  const handleStaffSuccess = () => {
    setShowStaffForm(false);
    setSelectedStaff(null);
    loadStaffData();
    toast.show({ 
      description: 'Staff operation completed successfully',
      status: 'success'
    });
  };

  const handleStaffSelect = (staff: any) => {
    setSelectedStaff(staff);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedStaff(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <StaffDashboardComponent
            totalStaff={staffStats?.totalStaff || staff.length}
            activeStaff={staffStats?.activeStaff || staff.filter(s => s.status === 'ACTIVE').length}
            departmentStats={departmentStats}
            errorMsg={error}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        );
      case 'list':
        return (
          <StaffList 
            staff={filteredStaff}
            loading={loading}
            error={error}
            onStaffSelect={handleStaffSelect}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onSearch={handleSearch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case 'analytics':
        return (
          <StaffAnalyticsComponent 
            analytics={staffAnalytics}
            loading={loading}
            error={error}
          />
        );
      case 'performance':
        return (
          <StaffPerformanceComponent 
            performance={staffPerformance}
            loading={loading}
            error={error}
          />
        );
      case 'documents':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoon}>Staff Documents (coming soon)</Text>
            <Text style={styles.comingSoonSubtext}>Document management system will be implemented here</Text>
          </View>
        );
      case 'tasks':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoon}>Staff Tasks (coming soon)</Text>
            <Text style={styles.comingSoonSubtext}>Task management system will be implemented here</Text>
          </View>
        );
      case 'collaboration':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoon}>Staff Collaboration (coming soon)</Text>
            <Text style={styles.comingSoonSubtext}>Collaboration tools will be implemented here</Text>
          </View>
        );
      case 'comparison':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoon}>Staff Comparison (coming soon)</Text>
            <Text style={styles.comingSoonSubtext}>Staff comparison tools will be implemented here</Text>
          </View>
        );
      case 'bulk':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoon}>Bulk Operations (coming soon)</Text>
            <Text style={styles.comingSoonSubtext}>Bulk import/export tools will be implemented here</Text>
          </View>
        );
      case 'export':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoon}>Export/Import (coming soon)</Text>
            <Text style={styles.comingSoonSubtext}>Data export/import tools will be implemented here</Text>
          </View>
        );
      case 'cache':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoon}>Cache Management (coming soon)</Text>
            <Text style={styles.comingSoonSubtext}>Cache management tools will be implemented here</Text>
          </View>
        );
      case 'settings':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoon}>Staff Settings (coming soon)</Text>
            <Text style={styles.comingSoonSubtext}>Staff configuration settings will be implemented here</Text>
          </View>
        );
      default:
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoon}>Coming soon...</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="people" size={28} color="#6366f1" style={styles.headerIcon} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Staff Management</Text>
          <Text style={styles.subtitle}>
            Advanced ERP-level staff feature with analytics, bulk, export, and more
            {error && ` • Error: ${error}`}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContentContainer}
      >
        {STAFF_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialIcons name={tab.icon as any} size={20} color={activeTab === tab.key ? '#fff' : '#6366f1'} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <Spinner size="lg" color="#6366f1" />
            <Text style={styles.loadingText}>Loading staff data...</Text>
          </View>
        ) : (
          renderTabContent()
        )}
      </View>

      {/* Floating Action Button */}
      <Fab
        renderInPortal={false}
        shadow={2}
        size="lg"
        icon={<Icon as={MaterialIcons} name="add" size="lg" color="white" />}
        onPress={() => setShowStaffForm(true)}
      />

      {/* Staff Form Modal */}
      <Modal isOpen={showStaffForm} onClose={() => setShowStaffForm(false)} size="xl">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Add New Staff Member</Modal.Header>
          <Modal.Body>
            <StaffForm
              onSubmit={handleCreateStaff}
              onCancel={() => setShowStaffForm(false)}
              initialData={selectedStaff}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal>

      {/* Staff Profile Modal */}
      <StaffProfileModal
        visible={showProfileModal}
        staff={selectedStaff}
        onClose={handleCloseProfileModal}
        onEdit={handleEditStaff}
        onDelete={handleDeleteStaff}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerIcon: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabsContentContainer: {
    paddingHorizontal: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#6366f1',
  },
  tabLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  tabLabelActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
});

export default StaffScreen; 
