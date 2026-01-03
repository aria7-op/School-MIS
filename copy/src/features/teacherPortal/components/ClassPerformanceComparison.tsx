import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

interface ClassPerformanceComparisonProps {
  classes?: any[];
  selectedClass?: string | null;
  onClassSelect?: (classId: string) => void;
}

const ClassPerformanceComparison: React.FC<ClassPerformanceComparisonProps> = ({
  classes = [],
  selectedClass,
  onClassSelect,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'attendance' | 'grades' | 'completion'>('overall');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester'>('month');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');

  // Rich dummy data for class performance comparison
  const dummyClassData = useMemo(() => [
    {
      id: '1',
      name: 'Mathematics 101',
      teacher: 'Dr. Smith',
      students: 28,
      overallScore: 87.5,
      attendanceRate: 94.2,
      averageGrade: 82.3,
      completionRate: 89.7,
      trend: 'up',
      trendValue: 5.2,
      subjects: ['Algebra', 'Calculus', 'Statistics'],
      performanceHistory: [82, 84, 86, 85, 87, 89, 88, 90, 89, 91, 90, 92],
      monthlyData: [85, 87, 89, 88, 90, 87, 89, 92, 90, 93, 91, 94],
      weeklyData: [87, 88, 89, 90, 88, 91, 89],
      color: '#6366f1',
    },
    {
      id: '2',
      name: 'Physics 201',
      teacher: 'Prof. Johnson',
      students: 24,
      overallScore: 83.1,
      attendanceRate: 91.8,
      averageGrade: 79.6,
      completionRate: 85.4,
      trend: 'stable',
      trendValue: 0.8,
      subjects: ['Mechanics', 'Thermodynamics', 'Electromagnetism'],
      performanceHistory: [78, 79, 80, 79, 81, 82, 81, 83, 82, 84, 83, 85],
      monthlyData: [79, 81, 83, 82, 84, 81, 83, 86, 84, 87, 85, 88],
      weeklyData: [81, 82, 83, 84, 82, 85, 83],
      color: '#10b981',
    },
    {
      id: '3',
      name: 'English Literature',
      teacher: 'Ms. Davis',
      students: 32,
      overallScore: 89.7,
      attendanceRate: 96.1,
      averageGrade: 86.2,
      completionRate: 92.8,
      trend: 'up',
      trendValue: 3.4,
      subjects: ['Poetry', 'Novels', 'Drama'],
      performanceHistory: [84, 85, 86, 87, 88, 89, 88, 90, 89, 91, 90, 92],
      monthlyData: [86, 88, 90, 89, 91, 88, 90, 93, 91, 94, 92, 95],
      weeklyData: [88, 89, 90, 91, 89, 92, 90],
      color: '#f59e0b',
    },
    {
      id: '4',
      name: 'Computer Science',
      teacher: 'Dr. Wilson',
      students: 26,
      overallScore: 91.3,
      attendanceRate: 93.7,
      averageGrade: 88.9,
      completionRate: 94.2,
      trend: 'up',
      trendValue: 7.1,
      subjects: ['Programming', 'Data Structures', 'Algorithms'],
      performanceHistory: [85, 87, 89, 88, 90, 92, 91, 93, 92, 94, 93, 95],
      monthlyData: [87, 89, 91, 90, 92, 89, 91, 94, 92, 95, 93, 96],
      weeklyData: [89, 90, 91, 92, 90, 93, 91],
      color: '#ef4444',
    },
    {
      id: '5',
      name: 'History 101',
      teacher: 'Prof. Brown',
      students: 30,
      overallScore: 81.9,
      attendanceRate: 88.5,
      averageGrade: 77.3,
      completionRate: 83.1,
      trend: 'down',
      trendValue: -2.1,
      subjects: ['Ancient History', 'Medieval History', 'Modern History'],
      performanceHistory: [80, 81, 82, 81, 83, 82, 81, 80, 79, 78, 77, 76],
      monthlyData: [81, 83, 85, 84, 86, 83, 85, 88, 86, 89, 87, 90],
      weeklyData: [83, 84, 85, 86, 84, 87, 85],
      color: '#8b5cf6',
    },
  ], []);

  // Chart configurations
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#6366f1',
    },
  };

  const pieChartData = useMemo(() => {
    return dummyClassData.map((classItem, index) => ({
      name: classItem.name,
      population: classItem.overallScore,
      color: classItem.color,
      legendFontColor: '#374151',
      legendFontSize: 12,
    }));
  }, [dummyClassData]);

  const getMetricData = (metric: string) => {
    switch (metric) {
      case 'overall':
        return dummyClassData.map(c => c.overallScore);
      case 'attendance':
        return dummyClassData.map(c => c.attendanceRate);
      case 'grades':
        return dummyClassData.map(c => c.averageGrade);
      case 'completion':
        return dummyClassData.map(c => c.completionRate);
      default:
        return dummyClassData.map(c => c.overallScore);
    }
  };

  const getMetricLabels = () => {
    return dummyClassData.map(c => c.name.substring(0, 8) + '...');
  };

  const renderMetricSelector = () => (
    <View style={styles.metricSelector}>
      {['overall', 'attendance', 'grades', 'completion'].map((metric) => (
        <TouchableOpacity
          key={metric}
          style={[
            styles.metricButton,
            selectedMetric === metric && styles.metricButtonActive
          ]}
          onPress={() => setSelectedMetric(metric as any)}
        >
          <Text style={[
            styles.metricButtonText,
            selectedMetric === metric && styles.metricButtonTextActive
          ]}>
            {metric.charAt(0).toUpperCase() + metric.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {['week', 'month', 'semester'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period as any)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChartTypeSelector = () => (
    <View style={styles.chartTypeSelector}>
      {['line', 'bar', 'pie'].map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.chartTypeButton,
            chartType === type && styles.chartTypeButtonActive
          ]}
          onPress={() => setChartType(type as any)}
        >
          <MaterialIcons
            name={type === 'line' ? 'show-chart' : type === 'bar' ? 'bar-chart' : 'pie-chart'}
            size={20}
            color={chartType === type ? '#ffffff' : '#6366f1'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPerformanceChart = () => {
    const data = getMetricData(selectedMetric);
    const labels = getMetricLabels();

    // Simple test data to see if charts work
    const simpleTestData = {
      labels: ['A', 'B', 'C', 'D', 'E'],
      datasets: [
        {
          data: [20, 45, 28, 80, 99],
        },
      ],
    };

    if (chartType === 'pie') {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Class Performance Distribution</Text>
          <PieChart
            data={pieChartData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      );
    }

    const chartData = {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    if (chartType === 'line') {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Performance Trend</Text>
          <LineChart
            data={simpleTestData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Performance Comparison</Text>
        <BarChart
          data={simpleTestData}
          width={chartWidth}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix="%"
        />
      </View>
    );
  };

  const renderClassComparisonTable = () => (
    <View style={styles.tableContainer}>
      <Text style={styles.tableTitle}>Detailed Class Performance</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Class</Text>
        <Text style={styles.tableHeaderText}>Overall</Text>
        <Text style={styles.tableHeaderText}>Attendance</Text>
        <Text style={styles.tableHeaderText}>Grades</Text>
        <Text style={styles.tableHeaderText}>Trend</Text>
      </View>
      {dummyClassData.map((classItem) => (
        <TouchableOpacity
          key={classItem.id}
          style={[
            styles.tableRow,
            selectedClass === classItem.id && styles.tableRowSelected
          ]}
          onPress={() => onClassSelect?.(classItem.id)}
        >
          <View style={styles.classInfo}>
            <View style={[styles.classColor, { backgroundColor: classItem.color }]} />
            <Text style={styles.className}>{classItem.name}</Text>
          </View>
          <Text style={styles.tableCell}>{classItem.overallScore}%</Text>
          <Text style={styles.tableCell}>{classItem.attendanceRate}%</Text>
          <Text style={styles.tableCell}>{classItem.averageGrade}%</Text>
          <View style={styles.trendContainer}>
            <MaterialIcons
              name={classItem.trend === 'up' ? 'trending-up' : classItem.trend === 'down' ? 'trending-down' : 'trending-flat'}
              size={16}
              color={classItem.trend === 'up' ? '#10b981' : classItem.trend === 'down' ? '#ef4444' : '#6b7280'}
            />
            <Text style={[
              styles.trendText,
              { color: classItem.trend === 'up' ? '#10b981' : classItem.trend === 'down' ? '#ef4444' : '#6b7280' }
            ]}>
              {classItem.trendValue > 0 ? '+' : ''}{classItem.trendValue}%
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <MaterialIcons name="trending-up" size={24} color="#10b981" />
        <Text style={styles.summaryValue}>86.7%</Text>
        <Text style={styles.summaryLabel}>Average Performance</Text>
      </View>
      <View style={styles.summaryCard}>
        <MaterialIcons name="people" size={24} color="#6366f1" />
        <Text style={styles.summaryValue}>5</Text>
        <Text style={styles.summaryLabel}>Total Classes</Text>
      </View>
      <View style={styles.summaryCard}>
        <MaterialIcons name="check-circle" size={24} color="#f59e0b" />
        <Text style={styles.summaryValue}>92.8%</Text>
        <Text style={styles.summaryLabel}>Avg Attendance</Text>
      </View>
      <View style={styles.summaryCard}>
        <MaterialIcons name="grade" size={24} color="#ef4444" />
        <Text style={styles.summaryValue}>82.9%</Text>
        <Text style={styles.summaryLabel}>Avg Grades</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Class Performance Comparison</Text>
        <Text style={styles.subtitle}>Analyze and compare performance across all your classes</Text>
      </View>

      {renderSummaryCards()}
      {renderMetricSelector()}
      {renderPeriodSelector()}
      {renderChartTypeSelector()}
      {renderPerformanceChart()}
      {renderClassComparisonTable()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  metricSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  metricButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  metricButtonActive: {
    backgroundColor: '#6366f1',
  },
  metricButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  metricButtonTextActive: {
    color: '#ffffff',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  periodButtonActive: {
    backgroundColor: '#6366f1',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  chartTypeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chartTypeButtonActive: {
    backgroundColor: '#6366f1',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  tableRowSelected: {
    backgroundColor: '#f1f5f9',
  },
  classInfo: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  classColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  className: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  trendContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default ClassPerformanceComparison;
