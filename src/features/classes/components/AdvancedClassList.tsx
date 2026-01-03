import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Class, ClassSearchParams } from '../types';
import { useTranslation } from '../../../contexts/TranslationContext';
import RtlView from '../../../components/ui/RtlView';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface AdvancedClassListProps {
  classes: Class[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  selectedClasses: number[];
  pagination: any;
  onRefresh: () => void;
  onLoadMore: () => void;
  onSelectClass: (classItem: Class) => void;
  onSelectClassItem: (id: number) => void;
  onBulkAction: (action: string, classIds: number[]) => void;
  onUpdateFilters: (filters: Partial<ClassSearchParams>) => void;
  filters: ClassSearchParams;
}

const AdvancedClassList: React.FC<AdvancedClassListProps> = ({
  classes,
  loading,
  error,
  refreshing,
  selectedClasses,
  pagination,
  onRefresh,
  onLoadMore,
  onSelectClass,
  onSelectClassItem,
  onBulkAction,
  onUpdateFilters,
  filters,
}) => {
  const { colors, dark } = useTheme();
  const { t, lang } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'cards'>('list');

  const isRtl = lang === 'fa' || lang === 'ps';

  // ======================
  // FILTER STATES
  // ======================
  const [filterStates, setFilterStates] = useState({
    level: '',
    section: '',
    teacher: '',
    capacity: '',
    status: '',
    dateRange: '',
  });

  // ======================
  // COMPUTED VALUES
  // ======================
  
  const filteredClasses = useMemo(() => {
    let filtered = classes;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(cls =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Level filter
    if (filterStates.level) {
      filtered = filtered.filter(cls => cls.level.toString() === filterStates.level);
    }

    // Section filter
    if (filterStates.section) {
      filtered = filtered.filter(cls => cls.section === filterStates.section);
    }

    // Status filter
    if (filterStates.status) {
      filtered = filtered.filter(cls => 
        filterStates.status === 'active' ? cls.isActive : !cls.isActive
      );
    }

    return filtered;
  }, [classes, searchQuery, filterStates]);

  const selectedCount = selectedClasses.length;
  const totalCount = classes.length;
  const filteredCount = filteredClasses.length;

  // ======================
  // HANDLERS
  // ======================
  
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    onUpdateFilters({ search: query, page: 1 });
  }, [onUpdateFilters]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterStates(prev => ({ ...prev, [key]: value }));
    
    const filterMap: Record<string, any> = {
      level: value ? parseInt(value) : undefined,
      section: value || undefined,
      status: value === 'active' ? true : value === 'inactive' ? false : undefined,
    };

    if (filterMap[key] !== undefined) {
      onUpdateFilters({ [key]: filterMap[key], page: 1 });
    }
  }, [onUpdateFilters]);

  const handleBulkAction = useCallback((action: string) => {
    if (selectedCount === 0) {
      Alert.alert(t('noSelection'), t('pleaseSelectClasses'));
      return;
    }

    const actionMessages = {
      delete: t('confirmBulkDelete'),
      activate: t('confirmBulkActivate'),
      deactivate: t('confirmBulkDeactivate'),
      assignTeacher: t('confirmBulkAssignTeacher'),
    };

    Alert.alert(
      t('confirmAction'),
      actionMessages[action as keyof typeof actionMessages] || t('confirmAction'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: () => onBulkAction(action, selectedClasses),
        },
      ]
    );
  }, [selectedCount, selectedClasses, onBulkAction, t]);

  const handleSort = useCallback((field: string) => {
    const currentOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
    onUpdateFilters({ sortBy: field as any, sortOrder: currentOrder });
  }, [filters.sortOrder, onUpdateFilters]);

  // ======================
  // RENDER ITEMS
  // ======================
  
  const renderClassItem = useCallback(({ item, index }: { item: Class; index: number }) => {
    const isSelected = selectedClasses.includes(item.id);
    const utilization = item.capacity > 0 ? (item._count?.students || 0) / item.capacity * 100 : 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.classItem,
          { backgroundColor: colors.card },
          isSelected && { backgroundColor: colors.primary + '20' },
          viewMode === 'cards' && styles.classCard,
        ]}
        onPress={() => onSelectClass(item)}
        onLongPress={() => onSelectClassItem(item.id)}
        activeOpacity={0.7}
      >
        {/* Selection Indicator */}
        <TouchableOpacity
          style={[styles.selectionIndicator, isSelected && styles.selectedIndicator]}
          onPress={() => onSelectClassItem(item.id)}
        >
          <MaterialIcons
            name={isSelected ? 'check-box' : 'check-box-outline-blank'}
            size={20}
            color={isSelected ? colors.primary : colors.text}
          />
        </TouchableOpacity>

        {/* Class Info */}
        <View style={styles.classInfo}>
          <View style={styles.classHeader}>
            <Text style={[styles.className, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.classBadges}>
              <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {item.code}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: item.isActive ? '#4CAF50' + '20' : '#F44336' + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: item.isActive ? '#4CAF50' : '#F44336' }
                ]}>
                  {item.isActive ? t('active') : t('inactive')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.classDetails}>
            <View style={styles.detailRow}>
              <MaterialIcons name="school" size={16} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {t('level')}: {item.level}
              </Text>
            </View>
            
            {item.section && (
              <View style={styles.detailRow}>
                <MaterialIcons name="category" size={16} color={colors.text} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {t('section')}: {item.section}
                </Text>
              </View>
            )}

            {item.roomNumber && (
              <View style={styles.detailRow}>
                <MaterialIcons name="room" size={16} color={colors.text} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {t('room')}: {item.roomNumber}
                </Text>
              </View>
            )}
          </View>

          {/* Capacity and Utilization */}
          <View style={styles.capacitySection}>
            <View style={styles.capacityInfo}>
              <Text style={[styles.capacityText, { color: colors.text }]}>
                {item._count?.students || 0} / {item.capacity} {t('students')}
              </Text>
              <Text style={[styles.utilizationText, { color: colors.text }]}>
                {utilization.toFixed(1)}% {t('utilization')}
              </Text>
            </View>
            <View style={styles.capacityBar}>
              <View
                style={[
                  styles.capacityFill,
                  {
                    width: `${Math.min(utilization, 100)}%`,
                    backgroundColor: utilization > 90 ? '#F44336' : utilization > 75 ? '#FF9800' : '#4CAF50',
                  },
                ]}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="people" size={16} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                {item._count?.students || 0}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="book" size={16} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                {item._count?.subjects || 0}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="schedule" size={16} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                {item._count?.timetables || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Menu */}
        <TouchableOpacity style={styles.actionMenu}>
          <MaterialIcons name="more-vert" size={20} color={colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [selectedClasses, colors, t, onSelectClass, onSelectClassItem, viewMode]);

  // ======================
  // RENDER HEADER
  // ======================
  
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.card }]}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
          <MaterialIcons name="search" size={20} color={colors.text} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('searchClasses')}
            placeholderTextColor={colors.text + '80'}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcons name="clear" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <Text style={[styles.resultCount, { color: colors.text }]}>
            {t('showing')} {filteredCount} {t('of')} {totalCount} {t('classes')}
          </Text>
          
          {selectedCount > 0 && (
            <Text style={[styles.selectedCount, { color: colors.primary }]}>
              {selectedCount} {t('selected')}
            </Text>
          )}
        </View>

        <View style={styles.toolbarRight}>
          {/* View Mode Toggle */}
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
              onPress={() => setViewMode('list')}
            >
              <MaterialIcons name="view-list" size={20} color={viewMode === 'list' ? colors.primary : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'grid' && styles.activeViewMode]}
              onPress={() => setViewMode('grid')}
            >
              <MaterialIcons name="grid-view" size={20} color={viewMode === 'grid' ? colors.primary : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'cards' && styles.activeViewMode]}
              onPress={() => setViewMode('cards')}
            >
              <MaterialIcons name="view-module" size={20} color={viewMode === 'cards' ? colors.primary : colors.text} />
            </TouchableOpacity>
          </View>

          {/* Filter Button */}
          <TouchableOpacity
            style={[styles.toolbarButton, showFilters && styles.activeToolbarButton]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialIcons name="filter-list" size={20} color={showFilters ? colors.primary : colors.text} />
          </TouchableOpacity>

          {/* Analytics Button */}
          <TouchableOpacity
            style={[styles.toolbarButton, showAnalytics && styles.activeToolbarButton]}
            onPress={() => setShowAnalytics(!showAnalytics)}
          >
            <MaterialIcons name="analytics" size={20} color={showAnalytics ? colors.primary : colors.text} />
          </TouchableOpacity>

          {/* Bulk Actions Button */}
          {selectedCount > 0 && (
            <TouchableOpacity
              style={[styles.toolbarButton, styles.bulkActionButton]}
              onPress={() => setShowBulkActions(!showBulkActions)}
            >
              <MaterialIcons name="more-horiz" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.background }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {/* Level Filter */}
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('level')}</Text>
                <View style={[styles.filterSelect, { backgroundColor: colors.card }]}>
                  <Text style={[styles.filterSelectText, { color: colors.text }]}>
                    {filterStates.level || t('all')}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={20} color={colors.text} />
                </View>
              </View>

              {/* Section Filter */}
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('section')}</Text>
                <View style={[styles.filterSelect, { backgroundColor: colors.card }]}>
                  <Text style={[styles.filterSelectText, { color: colors.text }]}>
                    {filterStates.section || t('all')}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={20} color={colors.text} />
                </View>
              </View>

              {/* Status Filter */}
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('status')}</Text>
                <View style={[styles.filterSelect, { backgroundColor: colors.card }]}>
                  <Text style={[styles.filterSelectText, { color: colors.text }]}>
                    {filterStates.status || t('all')}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={20} color={colors.text} />
                </View>
              </View>

              {/* Clear Filters */}
              <TouchableOpacity style={styles.clearFiltersButton}>
                <MaterialIcons name="clear" size={16} color={colors.primary} />
                <Text style={[styles.clearFiltersText, { color: colors.primary }]}>
                  {t('clearFilters')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Bulk Actions Panel */}
      {showBulkActions && selectedCount > 0 && (
        <View style={[styles.bulkActionsPanel, { backgroundColor: colors.primary }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={() => handleBulkAction('activate')}
            >
              <MaterialIcons name="check-circle" size={16} color="white" />
              <Text style={styles.bulkActionText}>{t('activate')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={() => handleBulkAction('deactivate')}
            >
              <MaterialIcons name="cancel" size={16} color="white" />
              <Text style={styles.bulkActionText}>{t('deactivate')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={() => handleBulkAction('assignTeacher')}
            >
              <MaterialIcons name="person-add" size={16} color="white" />
              <Text style={styles.bulkActionText}>{t('assignTeacher')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bulkActionButton, styles.dangerButton]}
              onPress={() => handleBulkAction('delete')}
            >
              <MaterialIcons name="delete" size={16} color="white" />
              <Text style={styles.bulkActionText}>{t('delete')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  );

  // ======================
  // RENDER FOOTER
  // ======================
  
  const renderFooter = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingMore')}...
          </Text>
        </View>
      );
    }
    return null;
  };

  // ======================
  // RENDER ERROR
  // ======================
  
  if (error && classes.length === 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <MaterialIcons name="error-outline" size={48} color={colors.text} />
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={onRefresh}
        >
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <RtlView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredClasses}
        renderItem={renderClassItem}
        keyExtractor={(item) => item.id.toString()}
        key={viewMode} // Force re-render when view mode changes
        numColumns={viewMode === 'grid' ? 2 : 1}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        getItemLayout={(data, index) => ({
          length: viewMode === 'cards' ? 200 : 120,
          offset: (viewMode === 'cards' ? 200 : 120) * index,
          index,
        })}
      />
    </RtlView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchSection: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultCount: {
    fontSize: 14,
    marginRight: 12,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginRight: 8,
  },
  viewModeButton: {
    padding: 6,
    borderRadius: 4,
  },
  activeViewMode: {
    backgroundColor: 'white',
  },
  toolbarButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
  },
  activeToolbarButton: {
    backgroundColor: '#f0f0f0',
  },
  bulkActionButton: {
    backgroundColor: 'transparent',
  },
  filtersPanel: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  filterItem: {
    marginRight: 16,
  },
  filterLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  filterSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 80,
  },
  filterSelectText: {
    fontSize: 14,
    marginRight: 4,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFiltersText: {
    fontSize: 14,
    marginLeft: 4,
  },
  bulkActionsPanel: {
    paddingVertical: 8,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 4,
  },
  bulkActionText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  listContent: {
    paddingBottom: 20,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  classCard: {
    margin: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectionIndicator: {
    marginRight: 12,
  },
  selectedIndicator: {
    backgroundColor: 'transparent',
  },
  classInfo: {
    flex: 1,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  classBadges: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  classDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 4,
  },
  capacitySection: {
    marginBottom: 8,
  },
  capacityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  capacityText: {
    fontSize: 14,
  },
  utilizationText: {
    fontSize: 12,
  },
  capacityBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    marginLeft: 2,
  },
  actionMenu: {
    padding: 8,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdvancedClassList; 
