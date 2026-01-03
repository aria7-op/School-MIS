import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Alert,
  Image,
  StatusBar,

  FlatList,
  ActivityIndicator,
  RefreshControl,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';

import { RootStackParamList } from '../../../types/navigation';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, StackNavigationProp, useTheme } from '@react-navigation/native';

interface AttendanceScreenProps {
  navigation: StackNavigationProp<RootStackParamList>;
}
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, subDays } from 'date-fns';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import AttendanceCalendar from '../components/AttendanceCalendar';
import AttendanceList from '../components/AttendanceList';
import { 
  fetchAttendanceRecords, 
  fetchClasses, 
  fetchUsers, 
  getAttendanceSummary 
} from '../api';
import { Class, User, AttendanceRecord } from '../models';
import { AttendanceStatus } from '../types';

const screenWidth = Dimensions.get('window').width;

interface FilterState {
  dateRange: 'today' | 'week' | 'month' | 'custom';
  startDate: Date;
  endDate: Date;
  userType: 'all' | 'student' | 'teacher';
  status: 'all' | AttendanceStatus;
  classId: string;
  searchQuery: string;
}

const AttendanceScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<{ 
    present: number; 
    absent: number; 
    late: number; 
    excused: number; 
    total: number 
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  // Initialize filters
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'week',
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    userType: 'student',
    status: 'all',
    classId: '',
    searchQuery: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [classList, userList] = await Promise.all([
        fetchClasses(),
        fetchUsers({ role: filters.userType === 'all' ? undefined : filters.userType }),
      ]);
      
      setClasses(classList);
      setUsers(userList);
      
      // Set default class if not set
      if (classList.length > 0 && !filters.classId) {
        setFilters(prev => ({ ...prev, classId: classList[0].id }));
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAttendanceData = async () => {
    if (!filters.classId) return;
    
    try {
      setLoading(true);
      
      // Determine date range based on filter selection
      let dateFrom = filters.startDate.toISOString().split('T')[0];
      let dateTo = filters.endDate.toISOString().split('T')[0];
      
      if (filters.dateRange === 'today') {
        dateFrom = dateTo = new Date().toISOString().split('T')[0];
      } else if (filters.dateRange === 'week') {
        dateFrom = subDays(new Date(), 7).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
      } else if (filters.dateRange === 'month') {
        dateFrom = subDays(new Date(), 30).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
      }
      
      const filterParams = {
        classId: filters.classId,
        dateFrom,
        dateTo,
        status: filters.status === 'all' ? undefined : filters.status,
        searchQuery: filters.searchQuery || undefined
      };
      
      const [records, summary] = await Promise.all([
        fetchAttendanceRecords(filterParams),
        getAttendanceSummary(filterParams),
      ]);
      
      setRecords(records);
      setSummary(summary);
    } catch (error) {
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.userType]);

  useEffect(() => {
    loadAttendanceData();
  }, [filters.classId, filters.dateRange, filters.startDate, filters.endDate, filters.status, filters.searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    loadAttendanceData();
  };

  const handleDateChange = (date: string) => {
    // When a date is selected from calendar, update filters
    const selectedDate = new Date(date);
    setFilters(prev => ({
      ...prev,
      dateRange: 'custom',
      startDate: selectedDate,
      endDate: selectedDate
    }));
  };

  const handleDatePickerChange = (event: any, date?: Date) => {
    setShowDatePicker(null);
    if (date) {
      if (showDatePicker === 'start') {
        setFilters(prev => ({ ...prev, startDate: date }));
      } else {
        setFilters(prev => ({ ...prev, endDate: date }));
      }
    }
  };

  const handleAddAttendance = () => {
    const selectedDate = new Date().toISOString().split('T')[0];
    navigation.navigate('TakeAttendance', { classId: filters.classId, date: selectedDate } as NavigationParams);
  };

  const handleEditRecord = (recordId: string) => {
    const record = records.find(r => r.id === recordId);
    if (record) {
      const user = users.find(u => u.id === record.userId);
      const userId = user?.id;
      const date = record.date;
      navigation.navigate('TakeAttendance', { classId: filters.classId, date, userId, recordId } as NavigationParams);
    }
  };

  const getMarkedDates = () => {
    if (!filters.classId) return {};
    
    const classRecords = records.filter(r => {
      const user = users.find(u => u.id === r.userId);
      return user?.class === filters.classId;
    });
    
    const datesWithRecords = [...new Set(classRecords.map(r => r.date))];
    
    const markedDates: { [date: string]: { marked: boolean; dotColor: string } } = {};
    
    datesWithRecords.forEach(date => {
      const dateRecords = classRecords.filter(r => r.date === date);
      const hasAbsent = dateRecords.some(r => r.status === 'absent');
      
      markedDates[date] = {
        marked: true,
        dotColor: hasAbsent ? '#F44336' : '#4CAF50',
      };
    });
    
    return markedDates;
  };

  const getPieChartData = () => {
    if (!summary) return [];
    
    return [
      {
        name: 'Present',
        population: summary.present,
        color: '#4CAF50',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
      {
        name: 'Absent',
        population: summary.absent,
        color: '#F44336',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
      {
        name: 'Late',
        population: summary.late,
        color: '#FFC107',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
      {
        name: 'Excused',
        population: summary.excused,
        color: '#9C27B0',
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
    ];
  };

  const selectedClass = classes.find(c => c.id === filters.classId);

  if (loading && !filters.classId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3f51b5" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollViewScrollbar}
      >
        <View style={styles.classSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {classes.map(cls => (
              <TouchableOpacity
                key={cls.id}
                style={[
                  styles.classButton,
                  filters.classId === cls.id && styles.selectedClassButton,
                ]}
                onPress={() => setFilters(prev => ({ ...prev, classId: cls.id }))}
              >
                <Text
                  style={[
                    styles.classButtonText,
                    filters.classId === cls.id && styles.selectedClassButtonText,
                  ]}
                >
                  {cls.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedClass && (
          <>
            <View style={styles.classInfoContainer}>
              {/* Left side - Class info */}
              <View style={styles.classTextContainer}>
                <Text style={styles.className}>{selectedClass.name}</Text>
                <Text style={styles.classDetails}>
                  {selectedClass.schedule} • {selectedClass.room}
                </Text>
              </View>

              {/* Right side - Filter button */}
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setShowFilters(true)}
              >
                <MaterialIcons name="filter-list" size={24} color="#fff" />
                <Text style={styles.filterButtonText}>Filters</Text>
              </TouchableOpacity>
            </View>

            <AttendanceCalendar
              markedDates={getMarkedDates()}
              onDayPress={handleDateChange}
              selectedDate={filters.endDate.toISOString().split('T')[0]}
            />

            {summary && (
              <View style={styles.chartContainer}>
                <PieChart
                  data={getPieChartData()}
                  width={screenWidth - 32}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            )}

            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Filtered Attendance</Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStat}>
                  <Text style={[styles.summaryNumber, { color: '#4CAF50' }]}>{summary?.present ?? 0}</Text>
                  <Text style={styles.summaryLabel}>Present</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={[styles.summaryNumber, { color: '#F44336' }]}>{summary?.absent ?? 0}</Text>
                  <Text style={styles.summaryLabel}>Absent</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={[styles.summaryNumber, { color: '#FFC107' }]}>{summary?.late ?? 0}</Text>
                  <Text style={styles.summaryLabel}>Late</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={[styles.summaryNumber, { color: '#9C27B0' }]}>{summary?.excused ?? 0}</Text>
                  <Text style={styles.summaryLabel}>Excused</Text>
                </View>
                </View>
                <Text style={styles.dateRangeText}>
                  {format(new Date(filters.startDate), 'MMM d, yyyy')} - {format(new Date(filters.endDate), 'MMM d, yyyy')}
                </Text>
              </View>
            </View>

            <AttendanceList
              records={records}
              users={users}
              onEdit={handleEditRecord}
              onAdd={handleAddAttendance}
            />
          </>
        )}

      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Attendance</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <MaterialIcons name="close" size={24} color="#3f51b5" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.datePicker}>
            <MaterialIcons name="date-range" size={24} color="#555" style={styles.icon} />
            <Picker
              selectedValue={filters.dateRange}
              style={styles.picker}
              onValueChange={(value) => setFilters(prev => ({
                ...prev,
                dateRange: value,
                startDate: value === 'today' ? new Date() :
                          value === 'week' ? subDays(new Date(), 7) :
                          value === 'month' ? subDays(new Date(), 30) :
                          prev.startDate,
                endDate: value === 'custom' ? prev.endDate : new Date()
              }))}
            >
              <Picker.Item label="Today" value="today" />
              <Picker.Item label="Last 7 Days" value="week" />
              <Picker.Item label="Last 30 Days" value="month" />
              <Picker.Item label="Custom Range" value="custom" />
            </Picker>
          </View>

              {filters.dateRange === 'custom' && (
                <View style={styles.dateRangeContainer}>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker('start')}
                  >
                    <Text>{format(filters.startDate, 'MMM d, yyyy')}</Text>
                    <MaterialIcons name="calendar-today" size={20} color="#3f51b5" />
                  </TouchableOpacity>
                  <Text style={styles.dateRangeSeparator}>to</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker('end')}
                  >
                    <Text>{format(filters.endDate, 'MMM d, yyyy')}</Text>
                    <MaterialIcons name="calendar-today" size={20} color="#3f51b5" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>User Type</Text>
              <Picker
                selectedValue={filters.userType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, userType: value }))}
              >
                <Picker.Item label="All Users" value="all" />
                <Picker.Item label="Students Only" value="student" />
                <Picker.Item label="Teachers Only" value="teacher" />
              </Picker>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Attendance Status</Text>
              <Picker
                selectedValue={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <Picker.Item label="All Statuses" value="all" />
                <Picker.Item label="Present Only" value="present" />
                <Picker.Item label="Absent Only" value="absent" />
                <Picker.Item label="Late Only" value="late" />
                <Picker.Item label="Excused Only" value="excused" />
              </Picker>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Search</Text>
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or email"
                  placeholderTextColor="#999"
                  value={filters.searchQuery}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, searchQuery: text }))}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => setFilters({
                dateRange: 'week',
                startDate: subDays(new Date(), 7),
                endDate: new Date(),
                userType: 'student',
                status: 'all',
                classId: filters.classId,
                searchQuery: ''
              })}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => {
                setShowFilters(false);
                loadAttendanceData();
              }}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'start' ? filters.startDate : filters.endDate}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width:'95%',
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop:10
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
    classInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal:27,
    backgroundColor:'#fff'
  },
  classTextContainer: {
    flex: 1, // Takes up available space
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 14,
    color: '#666',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 16, // Space between text and button
  },
  filterButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  classSelector: {
    paddingVertical: 8,
    paddingHorizontal:16,
    backgroundColor: '#fff',
  },
  classButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '4f46e5',
  },
  selectedClassButton: {
    backgroundColor: '#4f46e5',
  },
  classButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedClassButtonText: {
    color: '#fff',
  },
  classInfo: {
    padding: 16,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
  },
  ViewPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    margin: 10,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '90%',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dateInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
  },
  dateRangeSeparator: {
    marginHorizontal: 8,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  scrollViewScrollbar: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryContainer: {
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dateRangeSeparator: {
    marginHorizontal: 8,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  resetButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#3f51b5',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  scrollViewScrollbar: {
    scrollbarWidth: 'thin',
    scrollbarColor: '#4f46e5 transparent',
    // For webkit browsers
    '&::-webkit-scrollbar': {
      width: 8,

    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#4f46e5',
  icon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  },
}});

export default AttendanceScreen;
