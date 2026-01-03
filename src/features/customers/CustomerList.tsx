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
import { Customer } from './types';
import { useTranslation } from '../../contexts/TranslationContext';

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
  const toast = useToast();

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
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      case 'converted':
        return 'info';
      case 'lost':
        return 'error';
      default:
        return 'muted';
    }
  };

  const getCustomerPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'muted';
    }
  };

  const renderDetailRow = (icon: string, label: string, value: string) => (
    <HStack space={2} alignItems="center" mb={2}>
      <Icon as={Ionicons} name={icon} size="sm" color="coolGray.500" />
      <Text fontSize="sm" color="coolGray.600" flex={1}>
        {t(label)}:
      </Text>
      <Text fontSize="sm" color="coolGray.800" flex={2}>
        {value || t('n_a')}
      </Text>
    </HStack>
  );

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const isSelected = selectedCustomers.includes(item.id);
    const menuOpen = menuVisible === item.id;

    return (
      <Card mb={3} borderRadius="lg" shadow={2}>
        <Card.Body>
          <VStack space={3}>
            <HStack space={3} alignItems="center" justifyContent="space-between">
              <HStack space={3} alignItems="center" flex={1}>
                <Checkbox
                  value={item.id.toString()}
                  isChecked={isSelected}
                  onChange={() => handleCustomerSelect(item.id)}
                  colorScheme="blue"
                />
                <Pressable onPress={() => toggleExpand(item.id)} flex={1}>
                  <HStack space={3} alignItems="center">
                    <Box
                      w={12}
                      h={12}
                      borderRadius="full"
                      bg="blue.500"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text color="white" fontSize="lg" fontWeight="bold">
                        {item.name?.charAt(0)?.toUpperCase() || 'C'}
                      </Text>
                    </Box>
                    <VStack flex={1}>
                      <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                        {item.name}
                      </Text>
                      <Text fontSize="sm" color="coolGray.600">
                        {item.phone || item.email || t('no_phone')}
                      </Text>
                      <HStack space={2} mt={1}>
                        <Badge
                          colorScheme={getCustomerStatusColor(item.status)}
                          variant="subtle"
                          size="sm"
                        >
                          {t(item.status?.toLowerCase() || 'unknown')}
                        </Badge>
                        {item.priority && (
                          <Badge
                            colorScheme={getCustomerPriorityColor(item.priority)}
                            variant="subtle"
                            size="sm"
                          >
                            {item.priority}
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>
                </Pressable>
              </HStack>
              
              <Menu
                isOpen={menuOpen}
                onClose={() => setMenuVisible(null)}
                trigger={(triggerProps) => (
                  <Pressable
                    {...triggerProps}
                    onPress={() => setMenuVisible(item.id)}
                    p={2}
                  >
                    <Icon as={MaterialIcons} name="more-vert" size="sm" color="coolGray.500" />
                  </Pressable>
                )}
              >
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    onCustomerSelect(item);
                  }}
                  leftIcon={<Icon as={MaterialIcons} name="visibility" size="sm" />}
                >
                  View Details
                </Menu.Item>
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    onEdit(item);
                  }}
                  leftIcon={<Icon as={MaterialIcons} name="edit" size="sm" />}
                >
                  Edit
                </Menu.Item>
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    onCustomerDelete(item.id);
                  }}
                  leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" />}
                  _text={{ color: 'red.500' }}
                >
                  Delete
                </Menu.Item>
              </Menu>
            </HStack>

            <Collapsible collapsed={expandedId !== item.id}>
              <VStack space={3} mt={2}>
                <Divider />
                
                <VStack space={2}>
                  {renderDetailRow('person', 'full_name', item.name)}
                  {renderDetailRow('call', 'phone', item.phone || '')}
                  {renderDetailRow('mail', 'email', item.email || '')}
                  {renderDetailRow('transgender', 'gender', item.gender)}
                  {renderDetailRow('briefcase', 'purpose', item.purpose)}
                  {renderDetailRow('compass', 'source', item.source)}
                  {renderDetailRow('business', 'department', item.department)}
                  {renderDetailRow('id-card', 'added_by', `User ${item.added_by}`)}
                </VStack>

                {item.remark && (
                  <VStack space={2}>
                    <Text fontSize="sm" fontWeight="bold" color="coolGray.700">
                      {t('remarks')}
                    </Text>
                    <Text fontSize="sm" color="coolGray.600">
                      {item.remark}
                    </Text>
                  </VStack>
                )}

                <HStack space={2} flexWrap="wrap">
                  {item.source && (
                    <Badge colorScheme="blue" variant="outline" size="sm">
                      {item.source}
                    </Badge>
                  )}
                  {item.department && (
                    <Badge colorScheme="purple" variant="outline" size="sm">
                      {item.department}
                    </Badge>
                  )}
                  {item.tags && item.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} colorScheme="gray" variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </HStack>

                <HStack space={4} justifyContent="space-between">
                  <HStack space={2} alignItems="center">
                    <Icon as={Ionicons} name="cash" size="sm" color="green.500" />
                    <Text fontSize="sm" color="coolGray.700">
                      ${item.total_value?.toLocaleString() || '0'}
                    </Text>
                  </HStack>
                  <HStack space={2} alignItems="center">
                    <Icon as={MaterialIcons} name="shopping-cart" size="sm" color="blue.500" />
                    <Text fontSize="sm" color="coolGray.700">
                      {item.total_interactions || 0} interactions
                    </Text>
                  </HStack>
                  <HStack space={2} alignItems="center">
                    <Icon as={MaterialIcons} name="star" size="sm" color="yellow.500" />
                    <Text fontSize="sm" color="coolGray.700">
                      {item.lead_score || 'N/A'}
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            </Collapsible>
          </VStack>
        </Card.Body>
      </Card>
    );
  };

  const renderHeader = () => (
    <Box mb={4}>
      <HStack space={3} alignItems="center" justifyContent="space-between">
        <VStack>
          <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
            {t('customers')} ({customers.length})
          </Text>
          <Text fontSize="sm" color="coolGray.600">
            {t('manage_customer_relationships')}
          </Text>
        </VStack>
        
        {selectedCustomers.length > 0 && (
          <Button
            colorScheme="red"
            size="sm"
            leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" />}
            onPress={handleBulkDelete}
          >
            Delete ({selectedCustomers.length})
          </Button>
        )}
      </HStack>
    </Box>
  );

  const renderEmptyState = () => (
    <Box flex={1} justifyContent="center" alignItems="center" py={10}>
      <Icon as={Ionicons} name="people-outline" size="4xl" color="coolGray.300" mb={4} />
      <Text fontSize="lg" color="coolGray.500" textAlign="center" mb={2}>
        {t('no_customers')}
      </Text>
      <Text fontSize="sm" color="coolGray.400" textAlign="center" mb={4}>
        {loading ? t('loading_customers') : t('start_by_adding_first_customer')}
      </Text>
      {!loading && (
        <Button
          colorScheme="blue"
          leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
          onPress={() => onEdit({} as Customer)}
        >
          {t('add_customer')}
        </Button>
      )}
    </Box>
  );

  if (loading && !refreshing && customers.length === 0) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} color="coolGray.600">
          {t('loading_customers')}
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" p={5}>
        <Icon as={MaterialIcons} name="error" size="4xl" color="red.500" mb={4} />
        <Text fontSize="lg" color="red.600" textAlign="center" mb={4}>
          {t('failed_to_load_customers')}
        </Text>
        <Button
          colorScheme="blue"
          onPress={onRefresh}
          leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
        >
          {t('try_again')}
        </Button>
      </Box>
    );
  }

  return (
    <Box flex={1}>
      {renderHeader()}
      
      <FlatList
        data={customers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={customers.length === 0 ? { flex: 1 } : undefined}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
      />
    </Box>
  );
};

export default CustomerList;
