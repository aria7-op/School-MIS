import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useStudentApi, StudentConversionAnalytics, StudentConversionStats } from '../hooks/useStudentApi';

const { width: screenWidth } = Dimensions.get('window');

interface StudentAnalyticsProps {
  students: any[];
}

const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ students }) => {
  const [analytics, setAnalytics] = useState<StudentConversionAnalytics | null>(null);
  const [stats, setStats] = useState<StudentConversionStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'conversions' | 'events'>('overview');
  const [loading, setLoading] = useState(false);

  const { colors } = useTheme();
  const { getStudentConversionAnalytics, getStudentConversionStats } = useStudentApi();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsData, statsData] = await Promise.all([
        getStudentConversionAnalytics('30d'),
        getStudentConversionStats()
      ]);
      setAnalytics(analyticsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (!analytics || !stats) return null;

    const chartData = {
      labels: analytics.conversionTrend.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [{
        data: analytics.conversionTrend.map(item => item.conversions)
      }]
    };

    const pieData = [
      {
        name: 'Converted',
        population: analytics.convertedStudents,
        color: '#4CAF50',
        legendFontColor: colors.text,
      },
      {
        name: 'Direct',
        population: analytics.directStudents,
        color: '#2196F3',
        legendFontColor: colors.text,
      }
    ];

    return (
      <ScrollView style={styles.container}>
        <View style={[styles.statsGrid, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats.totalStudents}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
              Total Students
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {stats.convertedFromCustomers}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
              From Visitors
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#2196F3' }]}>
              {stats.directEnrollments}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
              Direct Enrollments
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats.conversionRate.toFixed(1)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
              Conversion Rate
            </Text>
          </View>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Student Conversion Trend (30 Days)
          </Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: colors.card,
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.text + '80',
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Student Distribution
          </Text>
          <PieChart
            data={pieData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => colors.text,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>
      </ScrollView>
    );
  };

  const renderConversions = () => (
    <ScrollView style={styles.container}>
      <View style={[styles.conversionStats, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Monthly Conversions: {stats?.monthlyConversions || 0}
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Yearly Conversions: {stats?.yearlyConversions || 0}
        </Text>
      </View>
    </ScrollView>
  );

  const renderEvents = () => (
    <ScrollView style={styles.container}>
      {analytics?.conversionEvents.map((event, index) => (
        <View key={index} style={[styles.eventItem, { backgroundColor: colors.card }]}>
          <View style={styles.eventHeader}>
            <Text style={[styles.eventType, { color: colors.primary }]}>
              {event.eventType}
            </Text>
            <Text style={[styles.eventDate, { color: colors.text + '60' }]}>
              {new Date(event.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text style={[styles.eventTitle, { color: colors.text }]}>
            {event.title}
          </Text>
          <Text style={[styles.eventDescription, { color: colors.text + '80' }]}>
            {event.description}
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && { color: 'white' }]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'conversions' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('conversions')}
        >
          <Text style={[styles.tabText, activeTab === 'conversions' && { color: 'white' }]}>
            Conversions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && { color: 'white' }]}>
            Events
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'conversions' && renderConversions()}
      {activeTab === 'events' && renderEvents()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartContainer: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  conversionStats: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  eventItem: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventDate: {
    fontSize: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
  },
});

export default StudentAnalytics; 