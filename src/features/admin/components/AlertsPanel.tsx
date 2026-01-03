import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SystemAlert } from '../types';

interface AlertsPanelProps {
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

const IconButton = ({ icon, size = 24, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[styles.iconButton, style]}
    onPress={onPress}
    {...props}
  >
    <MaterialIcons name={icon} size={size} color="#666" />
  </TouchableOpacity>
);

const Chip = ({ children, mode = 'outlined', onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[
      styles.chip,
      mode === 'flat' && styles.chipFlat,
      mode === 'outlined' && styles.chipOutlined,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    <Text style={[
      styles.chipText,
      mode === 'flat' && styles.chipTextFlat,
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const Button = ({ 
  mode = 'contained', 
  size = 'medium',
  onPress, 
  children, 
  style, 
  ...props 
}: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      mode === 'outlined' && styles.buttonOutlined,
      size === 'small' && styles.buttonSmall,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    <Text style={[
      styles.buttonText,
      mode === 'outlined' && styles.buttonTextOutlined,
      size === 'small' && styles.buttonTextSmall,
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const List = ({ children, style, ...props }: any) => (
  <View style={[styles.list, style]} {...props}>
    {children}
  </View>
);

const ListItem = ({ title, description, left, right, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[styles.listItem, style]}
    onPress={onPress}
    {...props}
  >
    {left && <View style={styles.listItemLeft}>{left}</View>}
    <View style={styles.listItemContent}>
      <Text style={styles.listItemTitle}>{title}</Text>
      {description && <Text style={styles.listItemDescription}>{description}</Text>}
    </View>
    {right && <View style={styles.listItemRight}>{right}</View>}
  </TouchableOpacity>
);

const Divider = ({ style, ...props }: any) => (
  <View style={[styles.divider, style]} {...props} />
);

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const getAlertPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#FF3B30';
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#007AFF';
      default:
        return '#666';
    }
  };

  const getAlertPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'check-circle';
      default:
        return 'help';
    }
  };

  const filters = [
    { id: 'all', label: 'All', count: data?.alerts?.length || 0 },
    { id: 'critical', label: 'Critical', count: data?.alerts?.filter((alert: any) => alert.priority === 'critical')?.length || 0 },
    { id: 'high', label: 'High', count: data?.alerts?.filter((alert: any) => alert.priority === 'high')?.length || 0 },
    { id: 'medium', label: 'Medium', count: data?.alerts?.filter((alert: any) => alert.priority === 'medium')?.length || 0 },
    { id: 'low', label: 'Low', count: data?.alerts?.filter((alert: any) => alert.priority === 'low')?.length || 0 },
  ];

  if (loading) {
    return (
      <Card style={styles.container}>
        <CardContent>
          <Text>Loading alerts...</Text>
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
            <View style={styles.headerLeft}>
              <Text style={styles.title}>System Alerts</Text>
              <Text style={styles.subtitle}>Important notifications and warnings</Text>
            </View>
            <View style={styles.headerRight}>
              <IconButton
                icon="notifications-off"
                size={24}
                onPress={() => {
                  // TODO: Implement mute notifications functionality
                  console.log('Mute notifications');
                }}
              />
              <IconButton
                icon="refresh"
                size={24}
                onPress={() => {
                  // TODO: Implement refresh functionality
                  console.log('Refresh alerts');
                }}
              />
            </View>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Alert Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="error" size={24} color="#FF3B30" />
              <Text style={styles.summaryCount}>
                {data?.alerts?.filter((alert: any) => alert.priority === 'critical')?.length || 0}
              </Text>
              <Text style={styles.summaryLabel}>Critical</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="warning" size={24} color="#FF9500" />
              <Text style={styles.summaryCount}>
                {data?.alerts?.filter((alert: any) => alert.priority === 'high')?.length || 0}
              </Text>
              <Text style={styles.summaryLabel}>High</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="info" size={24} color="#FF9500" />
              <Text style={styles.summaryCount}>
                {data?.alerts?.filter((alert: any) => alert.priority === 'medium')?.length || 0}
              </Text>
              <Text style={styles.summaryLabel}>Medium</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="check-circle" size={24} color="#007AFF" />
              <Text style={styles.summaryCount}>
                {data?.alerts?.filter((alert: any) => alert.priority === 'low')?.length || 0}
              </Text>
              <Text style={styles.summaryLabel}>Low</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardContent>
          <View style={styles.alertsHeader}>
            <Text style={styles.alertsTitle}>Recent Alerts</Text>
            <Button mode="outlined" size="small" onPress={() => {
              // TODO: Implement view all alerts functionality
              console.log('View all alerts');
            }}>
              View All
            </Button>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <View style={styles.filtersContainer}>
              {filters.map((filter) => (
                <Chip
                  key={filter.id}
                  mode={selectedFilter === filter.id ? 'flat' : 'outlined'}
                  onPress={() => setSelectedFilter(filter.id)}
                  style={styles.filterChip}
                >
                  {filter.label} ({filter.count})
                </Chip>
              ))}
            </View>
          </ScrollView>
          
          <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
            {data?.alerts?.map((alert: any, index: number) => (
              <View key={index} style={styles.alertItem}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertPriority}>
                    <MaterialIcons
                      name={getAlertPriorityIcon(alert.priority)}
                      size={20}
                      color={getAlertPriorityColor(alert.priority)}
                    />
                    <Chip
                      mode="flat"
                      style={[
                        styles.priorityChip,
                        { backgroundColor: getAlertPriorityColor(alert.priority) + '20' }
                      ]}
                    >
                      {alert.priority}
                    </Chip>
                  </View>
                  <Text style={styles.alertTime}>{alert.timestamp}</Text>
                </View>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                {index < data.alerts.length - 1 && <Divider style={styles.alertDivider} />}
              </View>
            ))}
          </ScrollView>
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
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  filtersScroll: {
    marginHorizontal: -16,
    marginBottom: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  alertsList: {
    maxHeight: 300,
  },
  alertItem: {
    paddingVertical: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertPriority: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityChip: {
    marginLeft: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  alertDivider: {
    marginTop: 12,
  },
  // Custom component styles
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipFlat: {
    backgroundColor: '#007AFF',
  },
  chipOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  chipTextFlat: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextOutlined: {
    color: '#007AFF',
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  list: {
    backgroundColor: '#fff',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemLeft: {
    marginRight: 16,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  listItemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  listItemRight: {
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
});

export default AlertsPanel; 
