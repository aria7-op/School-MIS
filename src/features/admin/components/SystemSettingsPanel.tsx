import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SystemSettingsPanelProps {
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

const Button = ({ children, mode = 'contained', size = 'medium', icon, onPress, style, ...props }: any) => (
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
    {icon && <MaterialIcons name={icon} size={16} color={mode === 'contained' ? '#fff' : '#007AFF'} style={styles.buttonIcon} />}
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

const Divider = ({ style, ...props }: any) => (
  <View style={[styles.divider, style]} {...props} />
);

const SystemSettingsPanel: React.FC<SystemSettingsPanelProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  if (loading) {
    return (
      <Card style={styles.container}>
        <CardContent>
          <Text>Loading system settings...</Text>
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
          <Text style={styles.title}>
            System Settings
          </Text>
          <Text style={styles.subtitle}>
            Configure system preferences and security
          </Text>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>
            Preferences
          </Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch value={data?.darkMode || false} onValueChange={() => {}} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch value={data?.notifications || false} onValueChange={() => {}} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Backup</Text>
            <Switch value={data?.autoBackup || false} onValueChange={() => {}} />
          </View>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>
            Security
          </Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
            <Switch value={data?.twoFactorAuth || false} onValueChange={() => {}} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Allow API Access</Text>
            <Switch value={data?.apiAccess || false} onValueChange={() => {}} />
          </View>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>
            System Actions
          </Text>
          <View style={styles.actionsRow}>
            <Button mode="outlined" icon="backup" onPress={() => {}} style={styles.actionButton}>
              Backup Now
            </Button>
            <Button mode="outlined" icon="restore" onPress={() => {}} style={styles.actionButton}>
              Restore
            </Button>
            <Button mode="outlined" icon="delete" onPress={() => {}} style={styles.actionButton}>
              Clear Data
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '30%',
    marginBottom: 8,
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
  buttonIcon: {
    marginRight: 4,
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
});

export default SystemSettingsPanel; 
