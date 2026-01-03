import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Card,
  Badge,
  Button,
  Icon,
  useToast,
  Spinner,
  Divider,
  Checkbox,
  Menu,
  Pressable,
} from 'native-base';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Collapsible from 'react-native-collapsible';
import { Customer, CustomerPipelineStage } from './types';
import { useTranslation } from '../../contexts/TranslationContext';
import { customerPipelineApi } from './api';
import Token from './components/Token';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width >= 768;

type CustomerListProps = {
  customers: Customer[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => void;
  onEdit: (customer: Customer) => void;
  onCustomerSelect: (customer: Customer) => void;
  onCustomerDelete: (customerId: number) => void;
};

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  loading,
  refreshing,
  error,
  onRefresh,
  onEdit,
  onCustomerSelect,
  onCustomerDelete,
}) => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [pipelineStages, setPipelineStages] = useState<CustomerPipelineStage[]>([]);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [selectedCustomerForToken, setSelectedCustomerForToken] = useState<Customer | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadPipelineStages();
  }, []);

  const loadPipelineStages = async () => {
    try {
      const response = await customerPipelineApi.getPipelineStages();
      if (response.success) {
        setPipelineStages(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load pipeline stages:', error);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCustomerSelect = (customerId: number) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${selectedCustomers.length} customers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedCustomers.forEach(id => onCustomerDelete(id));
            setSelectedCustomers([]);
            toast.show({
              description: `${selectedCustomers.length} customers deleted successfully`,
              variant: 'solid',
              placement: 'top',
            });
          },
        },
      ]
    );
  };

  const getCustomerStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#22c55e';
      case 'inactive':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      case 'converted':
        return '#3b82f6';
      case 'lost':
        return '#dc2626';
      case 'churned':
        return '#7c3aed';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return '#dc2626';
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'website':
        return 'globe';
      case 'referral':
        return 'people';
      case 'social_media':
        return 'share-social';
      case 'advertisement':
        return 'megaphone';
      case 'walk_in':
        return 'walk';
      default:
        return 'compass';
    }
  };

  const getCustomerTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'student':
        return 'school';
      case 'parent':
        return 'people';
      case 'teacher':
        return 'person';
      case 'staff':
        return 'briefcase';
      case 'prospect':
        return 'trending-up';
      case 'alumni':
        return 'graduation';
      default:
        return 'person';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPipelineStageColor = (stageId: number) => {
    const stage = pipelineStages.find(s => s.id === stageId);
    return stage?.color || '#6b7280';
  };

  const getPipelineStageName = (stageId: number) => {
    const stage = pipelineStages.find(s => s.id === stageId);
    return stage?.name || 'Unknown Stage';
  };

  const handlePrintCustomer = (customer: Customer) => {
    try {
      setSelectedCustomerForToken(customer);
      setTokenVisible(true);
      
      toast.show({
        description: `Opening token for ${customer.name}`,
        variant: 'solid',
        placement: 'top',
      });
    } catch (error) {
      console.error('Error opening token:', error);
      toast.show({
        description: 'Failed to open token',
        variant: 'solid',
        placement: 'top',
      });
    }
  };

  const renderCustomerCard = ({ item: customer }: { item: Customer }) => {
    const isExpanded = expandedId === customer.id;
    const isSelected = selectedCustomers.includes(customer.id);

    return (
      <Card style={styles.customerCard} key={customer.id}>
        <View style={styles.cardHeader}>
          <View style={styles.customerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.customerName}>{customer.name}</Text>
              {customer.serialNumber && (
                <Badge style={styles.serialBadge}>
                  <Text style={styles.serialText}>#{customer.serialNumber}</Text>
                </Badge>
              )}
            </View>
            
            <View style={styles.basicInfo}>
              {customer.email && (
                <View style={styles.infoItem}>
                  <Ionicons name="mail" size={14} color="#6b7280" />
                  <Text style={styles.infoText}>{customer.email}</Text>
                </View>
              )}
              
              {customer.phone && (
                <View style={styles.infoItem}>
                  <Ionicons name="call" size={14} color="#6b7280" />
                  <Text style={styles.infoText}>{customer.phone}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.cardActions}>
            <Checkbox
              value={isSelected.toString()}
              onChange={() => handleCustomerSelect(customer.id)}
              style={styles.checkbox}
            />
            
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setMenuVisible(menuVisible === customer.id ? null : customer.id)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
            </TouchableOpacity>

            {/* Print Icon */}
            <TouchableOpacity
              style={styles.printButton}
              onPress={() => handlePrintCustomer(customer)}
            >
              <Ionicons name="print-outline" size={20} color="#059669" />
            </TouchableOpacity>

            {menuVisible === customer.id && (
              <View style={styles.menu}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onCustomerSelect(customer);
                    setMenuVisible(null);
                  }}
                >
                  <Ionicons name="eye" size={16} color="#3b82f6" />
                  <Text style={styles.menuText}>View Details</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onEdit(customer);
                    setMenuVisible(null);
                  }}
                >
                  <Ionicons name="create" size={16} color="#f59e0b" />
                  <Text style={styles.menuText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onCustomerDelete(customer.id);
                    setMenuVisible(null);
                  }}
                >
                  <Ionicons name="trash" size={16} color="#ef4444" />
                  <Text style={styles.menuText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.tagsRow}>
            {customer.type && (
              <Badge style={[styles.tag, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name={getCustomerTypeIcon(customer.type)} size={12} color="#3730a3" />
                <Text style={[styles.tagText, { color: '#3730a3' }]}>{customer.type}</Text>
              </Badge>
            )}
            
            {customer.source && (
              <Badge style={[styles.tag, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name={getSourceIcon(customer.source)} size={12} color="#92400e" />
                <Text style={[styles.tagText, { color: '#92400e' }]}>{customer.source}</Text>
              </Badge>
            )}
            
            {customer.department && (
              <Badge style={[styles.tag, { backgroundColor: '#dbeafe' }]}>
                <Text style={[styles.tagText, { color: '#1e40af' }]}>{customer.department}</Text>
              </Badge>
            )}
            
            {customer.priority && (
              <Badge style={[styles.tag, { backgroundColor: '#fee2e2' }]}>
                <Text style={[styles.tagText, { color: getPriorityColor(customer.priority) }]}>
                  {customer.priority}
                </Text>
              </Badge>
            )}
          </View>

          {customer.pipelineStageId && (
            <View style={styles.pipelineStage}>
              <View style={[styles.stageIndicator, { backgroundColor: getPipelineStageColor(customer.pipelineStageId) }]} />
              <Text style={styles.stageText}>{getPipelineStageName(customer.pipelineStageId)}</Text>
            </View>
          )}

          {customer.purpose && (
            <Text style={styles.purposeText}>{customer.purpose}</Text>
          )}

          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => toggleExpand(customer.id)}
          >
            <Text style={styles.expandText}>
              {isExpanded ? 'Show Less' : 'Show More'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#6b7280"
            />
          </TouchableOpacity>

          <Collapsible collapsed={!isExpanded}>
            <View style={styles.expandedContent}>
              <Divider style={styles.divider} />
              
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Gender</Text>
                  <Text style={styles.detailValue}>{customer.gender || 'N/A'}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Referred To</Text>
                  <Text style={styles.detailValue}>{customer.referredTo || 'N/A'}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Spent</Text>
                  <Text style={styles.detailValue}>{formatCurrency(customer.totalSpent || 0)}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Order Count</Text>
                  <Text style={styles.detailValue}>{customer.orderCount || 0}</Text>
                </View>
                
                {customer.address && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.detailValue}>{customer.address}</Text>
                  </View>
                )}
                
                {customer.city && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>City</Text>
                    <Text style={styles.detailValue}>{customer.city}</Text>
                  </View>
                )}
                
                {customer.country && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Country</Text>
                    <Text style={styles.detailValue}>{customer.country}</Text>
                  </View>
                )}
                
                {customer.company && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Company</Text>
                    <Text style={styles.detailValue}>{customer.company}</Text>
                  </View>
                )}
                
                {customer.position && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Position</Text>
                    <Text style={styles.detailValue}>{customer.position}</Text>
                  </View>
                )}
                
                {customer.occupation && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Occupation</Text>
                    <Text style={styles.detailValue}>{customer.occupation}</Text>
                  </View>
                )}
                
                {customer.website && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Website</Text>
                    <Text style={styles.detailValue}>{customer.website}</Text>
                  </View>
                )}
                
                {customer.rermark && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Remark</Text>
                    <Text style={styles.detailValue}>{customer.rermark}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.metadataSection}>
                <Text style={styles.metadataTitle}>Additional Information</Text>
                <Text style={styles.metadataText}>
                  Created: {formatDate(customer.createdAt)}
                </Text>
                <Text style={styles.metadataText}>
                  Updated: {formatDate(customer.updatedAt)}
                </Text>
                {customer.metadata && Object.keys(customer.metadata).length > 0 && (
                  <Text style={styles.metadataText}>
                    Custom Fields: {Object.keys(customer.metadata).length}
                  </Text>
                )}
              </View>
            </View>
          </Collapsible>
        </View>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading customers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedCustomers.length > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkActionsText}>
            {selectedCustomers.length} customer(s) selected
          </Text>
          <TouchableOpacity style={styles.bulkDeleteButton} onPress={handleBulkDelete}>
            <Ionicons name="trash" size={16} color="#fff" />
            <Text style={styles.bulkDeleteButtonText}>Delete Selected</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={customers}
        renderItem={renderCustomerCard}
        keyExtractor={(item) => item.id.toString()}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No customers found</Text>
            <Text style={styles.emptySubtext}>Start by adding your first customer</Text>
          </View>
        }
      />

      {/* Token Component */}
      {selectedCustomerForToken && (
        <Token
          customer={selectedCustomerForToken}
          visible={tokenVisible}
          onClose={() => {
            setTokenVisible(false);
            setSelectedCustomerForToken(null);
          }}
        />
      )}
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  bulkActionsText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  bulkDeleteButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  customerCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  customerInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  serialBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  serialText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  basicInfo: {
    gap: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6b7280',
  },
  cardActions: {
    alignItems: 'center',
  },
  checkbox: {
    marginBottom: 8,
  },
  menuButton: {
    padding: 4,
  },
  printButton: {
    padding: 4,
    marginTop: 4,
  },
  menu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  cardBody: {
    padding: 16,
    paddingTop: 0,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  pipelineStage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stageIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  stageText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  purposeText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  expandText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 4,
  },
  expandedContent: {
    marginTop: 8,
  },
  divider: {
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  metadataSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  metadataTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  metadataText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CustomerList;
