import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  Alert,
  Dimensions,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

// Core Components
import AdminHeader from '../components/AdminHeader';
import AdminTabs from '../components/AdminTabs';
import QuickActionsPanel from '../components/QuickActionsPanel';
import SystemHealthPanel from '../components/SystemHealthPanel';
import ActivityLogsPanel from '../components/ActivityLogsPanel';
import AlertsPanel from '../components/AlertsPanel';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import UserManagementPanel from '../components/UserManagementPanel';
import AcademicManagementPanel from '../components/AcademicManagementPanel';
import FinancialManagementPanel from '../components/FinancialManagementPanel';
import ResourceManagementPanel from '../components/ResourceManagementPanel';
import CommunicationPanel from '../components/CommunicationPanel';
import SystemSettingsPanel from '../components/SystemSettingsPanel';
import SystemMonitoringDashboard from '../components/SystemMonitoringDashboard';
import ExportOptionsModal from '../components/ExportOptionsModal';
import FilterModal from '../components/FilterModal';
import SearchModal from '../components/SearchModal';
import EnrollmentManager from '../../admin/components/EnrollmentManager';
import HistoricalDataViewer from '../../reports/components/HistoricalDataViewer';

// Hooks
import useAdminAnalytics from '../hooks/useAdminAnalytics';
import useSystemMetrics from '../hooks/useSystemMetrics';
import useActivityLogs from '../hooks/useActivityLogs';
import useAdminAlerts from '../hooks/useAdminAlerts';
import useUserManagement from '../hooks/useUserManagement';
import useAcademicData from '../hooks/useAcademicData';
import useFinancialData from '../hooks/useFinancialData';
import useResourceData from '../hooks/useResourceData';
import useCommunicationData from '../hooks/useCommunicationData';

// Types
import { AdminSection, AdminMetrics, SystemAlert } from '../types';

const { width } = Dimensions.get('window');

// Custom styled components to replace React Native Paper
const Card = ({ children, style, ...props }: any) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

const Button = ({ 
  mode = 'contained', 
  onPress, 
  children, 
  style, 
  disabled = false,
  loading = false,
  ...props 
}: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      mode === 'outlined' && styles.buttonOutlined,
      mode === 'text' && styles.buttonText,
      disabled && styles.buttonDisabled,
      style,
    ]}
    onPress={onPress}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <ActivityIndicator size="small" color={mode === 'contained' ? '#fff' : '#007AFF'} />
    ) : (
      <Text style={[
        styles.buttonText,
        mode === 'outlined' && styles.buttonTextOutlined,
        mode === 'text' && styles.buttonTextText,
        disabled && styles.buttonTextDisabled,
      ]}>
        {children}
      </Text>
    )}
  </TouchableOpacity>
);

