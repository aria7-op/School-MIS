import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import secureApiService from '../../../services/secureApiService';

interface Interaction {
  id: number;
  customerId: number;
  type: string;
  channel: string;
  subject: string;
  description: string;
  outcome: string;
  duration: number;
  followUpRequired: boolean;
  followUpDate?: string;
  assignedTo?: string;
  priority: string;
  status: string;
  tags: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

interface InteractionAnalytics {
  totalInteractions: number;
  interactionsByType: Record<string, number>;
  interactionsByChannel: Record<string, number>;
  averageDuration: number;
  followUpRate: number;
  resolutionRate: number;
  topOutcomes: Array<{ outcome: string; count: number }>;
  interactionsByDay: Array<{ date: string; count: number }>;
}

interface CustomerInteractionsProps {
  customerId?: string;
  loading?: boolean;
  onRefresh?: () => void;
}

const CustomerInteractions: React.FC<CustomerInteractionsProps> = ({
  customerId,
  loading = false,
  onRefresh
}) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [analytics, setAnalytics] = useState<InteractionAnalytics | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  // Form state for creating new interaction
  const [newInteraction, setNewInteraction] = useState({
    type: '',
    channel: '',
    subject: '',
    description: '',
    outcome: '',
    followUpRequired: false,
    followUpDate: '',
    priority: 'medium',
    tags: [] as string[],
  });

  useEffect(() => {
    if (customerId) {
      loadCustomerInteractions();
    } else {
      loadAllInteractions();
    }
    loadInteractionAnalytics();
    loadInteractionTimeline();
  }, [customerId, filterType, filterChannel]);

