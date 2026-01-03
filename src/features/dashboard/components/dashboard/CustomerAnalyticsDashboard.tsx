import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RefreshControl } from 'react-native';
import Tooltip from '../../../../../components/ui/Tooltip';
import { useTranslation } from '../../../../contexts/TranslationContext';

type Customer = {
  id: number;
  serial_number: string;
  name: string;
  purpose: string;
  gender: string;
  mobile: string;
  created_at: string;
  department: string;
};

type TimeRange = 'day' | 'week' | 'month' | 'year' | 'custom';

interface CustomerAnalyticsDashboardProps {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}

const CustomerAnalyticsDashboard: React.FC<CustomerAnalyticsDashboardProps> = ({ customers, loading, error, refreshing, onRefresh }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width - 32;
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFilter, setDateFilter] = useState<{start: Date, end: Date}>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date()
  });

  // Apply time range filter to customers
  const filterCustomersByTimeRange = useCallback((data: Customer[]) => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        startDate = dateFilter.start;
        now.setTime(dateFilter.end.getTime());
        break;
    }

    return data.filter(customer => {
      const customerDate = new Date(customer.created_at);
      return customerDate >= startDate && customerDate <= now;
    });
  }, [timeRange, dateFilter]);

  // Process data for charts
  const processCustomerData = useCallback(() => {
    const filteredCustomers = filterCustomersByTimeRange(customers);
    if (filteredCustomers.length === 0) return null;

    // Process department data
    const departmentCount = filteredCustomers.reduce((acc, customer) => {
      const dept = customer.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const departmentData = Object.entries(departmentCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        color: getRandomColor(),
        legendFontColor: colors.text,
        legendFontSize: 12
      }));

    // Process gender data
    const genderCount = filteredCustomers.reduce((acc, customer) => {
      const gender = customer.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const genderData = Object.entries(genderCount).map(([name, value]) => ({
      name,
      value,
      color: name.toLowerCase() === 'male' ? '#3B82F6' : '#EC4899',
      legendFontColor: colors.text,
      legendFontSize: 12
    }));

    // Process purpose data
    const purposeCount = filteredCustomers.reduce((acc, customer) => {
      const purpose = customer.purpose || 'Unknown';
      acc[purpose] = (acc[purpose] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const purposeData = Object.entries(purposeCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        color: getRandomColor(),
        legendFontColor: colors.text,
        legendFontSize: 12
      }));

    // Process daily/weekly/monthly data based on time range
    let timeData: {labels: string[], datasets: {data: number[]}[]} = { labels: [], datasets: [{ data: [] }] };
    
    if (timeRange === 'day') {
      // Hourly data for day view
      const hourlyCount = Array(24).fill(0);
      filteredCustomers.forEach(customer => {
        try {
          const date = new Date(customer.created_at);
          const hour = date.getHours();
          hourlyCount[hour]++;
        } catch (e) {
          
        }
      });
      
      timeData.labels = Array.from({length: 24}, (_, i) => `${i}:00`);
      timeData.datasets[0].data = hourlyCount;
    } 
    else if (timeRange === 'week') {
      // Daily data for week view
      const dailyCount = Array(7).fill(0);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      filteredCustomers.forEach(customer => {
        try {
          const date = new Date(customer.created_at);
          const day = date.getDay(); // 0 (Sunday) to 6 (Saturday)
          dailyCount[day]++;
        } catch (e) {
          
        }
      });
      
      timeData.labels = dayNames;
      timeData.datasets[0].data = dailyCount;
    }
    else {
      // Monthly data for month/year view
      const monthlyCount = filteredCustomers.reduce((acc, customer) => {
        try {
          const date = new Date(customer.created_at);
          const month = date.toLocaleString('default', { month: 'short' });
          const year = date.getFullYear();
          const key = timeRange === 'year' ? `${month} ${year}` : month;
          acc[key] = (acc[key] || 0) + 1;
        } catch (e) {
          
        }
        return acc;
      }, {} as Record<string, number>);

      // Sort chronologically
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const sortedData = Object.entries(monthlyCount)
        .sort((a, b) => {
          if (timeRange === 'year') {
            const [aMonth, aYear] = a[0].split(' ');
            const [bMonth, bYear] = b[0].split(' ');
            return parseInt(aYear) - parseInt(bYear) || months.indexOf(aMonth) - months.indexOf(bMonth);
          }
          return months.indexOf(a[0]) - months.indexOf(b[0]);
        });

      timeData.labels = sortedData.map(([month]) => month);
      timeData.datasets[0].data = sortedData.map(([_, count]) => count);
    }

    // Calculate average per day
    const daysInRange = timeRange === 'day' ? 1 : 
                       timeRange === 'week' ? 7 : 
                       timeRange === 'month' ? 30 : 
                       timeRange === 'year' ? 365 : 
                       Math.ceil((dateFilter.end.getTime() - dateFilter.start.getTime()) / (1000 * 60 * 60 * 24));
    const averagePerDay = filteredCustomers.length / daysInRange;

    return {
      departmentData,
      genderData,
      purposeData,
      timeData,
      total: filteredCustomers.length,
      averagePerDay: averagePerDay.toFixed(1)
    };
  }, [customers, timeRange, filterCustomersByTimeRange, colors.text, dateFilter]);

  const getRandomColor = () => {
    const colors = [
      '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#6366F1', 
      '#EF4444', '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4',
      '#84CC16', '#F43F5E', '#0EA5E9', '#A855F7', '#EAB308'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${colors.text === '#000000' ? '0,0,0' : '255,255,255'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${colors.text === '#000000' ? '0,0,0' : '255,255,255'}, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.primary
    },
    fillShadowGradient: colors.primary,
    fillShadowGradientOpacity: 0.3,
    barPercentage: timeRange === 'day' ? 0.6 : 0.8,
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: colors.border,
      strokeDasharray: "0"
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date, type: 'start' | 'end' = 'start') => {
    if (selectedDate) {
      setDateFilter(prev => ({
        ...prev,
        [type]: selectedDate
      }));
    }
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const processedData = processCustomerData();

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.errorText, { color: colors.notification }]}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Text style={[styles.refreshText, { color: colors.primary }]}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (customers.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('no_customer_data')}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Text style={[styles.refreshText, { color: colors.primary }]}>{t('refresh')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('customer_analytics')}</Text>
        
        <View style={styles.filterContainer}>
    <View style={styles.pickerWrapper}>
  <MaterialIcons name="access-time" size={20} color={colors.text} style={styles.leftIcon} />

  <Picker
    selectedValue={timeRange}
    onValueChange={(itemValue) => {
      setTimeRange(itemValue);
      if (itemValue !== 'custom') {
        setShowDatePicker(false);
      }
    }}
    style={[styles.picker, { color: colors.text, backgroundColor: colors.background }]}
    dropdownIconColor={colors.text}
  >
    <Picker.Item label={t('last_24_hours')} value="day" />
    <Picker.Item label={t('last_week')} value="week" />
    <Picker.Item label={t('last_month')} value="month" />
    <Picker.Item label={t('last_year')} value="year" />
    <Picker.Item label={t('custom_range')} value="custom" />
  </Picker>
</View>

          {timeRange === 'custom' && (
            <View style={styles.datePickerContainer}>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                style={[styles.dateButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.dateButtonText}>{t('select_dates')}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <View style={styles.datePickerWrapper}>
                  <Text style={[styles.dateLabel, { color: colors.text }]}>{t('start_date')}</Text>
                  <DateTimePicker
                    value={dateFilter.start}
                    mode="date"
                    display="default"
                    onChange={(event, date) => handleDateChange(event, date, 'start')}
                    maximumDate={new Date()}
                  />

                  <Text style={[styles.dateLabel, { color: colors.text, marginTop: 10 }]}>{t('end_date')}</Text>
                  <DateTimePicker
                    value={dateFilter.end}
                    mode="date"
                    display="default"
                    onChange={(event, date) => handleDateChange(event, date, 'end')}
                    maximumDate={new Date()}
                    minimumDate={dateFilter.start}
                  />
                </View>
              )}
            </View>
          )}
        </View>

        {processedData && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{processedData.total}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>{t('total')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{processedData.averagePerDay}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>{t('avg_per_day')}</Text>
            </View>
          </View>
        )}
      </View>

      {processedData && (
        <>
          {/* Time-based Customer Growth */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              {timeRange === 'day' ? t('hourly_customers') : 
               timeRange === 'week' ? t('daily_customers') : 
               timeRange === 'month' ? t('monthly_customers') : 
               t('customer_growth')}
            </Text>
            {processedData.timeData.labels.length > 0 ? (
              <BarChart
                data={processedData.timeData}
                width={screenWidth}
                height={timeRange === 'day' ? 300 : 250}
                chartConfig={{
                  ...chartConfig,
                  barColors: processedData.timeData.labels.map(() => colors.primary)
                }}
                verticalLabelRotation={timeRange === 'day' ? 90 : 45}
                fromZero
                showBarTops={false}
                withCustomBarColorFromData={true}
                flatColor={true}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                  marginLeft: timeRange === 'day' ? -40 : 0
                }}
                yAxisSuffix=""
                yAxisInterval={1}
              />
            ) : (
              <Text style={[styles.errorText, { color: colors.text }]}>
                {t('no_data_for_time_range')}
              </Text>
            )}
          </View>

          <View style={styles.row}>
            {/* Customer by Department */}
            <View style={[styles.halfCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>{t('by_department')}</Text>
              {processedData.departmentData.length > 0 ? (
                <PieChart
                  data={processedData.departmentData}
                  width={(screenWidth / 2 - 24)*0.50}
                  height={180}
                  chartConfig={chartConfig}
                  accessor="value"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  // hasLegend={processedData.departmentData.length <= 5}
                />
              ) : (
                <Text style={[styles.noDataText, { color: colors.text }]}>{t('no_department_data')}</Text>
              )}
            </View>

            {/* Customer by Gender */}
          <View style={[styles.halfCard, { backgroundColor: colors.card }]}>
  <Text style={[styles.chartTitle, { color: colors.text }]}>{t('by_gender')}</Text>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={{ flex: 1 }}>
      <PieChart
        data={processedData.genderData}
        width={(screenWidth / 2 - 24)*0.50}  
        height={180}
        chartConfig={chartConfig}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
        hasLegend={false}
      />
    </View>

    <View style={{ flex: 1, paddingLeft: 2 }}>
      {processedData.genderData.map((item, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: item.color,
              marginRight: 6,
            }}
          />
          <Text style={{ color: colors.text, fontSize: 13 }}>
            {item.value} {item.name}
          </Text>
        </View>
      ))}
    </View>
  </View>
</View>

          </View>

          {/* Customer by Purpose */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>{t('by_purpose')}</Text>
            {processedData.purposeData.length > 0 ? (
              <PieChart
                data={processedData.purposeData}
                width={screenWidth * 0.30}
                height={180}
                chartConfig={chartConfig}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend={processedData.purposeData.length <= 8}
              />
            ) : (
              <Text style={[styles.noDataText, { color: colors.text }]}>{t('no_purpose_data')}</Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#ddd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  halfCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 40,
  },
  filterContainer: {
    marginBottom: 16,
  },
pickerWrapper: {
  flexDirection: 'row',
  alignItems: 'center',
  width: '30%',
  borderWidth: 1,
  borderColor: '#E0E0E0',
  borderRadius: 12,
  backgroundColor: '#F9FAFB',
  paddingHorizontal: 10,
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
  marginVertical: 10,
},
leftIcon: {
  marginRight: 8,
},
picker: {
  flex: 1,
  height: 45,
  backgroundColor: 'transparent', 
  color: '#333', 
  border:'none',
},
  datePickerContainer: {
    marginTop: 10,
  },
  dateButton: {
    backgroundColor: '#4A90E2',   
    width:'30%',  
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, 
  },
  dateButtonText: {
     color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerWrapper: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  refreshButton: {
    marginTop: 20,
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  refreshText: {
    fontWeight: 'bold',
  },
});

export default CustomerAnalyticsDashboard;
