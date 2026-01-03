import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import secureApiService from '../../../services/secureApiService';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  value: number;
  lastContact: string;
  priority: string;
  department: string;
  assignedTo?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  customers: Customer[];
  totalValue: number;
  count: number;
}

interface PipelineBoardProps {
  customers: Customer[];
  onCustomerSelect: (customer: Customer) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

const PipelineBoard: React.FC<PipelineBoardProps> = ({
  customers,
  onCustomerSelect,
  loading = false,
  onRefresh
}) => {
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const defaultStages: PipelineStage[] = [
    { id: 'lead', name: 'Lead', color: '#6b7280', customers: [], totalValue: 0, count: 0 },
    { id: 'contacted', name: 'Contacted', color: '#3b82f6', customers: [], totalValue: 0, count: 0 },
    { id: 'qualified', name: 'Qualified', color: '#f59e0b', customers: [], totalValue: 0, count: 0 },
    { id: 'proposal', name: 'Proposal', color: '#8b5cf6', customers: [], totalValue: 0, count: 0 },
    { id: 'negotiation', name: 'Negotiation', color: '#ec4899', customers: [], totalValue: 0, count: 0 },
    { id: 'closed', name: 'Closed Won', color: '#10b981', customers: [], totalValue: 0, count: 0 },
    { id: 'lost', name: 'Lost', color: '#ef4444', customers: [], totalValue: 0, count: 0 },
  ];

  useEffect(() => {
    organizeCustomersByStage();
  }, [customers]);

  const organizeCustomersByStage = () => {
    const stages = defaultStages.map(stage => ({
      ...stage,
      customers: customers.filter(customer => {
        const status = customer.status.toLowerCase();
        switch (stage.id) {
          case 'lead':
            return status === 'lead' || status === 'new';
          case 'contacted':
            return status === 'contacted' || status === 'in-progress';
          case 'qualified':
            return status === 'qualified' || status === 'interested';
          case 'proposal':
            return status === 'proposal' || status === 'quoted';
          case 'negotiation':
            return status === 'negotiation' || status === 'discussion';
          case 'closed':
            return status === 'closed' || status === 'converted' || status === 'won';
          case 'lost':
            return status === 'lost' || status === 'rejected';
          default:
            return false;
        }
      })
    }));

    // Calculate totals
    stages.forEach(stage => {
      stage.count = stage.customers.length;
      stage.totalValue = stage.customers.reduce((sum, customer) => sum + (customer.value || 0), 0);
    });

    setPipelineStages(stages);
  };

  const fetchPipelineData = async () => {
    try {
      setError(null);
      const response = await secureApiService.getPipeline();
      // Update stages with backend data if available
      if (response.success && response.data && response.data.stages) {
        setPipelineStages(response.data.stages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pipeline data');
      
    }
  };

  const moveCustomerToStage = async (customerId: number, newStage: string) => {
    try {
      await secureApiService.updateCustomer(customerId.toString(), { stage: newStage });
      // Refresh data
      onRefresh?.();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to move customer to new stage');
      
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPipelineData();
    setRefreshing(false);
    onRefresh?.();
  };

  const renderCustomerCard = (customer: Customer, stageId: string) => (
    <TouchableOpacity key={customer.id} style={styles.customerCard} onPress={() => onCustomerSelect(customer)}>
      <View style={styles.customerCardContent}>
        <View style={styles.customerHeader}>
          <View style={[styles.customerAvatar, { backgroundColor: getStatusColor(customer.status) }]}>
            <Text style={styles.customerAvatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName} numberOfLines={1}>{customer.name}</Text>
            <Text style={styles.customerEmail} numberOfLines={1}>{customer.email}</Text>
          </View>
        </View>
        
        <View style={styles.customerDetails}>
          <Text style={styles.customerValue}>${customer.value?.toLocaleString()}</Text>
          <View style={[styles.priorityChip, { borderColor: getPriorityColor(customer.priority) }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(customer.priority) }]}>{customer.priority}</Text>
          </View>
        </View>

        <View style={styles.customerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setSelectedCustomer(customer)}
          >
            <MaterialIcons name="more-vert" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStage = (stage: PipelineStage) => (
    <View key={stage.id} style={styles.stageContainer}>
      <View style={styles.stageHeader}>
        <View style={styles.stageInfo}>
          <Text style={styles.stageName}>{stage.name}</Text>
          <View style={styles.stageStats}>
            <Text style={styles.stageCount}>{stage.count}</Text>
            <Text style={styles.stageValue}>${stage.totalValue?.toLocaleString()}</Text>
          </View>
        </View>
        <View style={[styles.stageColor, { backgroundColor: stage.color }]} />
      </View>

      <ScrollView style={styles.stageContent} showsVerticalScrollIndicator={false}>
        {stage.customers.map(customer => renderCustomerCard(customer, stage.id))}
        
        {stage.customers.length === 0 && (
          <View style={styles.emptyStage}>
            <MaterialIcons name="account-group" size={32} color="#9ca3af" />
            <Text style={styles.emptyStageText}>No customers</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'converted':
        return '#3b82f6';
      case 'lost':
        return '#ef4444';
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

  const renderMoveCustomerModal = () => {
    if (!selectedCustomer) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Move {selectedCustomer.name}</Text>
            <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
              <MaterialIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {pipelineStages.map(stage => (
              <TouchableOpacity
                key={stage.id}
                style={styles.moveOption}
                onPress={() => {
                  moveCustomerToStage(selectedCustomer.id, stage.id);
                  setSelectedCustomer(null);
                }}
              >
                <View style={[styles.moveOptionColor, { backgroundColor: stage.color }]} />
                <Text style={styles.moveOptionText}>{stage.name}</Text>
                <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  if (loading && pipelineStages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading pipeline...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorCard}>
          <View style={styles.errorCardContent}>
            <View style={styles.errorContent}>
              <MaterialIcons name="error" size={24} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        horizontal
        style={styles.pipelineContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6366f1']} />
        }
      >
        {pipelineStages.map(renderStage)}
      </ScrollView>

      {renderMoveCustomerModal()}
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
  },
  errorCardContent: {
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
  pipelineContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stageContainer: {
    width: 280,
    marginRight: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    maxHeight: '100%',
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stageInfo: {
    flex: 1,
  },
  stageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  stageStats: {
    flexDirection: 'row',
    gap: 12,
  },
  stageCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  stageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  stageColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stageContent: {
    flex: 1,
    padding: 12,
  },
  customerCard: {
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 1,
  },
  customerCardContent: {
    padding: 12,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  customerAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  customerEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  customerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  priorityChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '500',
  },
  customerActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    padding: 4,
  },
  emptyStage: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStageText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalBody: {
    padding: 16,
  },
  moveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  moveOptionColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  moveOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
});

export default PipelineBoard; 
