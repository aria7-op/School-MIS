import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import api from '../../../services/api';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  oldData: string | null;
  newData: string | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

interface Filters {
  action: string;
  entityType: string;
  userId: string;
  startDate: Date | null;
  endDate: Date | null;
  searchText: string;
}

const AuditLogsScreen = () => {
  const { colors } = useTheme();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  const [filters, setFilters] = useState<Filters>({
    action: '',
    entityType: '',
    userId: '',
    startDate: null,
    endDate: null,
    searchText: '',
  });

  const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'MARK_IN', 'MARK_OUT', 'LOGIN', 'LOGOUT'];
  const entityTypes = ['Attendance', 'Grade', 'Payment', 'Student', 'User', 'Class', 'Teacher', 'Parent'];

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit: 20,
      };

      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();

      const response = await api.get('/api/audit-logs', { params });
      
      if (response.data.success) {
        setLogs(response.data.data.logs);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchLogs();
  };

  const resetFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      userId: '',
      startDate: null,
      endDate: null,
      searchText: '',
    });
    setPage(1);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return '#10B981';
      case 'UPDATE':
        return '#3B82F6';
      case 'DELETE':
        return '#EF4444';
      case 'MARK_IN':
      case 'MARK_OUT':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'add-circle';
      case 'UPDATE':
        return 'edit';
      case 'DELETE':
        return 'delete';
      case 'MARK_IN':
        return 'login';
      case 'MARK_OUT':
        return 'logout';
      default:
        return 'info';
    }
  };

  const renderLogCard = (log: AuditLog) => (
    <TouchableOpacity
      key={log.id}
      style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        setSelectedLog(log);
        setShowDetails(true);
      }}
    >
      <View style={styles.logHeader}>
        <View style={styles.actionBadge}>
          <Icon 
            name={getActionIcon(log.action)} 
            size={16} 
            color={getActionColor(log.action)} 
          />
          <Text style={[styles.actionText, { color: getActionColor(log.action) }]}>
            {log.action}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: colors.text + '80' }]}>
          {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
        </Text>
      </View>

      <View style={styles.logBody}>
        <View style={styles.infoRow}>
          <Icon name="folder" size={14} color={colors.text + '60'} />
          <Text style={[styles.infoLabel, { color: colors.text + '80' }]}>Entity:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {log.entityType}
          </Text>
        </View>

        {log.user && (
          <View style={styles.infoRow}>
            <Icon name="person" size={14} color={colors.text + '60'} />
            <Text style={[styles.infoLabel, { color: colors.text + '80' }]}>User:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {log.user.firstName} {log.user.lastName}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>
                {log.user.role}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Icon name="computer" size={14} color={colors.text + '60'} />
          <Text style={[styles.infoLabel, { color: colors.text + '80' }]}>IP:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {log.ipAddress}
          </Text>
        </View>
      </View>

      <View style={styles.logFooter}>
        <Text style={[styles.entityIdText, { color: colors.text + '60' }]}>
          ID: {log.entityId}
        </Text>
        <Icon name="chevron-right" size={20} color={colors.text + '40'} />
      </View>
    </TouchableOpacity>
  );

  const renderDetailsModal = () => (
    <Modal
      visible={showDetails}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetails(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Audit Log Details</Text>
          <TouchableOpacity onPress={() => setShowDetails(false)}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedLog && (
            <>
              <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                  Action Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Action:</Text>
                  <View style={[styles.actionBadge, { backgroundColor: getActionColor(selectedLog.action) + '20' }]}>
                    <Text style={[styles.actionText, { color: getActionColor(selectedLog.action) }]}>
                      {selectedLog.action}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Entity Type:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedLog.entityType}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Entity ID:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedLog.entityId}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Timestamp:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {format(new Date(selectedLog.createdAt), 'PPpp')}
                  </Text>
                </View>
              </View>

              {selectedLog.user && (
                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                    User Information
                  </Text>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Name:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedLog.user.firstName} {selectedLog.user.lastName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>Role:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedLog.user.role}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>User ID:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedLog.user.id}
                    </Text>
                  </View>
                </View>
              )}

              <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                  System Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>IP Address:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedLog.ipAddress}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text + '80' }]}>User Agent:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={2}>
                    {selectedLog.userAgent}
                  </Text>
                </View>
              </View>

              {selectedLog.oldData && (
                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                    Old Data
                  </Text>
                  <ScrollView horizontal>
                    <Text style={[styles.jsonText, { color: colors.text }]}>
                      {JSON.stringify(JSON.parse(selectedLog.oldData), null, 2)}
                    </Text>
                  </ScrollView>
                </View>
              )}

              {selectedLog.newData && (
                <View style={[styles.detailSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                    New Data
                  </Text>
                  <ScrollView horizontal>
                    <Text style={[styles.jsonText, { color: colors.text }]}>
                      {JSON.stringify(JSON.parse(selectedLog.newData), null, 2)}
                    </Text>
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Filters</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Action Filter */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Action Type</Text>
            <View style={styles.chipContainer}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  { 
                    backgroundColor: filters.action === '' ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setFilters({ ...filters, action: '' })}
              >
                <Text style={[styles.chipText, { color: filters.action === '' ? '#fff' : colors.text }]}>
                  All
                </Text>
              </TouchableOpacity>
              {actionTypes.map((action) => (
                <TouchableOpacity
                  key={action}
                  style={[
                    styles.chip,
                    { 
                      backgroundColor: filters.action === action ? colors.primary : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setFilters({ ...filters, action })}
                >
                  <Text style={[styles.chipText, { color: filters.action === action ? '#fff' : colors.text }]}>
                    {action}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Entity Type Filter */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Entity Type</Text>
            <View style={styles.chipContainer}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  { 
                    backgroundColor: filters.entityType === '' ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setFilters({ ...filters, entityType: '' })}
              >
                <Text style={[styles.chipText, { color: filters.entityType === '' ? '#fff' : colors.text }]}>
                  All
                </Text>
              </TouchableOpacity>
              {entityTypes.map((entityType) => (
                <TouchableOpacity
                  key={entityType}
                  style={[
                    styles.chip,
                    { 
                      backgroundColor: filters.entityType === entityType ? colors.primary : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setFilters({ ...filters, entityType })}
                >
                  <Text style={[styles.chipText, { color: filters.entityType === entityType ? '#fff' : colors.text }]}>
                    {entityType}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Range Filter */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Date Range</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowDatePicker('start')}
              >
                <Icon name="event" size={20} color={colors.text} />
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {filters.startDate ? format(filters.startDate, 'MMM dd, yyyy') : 'Start Date'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowDatePicker('end')}
              >
                <Icon name="event" size={20} color={colors.text} />
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {filters.endDate ? format(filters.endDate, 'MMM dd, yyyy') : 'End Date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={
                showDatePicker === 'start' && filters.startDate
                  ? filters.startDate
                  : showDatePicker === 'end' && filters.endDate
                  ? filters.endDate
                  : new Date()
              }
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(null);
                if (selectedDate) {
                  if (showDatePicker === 'start') {
                    setFilters({ ...filters, startDate: selectedDate });
                  } else {
                    setFilters({ ...filters, endDate: selectedDate });
                  }
                }
              }}
            />
          )}

          <View style={styles.filterActions}>
            <TouchableOpacity
              style={[styles.resetButton, { borderColor: colors.border }]}
              onPress={resetFilters}
            >
              <Icon name="refresh" size={20} color={colors.text} />
              <Text style={[styles.resetButtonText, { color: colors.text }]}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowFilters(false);
                setPage(1);
                fetchLogs();
              }}
            >
              <Icon name="check" size={20} color="#fff" />
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Audit Logs</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
            {logs.length} records
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowFilters(true)}
        >
          <Icon name="filter-list" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {(filters.action || filters.entityType || filters.startDate || filters.endDate) && (
        <View style={styles.activeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.action && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                  {filters.action}
                </Text>
                <TouchableOpacity onPress={() => setFilters({ ...filters, action: '' })}>
                  <Icon name="close" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            {filters.entityType && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                  {filters.entityType}
                </Text>
                <TouchableOpacity onPress={() => setFilters({ ...filters, entityType: '' })}>
                  <Icon name="close" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            {filters.startDate && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                  From: {format(filters.startDate, 'MMM dd')}
                </Text>
                <TouchableOpacity onPress={() => setFilters({ ...filters, startDate: null })}>
                  <Icon name="close" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            {filters.endDate && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                  To: {format(filters.endDate, 'MMM dd')}
                </Text>
                <TouchableOpacity onPress={() => setFilters({ ...filters, endDate: null })}>
                  <Icon name="close" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Logs List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading audit logs...</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="assignment" size={64} color={colors.text + '40'} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No audit logs found</Text>
          <Text style={[styles.emptySubtext, { color: colors.text + '60' }]}>
            Try adjusting your filters
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {logs.map(renderLogCard)}

          {/* Pagination */}
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[
                styles.pageButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                page === 1 && styles.pageButtonDisabled,
              ]}
              onPress={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <Icon name="chevron-left" size={20} color={page === 1 ? colors.text + '40' : colors.text} />
            </TouchableOpacity>

            <Text style={[styles.pageText, { color: colors.text }]}>
              Page {page} of {totalPages}
            </Text>

            <TouchableOpacity
              style={[
                styles.pageButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                page === totalPages && styles.pageButtonDisabled,
              ]}
              onPress={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              <Icon
                name="chevron-right"
                size={20}
                color={page === totalPages ? colors.text + '40' : colors.text}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {renderFiltersModal()}
      {renderDetailsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
  },
  scrollView: {
    flex: 1,
  },
  logCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  timeText: {
    fontSize: 11,
  },
  logBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    marginLeft: 6,
    marginRight: 4,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  entityIdText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  jsonText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    padding: 12,
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 14,
    marginLeft: 8,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default AuditLogsScreen;

