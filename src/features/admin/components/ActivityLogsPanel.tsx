import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityLog } from '../types';

interface ActivityLogsPanelProps {
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

const Button = ({ children, mode = 'contained', size = 'medium', onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      mode === 'contained' && styles.buttonContained,
      mode === 'outlined' && styles.buttonOutlined,
      size === 'small' && styles.buttonSmall,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    <Text style={[
      styles.buttonText,
      mode === 'contained' && styles.buttonTextContained,
      mode === 'outlined' && styles.buttonTextOutlined,
      size === 'small' && styles.buttonTextSmall,
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

const Chip = ({ children, mode = 'outlined', textStyle, style, ...props }: any) => (
  <View
    style={[
      styles.chip,
      mode === 'outlined' && styles.chipOutlined,
      mode === 'flat' && styles.chipFlat,
      style,
    ]}
    {...props}
  >
    <Text style={[
      styles.chipText,
      textStyle,
      mode === 'flat' && styles.chipTextFlat,
    ]}>
      {children}
    </Text>
  </View>
);

const Avatar = ({ size = 40, label, style, ...props }: any) => (
  <View style={[
    styles.avatar,
    { width: size, height: size, borderRadius: size / 2 },
    style,
  ]} {...props}>
    <Text style={[
      styles.avatarText,
      { fontSize: size * 0.4 },
    ]}>
      {label}
    </Text>
  </View>
);

const Searchbar = ({ placeholder, value, onChangeText, style, ...props }: any) => (
  <View style={[styles.searchbarContainer, style]}>
    <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
    <TextInput
      style={styles.searchbarInput}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

const Divider = ({ style, ...props }: any) => (
  <View style={[styles.divider, style]} {...props} />
);

const ActivityLogsPanel: React.FC<ActivityLogsPanelProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const getActionIcon = (action: string) => {
    const actionMap: Record<string, string> = {
      create: 'add',
      update: 'edit',
      delete: 'delete',
      login: 'login',
      logout: 'logout',
      export: 'download',
      import: 'upload',
      backup: 'backup-restore',
      restore: 'restore',
      default: 'info',
    };

    return actionMap[action.toLowerCase()] || actionMap.default;
  };

  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      create: '#4CAF50',
      update: '#2196F3',
      delete: '#F44336',
      login: '#4CAF50',
      logout: '#FF9800',
      export: '#9C27B0',
      import: '#607D8B',
      backup: '#FF9800',
      restore: '#4CAF50',
      default: '#007AFF',
    };

    return colorMap[action.toLowerCase()] || colorMap.default;
  };

  const getStatusColor = (status: ActivityLog['status']) => {
    switch (status) {
      case 'success':
        return '#007AFF';
      case 'failed':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return '#007AFF';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#F44336';
      case 'success':
        return '#007AFF';
      default:
        return '#666';
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'success':
        return 'check-circle';
      default:
        return 'help';
    }
  };

  const filters = [
    { id: 'all', label: 'All', count: data?.logs?.length || 0 },
    { id: 'info', label: 'Info', count: data?.logs?.filter((log: any) => log.level === 'info')?.length || 0 },
    { id: 'warning', label: 'Warning', count: data?.logs?.filter((log: any) => log.level === 'warning')?.length || 0 },
    { id: 'error', label: 'Error', count: data?.logs?.filter((log: any) => log.level === 'error')?.length || 0 },
  ];

  const renderLog = (log: ActivityLog) => {
    const isSelected = selectedLog === log.id;
    const actionColor = getActionColor(log.action);
    const statusColor = getStatusColor(log.status);

    return (
      <View key={log.id} style={styles.logContainer}>
        <TouchableOpacity
          style={[
            styles.logItem,
            isSelected && styles.selectedLog,
          ]}
          onPress={() => setSelectedLog(isSelected ? null : log.id)}
          activeOpacity={0.7}
        >
          <View style={styles.logHeader}>
            <View style={styles.logUser}>
              <Avatar
                size={32}
                label={log.userName.split(' ').map(n => n[0]).join('')}
                style={{ backgroundColor: actionColor }}
              />
              <View style={styles.logUserInfo}>
                <Text style={styles.logUserName}>
                  {log.userName}
                </Text>
                <Text style={styles.logAction}>
                  {log.action} {log.resource}
                </Text>
              </View>
            </View>
            <View style={styles.logMeta}>
              <Chip
                mode="outlined"
                textStyle={{ fontSize: 10 }}
                style={[styles.statusChip, { borderColor: statusColor }]}
              >
                {log.status}
              </Chip>
              <Text style={styles.logTimestamp}>
                {formatTimestamp(log.timestamp)}
              </Text>
            </View>
          </View>
          {isSelected && (
            <View style={styles.logDetails}>
              <Text style={styles.logDetailsText}>
                {log.details}
              </Text>
              <View style={styles.logDetailsMeta}>
                <Text style={styles.logDetailsMetaText}>
                  IP: {log.ipAddress}
                </Text>
                <Text style={styles.logDetailsMetaText}>
                  Resource ID: {log.resourceId}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
        <Divider />
      </View>
    );
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <CardContent>
          <Text>Loading activity logs...</Text>
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

  // Mock data for demonstration
  const mockLogs = [
    {
      id: '1',
      userName: 'John Doe',
      action: 'create',
      resource: 'user',
      status: 'success',
      timestamp: new Date().toISOString(),
      details: 'Created new user account for jane.smith@school.com',
      ipAddress: '192.168.1.100',
      resourceId: 'user_123',
      level: 'info',
    },
    {
      id: '2',
      userName: 'Admin User',
      action: 'update',
      resource: 'class',
      status: 'success',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: 'Updated class schedule for Grade 10A',
      ipAddress: '192.168.1.101',
      resourceId: 'class_456',
      level: 'info',
    },
    {
      id: '3',
      userName: 'System',
      action: 'backup',
      resource: 'database',
      status: 'failed',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: 'Database backup failed due to insufficient disk space',
      ipAddress: '192.168.1.1',
      resourceId: 'backup_789',
      level: 'error',
    },
  ];

  const logs = data?.logs || mockLogs;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Activity Logs</Text>
              <Text style={styles.subtitle}>System activity and user actions</Text>
            </View>
            <View style={styles.headerRight}>
              <IconButton
                icon="search"
                size={24}
                onPress={() => setSearchVisible(!searchVisible)}
              />
              <IconButton
                icon="filter-list"
                size={24}
                onPress={() => setMenuVisible(!menuVisible)}
              />
              <IconButton
                icon="refresh"
                size={24}
                onPress={() => {
                  // TODO: Implement refresh functionality
                  console.log('Refresh activity logs');
                }}
              />
            </View>
          </View>
          
          {searchVisible && (
            <Searchbar
              placeholder="Search logs..."
              style={styles.searchBar}
            />
          )}
        </CardContent>
      </Card>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.selectedFilterChip,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter.id && styles.selectedFilterChipText,
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.logsContainer}>
        {logs.map(renderLog)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 16,
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
  headerRight: {
    flexDirection: 'row',
  },
  searchBar: {
    marginTop: 16,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedFilterChip: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
  },
  selectedFilterChipText: {
    color: '#fff',
  },
  logsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logContainer: {
    marginBottom: 8,
  },
  logItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedLog: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  logUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  logAction: {
    fontSize: 12,
    color: '#666',
  },
  logMeta: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 4,
  },
  logTimestamp: {
    fontSize: 10,
    color: '#999',
  },
  logDetails: {
    marginTop: 12,
    paddingTop: 12,
  },
  logDetailsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  logDetailsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logDetailsMetaText: {
    fontSize: 10,
    color: '#999',
  },
  errorText: {
    color: '#F44336',
  },
  // Custom component styles
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
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 28,
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
  buttonTextSmall: {
    fontSize: 12,
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  chipOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  chipFlat: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextFlat: {
    color: '#fff',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchbarInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
});

export default ActivityLogsPanel; 
