import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SystemHealthPanelProps {
  data?: any;
  loading?: boolean;
  error?: string | null;
}

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

const ProgressBar = ({ progress, color = '#007AFF', style, ...props }: any) => (
  <View style={[styles.progressBarContainer, style]} {...props}>
    <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
  </View>
);

const Chip = ({ children, mode = 'flat', style, ...props }: any) => (
  <View style={[
    styles.chip,
    mode === 'flat' && styles.chipFlat,
    style,
  ]} {...props}>
    <Text style={styles.chipText}>{children}</Text>
  </View>
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

const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#007AFF';
      case 'warning':
        return '#FF9500';
      case 'critical':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'check-circle';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'help';
    }
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <CardContent>
          <Text>Loading system health data...</Text>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.container}>
        <CardContent>
          <Text style={styles.errorText}>Error: {error}</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.header}>
            <Text style={styles.title}>System Health</Text>
            <IconButton
              icon="refresh"
              size={24}
              onPress={() => {
                // TODO: Implement refresh functionality
                console.log('Refresh system health data');
              }}
            />
          </View>
          
          <View style={styles.overallStatus}>
            <View style={styles.statusIndicator}>
              <MaterialIcons
                name="check-circle"
                size={32}
                color="#007AFF"
              />
              <Text style={styles.statusText}>System Healthy</Text>
            </View>
            <Chip mode="flat" style={styles.statusChip}>
              All Systems Operational
            </Chip>
          </View>
        </CardContent>
      </Card>

      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <CardContent>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>CPU Usage</Text>
              <MaterialIcons name="memory" size={20} color="#007AFF" />
            </View>
            <Text style={styles.metricValue}>45%</Text>
            <ProgressBar
              progress={0.45}
              color="#007AFF"
              style={styles.progressBar}
            />
            <Text style={styles.metricStatus}>Normal</Text>
          </CardContent>
        </Card>

        <Card style={styles.metricCard}>
          <CardContent>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Memory Usage</Text>
              <MaterialIcons name="storage" size={20} color="#34C759" />
            </View>
            <Text style={styles.metricValue}>78%</Text>
            <ProgressBar
              progress={0.78}
              color="#FF9500"
              style={styles.progressBar}
            />
            <Text style={styles.metricStatus}>Warning</Text>
          </CardContent>
        </Card>

        <Card style={styles.metricCard}>
          <CardContent>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Disk Space</Text>
              <MaterialIcons name="hard-drive" size={20} color="#FF9500" />
            </View>
            <Text style={styles.metricValue}>32%</Text>
            <ProgressBar
              progress={0.32}
              color="#007AFF"
              style={styles.progressBar}
            />
            <Text style={styles.metricStatus}>Normal</Text>
          </CardContent>
        </Card>

        <Card style={styles.metricCard}>
          <CardContent>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Network</Text>
              <MaterialIcons name="wifi" size={20} color="#007AFF" />
            </View>
            <Text style={styles.metricValue}>95%</Text>
            <ProgressBar
              progress={0.95}
              color="#007AFF"
              style={styles.progressBar}
            />
            <Text style={styles.metricStatus}>Excellent</Text>
          </CardContent>
        </Card>
      </View>

      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Service Status</Text>
          <View style={styles.servicesList}>
            {[
              { name: 'Database', status: 'healthy', uptime: '99.9%' },
              { name: 'API Server', status: 'healthy', uptime: '99.8%' },
              { name: 'File Storage', status: 'healthy', uptime: '99.7%' },
              { name: 'Email Service', status: 'warning', uptime: '98.5%' },
              { name: 'Backup Service', status: 'healthy', uptime: '99.9%' },
            ].map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceUptime}>Uptime: {service.uptime}</Text>
                </View>
                <View style={styles.serviceStatus}>
                  <MaterialIcons
                    name={getStatusIcon(service.status)}
                    size={20}
                    color={getStatusColor(service.status)}
                  />
                  <Chip
                    mode="flat"
                    style={[styles.serviceChip, { backgroundColor: getStatusColor(service.status) + '20' }]}
                  >
                    {service.status}
                  </Chip>
                </View>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  overallStatus: {
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statusChip: {
    backgroundColor: '#E8F5E8',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressBar: {
    marginBottom: 8,
  },
  metricStatus: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  servicesList: {
    gap: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  serviceUptime: {
    fontSize: 12,
    color: '#666',
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  // Custom component styles
  chip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipFlat: {
    backgroundColor: '#f0f0f0',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  iconButton: {
    padding: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
});

export default SystemHealthPanel; 
