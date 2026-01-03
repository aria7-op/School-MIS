import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';
import RtlView from '../../../components/ui/RtlView';
import classService from '../services/classService';

interface AdvancedClassBulkOpsProps {
  selectedClass: any;
  onBulkAction: (action: string, data: any) => void;
}

const AdvancedClassBulkOps: React.FC<AdvancedClassBulkOpsProps> = ({
  selectedClass,
  onBulkAction,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const TABS = [
    { key: 'students', label: t('students'), icon: 'people' },
    { key: 'assignments', label: t('assignments'), icon: 'assignment' },
    { key: 'grades', label: t('grades'), icon: 'grade' },
    { key: 'attendance', label: t('attendance'), icon: 'check-circle' },
  ];

  // Rich dummy data
  const dummyStudents = [
    { id: 1, name: 'John Smith', email: 'john.smith@email.com', status: 'Active', grade: 'A', attendance: 95 },
    { id: 2, name: 'Emma Johnson', email: 'emma.johnson@email.com', status: 'Active', grade: 'B+', attendance: 88 },
    { id: 3, name: 'Michael Brown', email: 'michael.brown@email.com', status: 'Inactive', grade: 'C', attendance: 72 },
    { id: 4, name: 'Sarah Davis', email: 'sarah.davis@email.com', status: 'Active', grade: 'A-', attendance: 92 },
    { id: 5, name: 'David Wilson', email: 'david.wilson@email.com', status: 'Active', grade: 'B', attendance: 85 },
    { id: 6, name: 'Lisa Anderson', email: 'lisa.anderson@email.com', status: 'Active', grade: 'A+', attendance: 98 },
    { id: 7, name: 'Robert Taylor', email: 'robert.taylor@email.com', status: 'Inactive', grade: 'D', attendance: 65 },
    { id: 8, name: 'Jennifer Garcia', email: 'jennifer.garcia@email.com', status: 'Active', grade: 'B-', attendance: 79 },
  ];

  const dummyAssignments = [
    { id: 1, title: 'Calculus Problem Set 1', subject: 'Mathematics', dueDate: '2024-02-20', status: 'Active', submissions: 25 },
    { id: 2, title: 'Physics Lab Report', subject: 'Physics', dueDate: '2024-02-18', status: 'Active', submissions: 28 },
    { id: 3, title: 'Essay on Shakespeare', subject: 'English', dueDate: '2024-02-25', status: 'Active', submissions: 20 },
    { id: 4, title: 'Programming Project', subject: 'Computer Science', dueDate: '2024-02-15', status: 'Completed', submissions: 30 },
    { id: 5, title: 'History Research Paper', subject: 'History', dueDate: '2024-02-22', status: 'Active', submissions: 18 },
  ];

  const dummyGrades = [
    { id: 1, student: 'John Smith', subject: 'Mathematics', grade: 'A', score: 92, date: '2024-02-15' },
    { id: 2, student: 'Emma Johnson', subject: 'Mathematics', grade: 'B+', score: 87, date: '2024-02-15' },
    { id: 3, student: 'Michael Brown', subject: 'Mathematics', grade: 'C', score: 73, date: '2024-02-15' },
    { id: 4, student: 'Sarah Davis', subject: 'Mathematics', grade: 'A-', score: 89, date: '2024-02-15' },
    { id: 5, student: 'David Wilson', subject: 'Mathematics', grade: 'B', score: 82, date: '2024-02-15' },
  ];

  const dummyAttendance = [
    { id: 1, student: 'John Smith', date: '2024-02-15', status: 'Present', time: '08:30 AM' },
    { id: 2, student: 'Emma Johnson', date: '2024-02-15', status: 'Late', time: '08:45 AM' },
    { id: 3, student: 'Michael Brown', date: '2024-02-15', status: 'Absent', time: 'N/A' },
    { id: 4, student: 'Sarah Davis', date: '2024-02-15', status: 'Present', time: '08:25 AM' },
    { id: 5, student: 'David Wilson', date: '2024-02-15', status: 'Present', time: '08:35 AM' },
  ];

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'students': return dummyStudents;
      case 'assignments': return dummyAssignments;
      case 'grades': return dummyGrades;
      case 'attendance': return dummyAttendance;
      default: return [];
    }
  };

  // Filter data
  const filteredData = getCurrentData().filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.student?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(filteredData.map(item => item.id));
      setSelectAll(true);
    }
  };

  // Handle individual selection
  const handleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
      setSelectAll(false);
    } else {
      setSelectedItems([...selectedItems, id]);
      if (selectedItems.length + 1 === filteredData.length) {
        setSelectAll(true);
      }
    }
  };

  // Bulk operations
  const bulkOperations = [
    {
      key: 'students',
      operations: [
        { id: 'activate', label: t('activateStudents'), icon: 'check-circle', color: '#4CAF50' },
        { id: 'deactivate', label: t('deactivateStudents'), icon: 'cancel', color: '#F44336' },
        { id: 'sendEmail', label: t('sendEmail'), icon: 'email', color: '#2196F3' },
        { id: 'export', label: t('exportData'), icon: 'file-download', color: '#FF9800' },
        { id: 'delete', label: t('deleteStudents'), icon: 'delete', color: '#F44336' },
      ]
    },
    {
      key: 'assignments',
      operations: [
        { id: 'extendDueDate', label: t('extendDueDate'), icon: 'schedule', color: '#FF9800' },
        { id: 'gradeBulk', label: t('gradeBulk'), icon: 'grade', color: '#4CAF50' },
        { id: 'sendReminder', label: t('sendReminder'), icon: 'notifications', color: '#2196F3' },
        { id: 'duplicate', label: t('duplicateAssignments'), icon: 'content-copy', color: '#9C27B0' },
        { id: 'delete', label: t('deleteAssignments'), icon: 'delete', color: '#F44336' },
      ]
    },
    {
      key: 'grades',
      operations: [
        { id: 'adjustGrades', label: t('adjustGrades'), icon: 'edit', color: '#FF9800' },
        { id: 'curveGrades', label: t('curveGrades'), icon: 'trending-up', color: '#4CAF50' },
        { id: 'exportGrades', label: t('exportGrades'), icon: 'file-download', color: '#2196F3' },
        { id: 'sendReport', label: t('sendReport'), icon: 'email', color: '#9C27B0' },
        { id: 'resetGrades', label: t('resetGrades'), icon: 'refresh', color: '#F44336' },
      ]
    },
    {
      key: 'attendance',
      operations: [
        { id: 'markPresent', label: t('markPresent'), icon: 'check-circle', color: '#4CAF50' },
        { id: 'markAbsent', label: t('markAbsent'), icon: 'cancel', color: '#F44336' },
        { id: 'markLate', label: t('markLate'), icon: 'schedule', color: '#FF9800' },
        { id: 'exportAttendance', label: t('exportAttendance'), icon: 'file-download', color: '#2196F3' },
        { id: 'sendReport', label: t('sendReport'), icon: 'email', color: '#9C27B0' },
      ]
    }
  ];

  const currentOperations = bulkOperations.find(op => op.key === activeTab)?.operations || [];

  // Handle bulk operation
  const handleBulkOperation = (operationId: string) => {
    if (selectedItems.length === 0) {
      Alert.alert(t('noSelection'), t('pleaseSelectItems'));
      return;
    }

    Alert.alert(
      t('confirmOperation'),
      t('confirmBulkOperation', { operation: operationId, count: selectedItems.length }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: () => {
            onBulkAction(operationId, { items: selectedItems, type: activeTab });
            setSelectedItems([]);
            setSelectAll(false);
          }
        }
      ]
    );
  };

  // Render student item
  const renderStudentItem = ({ item }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.card }]}>
      <View style={styles.itemHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleSelectItem(item.id)}
        >
          <MaterialIcons
            name={selectedItems.includes(item.id) ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={selectedItems.includes(item.id) ? colors.primary : colors.text}
          />
        </TouchableOpacity>
        
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.itemSubtitle, { color: colors.text + '80' }]}>
            {item.email}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Active' ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="grade" size={16} color={colors.text + '80'} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {t('grade')}: {item.grade}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="check-circle" size={16} color={colors.text + '80'} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {t('attendance')}: {item.attendance}%
          </Text>
        </View>
      </View>
    </View>
  );

  // Render assignment item
  const renderAssignmentItem = ({ item }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.card }]}>
      <View style={styles.itemHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleSelectItem(item.id)}
        >
          <MaterialIcons
            name={selectedItems.includes(item.id) ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={selectedItems.includes(item.id) ? colors.primary : colors.text}
          />
        </TouchableOpacity>
        
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.itemSubtitle, { color: colors.text + '80' }]}>
            {item.subject}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Active' ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="event" size={16} color={colors.text + '80'} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {t('dueDate')}: {item.dueDate}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="folder" size={16} color={colors.text + '80'} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {t('submissions')}: {item.submissions}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render grade item
  const renderGradeItem = ({ item }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.card }]}>
      <View style={styles.itemHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleSelectItem(item.id)}
        >
          <MaterialIcons
            name={selectedItems.includes(item.id) ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={selectedItems.includes(item.id) ? colors.primary : colors.text}
          />
        </TouchableOpacity>
        
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.student}
          </Text>
          <Text style={[styles.itemSubtitle, { color: colors.text + '80' }]}>
            {item.subject}
          </Text>
        </View>
        
        <View style={[styles.gradeBadge, { backgroundColor: item.grade === 'A' ? '#4CAF50' : item.grade === 'B' ? '#2196F3' : item.grade === 'C' ? '#FF9800' : '#F44336' }]}>
          <Text style={styles.gradeText}>{item.grade}</Text>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="score" size={16} color={colors.text + '80'} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {t('score')}: {item.score}%
          </Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="event" size={16} color={colors.text + '80'} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {t('date')}: {item.date}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render attendance item
  const renderAttendanceItem = ({ item }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.card }]}>
      <View style={styles.itemHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleSelectItem(item.id)}
        >
          <MaterialIcons
            name={selectedItems.includes(item.id) ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={selectedItems.includes(item.id) ? colors.primary : colors.text}
          />
        </TouchableOpacity>
        
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.student}
          </Text>
          <Text style={[styles.itemSubtitle, { color: colors.text + '80' }]}>
            {item.date}
          </Text>
        </View>
        
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'Present' ? '#4CAF50' : item.status === 'Late' ? '#FF9800' : '#F44336' }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="access-time" size={16} color={colors.text + '80'} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {t('time')}: {item.time}
          </Text>
        </View>
      </View>
    </View>
  );

  // Get render function based on active tab
  const getRenderFunction = () => {
    switch (activeTab) {
      case 'students': return renderStudentItem;
      case 'assignments': return renderAssignmentItem;
      case 'grades': return renderGradeItem;
      case 'attendance': return renderAttendanceItem;
      default: return renderStudentItem;
    }
  };

  return (
    <RtlView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <MaterialIcons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? colors.primary : colors.text}
              />
              <Text style={[
                styles.tabButtonText,
                { color: activeTab === tab.key ? colors.primary : colors.text }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search and Filters */}
      <View style={[styles.searchSection, { backgroundColor: colors.card }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.text} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('search')}
              placeholderTextColor={colors.text + '60'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.selectAllButton, { backgroundColor: colors.primary }]}
            onPress={handleSelectAll}
          >
            <MaterialIcons
              name={selectAll ? 'check-box' : 'check-box-outline-blank'}
              size={20}
              color="white"
            />
            <Text style={styles.selectAllText}>
              {selectAll ? t('deselectAll') : t('selectAll')}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.selectionCount, { color: colors.text }]}>
            {selectedItems.length} {t('selected')}
          </Text>
        </View>
      </View>

      {/* Bulk Operations */}
      {selectedItems.length > 0 && (
        <View style={[styles.operationsSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.operationsTitle, { color: colors.text }]}>
            {t('bulkOperations')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {currentOperations.map(operation => (
              <TouchableOpacity
                key={operation.id}
                style={[styles.operationButton, { backgroundColor: operation.color }]}
                onPress={() => handleBulkOperation(operation.id)}
              >
                <MaterialIcons name={operation.icon as any} size={20} color="white" />
                <Text style={styles.operationButtonText}>{operation.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Items List */}
      <FlatList
        data={filteredData}
        renderItem={getRenderFunction()}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.itemsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={48} color={colors.text + '50'} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              {t('noItemsFound')}
            </Text>
          </View>
        }
      />
    </RtlView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    marginLeft: 8,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectAllText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  operationsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  operationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  operationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  operationButtonText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  itemsList: {
    padding: 16,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gradeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default AdvancedClassBulkOps; 