const Chip = ({ children, selected, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[
      styles.chip,
      selected && styles.chipSelected,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    <Text style={[
      styles.chipText,
      selected && styles.chipTextSelected,
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const Searchbar = ({ 
  placeholder, 
  onChangeText, 
  value, 
  style, 
  ...props 
}: any) => (
  <View style={[styles.searchbarContainer, style]}>
    <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
    <TextInput
      style={styles.searchbarInput}
      placeholder={placeholder}
      onChangeText={onChangeText}
      value={value}
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

const Badge = ({ children, style, ...props }: any) => (
  <View style={[styles.badge, style]} {...props}>
    <Text style={styles.badgeText}>{children}</Text>
  </View>
);

const Divider = ({ style, ...props }: any) => (
  <View style={[styles.divider, style]} {...props} />
);

const FAB = ({ icon, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[styles.fab, style]}
    onPress={onPress}
    {...props}
  >
    <MaterialIcons name={icon} size={24} color="#fff" />
  </TouchableOpacity>
);

const AdminPanelScreen: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<AdminSection>('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Data Hooks
  const {
    analytics,
    loading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useAdminAnalytics();

  const {
    systemMetrics,
    isLoading: systemLoading,
    error: systemError,
    refreshMetrics: refetchSystem,
  } = useSystemMetrics();

  const {
    logs,
    isLoading: logsLoading,
    error: logsError,
    refreshLogs: refetchLogs,
  } = useActivityLogs();

  const {
    alerts,
    loading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useAdminAlerts();

  const {
    userData,
    loading: userLoading,
    error: userError,
    refetch: refetchUsers,
  } = useUserManagement();

  const {
    academicData,
    loading: academicLoading,
    error: academicError,
    refetch: refetchAcademic,
  } = useAcademicData();

  const {
    financialData,
    loading: financialLoading,
    error: financialError,
    refetch: refetchFinancial,
  } = useFinancialData();

  const {
    resourceData,
    loading: resourceLoading,
    error: resourceError,
    refetch: refetchResources,
  } = useResourceData();

  const {
    communicationData,
    loading: communicationLoading,
    error: communicationError,
    refetch: refetchCommunication,
  } = useCommunicationData();

  // Sections configuration
  const sections = useMemo(() => [
    {
      id: 'overview' as AdminSection,
      label: 'Overview',
      icon: 'dashboard',
      badge: alerts?.length || 0,
      color: '#007AFF',
    },
    {
      id: 'users' as AdminSection,
      label: 'Users',
      icon: 'people',
      badge: userData?.pendingApprovals || 0,
      color: '#34C759',
    },
    {
      id: 'academic' as AdminSection,
      label: 'Academic',
      icon: 'school',
      badge: academicData?.upcomingExams || 0,
      color: '#FF9500',
    },
    {
      id: 'finance' as AdminSection,
      label: 'Finance',
      icon: 'attach-money',
      badge: financialData?.pendingPayments || 0,
      color: '#FF3B30',
    },
    {
      id: 'resources' as AdminSection,
      label: 'Resources',
      icon: 'inventory',
      badge: resourceData?.lowStockItems || 0,
      color: '#AF52DE',
    },
    {
      id: 'communication' as AdminSection,
      label: 'Communication',
      icon: 'message',
      badge: communicationData?.unreadMessages || 0,
      color: '#5856D6',
    },
    {
      id: 'system' as AdminSection,
      label: 'System',
      icon: 'settings',
      badge: systemMetrics?.criticalIssues || 0,
      color: '#8E8E93',
    },
    {
      id: 'monitoring' as AdminSection,
      label: 'Monitoring',
      icon: 'speedometer',
      badge: 0,
      color: '#667eea',
    },
  ], [alerts, userData, academicData, financialData, resourceData, communicationData, systemMetrics]);

  // Loading states
  const isLoading = analyticsLoading || systemLoading || logsLoading || alertsLoading;

  // Error handling
  const hasErrors = analyticsError || systemError || logsError || alertsError;

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchAnalytics(),
        refetchSystem(),
        refetchLogs(),
        refetchAlerts(),
        refetchUsers(),
        refetchAcademic(),
        refetchFinancial(),
        refetchResources(),
        refetchCommunication(),
      ]);
    } catch (error) {
      
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {

    setShowExportModal(false);
  };

  const handleFilterApply = (filters: any) => {
    setSelectedFilters(filters);
    setShowFilterModal(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSearchModal(false);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'export':
        setShowExportModal(true);
        break;
      case 'filter':
        setShowFilterModal(true);
        break;
      case 'search':
        setShowSearchModal(true);
        break;
      default:

    }
  };

  const renderSectionContent = () => {
    switch (selectedSection) {
      case 'overview':
        return (
          <View style={styles.sectionContent}>
            <AnalyticsDashboard />
            <QuickActionsPanel onAction={handleQuickAction} />
            <SystemHealthPanel />
            <AlertsPanel />
          </View>
        );
      case 'users':
        return <UserManagementPanel />;
      case 'academic':
        return <AcademicManagementPanel />;
      case 'finance':
        return <FinancialManagementPanel />;
      case 'resources':
        return <ResourceManagementPanel />;
      case 'communication':
        return <CommunicationPanel />;
      case 'system':
        return <SystemSettingsPanel />;
      case 'monitoring':
        return <SystemMonitoringDashboard />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading admin panel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Admin Panel"
        onMenuPress={() => {
          // TODO: Implement menu functionality
          console.log('Menu pressed');
        }}
        onSearchPress={() => setShowSearchModal(true)}
        onFilterPress={() => setShowFilterModal(true)}
      />

      <AdminTabs
        sections={sections}
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderSectionContent()}
      </ScrollView>

      <FAB
        icon="add"
        onPress={() => {
          // TODO: Implement FAB action
          console.log('FAB pressed');
        }}
        style={styles.fab}
      />

      {/* Modals */}
      <ExportOptionsModal
        visible={showExportModal}
        onDismiss={() => setShowExportModal(false)}
        onExport={handleExport}
      />

      <FilterModal
        visible={showFilterModal}
        onDismiss={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
        currentFilters={selectedFilters}
      />

      <SearchModal
        visible={showSearchModal}
        onDismiss={() => setShowSearchModal(false)}
        onSearch={handleSearch}
        currentQuery={searchQuery}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  sectionContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  // Card styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Button styles
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextOutlined: {
    color: '#007AFF',
  },
  buttonTextText: {
    color: '#007AFF',
  },
  buttonTextDisabled: {
    color: '#999',
  },
  // Chip styles
  chip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    color: '#666',
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#fff',
  },
  // Searchbar styles
  searchbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchbarInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  // Badge styles
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Divider styles
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  // FAB styles
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default AdminPanelScreen;
