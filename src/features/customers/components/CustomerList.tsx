import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, TextInput, Modal, ScrollView, Dimensions, Platform } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import secureApiService from '../../../services/secureApiService';
import CustomerForm from './CustomerForm';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useTheme } from '@react-navigation/native';
import { Customer } from '../types';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;



interface CustomerListProps {
  customers: Customer[];
  onCustomerSelect: (customer: Customer) => void;
  onCustomerEdit: (customer: Customer) => void;
  onCustomerDelete: (customerId: number) => Promise<void>;
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalCustomers?: number;
  onPageChange?: (page: number) => void;
  onLoadMore?: () => void;
  // Highlight props
  highlightedCustomerId?: number | null;
}

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onCustomerSelect,
  onCustomerEdit,
  onCustomerDelete,
  loading = false,
  onRefresh,
  refreshing = false,
  viewMode = 'list',
  onViewModeChange,
  currentPage,
  totalPages,
  totalCustomers,
  onPageChange,
  onLoadMore,
  highlightedCustomerId
}) => {
  // Remove searchQuery state and search bar UI
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'status' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const { colors } = useTheme();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>(undefined);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const { t } = useTranslation();

  // Helper function to get customer name safely
  const getCustomerName = (customer: Customer): string => {
    if (!customer) return 'Unknown Customer';
    
    if (customer.firstName && customer.lastName) {
      return `${customer.firstName} ${customer.lastName}`;
    }
    return customer.name || 'Unknown Customer';
  };

  const getCustomerValue = (customer: Customer): number => {
    if (!customer) return 0;
    return customer.value || customer.totalSpent || 0;
  };

  const getCustomerPriority = (customer: Customer): string => {
    if (!customer) return 'MEDIUM';
    return customer.priority || 'MEDIUM';
  };

  const handleCustomerSelect = (customer: Customer) => {
    if (!customer) {
      // console.warn('Attempted to select undefined customer');
      return;
    }
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedCustomer(undefined);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditCustomer(customer);
    setShowEditModal(true);
  };

  const formatDate = (dateString: string | Date | any) => {
    // 
    
    if (!dateString) return 'N/A';
    
    // Handle empty objects
    if (typeof dateString === 'object' && Object.keys(dateString).length === 0) {
      // 
      return 'N/A';
    }
    
    try {
      let date: Date;
      
      // Handle different date formats
      if (typeof dateString === 'object' && dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'object' && dateString && dateString.toString && dateString.toString() !== '[object Object]') {
        date = new Date(dateString);
      } else if (typeof dateString === 'string') {
        // Try to parse the string date
        date = new Date(dateString);
      } else if (typeof dateString === 'number') {
        // Handle timestamp
        date = new Date(dateString);
      } else {
        // 
        return 'N/A';
      }
      
      // 
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        // 
        // Try alternative parsing methods
        if (typeof dateString === 'string') {
          // Try parsing as ISO string
          const isoDate = new Date(dateString.replace(' ', 'T'));
          if (!isNaN(isoDate.getTime())) {
            return isoDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        }
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      // 
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'MALE': return t('male');
      case 'FEMALE': return t('female');
      case 'OTHER': return t('other');
      case 'PREFER_NOT_TO_SAY': return t('prefer_not_to_say');
      default: return gender;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'STUDENT': return t('student');
      case 'PARENT': return t('parent');
      case 'TEACHER': return t('teacher');
      case 'STAFF': return t('staff');
      case 'PROSPECT': return t('prospect');
      case 'ALUMNI': return t('alumni');
      default: return type;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'LOW': return t('low');
      case 'MEDIUM': return t('medium');
      case 'HIGH': return t('high');
      case 'URGENT': return t('urgent');
      default: return priority;
    }
  };

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, sortBy, sortOrder, fromDate, toDate]);

  const filterAndSortCustomers = () => {
    let filtered = customers.filter(customer => {
      if (!customer) return false;
      
      const name = getCustomerName(customer);
      const email = customer.email || '';
      const phone = customer.phone || '';
      
      // Text search filter
      // No search bar, so always match
      
      // Date filter
      if (fromDate || toDate) {
        const customerDate = new Date(customer.createdAt || customer.createdAt || new Date());
        const fromDateTime = fromDate ? new Date(fromDate).getTime() : 0;
        const toDateTime = toDate ? new Date(toDate + 'T23:59:59').getTime() : Date.now();
        
        if (fromDate && customerDate.getTime() < fromDateTime) return false;
        if (toDate && customerDate.getTime() > toDateTime) return false;
      }
      
      return true;
    });

    // Sort customers
    filtered.sort((a, b) => {
      if (!a || !b) return 0;
      
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = getCustomerName(a).toLowerCase();
          bValue = getCustomerName(b).toLowerCase();
          break;
        case 'value':
          aValue = getCustomerValue(a);
          bValue = getCustomerValue(b);
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || new Date()).getTime();
          bValue = new Date(b.createdAt || new Date()).getTime();
          break;
        default:
          aValue = new Date(a.createdAt || new Date()).getTime();
          bValue = new Date(b.createdAt || new Date()).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCustomers(filtered);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${getCustomerName(customer)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onCustomerDelete(customer.id)
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    if (!status) return colors.text; // Use theme color
    
    switch (status.toLowerCase()) {
      case 'active':
        return colors.primary;
      case 'pending':
        return colors.warning;
      case 'converted':
        return colors.info;
      case 'lost':
        return colors.error;
      default:
        return colors.text;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.text;
    }
  };

  const renderCustomerCard = ({ item: customer, index }: { item: Customer, index: number }) => {
    const isEven = index % 2 === 0;
    return (
      <TouchableOpacity
        style={[
          styles.customerCard,
          isEven ? styles.customerCardEven : styles.customerCardOdd,
          highlightedCustomerId === customer.id && styles.customerCardHighlighted
        ]}
        onPress={() => handleCustomerSelect(customer)}
        activeOpacity={0.9}
      >
        <View style={styles.customerCardHeader}>
          <Text style={styles.customerName}>{getCustomerName(customer)}</Text>
          {customer.priority && (
            <View style={[styles.badge, styles[`badge${getCustomerPriority(customer)}`]]}>
              <Text style={styles.badgeText}>{t(getPriorityLabel(customer.priority))}</Text>
            </View>
          )}
        </View>
        <View style={styles.customerCardRow}>
          <MaterialIcons name="email" size={16} color="#6366f1" style={styles.cardIcon} />
          <Text style={styles.customerCardLabel}>{t('email')}:</Text>
          <Text style={styles.customerCardValue}>{customer.email || t('not_available')}</Text>
        </View>
        <View style={styles.customerCardRow}>
          <MaterialIcons name="phone" size={16} color="#10b981" style={styles.cardIcon} />
          <Text style={styles.customerCardLabel}>{t('phone')}:</Text>
          <Text style={styles.customerCardValue}>{customer.phone || t('not_available')}</Text>
        </View>
        <View style={styles.customerCardRow}>
          <MaterialIcons name="location-on" size={16} color="#f59e0b" style={styles.cardIcon} />
          <Text style={styles.customerCardLabel}>{t('city')}:</Text>
          <Text style={styles.customerCardValue}>{customer.city || t('not_available')}</Text>
        </View>
        <View style={styles.customerCardFooter}>
          <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleEditCustomer(customer)}>
            <MaterialIcons name="edit" size={18} color="#6366f1" />
            <Text style={styles.cardActionText}>{t('edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleDeleteCustomer(customer)}>
            <MaterialIcons name="delete" size={18} color="#ef4444" />
            <Text style={styles.cardActionText}>{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGridItem = ({ item: customer }: { item: Customer }) => {
    const isHighlighted = highlightedCustomerId === customer.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.gridItem, 
          { 
            backgroundColor: isHighlighted ? '#f0f4ff' : colors.card,
            borderWidth: isHighlighted ? 3 : 1,
            borderColor: isHighlighted ? '#6366f1' : 'transparent',
          }
        ]} 
        onPress={() => handleCustomerSelect(customer)}
      >
      <View style={styles.gridHeader}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(customer.status || 'active') }]} />
        <View style={styles.gridActions}>
          <TouchableOpacity onPress={() => onCustomerEdit(customer)}>
            <MaterialIcons name="edit" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.gridName} numberOfLines={1}>{getCustomerName(customer)}</Text>
      <Text style={styles.gridEmail} numberOfLines={1}>{customer.email}</Text>
      
      <View style={styles.gridStatus}>
        <Text style={[styles.statusText, { color: getStatusColor(customer.status || 'active') }]}>{customer.status || 'Active'}</Text>
      </View>
      
      <Text style={styles.gridValue}>{formatCurrency(getCustomerValue(customer))}</Text>
    </TouchableOpacity>
    );
  };

  const renderCustomerDetailsModal = () => {
    if (!selectedCustomer) return null;

    return (
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDetailsModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={closeDetailsModal}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Enhanced Header with Customer Avatar */}
            <View style={styles.modalHeader}>
              <View style={styles.customerAvatar}>
                <Text style={styles.avatarText}>
                  {getCustomerName(selectedCustomer).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.modalTitle}>{getCustomerName(selectedCustomer)}</Text>
                <Text style={styles.customerSubtitle}>{selectedCustomer.email}</Text>
                <View style={styles.headerBadges}>
                  <View style={[styles.badge, { backgroundColor: getPriorityColor(selectedCustomer.priority) }]}>
                    <Text style={styles.badgeText}>{getPriorityLabel(selectedCustomer.priority)}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{getTypeLabel(selectedCustomer.type)}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeDetailsModal}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Quick Stats Cards */}
              <View style={styles.statsContainer}>
                <View style={[styles.statCard, styles.statCard_1]}>
                  <View style={styles.statCardDetails}>
                      <Text style={styles.statLabel}>Value</Text>
                      <Text style={styles.statValue_1}>{formatCurrency(selectedCustomer.value || 0)}</Text>
                  </View>
                  <MaterialIcons name="attach-money" size={30} color={colors.success} />
                </View>
                <View style={[styles.statCard, styles.statCard_2]}>
                  <View style={styles.statCardDetails}>
                    <Text style={styles.statLabel}>Orders</Text>            
                    <Text style={styles.statValue_2}>{selectedCustomer.orderCount || 0}</Text>
                  </View>
                  <MaterialIcons name="shopping-cart" size={30} color={colors.info} />
                </View>
                <View style={[styles.statCard, styles.statCard_3]}>
                  <View style={styles.statCardDetails}>
                    <Text style={styles.statLabel}>Lead Score</Text>
                    <Text style={styles.statValue_3}>{selectedCustomer.lead_score || 0}</Text>
                  </View>
                  <MaterialIcons name="trending-up" size={30} color={colors.warning} />
                </View>
                <View style={[styles.statCard, styles.statCard_4]}>
                  <View style={styles.statCardDetails}>
                    <Text style={styles.statLabel}>Total Spent</Text>
                    <Text style={styles.statValue_4}>{formatCurrency(selectedCustomer.totalSpent || 0)}</Text>
                  </View>
                  <MaterialIcons name="account-balance-wallet" size={30} color={colors.secondary} />
                </View>
              </View>

              {/* Contact Information */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Contact Information</Text>
                </View>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailItemBox}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="email" size={16} color={colors.textSecondary} />
                      </View>
                      <View>
                        <Text style={styles.detailLabel}>Email</Text>
                      </View>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>{selectedCustomer.email}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailItemBox}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="phone" size={16} color={colors.textSecondary} />
                      </View>
                      <View>
                        <Text style={styles.detailLabel}>Phone</Text>
                      </View>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>{selectedCustomer.phone}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailItemBox}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="person" size={16} color={colors.textSecondary} />
                      </View>
                      <View>
                        <Text style={styles.detailLabel}>Gender</Text>
                      </View>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>{getGenderLabel(selectedCustomer.gender)}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailItemBox}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="fingerprint" size={16} color={colors.textSecondary} />
                      </View>
                      <View>
                        <Text style={styles.detailLabel}>Serial Number</Text>
                      </View>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>{selectedCustomer.serialNumber || 'N/A'}</Text>
                    </View>
                  </View>
                  
                </View>
              </View>

              {/* Address Information */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Address Information</Text>
                </View>
                <View style={styles.addressCard}>
                  <View style={styles.addressItem}>
                    <MaterialIcons name="home" size={16} color={colors.textSecondary} />
                    <Text style={styles.addressText}>{selectedCustomer.address || 'N/A'}</Text>
                  </View>
                  <View style={styles.addressItem}>
                    <MaterialIcons name="streetview" size={16} color={colors.textSecondary} />
                    <Text style={styles.addressText}>{selectedCustomer.street || 'N/A'}</Text>
                  </View>
                  <View style={styles.addressItem}>
                    <MaterialIcons name="location-city" size={16} color={colors.textSecondary} />
                    <Text style={styles.addressText}>{selectedCustomer.city || 'N/A'}</Text>
                  </View>
                  <View style={styles.addressItem}>
                    <MaterialIcons name="public" size={16} color={colors.textSecondary} />
                    <Text style={styles.addressText}>{selectedCustomer.country || 'N/A'}</Text>
                  </View>
                  <View style={styles.addressItem}>
                    <MaterialIcons name="markunread-mailbox" size={16} color={colors.textSecondary} />
                    <Text style={styles.addressText}>{selectedCustomer.postal_code || 'N/A'}</Text>
                  </View>
                </View>
              </View>

              {/* Professional Information */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Professional Information</Text>
                </View>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailItemBox}>
                      <View style={styles.detailIconContainer}>
                         <MaterialIcons name="business" size={16} color={colors.textSecondary} />
                      </View>
                      <View>
                         <Text style={styles.detailLabel}>Company</Text>
                      </View>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>{selectedCustomer.company || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailItemBox}>
                       <View style={styles.detailIconContainer}>
                          <MaterialIcons name="engineering" size={16} color={colors.textSecondary} />
                       </View>
                       <View>
                          <Text style={styles.detailLabel}>Occupation</Text>
                       </View>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>{selectedCustomer.occupation || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailItemBox}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="language" size={16} color={colors.textSecondary} />
                      </View>
                      <View>
                        <Text style={styles.detailLabel}>Website</Text>
                      </View>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>{selectedCustomer.website || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailItemBox}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="account-tree" size={16} color={colors.textSecondary} />
                      </View>
                      <View>
                        <Text style={styles.detailLabel}>Department</Text>
                      </View>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>{selectedCustomer.department || 'N/A'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <View style={styles.detailItemBox}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="my-location" size={16} color={colors.textSecondary} />
                      </View>
                      <View>
                        <Text style={styles.detailLabel}>Purpose</Text>
                      </View>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>{selectedCustomer.purpose || 'N/A'}</Text>
                    </View>
                  </View>

                </View>
              </View>

              {/* Lead Information */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Lead Information</Text>
                </View>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailItemBox}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="source" size={16} color={colors.textSecondary} />
                      </View>
                      <View>
                        <Text style={styles.detailLabel}>Source</Text>
                      </View>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>{selectedCustomer.source || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailItemBox}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="flag" size={16} color={colors.textSecondary} />
                      </View>
                      <View>
                        <Text style={styles.detailLabel}>Stage</Text>
                      </View>
                    </View>       
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>{selectedCustomer.stage || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailItemBox}>
                      <View style={styles.detailIconContainer}>
                        <MaterialIcons name="share" size={16} color={colors.textSecondary} />
                      </View>
                      <View>
                        <Text style={styles.detailLabel}>Referred To</Text>
                      </View>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>{selectedCustomer.refered_to || 'N/A'}</Text>
                    </View>
                  </View>

                </View>
              </View>

              {/* Tags */}
              {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                <View style={styles.detailSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tags</Text>
                  </View>
                  <View style={styles.tagsContainer}>
                    {selectedCustomer.tags.map((tag, index) => (
                      <View key={index} style={styles.tagChip}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Remarks */}
              {selectedCustomer.remark && (
                <View style={styles.detailSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Remarks</Text>
                  </View>
                  <View style={styles.remarkCard}>
                    <Text style={styles.remarkText}>{selectedCustomer.remark}</Text>
                  </View>
                </View>
              )}

              {/* Custom Metadata */}
              {selectedCustomer.metadata && Object.keys(selectedCustomer.metadata).length > 0 && (
                <View style={styles.detailSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Custom Fields</Text>
                  </View>
                  <View style={styles.detailGrid}>
                    {Object.entries(selectedCustomer.metadata).map(([key, value]) => (
                      <View key={key} style={styles.detailItem}>
                        <View style={styles.detailIconContainer}>
                          <MaterialIcons name="code" size={16} color={colors.textSecondary} />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>{key}</Text>
                          <Text style={styles.detailValue}>{String(value)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* System Information */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>System Information</Text>
                </View>
                <View style={styles.systemCard}>
                  <View style={styles.systemItem}>
                    <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                    <Text style={styles.systemLabel}>Created</Text>
                    <Text style={styles.systemValue}>{formatDate(selectedCustomer.createdAt)}</Text>
                  </View>
                  <View style={styles.systemItem}>
                    <MaterialIcons name="update" size={16} color={colors.textSecondary} />
                    <Text style={styles.systemLabel}>Last Updated</Text>
                    <Text style={styles.systemValue}>{formatDate(selectedCustomer.updatedAt)}</Text>
                  </View>
                  <View style={styles.systemItem}>
                    <MaterialIcons name="tag" size={16} color={colors.textSecondary} />
                    <Text style={styles.systemLabel}>Customer ID</Text>
                    <Text style={styles.systemValue}>#{selectedCustomer.id}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Date Filter Section */}
      <View style={styles.dateFilterContainer}>
        <TouchableOpacity
          style={styles.dateFilterToggle}
          onPress={() => setShowDateFilter(!showDateFilter)}
        >
          <MaterialIcons name="date-range" size={20} color={colors.primary} />
          <Text style={styles.dateFilterText}>{t('date_filter')}</Text>
          <MaterialIcons 
            name={showDateFilter ? 'expand-less' : 'expand-more'} 
            size={20} 
            color={colors.primary} 
          />
        </TouchableOpacity>
        
        {showDateFilter && (
          <View style={styles.dateFilterControls}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>{t('from')}:</Text>
              <TextInput
                style={[styles.dateInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={t('yyyy_mm_dd')}
                value={fromDate}
                onChangeText={setFromDate}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>{t('to')}:</Text>
              <TextInput
                style={[styles.dateInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={t('yyyy_mm_dd')}
                value={toDate}
                onChangeText={setToDate}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <TouchableOpacity
              style={styles.clearDateFilter}
              onPress={() => {
                setFromDate('');
                setToDate('');
              }}
            >
              <MaterialIcons name="clear" size={16} color={colors.error} />
              <Text style={styles.clearDateFilterText}>{t('clear')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.headerControls}>
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>{t('sort_by')}:</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            <MaterialIcons 
              name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} 
              size={16} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortBy('createdAt')}
          >
            <Text style={[styles.sortText, sortBy === 'createdAt' && styles.activeSort]}>{t('date')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortBy('name')}
          >
            <Text style={[styles.sortText, sortBy === 'name' && styles.activeSort]}>{t('name')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortBy('value')}
          >
            <Text style={[styles.sortText, sortBy === 'value' && styles.activeSort]}>{t('value')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortBy('status')}
          >
            <Text style={[styles.sortText, sortBy === 'status' && styles.activeSort]}>{t('status')}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.viewModeButton}
          onPress={() => onViewModeChange && onViewModeChange(viewMode === 'list' ? 'grid' : 'list')}
        >
          <MaterialIcons 
            name={viewMode === 'list' ? 'view-module' : 'view-list'} 
            size={20} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPaginationControls = () => {
    // Calculate total pages based on total customers (626 customers / 10 per page = 63 pages)
    const calculatedTotalPages = Math.ceil((totalCustomers || customers.length) / 10);
    const effectiveTotalPages = totalPages || calculatedTotalPages;
    
    // Always show pagination if we have more than 10 customers or if we're on page 2+
    const shouldShowPagination = customers.length > 10 || (currentPage || 1) > 1 || effectiveTotalPages > 1;
    
    if (!shouldShowPagination) return null;
    
    return (
      <View style={styles.paginationBar}>
        <TouchableOpacity
          style={styles.paginationBtn}
          onPress={() => onPageChange && onPageChange(Math.max(1, (currentPage || 1) - 1))}
          disabled={(currentPage || 1) === 1}
        >
          <MaterialIcons name="chevron-left" size={22} color={(currentPage || 1) === 1 ? '#cbd5e1' : '#6366f1'} />
        </TouchableOpacity>
        <Text style={styles.paginationText}>
          {t('page')} {currentPage || 1} {t('of')} {effectiveTotalPages} | {t('total')}: {totalCustomers || customers.length}
        </Text>
        <TouchableOpacity
          style={styles.paginationBtn}
          onPress={() => onPageChange && onPageChange(Math.min(effectiveTotalPages, (currentPage || 1) + 1))}
          disabled={(currentPage || 1) === effectiveTotalPages}
        >
          <MaterialIcons name="chevron-right" size={22} color={(currentPage || 1) === effectiveTotalPages ? '#cbd5e1' : '#6366f1'} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && customers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('loading_customers')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {renderHeader()}
      
      <FlatList
        data={filteredCustomers}
        renderItem={viewMode === 'list' ? renderCustomerCard : renderGridItem}
        keyExtractor={(item) => item.id.toString()}
        key={viewMode}
        numColumns={viewMode === 'grid' ? 2 : 1}
        contentContainerStyle={[viewMode === 'grid' ? styles.gridContainer : styles.listContainer, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>{t('no_customers_found')}</Text>
            <Text style={styles.emptyText}>{t('start_by_adding_first_customer')}</Text>
          </View>
        }
      />

      {/* Pagination controls at the bottom */}
      {renderPaginationControls()}

      {renderCustomerDetailsModal()}
      {/* Add CustomerForm modal for editing */}
      {showEditModal && (
        <CustomerForm
          initialValues={editCustomer}
          onSubmit={(data) => {
            onCustomerEdit(data);
            setShowEditModal(false);
            setEditCustomer(undefined);
          }}
          loading={false}
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditCustomer(undefined);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f8fafc', // REMOVE or replace
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  sortButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  sortText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeSort: {
    color: '#6366f1',
    fontWeight: '600',
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  listContainer: {
    padding: 16,
  },
  gridContainer: {
    padding: 8,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  customerCardEven: {
    backgroundColor: '#f8fafc',
  },
  customerCardOdd: {
    backgroundColor: '#fff',
  },
  customerCardHighlighted: {
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  customerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  badgeLOW: { backgroundColor: '#6B7280' },
  badgeMEDIUM: { backgroundColor: '#3B82F6' },
  badgeHIGH: { backgroundColor: '#F59E0B' },
  badgeURGENT: { backgroundColor: '#EF4444' },
  customerCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardIcon: {
    marginRight: 6,
  },
  customerCardLabel: {
    fontSize: 13,
    color: '#64748b',
    marginRight: 4,
    fontWeight: '500',
  },
  customerCardValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '400',
  },
  customerCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 12,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 4,
  },
  cardActionText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 4,
  },
  gridItem: {
    flex: 1,
    margin: 4,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    minHeight: 120,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridActions: {
    flexDirection: 'row',
    gap: 4,
  },
  gridName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  gridEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  gridStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  gridValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: isLargeScreen ? 1000 : '95%',
    maxWidth: 1200,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#eeeeee',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  customerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'black',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    flexDirection:'row',
    justifyContent:'space-between',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    borderWidth:1,
  },
  statCard_1:{
    borderColor:'#10b981',
    // backgroundColor:'lightgreen'
  },
  statCard_2:{
    borderColor:'#3b82f6',
    // backgroundColor:'#f1f5f9'
  },
  statCard_3:{
    borderColor:'#f59e0b',
    // backgroundColor:'lighterorange'
  },
  statCard_4:{
    borderColor:'#8b5cf6',
    // backgroundColor:'lightpurple'
  },
  statCardDetails: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight:700,
    marginBottom: 4,
  },
  statValue_1:{
    color:'#10b981'
  },
  statValue_2:{
    color:'#3b82f6'
  },
  statValue_3:{
    color:'#f59e0b'
  },
  statValue_4:{
    color:'#8b5cf6'
  },
  statLabel: {
    fontSize: 12,
    fontWeight:700,
    color: '#6b7280',
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailGrid: {
    flexDirection: isLargeScreen ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    width: isLargeScreen ? '48%' : '100%',
    marginBottom: 12,
  },
  detailItemBox:{
    flexDirection:'row',
    marginBottom:5
  },
  detailIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#0f172a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  remarkCard: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  remarkText: {
    fontSize: 16,
    color: '#0f172a',
    lineHeight: 24,
  },
  addressCard: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap:12
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
  },
  systemCard: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  systemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap:12
  },
  systemLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  systemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  tagChip: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
    marginRight: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#6b7280',
  },
  paginationContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop:100
  },
  paginationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paginationText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paginationButtonDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginHorizontal: 4,
  },
  paginationButtonTextDisabled: {
    color: '#9ca3af',
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 4,
  },
  pageNumberButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pageNumberButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  pageNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  pageNumberTextActive: {
    color: 'white',
  },
  dateFilterContainer: {
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateFilterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  dateFilterText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  dateFilterControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },
  dateInputContainer: {
    flex: 1,
    marginTop: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  clearDateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clearDateFilterText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 4,
  },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 12,
  },
  paginationBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 6,
  },
  paginationText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },

});

export default CustomerList; 
