import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, useTheme, Button, IconButton, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const ConversionAnalyticsPanel: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  // Mock conversion data
  const conversionData = {
    overallRate: 15.8,
    totalLeads: 1250,
    totalConversions: 198,
    averageTimeToConvert: 14.5,
    funnelStages: [
      { stage: 'Awareness', count: 1250, rate: 100 },
      { stage: 'Interest', count: 750, rate: 60 },
      { stage: 'Consideration', count: 450, rate: 36 },
      { stage: 'Intent', count: 280, rate: 22.4 },
      { stage: 'Purchase', count: 198, rate: 15.8 },
    ],
    sourceData: [
      { source: 'Organic Search', conversions: 45, rate: 18.2 },
      { source: 'Social Media', conversions: 38, rate: 15.3 },
      { source: 'Email Marketing', conversions: 52, rate: 21.0 },
      { source: 'Direct Traffic', conversions: 35, rate: 14.1 },
      { source: 'Referrals', conversions: 28, rate: 11.3 },
    ],
    monthlyTrends: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [12.5, 13.2, 14.1, 15.3, 15.8, 16.2],
    },
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading conversion analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall">Conversion Analytics</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Track and optimize customer conversion performance
          </Text>
        </Card.Content>
      </Card>

      <ScrollView style={styles.content}>
        {/* Key Metrics */}
        <Card style={styles.metricsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Conversion Metrics
            </Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  {conversionData.overallRate}%
                </Text>
                <Text variant="bodySmall">Overall Rate</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  {conversionData.totalConversions}
                </Text>
                <Text variant="bodySmall">Conversions</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.secondary }}>
                  {conversionData.averageTimeToConvert} days
                </Text>
                <Text variant="bodySmall">Avg Time</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.tertiary }}>
                  {conversionData.totalLeads}
                </Text>
                <Text variant="bodySmall">Total Leads</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Conversion Funnel */}
        <Card style={styles.funnelCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Conversion Funnel
            </Text>
            
            <View style={styles.funnelStages}>
              {conversionData.funnelStages.map((stage, index) => (
                <View key={index} style={styles.funnelStage}>
                  <View style={styles.stageHeader}>
                    <Text variant="titleSmall">{stage.stage}</Text>
                    <Text variant="bodySmall">{stage.count} leads</Text>
                  </View>
                  <View style={styles.stageProgress}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: `${stage.rate}%`,
                          backgroundColor: theme.colors.primary 
                        }
                      ]} 
                    />
                  </View>
                  <Text variant="bodySmall" style={styles.stageRate}>
                    {stage.rate}% conversion rate
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Conversion Trends */}
        <Card style={styles.trendsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Conversion Rate Trends
            </Text>
            
            <LineChart
              data={{
                labels: conversionData.monthlyTrends.labels,
                datasets: [{
                  data: conversionData.monthlyTrends.data
                }]
              }}
              width={width - 80}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 1,
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

        {/* Source Performance */}
        <Card style={styles.sourcesCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Conversion by Source
            </Text>
            
            <View style={styles.sourcesList}>
              {conversionData.sourceData.map((source, index) => (
                <Card key={index} style={styles.sourceCard}>
                  <Card.Content>
                    <View style={styles.sourceHeader}>
                      <Text variant="titleSmall">{source.source}</Text>
                      <Chip mode="outlined">
                        {source.conversions} conversions
                      </Chip>
                    </View>
                    <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                      {source.rate}%
                    </Text>
                    <Text variant="bodySmall">Conversion Rate</Text>
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
                  Conversion rate has improved by 2.3% over the last 6 months
                </Text>
              </View>
              
              <View style={styles.insightItem}>
                <MaterialIcons name="email" size={24} color={theme.colors.primary} />
                <Text variant="bodyMedium">
                  Email marketing shows highest conversion rate at 21%
                </Text>
              </View>
              
              <View style={styles.insightItem}>
                <MaterialIcons name="schedule" size={24} color={theme.colors.primary} />
                <Text variant="bodyMedium">
                  Average time to convert is 14.5 days
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Optimization Recommendations */}
        <Card style={styles.recommendationsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Optimization Recommendations
            </Text>
            
            <View style={styles.recommendationsList}>
              <Card style={styles.recommendationCard}>
                <Card.Content>
                  <Text variant="titleSmall">Improve Email Marketing</Text>
                  <Text variant="bodySmall">
                    Email shows highest conversion. Focus on email campaign optimization.
                  </Text>
                </Card.Content>
              </Card>
              
              <Card style={styles.recommendationCard}>
                <Card.Content>
                  <Text variant="titleSmall">Reduce Funnel Drop-off</Text>
                  <Text variant="bodySmall">
                    High drop-off between Interest and Consideration stages.
                  </Text>
                </Card.Content>
              </Card>
              
              <Card style={styles.recommendationCard}>
                <Card.Content>
                  <Text variant="titleSmall">Optimize Referral Program</Text>
                  <Text variant="bodySmall">
                    Referrals show lowest conversion rate. Improve referral incentives.
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
  funnelCard: {
    margin: 16,
    elevation: 2,
  },
  funnelStages: {
    gap: 16,
  },
  funnelStage: {
    marginBottom: 12,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stageProgress: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  stageRate: {
    marginTop: 4,
    opacity: 0.7,
  },
  trendsCard: {
    margin: 16,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  sourcesCard: {
    margin: 16,
    elevation: 2,
  },
  sourcesList: {
    gap: 8,
  },
  sourceCard: {
    marginBottom: 8,
  },
  sourceHeader: {
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

export default ConversionAnalyticsPanel; 