  const loadCustomerInteractions = async () => {
    try {
      setError(null);
      const response = await secureApiService.get(`/customers/${customerId}/interactions`);
      setInteractions(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch interactions');
      
    }
  };

  const loadAllInteractions = async () => {
    try {
      setError(null);
      const response = await secureApiService.get('/customers/interactions/analytics');
      // This would typically return all interactions, but for now we'll use analytics data
      setInteractions([]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch interactions');
      
    }
  };

  const loadInteractionAnalytics = async () => {
    try {
      const response = await secureApiService.get('/customers/interactions/analytics');
      setAnalytics(response.data);
    } catch (err: any) {
      
    }
  };

  const loadInteractionTimeline = async () => {
    try {
      const response = await secureApiService.get('/customers/interactions/timeline');
      setTimeline(response.data || []);
    } catch (err: any) {
      
    }
  };

  const createInteraction = async () => {
    try {
      const response = await secureApiService.post(`/customers/${customerId}/interactions`, newInteraction);
      setInteractions(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      setNewInteraction({
        type: '',
        channel: '',
        subject: '',
        description: '',
        outcome: '',
        followUpRequired: false,
        followUpDate: '',
        priority: 'medium',
        tags: [],
      });
      Alert.alert('Success', 'Interaction created successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create interaction');
    }
  };

  const updateInteraction = async (interactionId: number, data: Partial<Interaction>) => {
    try {
      const response = await secureApiService.put(`/customers/${customerId}/interactions/${interactionId}`, data);
      setInteractions(prev => prev.map(i => i.id === interactionId ? response.data : i));
      Alert.alert('Success', 'Interaction updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update interaction');
    }
  };

  const deleteInteraction = async (interactionId: number) => {
    Alert.alert(
      'Delete Interaction',
      'Are you sure you want to delete this interaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await secureApiService.delete(`/customers/${customerId}/interactions/${interactionId}`);
              setInteractions(prev => prev.filter(i => i.id !== interactionId));
              Alert.alert('Success', 'Interaction deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete interaction');
            }
          }
        }
      ]
    );
  };

  const bulkCreateInteractions = async (interactionsData: Partial<Interaction>[]) => {
    try {
      const response = await secureApiService.post('/customers/interactions/bulk', { interactions: interactionsData });
      setInteractions(prev => [...response.data, ...prev]);
      Alert.alert('Success', `${interactionsData.length} interactions created successfully`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create interactions');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      customerId ? loadCustomerInteractions() : loadAllInteractions(),
      loadInteractionAnalytics(),
      loadInteractionTimeline()
    ]);
    setRefreshing(false);
    onRefresh?.();
  };

  const getInteractionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'call':
        return '#10b981';
      case 'email':
        return '#3b82f6';
      case 'meeting':
        return '#f59e0b';
      case 'chat':
        return '#8b5cf6';
      case 'visit':
        return '#ec4899';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const renderInteractionCard = (interaction: Interaction) => (
    <TouchableOpacity
      key={interaction.id}
      style={styles.interactionCard}
      onPress={() => setSelectedInteraction(interaction)}
    >
      <View style={styles.interactionHeader}>
        <View style={styles.interactionType}>
          <View style={[styles.typeDot, { backgroundColor: getInteractionTypeColor(interaction.type) }]} />
          <Text style={styles.interactionTypeText}>{interaction.type}</Text>
        </View>
        <View style={styles.interactionActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setSelectedInteraction(interaction)}
          >
            <MaterialIcons name="edit" size={16} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteInteraction(interaction.id)}
          >
            <MaterialIcons name="delete" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.interactionSubject}>{interaction.subject}</Text>
      <Text style={styles.interactionDescription} numberOfLines={2}>
        {interaction.description}
      </Text>

      <View style={styles.interactionMeta}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Channel:</Text>
          <Text style={styles.metaValue}>{interaction.channel}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Outcome:</Text>
          <Text style={styles.metaValue}>{interaction.outcome}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Duration:</Text>
          <Text style={styles.metaValue}>{interaction.duration} min</Text>
        </View>
      </View>

      <View style={styles.interactionFooter}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(interaction.priority) }]}>
          <Text style={styles.priorityText}>{interaction.priority}</Text>
        </View>
        {interaction.followUpRequired && (
          <View style={styles.followUpBadge}>
            <MaterialIcons name="schedule" size={12} color="#f59e0b" />
            <Text style={styles.followUpText}>Follow-up</Text>
          </View>
        )}
        <Text style={styles.interactionDate}>
          {new Date(interaction.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderAnalyticsCard = () => (
    <View style={styles.analyticsCard}>
      <View style={styles.analyticsHeader}>
        <Text style={styles.analyticsTitle}>Interaction Analytics</Text>
        <TouchableOpacity onPress={() => setShowAnalyticsModal(true)}>
          <MaterialIcons name="analytics" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {analytics && (
        <View style={styles.analyticsContent}>
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{analytics.totalInteractions}</Text>
              <Text style={styles.analyticsLabel}>Total</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{analytics.averageDuration.toFixed(1)}</Text>
              <Text style={styles.analyticsLabel}>Avg Duration</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{(analytics.followUpRate * 100).toFixed(1)}%</Text>
              <Text style={styles.analyticsLabel}>Follow-up Rate</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>{(analytics.resolutionRate * 100).toFixed(1)}%</Text>
              <Text style={styles.analyticsLabel}>Resolution Rate</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderCreateModal = () => (
    <Modal visible={showCreateModal} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create New Interaction</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <MaterialIcons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Type</Text>
            <View style={styles.typeButtons}>
              {['Call', 'Email', 'Meeting', 'Chat', 'Visit'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newInteraction.type === type && styles.typeButtonActive
                  ]}
                  onPress={() => setNewInteraction(prev => ({ ...prev, type }))}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newInteraction.type === type && styles.typeButtonTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Channel</Text>
            <View style={styles.typeButtons}>
              {['Phone', 'Email', 'In-Person', 'Video Call', 'Social Media'].map(channel => (
                <TouchableOpacity
                  key={channel}
                  style={[
                    styles.typeButton,
                    newInteraction.channel === channel && styles.typeButtonActive
                  ]}
                  onPress={() => setNewInteraction(prev => ({ ...prev, channel }))}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newInteraction.channel === channel && styles.typeButtonTextActive
                  ]}>
                    {channel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Subject</Text>
            <TextInput
              style={styles.textInput}
              value={newInteraction.subject}
              onChangeText={(text) => setNewInteraction(prev => ({ ...prev, subject: text }))}
              placeholder="Enter subject"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newInteraction.description}
              onChangeText={(text) => setNewInteraction(prev => ({ ...prev, description: text }))}
              placeholder="Enter description"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Outcome</Text>
            <TextInput
              style={styles.textInput}
              value={newInteraction.outcome}
              onChangeText={(text) => setNewInteraction(prev => ({ ...prev, outcome: text }))}
              placeholder="Enter outcome"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Priority</Text>
            <View style={styles.typeButtons}>
              {['Low', 'Medium', 'High'].map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.typeButton,
                    newInteraction.priority === priority.toLowerCase() && styles.typeButtonActive
                  ]}
                  onPress={() => setNewInteraction(prev => ({ ...prev, priority: priority.toLowerCase() }))}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newInteraction.priority === priority.toLowerCase() && styles.typeButtonTextActive
                  ]}>
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setNewInteraction(prev => ({ ...prev, followUpRequired: !prev.followUpRequired }))}
          >
            <MaterialIcons
              name={newInteraction.followUpRequired ? 'check-box' : 'check-box-outline-blank'}
              size={20}
              color="#6366f1"
            />
            <Text style={styles.checkboxLabel}>Follow-up Required</Text>
          </TouchableOpacity>

          {newInteraction.followUpRequired && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Follow-up Date</Text>
              <TextInput
                style={styles.textInput}
                value={newInteraction.followUpDate}
                onChangeText={(text) => setNewInteraction(prev => ({ ...prev, followUpDate: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCreateModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={createInteraction}
          >
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading && interactions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading interactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorCard}>
          <View style={styles.errorContent}>
            <MaterialIcons name="error" size={24} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      )}

      {renderAnalyticsCard()}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            {customerId ? 'Customer Interactions' : 'All Interactions'}
          </Text>
          <Text style={styles.subtitle}>
            {interactions.length} interactions
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6366f1']} />
        }
      >
        {interactions.map(renderInteractionCard)}

        {interactions.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="chat" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No interactions found</Text>
            <Text style={styles.emptyText}>
              Start by creating your first interaction
            </Text>
          </View>
        )}
      </ScrollView>

      {renderCreateModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorCard: {
    margin: 16,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 8,
    color: '#dc2626',
    fontSize: 14,
  },
  analyticsCard: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    padding: 16,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  analyticsContent: {
    gap: 16,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  interactionCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  interactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  interactionType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  interactionTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  interactionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  interactionSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  interactionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  interactionMeta: {
    gap: 4,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b',
  },
  interactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  followUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  followUpText: {
    fontSize: 10,
    color: '#f59e0b',
    marginLeft: 2,
  },
  interactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f8fafc',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  typeButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default CustomerInteractions; 
