import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useActivityLogs } from '../hooks/useActivityLogs';

interface FilterCriteria {
  startDate: string;
  endDate: string;
  severity: string[];
  category: string[];
  user: string;
  status: string[];
}

const PAGE_SIZE = 10;

// Custom styled components
const Card = ({ children, style, ...props }: any) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

const CardContent = ({ children, style, ...props }: any) => (
  <View style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
);

const Button = ({ children, mode = 'contained', onPress, style, icon, ...props }: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      mode === 'contained' && styles.buttonContained,
      mode === 'outlined' && styles.buttonOutlined,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    {icon && <MaterialIcons name={icon} size={16} color={mode === 'contained' ? '#fff' : '#007AFF'} style={{ marginRight: 8 }} />}
    <Text style={[
      styles.buttonText,
      mode === 'contained' && styles.buttonTextContained,
      mode === 'outlined' && styles.buttonTextOutlined,
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const IconButton = ({ icon, size = 24, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[styles.iconButton, style]}
    onPress={onPress}
    {...props}
  >
    <MaterialIcons name={icon} size={size} color="#666" />
  </TouchableOpacity>
);

const Chip = ({ children, selected = false, onPress, style, ...props }: any) => (
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

const Searchbar = ({ placeholder, onChangeText, value, style, ...props }: any) => (
  <View style={[styles.searchbar, style]}>
    <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      onChangeText={onChangeText}
      value={value}
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

const Divider = ({ style, ...props }: any) => (
  <View style={[styles.divider, style]} {...props} />
);

const ActivityLogs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<{ field: string; ascending: boolean }>({ field: 'timestamp', ascending: false });
  const [showFilters, setShowFilters] = useState(false);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [filters, setFilters] = useState<FilterCriteria>({
    startDate: '',
    endDate: '',
    severity: [],
    category: [],
    user: '',
    status: [],
  });

  const {
    logs,
    loading,
    error,
    totalLogs,
    fetchLogs,
    exportLogs,
    clearLogs,
    categories,
    severityLevels,
    statuses,
  } = useActivityLogs();

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      ascending: prev.field === field ? !prev.ascending : true,
    }));
  };

  const handleExport = async () => {
    await exportLogs(exportFormat, filters);
    setMenuVisible(false);
  };

  const handleLogPress = (log: any) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };

  const handleFilterChange = (key: keyof FilterCriteria, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      severity: [],
      category: [],
      user: '',
      status: [],
    });
    setSearchQuery('');
    setPage(0);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy.field !== field) return 'unfold-more';
    return sortBy.ascending ? 'arrow-upward' : 'arrow-downward';
  };

  const renderFilters = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Logs</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowFilters(false)}
            />
          </View>

          <ScrollView style={styles.filterContent}>
            <Text style={styles.filterSection}>Date Range</Text>
            <View style={styles.dateRange}>
              <Button
                mode="outlined"
                icon="calendar-today"
                onPress={() => {}}
                style={styles.dateButton}
              >
                {filters.startDate || 'Start Date'}
              </Button>
              <Button
                mode="outlined"
                icon="calendar-today"
                onPress={() => {}}
                style={styles.dateButton}
              >
                {filters.endDate || 'End Date'}
              </Button>
            </View>

            <Text style={styles.filterSection}>Severity</Text>
            <View style={styles.chipGroup}>
              {severityLevels.map(severity => (
                <Chip
                  key={severity}
                  selected={filters.severity.includes(severity)}
                  onPress={() => handleFilterChange('severity',
                    filters.severity.includes(severity)
                      ? filters.severity.filter(s => s !== severity)
                      : [...filters.severity, severity]
                  )}
                  style={styles.chip}
                >
                  {severity}
                </Chip>
              ))}
            </View>

            <Text style={styles.filterSection}>Category</Text>
            <View style={styles.chipGroup}>
              {categories.map(category => (
                <Chip
                  key={category}
                  selected={filters.category.includes(category)}
                  onPress={() => handleFilterChange('category',
                    filters.category.includes(category)
                      ? filters.category.filter(c => c !== category)
                      : [...filters.category, category]
                  )}
                  style={styles.chip}
                >
                  {category}
                </Chip>
              ))}
            </View>

            <Text style={styles.filterSection}>Status</Text>
            <View style={styles.chipGroup}>
              {statuses.map(status => (
                <Chip
                  key={status}
                  selected={filters.status.includes(status)}
                  onPress={() => handleFilterChange('status',
                    filters.status.includes(status)
                      ? filters.status.filter(s => s !== status)
                      : [...filters.status, status]
                  )}
                  style={styles.chip}
                >
                  {status}
                </Chip>
              ))}
            </View>

            <Text style={styles.filterSection}>User</Text>
            <Searchbar
              placeholder="Filter by user"
              onChangeText={value => handleFilterChange('user', value)}
              value={filters.user}
              style={styles.searchbar}
            />
          </ScrollView>

          <Divider style={styles.divider} />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={handleClearFilters}
              style={styles.actionButton}
            >
              Clear All
            </Button>
            <Button
              mode="contained"
              onPress={() => setShowFilters(false)}
              style={styles.actionButton}
            >
              Apply Filters
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderLogDetails = () => (
    <Modal
      visible={showLogDetails}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLogDetails(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Details</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowLogDetails(false)}
            />
          </View>
          
          {selectedLog && (
            <ScrollView style={styles.logDetailsContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Timestamp:</Text>
                <Text style={styles.detailValue}>{selectedLog.timestamp}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>User:</Text>
                <Text style={styles.detailValue}>{selectedLog.user}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Action:</Text>
                <Text style={styles.detailValue}>{selectedLog.action}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{selectedLog.category}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Severity:</Text>
                <Text style={styles.detailValue}>{selectedLog.severity}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>{selectedLog.status}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Details:</Text>
                <Text style={styles.detailValue}>{selectedLog.details}</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderLogTable = () => (
    <Card style={styles.tableCard}>
      <CardContent>
        <View style={styles.tableHeader}>
          <TouchableOpacity
            style={styles.tableHeaderCell}
            onPress={() => handleSort('timestamp')}
          >
            <Text style={styles.tableHeaderText}>Timestamp</Text>
            <MaterialIcons name={renderSortIcon('timestamp')} size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tableHeaderCell}
            onPress={() => handleSort('user')}
          >
            <Text style={styles.tableHeaderText}>User</Text>
            <MaterialIcons name={renderSortIcon('user')} size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tableHeaderCell}
            onPress={() => handleSort('action')}
          >
            <Text style={styles.tableHeaderText}>Action</Text>
            <MaterialIcons name={renderSortIcon('action')} size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tableHeaderCell}
            onPress={() => handleSort('category')}
          >
            <Text style={styles.tableHeaderText}>Category</Text>
            <MaterialIcons name={renderSortIcon('category')} size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tableHeaderCell}
            onPress={() => handleSort('severity')}
          >
            <Text style={styles.tableHeaderText}>Severity</Text>
            <MaterialIcons name={renderSortIcon('severity')} size={16} color="#666" />
          </TouchableOpacity>
          <View style={styles.tableHeaderCell}>
            <Text style={styles.tableHeaderText}>Actions</Text>
          </View>
        </View>

        <ScrollView style={styles.tableBody}>
          {logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((log, index) => (
            <TouchableOpacity
              key={log.id}
              style={styles.tableRow}
              onPress={() => handleLogPress(log)}
            >
              <Text style={styles.tableCell}>{log.timestamp}</Text>
              <Text style={styles.tableCell}>{log.user}</Text>
              <Text style={styles.tableCell}>{log.action}</Text>
              <Text style={styles.tableCell}>{log.category}</Text>
              <Chip
                selected={false}
                style={[
                  styles.severityChip,
                  { backgroundColor: log.severity === 'high' ? '#ffebee' : '#e8f5e8' }
                ]}
              >
                {log.severity}
              </Chip>
              <View style={styles.actionCell}>
                <IconButton
                  icon="visibility"
                  size={16}
                  onPress={() => handleLogPress(log)}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.pagination}>
          <Button
            mode="outlined"
            onPress={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Text style={styles.pageInfo}>
            Page {page + 1} of {Math.ceil(totalLogs / PAGE_SIZE)}
          </Text>
          <Button
            mode="outlined"
            onPress={() => setPage(page + 1)}
            disabled={(page + 1) * PAGE_SIZE >= totalLogs}
          >
            Next
          </Button>
        </View>
      </CardContent>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <CardContent>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Activity Logs</Text>
              <Text style={styles.subtitle}>
                {totalLogs} total logs • {logs.length} displayed
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Searchbar
                placeholder="Search logs..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.headerSearchbar}
              />
              <Button
                mode="outlined"
                icon="filter-list"
                onPress={() => setShowFilters(true)}
                style={styles.filterButton}
              >
                Filters
              </Button>
              <Button
                mode="contained"
                icon="file-download"
                onPress={handleExport}
              >
                Export
              </Button>
            </View>
          </View>
        </CardContent>
      </Card>

      {renderLogTable()}
      {renderFilters()}
      {renderLogDetails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSearchbar: {
    marginRight: 12,
    width: 200,
  },
  filterButton: {
    marginRight: 12,
  },
  tableCard: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  tableHeaderCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  severityChip: {
    flex: 1,
    alignSelf: 'flex-start',
  },
  actionCell: {
    flex: 1,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
  },
  // Custom component styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minHeight: 36,
  },
  buttonContained: {
    backgroundColor: '#007AFF',
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextContained: {
    color: '#fff',
  },
  buttonTextOutlined: {
    color: '#007AFF',
  },
  iconButton: {
    padding: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
  },
  searchbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContent: {
    padding: 16,
  },
  filterSection: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  dateRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  logDetailsContent: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default ActivityLogs;
