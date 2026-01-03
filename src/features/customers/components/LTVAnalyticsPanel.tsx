import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, useTheme, Button, IconButton, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const LTVAnalyticsPanel: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  // Mock data for LTV analytics
  const ltvData = {
    averageLTV: 2450,
    totalLTV: 2450000,
    topSegment: 'Premium',
    growthRate: 12.5,
    customerCount: 1000,
    segments: [
      { name: 'Premium', ltv: 5000, count: 200 },
      { name: 'Standard', ltv: 2000, count: 500 },
      { name: 'Basic', ltv: 800, count: 300 },
    ],
    monthlyData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [1800, 2100, 1950, 2300, 2450, 2600],
    },
    forecastData: {
      labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      data: [2700, 2850, 3000, 3150, 3300, 3450],
    },
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading LTV analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall">LTV Analytics</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Customer Lifetime Value Analysis and Forecasting
          </Text>
        </Card.Content>
      </Card>

      <ScrollView style={styles.content}>
        {/* Key Metrics */}
        <Card style={styles.metricsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Key Metrics
            </Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  ${ltvData.averageLTV}
                </Text>
                <Text variant="bodySmall">Average LTV</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  ${(ltvData.totalLTV / 1000000).toFixed(1)}M
                </Text>
                <Text variant="bodySmall">Total LTV</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.secondary }}>
                  {ltvData.growthRate}%
                </Text>
                <Text variant="bodySmall">Growth Rate</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.tertiary }}>
                  {ltvData.customerCount}
                </Text>
                <Text variant="bodySmall">Customers</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* LTV Trends */}
        <Card style={styles.trendsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              LTV Trends (Last 6 Months)
            </Text>
            
            <LineChart
              data={{
                labels: ltvData.monthlyData.labels,
                datasets: [{
                  data: ltvData.monthlyData.data
                }]
              }}
              width={width - 80}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                style: {
                  borderRadius: 16
                }
              }}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* LTV Forecast */}
        <Card style={styles.forecastCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              LTV Forecast (Next 6 Months)
            </Text>
            
            <LineChart
              data={{
                labels: ltvData.forecastData.labels,
                datasets: [{
                  data: ltvData.forecastData.data
                }]
              }}
              width={width - 80}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                style: {
                  borderRadius: 16
                }
              }}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Customer Segments */}
        <Card style={styles.segmentsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              LTV by Customer Segment
            </Text>
            
            <View style={styles.segmentsList}>
              {ltvData.segments.map((segment, index) => (
                <Card key={index} style={styles.segmentCard}>
                  <Card.Content>
                    <View style={styles.segmentHeader}>
                      <Text variant="titleSmall">{segment.name}</Text>
                      <Chip mode="outlined">
                        {segment.count} customers
                      </Chip>
                    </View>
                    <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                      ${segment.ltv}
                    </Text>
                    <Text variant="bodySmall">Average LTV</Text>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Insights */}
        <Card style={styles.insightsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Key Insights
            </Text>
            
            <View style={styles.insightsList}>
              <View style={styles.insightItem}>
                <MaterialIcons name="trending-up" size={24} color={theme.colors.primary} />
                <Text variant="bodyMedium">
                  LTV has increased by {ltvData.growthRate}% over the last 6 months
                </Text>
              </View>
              
              <View style={styles.insightItem}>
                <MaterialIcons name="star" size={24} color={theme.colors.primary} />
                <Text variant="bodyMedium">
                  Premium customers contribute {((ltvData.segments[0].ltv * ltvData.segments[0].count) / ltvData.totalLTV * 100).toFixed(1)}% of total LTV
                </Text>
              </View>
              
              <View style={styles.insightItem}>
                <MaterialIcons name="visibility" size={24} color={theme.colors.primary} />
                <Text variant="bodyMedium">
                  Forecast predicts {((ltvData.forecastData.data[5] - ltvData.monthlyData.data[5]) / ltvData.monthlyData.data[5] * 100).toFixed(1)}% growth by year-end
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Recommendations */}
        <Card style={styles.recommendationsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Recommendations
            </Text>
            
            <View style={styles.recommendationsList}>
              <Card style={styles.recommendationCard}>
                <Card.Content>
                  <Text variant="titleSmall">Focus on Premium Segment</Text>
                  <Text variant="bodySmall">
                    Premium customers show highest LTV. Consider targeted marketing campaigns.
                  </Text>
                </Card.Content>
              </Card>
              
              <Card style={styles.recommendationCard}>
                <Card.Content>
                  <Text variant="titleSmall">Improve Basic Segment</Text>
                  <Text variant="bodySmall">
                    Basic customers have lowest LTV. Implement upselling strategies.
                  </Text>
                </Card.Content>
              </Card>
              
              <Card style={styles.recommendationCard}>
                <Card.Content>
                  <Text variant="titleSmall">Retention Programs</Text>
                  <Text variant="bodySmall">
                    Implement loyalty programs to increase customer retention and LTV.
                  </Text>
                </Card.Content>
              </Card>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    elevation: 2,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  metricsCard: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  trendsCard: {
    margin: 16,
    elevation: 2,
  },
  forecastCard: {
    margin: 16,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  segmentsCard: {
    margin: 16,
    elevation: 2,
  },
  segmentsList: {
    gap: 8,
  },
  segmentCard: {
    marginBottom: 8,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightsCard: {
    margin: 16,
    elevation: 2,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recommendationsCard: {
    margin: 16,
    elevation: 2,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationCard: {
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LTVAnalyticsPanel; 
