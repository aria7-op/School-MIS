import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useSystemMetrics } from '../hooks/useSystemMetrics';

interface MetricThreshold {
  warning: number;
  critical: number;
  unit: string;
}

interface SystemMetric {
  id: string;
  label: string;
  value: number;
  history: number[];
  threshold: MetricThreshold;
  status: 'healthy' | 'warning' | 'critical';
  icon: string;
  description: string;
  recommendations: string[];
}

// Custom styled components
const Card = ({ children, style, onPress, ...props }: any) => (
  <TouchableOpacity
    style={[styles.card, style]}
    onPress={onPress}
    activeOpacity={0.7}
    {...props}
  >
    {children}
  </TouchableOpacity>
);

const CardContent = ({ children, style, ...props }: any) => (
  <View style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
);

const Button = ({ children, mode = 'contained', onPress, style, ...props }: any) => (
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

const ProgressBar = ({ progress, color = '#007AFF', style, ...props }: any) => (
  <View style={[styles.progressBarContainer, style]} {...props}>
    <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
  </View>
);

const Divider = ({ style, ...props }: any) => (
  <View style={[styles.divider, style]} {...props} />
);

const SystemHealth: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<SystemMetric | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    metrics,
    loading,
    error,
    refreshMetrics,
    clearCache,
    performBackup,
    optimizeSystem
  } = useSystemMetrics();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(refreshMetrics, 60000); // Refresh every minute
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refreshMetrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#007AFF';
      case 'warning':
        return '#FF9800';
      case 'critical':
        return '#F44336';
      default:
        return '#007AFF';
    }
  };

  const getMetricProgress = (metric: SystemMetric) => {
    const { value, threshold } = metric;
    return value / threshold.critical;
  };

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const renderMetricCard = (metric: SystemMetric) => (
    <Card
      key={metric.id}
      style={[styles.metricCard, { borderLeftColor: getStatusColor(metric.status) }]}
      onPress={() => {
        setSelectedMetric(metric);
        setShowModal(true);
      }}
    >
      <CardContent>
        <View style={styles.metricHeader}>
          <MaterialIcons name={metric.icon} size={24} color={getStatusColor(metric.status)} />
          <View style={styles.statusIndicator}>
            <View
              style={[styles.statusDot, { backgroundColor: getStatusColor(metric.status) }]}
            />
          </View>
        </View>

        <Text style={styles.metricLabel}>{metric.label}</Text>
        <Text style={styles.metricValue}>
          {metric.value.toFixed(1)}{metric.threshold.unit}
        </Text>

        <ProgressBar
          progress={getMetricProgress(metric)}
          color={getStatusColor(metric.status)}
          style={styles.progressBar}
        />

        <Text style={styles.metricDescription}>
          {metric.description}
        </Text>
      </CardContent>
    </Card>
  );

  const renderDetailedChart = (metric: SystemMetric) => {
    const screenWidth = Dimensions.get('window').width - 40;
    const chartHeight = 220;

    const data = {
      labels: ['0h', '6h', '12h', '18h', '24h'],
      datasets: [{
        data: metric.history,
        color: (opacity = 1) => getStatusColor(metric.status),
        strokeWidth: 2
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={data}
          width={screenWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderMetricModal = () => {
    if (!selectedMetric) return null;

    return (
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedMetric.label}</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowModal(false)}
              />
            </View>

            <View style={styles.modalMetrics}>
              <View style={styles.metricDetail}>
                <Text style={styles.metricDetailLabel}>Current</Text>
                <Text style={styles.metricDetailValue}>
                  {selectedMetric.value.toFixed(1)}{selectedMetric.threshold.unit}
                </Text>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.metricDetail}>
                <Text style={styles.metricDetailLabel}>Status</Text>
                <Text
                  style={[
                    styles.metricDetailValue,
                    { color: getStatusColor(selectedMetric.status) }
                  ]}
                >
                  {selectedMetric.status.charAt(0).toUpperCase() + selectedMetric.status.slice(1)}
                </Text>
              </View>
            </View>

            {renderDetailedChart(selectedMetric)}

            <View style={styles.recommendationsSection}>
              <Text style={styles.recommendationsTitle}>Recommendations</Text>
              {selectedMetric.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <MaterialIcons name="lightbulb" size={20} color="#FF9800" style={styles.recommendationIcon} />
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowModal(false);
                  // Handle optimize action
                }}
                style={styles.modalButton}
              >
                Optimize
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  setShowModal(false);
                  // Handle fix action
                }}
                style={styles.modalButton}
              >
                Fix Issues
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Mock data for demonstration
  const mockMetrics: SystemMetric[] = [
    {
      id: 'cpu',
      label: 'CPU Usage',
      value: 65,
      history: [45, 52, 58, 62, 65],
      threshold: { warning: 70, critical: 90, unit: '%' },
      status: 'healthy',
      icon: 'memory',
      description: 'Current CPU utilization',
      recommendations: ['Monitor CPU usage trends', 'Consider load balancing if usage increases']
    },
    {
      id: 'memory',
      label: 'Memory Usage',
      value: 78,
      history: [60, 65, 70, 75, 78],
      threshold: { warning: 80, critical: 95, unit: '%' },
      status: 'warning',
      icon: 'storage',
      description: 'RAM utilization',
      recommendations: ['Close unnecessary applications', 'Consider increasing RAM']
    },
    {
      id: 'disk',
      label: 'Disk Usage',
      value: 85,
      history: [70, 75, 80, 83, 85],
      threshold: { warning: 85, critical: 95, unit: '%' },
      status: 'warning',
      icon: 'hard-drive',
      description: 'Storage space usage',
      recommendations: ['Clean up temporary files', 'Archive old data']
    },
    {
      id: 'network',
      label: 'Network',
      value: 45,
      history: [30, 35, 40, 42, 45],
      threshold: { warning: 80, critical: 95, unit: '%' },
      status: 'healthy',
      icon: 'wifi',
      description: 'Network bandwidth usage',
      recommendations: ['Monitor network traffic', 'Optimize data transfer']
    }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading system health...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Health</Text>
        <View style={styles.headerActions}>
          <IconButton
            icon="refresh"
            onPress={refreshMetrics}
            style={styles.headerButton}
          />
          <IconButton
            icon="settings"
            onPress={() => {
              // TODO: Implement settings functionality
              console.log('Open system settings');
            }}
            style={styles.headerButton}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.metricsGrid}>
          {mockMetrics.map(renderMetricCard)}
        </View>
      </ScrollView>

      {renderMetricModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusIndicator: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    marginBottom: 8,
  },
  metricDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Custom component styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
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
  progressBarContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
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
    borderRadius: 12,
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
  modalMetrics: {
    flexDirection: 'row',
    padding: 16,
  },
  metricDetail: {
    flex: 1,
    alignItems: 'center',
  },
  metricDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricDetailValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  chartContainer: {
    padding: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recommendationsSection: {
    padding: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationIcon: {
    marginRight: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default SystemHealth;
