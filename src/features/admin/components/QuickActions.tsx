import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  route?: string;
  action?: () => void;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  status?: 'active' | 'maintenance' | 'deprecated';
  permissions?: string[];
}

interface ActionModalContent {
  title: string;
  description: string;
  fields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: string[];
    required?: boolean;
  }>;
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

const Divider = ({ style, ...props }: any) => (
  <View style={[styles.divider, style]} {...props} />
);

const QuickActions: React.FC = () => {
  const navigation = useNavigation();
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<ActionModalContent | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const quickActions: QuickAction[] = [
    {
      id: 'users',
      label: 'User Management',
      icon: 'people',
      color: '#007AFF',
      description: 'Manage users, roles, and permissions',
      route: 'UserManagement',
      status: 'active',
      permissions: ['MANAGE_USERS']
    },
    {
      id: 'payments',
      label: 'Payment Processing',
      icon: 'payment',
      color: '#4CAF50',
      description: 'Process payments and manage transactions',
      route: 'PaymentProcessing',
      status: 'active',
      permissions: ['MANAGE_PAYMENTS']
    },
    {
      id: 'reports',
      label: 'Generate Reports',
      icon: 'assessment',
      color: '#FF9800',
      description: 'Create and export system reports',
      requiresConfirmation: true,
      confirmationMessage: 'This will generate reports for all modules. Continue?',
      status: 'active',
      permissions: ['GENERATE_REPORTS']
    },
    {
      id: 'backup',
      label: 'System Backup',
      icon: 'backup',
      color: '#2196F3',
      description: 'Perform system backup and restoration',
      requiresConfirmation: true,
      confirmationMessage: 'Starting system backup. This may take several minutes.',
      status: 'active',
      permissions: ['MANAGE_SYSTEM']
    },
    {
      id: 'cache',
      label: 'Cache Management',
      icon: 'cached',
      color: '#9C27B0',
      description: 'Manage system cache and performance',
      status: 'maintenance',
      permissions: ['MANAGE_SYSTEM']
    },
    {
      id: 'notifications',
      label: 'Send Notifications',
      icon: 'notifications',
      color: '#E91E63',
      description: 'Send system-wide notifications',
      status: 'active',
      permissions: ['SEND_NOTIFICATIONS']
    },
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      icon: 'insights',
      color: '#673AB7',
      description: 'View detailed system analytics',
      route: 'AnalyticsDashboard',
      status: 'active',
      permissions: ['VIEW_ANALYTICS']
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: 'assignment',
      color: '#FF5722',
      description: 'View system audit trail and activity logs',
      route: 'AuditLogs',
      status: 'active',
      permissions: ['SUPER_ADMIN', 'SCHOOL_ADMIN']
    },
    {
      id: 'maintenance',
      label: 'System Maintenance',
      icon: 'build',
      color: '#795548',
      description: 'Perform system maintenance tasks',
      status: 'active',
      permissions: ['MANAGE_SYSTEM']
    },
    {
      id: 'bulk-promotions',
      label: 'Bulk Promotions',
      icon: 'trending-up',
      color: '#3465d9',
      description: 'Promote students to the next class/year',
      route: 'EnrollmentManager', // Make sure EnrollmentManager screen is registered with this name
      permissions: ['admin', 'superadmin'],
    },
    {
      id: 'historical-data',
      label: 'Historical Data',
      icon: 'history',
      color: '#979797',
      description: 'View academic data from any year',
      route: 'HistoricalDataViewer', // Match the navigation key you use for this component
      permissions: ['admin', 'superadmin'],
    },
  ];

  const handleActionPress = (action: QuickAction) => {
    setSelectedAction(action);

    if (action.requiresConfirmation) {
      setModalContent({
        title: action.label,
        description: action.confirmationMessage || 'Are you sure you want to proceed?'
      });
      setShowModal(true);
      return;
    }

    if (action.route) {
      navigation.navigate(action.route as never);
    } else if (action.action) {
      action.action();
    }
  };

  const handleConfirm = () => {
    if (!selectedAction) return;

    if (selectedAction.route) {
      navigation.navigate(selectedAction.route as never);
    } else if (selectedAction.action) {
      selectedAction.action();
    }

    setShowModal(false);
    setSelectedAction(null);
    setFormData({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'maintenance':
        return '#FF9800';
      case 'deprecated':
        return '#F44336';
      default:
        return '#007AFF';
    }
  };

  const renderActionCard = (action: QuickAction) => (
    <Card
      key={action.id}
      style={[styles.actionCard, { borderLeftColor: action.color }]}
    >
      <TouchableOpacity
        onPress={() => handleActionPress(action)}
        style={styles.actionRipple}
        activeOpacity={0.7}
      >
        <View>
          <View style={styles.actionHeader}>
            <MaterialIcons name={action.icon} size={24} color={action.color} />
            <View style={styles.actionStatus}>
              <View
                style={[styles.statusDot, { backgroundColor: getStatusColor(action.status || 'active') }]}
              />
            </View>
          </View>
          <Text style={styles.actionLabel}>{action.label}</Text>
          <Text style={styles.actionDescription}>{action.description}</Text>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderModal = () => (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalContent?.title}</Text>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalDescription}>{modalContent?.description}</Text>
            
            {modalContent?.fields && (
              <View style={styles.formFields}>
                {modalContent.fields.map(field => (
                  <View key={field.key} style={styles.formField}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={formData[field.key] || ''}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, [field.key]: text }))}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
          
          <Divider style={styles.modalDivider} />
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              style={styles.modalButton}
            >
              Confirm
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <Card style={styles.container}>
      <CardContent>
        <Text style={styles.title}>Quick Actions</Text>
        <Text style={styles.subtitle}>
          Frequently used administrative tools and actions
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsContainer}
        >
          {quickActions.map(renderActionCard)}
        </ScrollView>
      </CardContent>
      
      {renderModal()}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
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
  actionsContainer: {
    paddingRight: 16,
  },
  actionCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionRipple: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  actionStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
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
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
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
    borderRadius: 8,
    width: '90%',
    maxWidth: 400,
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
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  formFields: {
    marginBottom: 16,
  },
  formField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  modalDivider: {
    marginVertical: 0,
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

export default QuickActions;
