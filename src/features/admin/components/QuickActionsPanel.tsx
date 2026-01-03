import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface QuickActionsPanelProps {
  onAction?: (action: string) => void;
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

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  onAction = () => {},
}) => {
  const quickActions = [
    {
      id: 'add-user',
      title: 'Add User',
      icon: 'account-plus',
      color: '#007AFF',
      description: 'Create new user account',
    },
    {
      id: 'backup',
      title: 'Backup Data',
      icon: 'cloud-upload',
      color: '#34C759',
      description: 'Create system backup',
    },
    {
      id: 'reports',
      title: 'Generate Reports',
      icon: 'file-chart',
      color: '#FF9500',
      description: 'Create system reports',
    },
    {
      id: 'settings',
      title: 'System Settings',
      icon: 'cog',
      color: '#FF3B30',
      description: 'Configure system',
    },
    {
      id: 'notifications',
      title: 'Send Notifications',
      icon: 'bell',
      color: '#AF52DE',
      description: 'Send bulk notifications',
    },
    {
      id: 'maintenance',
      title: 'Maintenance Mode',
      icon: 'wrench',
      color: '#8E8E93',
      description: 'Toggle maintenance mode',
    },
  ];

  const recentActions = [
    { action: 'User created', time: '2 minutes ago', user: 'Admin' },
    { action: 'System backup completed', time: '1 hour ago', user: 'System' },
    { action: 'Settings updated', time: '3 hours ago', user: 'Admin' },
    { action: 'Report generated', time: '5 hours ago', user: 'Admin' },
  ];

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.title}>Quick Actions</Text>
          <Text style={styles.subtitle}>Common administrative tasks</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
            <View style={styles.actionsContainer}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionItem}
                  onPress={() => onAction(action.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <MaterialIcons name={action.icon as any} size={24} color="white" />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Recent Actions</Text>
          <View style={styles.recentActions}>
            {recentActions.map((item, index) => (
              <View key={index} style={styles.recentAction}>
                <View style={styles.recentActionLeft}>
                  <Text style={styles.recentActionText}>{item.action}</Text>
                  <Text style={styles.recentActionTime}>
                    {item.time} by {item.user}
                  </Text>
                </View>
                <IconButton
                  icon="info"
                  size={16}
                  onPress={() => {}}
                />
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  actionsScroll: {
    marginHorizontal: -16,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  actionItem: {
    alignItems: 'center',
    minWidth: 100,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    marginRight: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
    color: '#333',
  },
  actionDescription: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  recentActions: {
    gap: 8,
  },
  recentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  recentActionLeft: {
    flex: 1,
  },
  recentActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  recentActionTime: {
    fontSize: 12,
    color: '#666',
  },
  iconButton: {
    padding: 4,
  },
});

export default QuickActionsPanel; 
