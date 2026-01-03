import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Staff, StaffStats, StaffAnalytics, StaffPerformance } from '../types';
import { useStaff } from '../hooks/useStaffApi';
import StaffAnalyticsCard from '../components/StaffAnalyticsCard';
import StaffCharts from '../components/StaffCharts';

const { width } = Dimensions.get('window');

const StaffDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { staffId } = route.params as { staffId: number };
  
  const { fetchStaffById, fetchStaffStats, fetchStaffAnalytics, fetchStaffPerformance } = useStaff();
  
  const [staff, setStaff] = useState<Staff | null>(null);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [analytics, setAnalytics] = useState<StaffAnalytics | null>(null);
  const [performance, setPerformance] = useState<StaffPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'documents' | 'history'>('overview');

  useEffect(() => {
    loadStaffData();
  }, [staffId]);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      const [staffData, statsData, analyticsData, performanceData] = await Promise.all([
        fetchStaffById(staffId),
        fetchStaffStats(staffId),
        fetchStaffAnalytics(staffId),
        fetchStaffPerformance(staffId),
      ]);
      
      setStaff(staffData);
      setStats(statsData);
      setAnalytics(analyticsData);
      setPerformance(performanceData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load staff details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditStaff' as never, { staffId } as never);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Staff',
      `Are you sure you want to delete ${staff?.user?.firstName} ${staff?.user?.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle delete
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleViewStats = () => {
    navigation.navigate('StaffStats' as never, { staffId } as never);
  };

  const handleViewAnalytics = () => {
    navigation.navigate('StaffAnalytics' as never, { staffId } as never);
  };

  const handleViewPerformance = () => {
    navigation.navigate('StaffPerformance' as never, { staffId } as never);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10B981';
      case 'INACTIVE':
        return '#6B7280';
      case 'SUSPENDED':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getGenderIcon = (gender?: string) => {
    switch (gender) {
      case 'MALE':
        return 'mars';
      case 'FEMALE':
        return 'venus';
      default:
        return 'genderless';
    }
  };

  const getGenderColor = (gender?: string) => {
    switch (gender) {
      case 'MALE':
        return '#3B82F6';
      case 'FEMALE':
        return '#EC4899';
      default:
        return '#6B7280';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const calculateExperience = (joiningDate?: string) => {
    if (!joiningDate) return 0;
    const joining = new Date(joiningDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joining.getTime());
    const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Staff Details</Text>
            <Text style={styles.headerSubtitle}>
              {staff?.user?.firstName} {staff?.user?.lastName}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleEdit}>
              <MaterialIcons name="edit" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleDelete}>
              <MaterialIcons name="delete" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        {staff?.user?.avatar ? (
          <Image source={{ uri: staff.user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {staff?.user?.firstName?.charAt(0) || 'S'}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(staff?.user?.status || 'INACTIVE') },
          ]}
        />
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>
          {staff?.user?.firstName} {staff?.user?.lastName}
        </Text>
        <Text style={styles.profileEmployeeId}>{staff?.employeeId}</Text>
        <Text style={styles.profileDesignation}>{staff?.designation}</Text>
        
        <View style={styles.profileMeta}>
          <View style={styles.metaItem}>
            <FontAwesome5
              name={getGenderIcon(staff?.user?.gender)}
              size={12}
              color={getGenderColor(staff?.user?.gender)}
            />
            <Text style={styles.metaText}>{staff?.user?.gender || 'N/A'}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="business" size={12} color="#6B7280" />
            <Text style={styles.metaText}>{staff?.department?.name || 'No Department'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabs}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
          Overview
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
        onPress={() => setActiveTab('analytics')}
      >
        <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
          Analytics
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
        onPress={() => setActiveTab('documents')}
      >
        <Text style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>
          Documents
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
        onPress={() => setActiveTab('history')}
      >
        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
          History
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <MaterialIcons name="email" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{staff?.user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="phone" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{staff?.user?.phone || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Professional Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <MaterialIcons name="badge" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Employee ID</Text>
            <Text style={styles.infoValue}>{staff?.employeeId || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="work" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Designation</Text>
            <Text style={styles.infoValue}>{staff?.designation || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="business" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{staff?.department?.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="event" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Joining Date</Text>
            <Text style={styles.infoValue}>{formatDate(staff?.joiningDate)}</Text>
          </View>
        </View>
      </View>

      {/* Financial Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <FontAwesome5 name="dollar-sign" size={14} color="#6B7280" />
            <Text style={styles.infoLabel}>Salary</Text>
            <Text style={styles.infoValue}>{formatCurrency(staff?.salary)}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="account-balance" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Bank</Text>
            <Text style={styles.infoValue}>{staff?.bankName || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="credit-card" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Account Number</Text>
            <Text style={styles.infoValue}>{staff?.accountNumber || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="code" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>IFSC Code</Text>
            <Text style={styles.infoValue}>{staff?.ifscCode || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <MaterialIcons name="cake" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Birth Date</Text>
            <Text style={styles.infoValue}>{formatDate(staff?.user?.birthDate)}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="schedule" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Experience</Text>
            <Text style={styles.infoValue}>{calculateExperience(staff?.joiningDate)} years</Text>
          </View>
        </View>
        
        {staff?.user?.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bioLabel}>Bio</Text>
            <Text style={styles.bioText}>{staff.user.bio}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAnalyticsTab = () => (
    <View style={styles.tabContent}>
      {analytics && performance && (
        <StaffAnalyticsCard
          analytics={analytics}
          performance={performance}
          onViewDetails={handleViewAnalytics}
          onViewCharts={() => setShowCharts(true)}
        />
      )}
    </View>
  );

  const renderDocumentsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documents</Text>
        {staff?.documents && staff.documents.length > 0 ? (
          <View style={styles.documentsList}>
            {staff.documents.map((doc, index) => (
              <View key={index} style={styles.documentItem}>
                <MaterialIcons name="description" size={24} color="#3B82F6" />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>{doc.title}</Text>
                  <Text style={styles.documentType}>{doc.documentType}</Text>
                </View>
                <TouchableOpacity style={styles.documentAction}>
                  <MaterialIcons name="download" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="folder-open" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No documents uploaded</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity History</Text>
        <View style={styles.historyList}>
          <View style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <MaterialIcons name="person-add" size={16} color="#10B981" />
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>Staff member created</Text>
              <Text style={styles.historyTime}>
                {formatDate(staff?.createdAt)} at {new Date(staff?.createdAt || '').toLocaleTimeString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <MaterialIcons name="edit" size={16} color="#3B82F6" />
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>Profile updated</Text>
              <Text style={styles.historyTime}>
                {formatDate(staff?.updatedAt)} at {new Date(staff?.updatedAt || '').toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="hourglass-empty" size={48} color="#6B7280" />
        <Text style={styles.loadingText}>Loading staff details...</Text>
      </View>
    );
  }

  if (!staff) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Staff member not found</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderProfileSection()}
      {renderTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'documents' && renderDocumentsTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </ScrollView>

      {showCharts && analytics && performance && (
        <StaffCharts
          analytics={analytics}
          performance={performance}
          onClose={() => setShowCharts(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmployeeId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  profileDesignation: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  profileMeta: {
    flexDirection: 'row',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  bioContainer: {
    marginTop: 16,
  },
  bioLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  documentsList: {
    marginTop: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  documentType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  documentAction: {
    padding: 8,
  },
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  historyTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#374151',
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default StaffDetailScreen; 
