import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useExams, useExamApi } from '../hooks/useExamApi';
import { Exam, ExamFilters, CreateExamData } from '../services/examApi';
import ExamCard from '../components/ExamCard';
import ExamFormModal from '../components/ExamFormModal';
import ExamDetailsModal from '../components/ExamDetailsModal';
import ExamAnalyticsModal from '../components/ExamAnalyticsModal';
import ExamFiltersModal from '../components/ExamFiltersModal';
import ExamBulkActionsModal from '../components/ExamBulkActionsModal';
import ExamCalendar from '../components/ExamCalendar';
import { useAuth } from '../../../contexts/AuthContext';

type TabType = 'all' | 'calendar' | 'midterm' | 'final' | 'quiz' | 'assignment' | 'project' | 'practical' | 'upcoming';
type ViewMode = 'grid' | 'list';

const AdvancedExamScreen: React.FC = () => {
  const { colors, dark } = useTheme();
  const { user } = useAuth();
  
  // State Management
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Modal States
  const [showExamForm, setShowExamForm] = useState(false);
  const [showExamDetails, setShowExamDetails] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Selected Items
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<ExamFilters>({
    page: 1,
    limit: 20,
    sortBy: 'startDate',
    sortOrder: 'desc'
  });

  // API Hooks
  const { exams, pagination, loading, error, loadExams, refetch } = useExams(filters);
  const { 
    createExam, 
    updateExam, 
    deleteExam, 
    bulkDeleteExams,
    searchExams,
    getUpcomingExams,
    loading: apiLoading 
  } = useExamApi();

  // ======================
  // COMPUTED VALUES
  // ======================

  const filteredExams = useMemo(() => {
    // Ensure exams is always an array to prevent undefined errors
    const safeExams = exams || [];
    let filtered = safeExams;

    // Apply tab filter
    if (activeTab !== 'all' && activeTab !== 'upcoming') {
      filtered = filtered.filter(exam => exam.type.toLowerCase() === activeTab);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exam =>
        exam.name.toLowerCase().includes(query) ||
        exam.code.toLowerCase().includes(query) ||
        exam.subject?.name.toLowerCase().includes(query) ||
        exam.class?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [exams, activeTab, searchQuery]);

  const examStats = useMemo(() => {
    const total = filteredExams.length;
    const upcoming = filteredExams.filter(exam => new Date(exam.startDate) > new Date()).length;
    const ongoing = filteredExams.filter(exam => {
      const now = new Date();
      return new Date(exam.startDate) <= now && new Date(exam.endDate) >= now;
    }).length;
    const completed = filteredExams.filter(exam => new Date(exam.endDate) < new Date()).length;

    return { total, upcoming, ongoing, completed };
  }, [filteredExams]);

  const tabs = [
    { key: 'all' as TabType, label: 'All', count: examStats.total, icon: 'grid-outline' },
    { key: 'upcoming' as TabType, label: 'Upcoming', count: examStats.upcoming, icon: 'time-outline' },
    { key: 'midterm' as TabType, label: 'Midterm', icon: 'school-outline' },
    { key: 'final' as TabType, label: 'Final', icon: 'trophy-outline' },
    { key: 'quiz' as TabType, label: 'Quiz', icon: 'help-circle-outline' },
    { key: 'assignment' as TabType, label: 'Assignment', icon: 'document-text-outline' },
    { key: 'project' as TabType, label: 'Project', icon: 'construct-outline' },
    { key: 'practical' as TabType, label: 'Practical', icon: 'flask-outline' }
  ];

  // ======================
  // EVENT HANDLERS
  // ======================

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSelectedExams([]);
    setSelectionMode(false);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await searchExams(query, 'class,subject,term');
        // Handle search results if needed
      } catch (error) {
        console.error('Search error:', error);
      }
    }
  }, [searchExams]);

  const handleCreateExam = useCallback(() => {
    setEditingExam(null);
    setShowExamForm(true);
  }, []);

  const handleEditExam = useCallback((exam: Exam) => {
    setEditingExam(exam);
    setShowExamForm(true);
  }, []);

  const handleDeleteExam = useCallback((exam: Exam) => {
    Alert.alert(
      'Delete Exam',
      `Are you sure you want to delete "${exam.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteExam(exam.id);
            if (result) {
              Alert.alert('Success', 'Exam deleted successfully');
              refetch();
            }
          }
        }
      ]
    );
  }, [deleteExam, refetch]);

  const handleExamSubmit = useCallback(async (data: CreateExamData) => {
    try {
      if (editingExam) {
        const result = await updateExam(editingExam.id, data);
        if (result) {
          Alert.alert('Success', 'Exam updated successfully');
        }
      } else {
        const result = await createExam(data);
        if (result) {
          Alert.alert('Success', 'Exam created successfully');
        }
      }
      setShowExamForm(false);
      setEditingExam(null);
      refetch();
    } catch (error) {
      console.error('Exam submit error:', error);
    }
  }, [editingExam, updateExam, createExam, refetch]);

  const handleViewDetails = useCallback((exam: Exam) => {
    setSelectedExam(exam);
    setShowExamDetails(true);
  }, []);

  const handleViewAnalytics = useCallback((exam: Exam) => {
    setSelectedExam(exam);
    setShowAnalytics(true);
  }, []);

  const handleExamSelect = useCallback((examId: string) => {
    setSelectedExams(prev => {
      if (prev.includes(examId)) {
        return prev.filter(id => id !== examId);
      } else {
        return [...prev, examId];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedExams.length === filteredExams.length) {
      setSelectedExams([]);
    } else {
      setSelectedExams(filteredExams.map(exam => exam.id));
    }
  }, [selectedExams, filteredExams]);

  const handleBulkDelete = useCallback(() => {
    if (selectedExams.length === 0) return;

    Alert.alert(
      'Delete Exams',
      `Are you sure you want to delete ${selectedExams.length} exam(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await bulkDeleteExams(selectedExams);
            if (result) {
              Alert.alert('Success', `${result.success} exam(s) deleted successfully`);
              setSelectedExams([]);
              setSelectionMode(false);
              refetch();
            }
          }
        }
      ]
    );
  }, [selectedExams, bulkDeleteExams, refetch]);

  const handleApplyFilters = useCallback((newFilters: ExamFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    setShowFilters(false);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: prev.page! + 1 }));
    }
  }, [pagination]);

  // ======================
  // RENDER FUNCTIONS
  // ======================

  const renderTabItem = ({ item }: { item: typeof tabs[0] }) => (
    <TouchableOpacity
      style={[
        styles.tabItem,
        activeTab === item.key && [styles.activeTabItem, { backgroundColor: colors.primary }]
      ]}
      onPress={() => handleTabChange(item.key)}
      activeOpacity={0.7}
    >
      <View style={styles.tabContent}>
        <Ionicons
          name={item.icon as any}
          size={20}
          color={activeTab === item.key ? '#fff' : colors.text}
        />
        <Text style={[
          styles.tabText,
          { color: activeTab === item.key ? '#fff' : colors.text }
        ]}>
          {item.label}
        </Text>
        {item.count !== undefined && (
          <View style={[
            styles.tabBadge,
            { backgroundColor: activeTab === item.key ? 'rgba(255,255,255,0.3)' : colors.primary }
          ]}>
            <Text style={[
              styles.tabBadgeText,
              { color: activeTab === item.key ? '#fff' : '#fff' }
            ]}>
              {item.count}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderExamItem = ({ item }: { item: Exam }) => (
    <ExamCard
      exam={item}
      viewMode={viewMode}
      isSelected={selectedExams.includes(item.id)}
      selectionMode={selectionMode}
      onPress={() => selectionMode ? handleExamSelect(item.id) : handleViewDetails(item)}
      onLongPress={() => {
        if (!selectionMode) {
          setSelectionMode(true);
          handleExamSelect(item.id);
        }
      }}
      onEdit={() => handleEditExam(item)}
      onDelete={() => handleDeleteExam(item)}
      onViewAnalytics={() => handleViewAnalytics(item)}
      canEdit={user?.role === 'TEACHER' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN'}
    />
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.card }]}>
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Exams Management
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
            {examStats.total} total • {examStats.upcoming} upcoming • {examStats.ongoing} ongoing
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => setShowFilters(true)}
          >
            <Feather name="filter" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'list' : 'grid'} 
              size={20} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          
          {selectionMode && (
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: '#ff6b6b20' }]}
              onPress={handleBulkDelete}
            >
              <Ionicons name="trash" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
          <Feather name="search" size={20} color={colors.text + '60'} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search exams, subjects, classes..."
            placeholderTextColor={colors.text + '60'}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close" size={20} color={colors.text + '60'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {selectionMode && (
        <View style={[styles.selectionBar, { backgroundColor: colors.primary + '10' }]}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={handleSelectAll}
          >
            <Text style={[styles.selectAllText, { color: colors.primary }]}>
              {selectedExams.length === filteredExams.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.selectionCount, { color: colors.primary }]}>
            {selectedExams.length} selected
          </Text>
          
          <TouchableOpacity
            style={styles.cancelSelectionButton}
            onPress={() => {
              setSelectionMode(false);
              setSelectedExams([]);
            }}
          >
            <Text style={[styles.cancelSelectionText, { color: colors.text + '80' }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="clipboard-text-off" 
        size={80} 
        color={colors.text + '40'} 
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Exams Found
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text + '60' }]}>
        {activeTab === 'all' 
          ? "Create your first exam to get started"
          : `No ${activeTab} exams available`
        }
      </Text>
      {(user?.role === 'TEACHER' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateExam}
        >
          <Text style={styles.createButtonText}>Create Exam</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ======================
  // MAIN RENDER
  // ======================

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      
      {renderHeader()}
      
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={tabs}
        renderItem={renderTabItem}
        keyExtractor={item => item.key}
        style={styles.tabsList}
        contentContainerStyle={styles.tabsContent}
      />

      <FlatList
        data={filteredExams}
        renderItem={renderExamItem}
        keyExtractor={item => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          apiLoading && exams.length > 0 ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />

      {/* Floating Action Button */}
      {(user?.role === 'TEACHER' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={handleCreateExam}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modals */}
      <ExamFormModal
        visible={showExamForm}
        exam={editingExam}
        onClose={() => {
          setShowExamForm(false);
          setEditingExam(null);
        }}
        onSubmit={handleExamSubmit}
      />

      <ExamDetailsModal
        visible={showExamDetails}
        exam={selectedExam}
        onClose={() => {
          setShowExamDetails(false);
          setSelectedExam(null);
        }}
        onEdit={() => {
          setShowExamDetails(false);
          if (selectedExam) handleEditExam(selectedExam);
        }}
        onDelete={() => {
          setShowExamDetails(false);
          if (selectedExam) handleDeleteExam(selectedExam);
        }}
      />

      <ExamAnalyticsModal
        visible={showAnalytics}
        exam={selectedExam}
        onClose={() => {
          setShowAnalytics(false);
          setSelectedExam(null);
        }}
      />

      <ExamFiltersModal
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
      />

      <ExamBulkActionsModal
        visible={showBulkActions}
        selectedExams={selectedExams}
        onClose={() => setShowBulkActions(false)}
        onComplete={() => {
          setShowBulkActions(false);
          setSelectedExams([]);
          setSelectionMode(false);
          refetch();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectAllButton: {
    paddingVertical: 4,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelSelectionButton: {
    paddingVertical: 4,
  },
  cancelSelectionText: {
    fontSize: 14,
  },
  tabsList: {
    maxHeight: 60,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTabItem: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default AdvancedExamScreen;