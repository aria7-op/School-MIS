import React, { useState, useMemo } from 'react';
import { FlatList } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  Badge,
  Button,
  Input,
  Select,
  Checkbox,
  IconButton,
  useToast,
  Spinner,
  Divider,
  Pressable,
  Modal,
  FormControl,
  TextArea,
  Avatar,
  Icon,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import usePaymentsApi, { Payment } from '../hooks/usePaymentsApi';

interface PaymentListProps {
  onViewPayment?: (payment: Payment) => void;
  onEditPayment?: (payment: Payment) => void;
  onDeletePayment?: (paymentId: number) => void;
  showBulkActions?: boolean;
}

const PaymentList: React.FC<PaymentListProps> = ({
  onViewPayment,
  onEditPayment,
  onDeletePayment,
  showBulkActions = true,
}) => {
  const { payments, loading, error, deletePayment } = usePaymentsApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const toast = useToast();

  const paymentTypes = useMemo(() => {
    const types = payments?.map((p: Payment) => p.paymentType).filter(Boolean) || [];
    return [...new Set(types)];
  }, [payments]);

  const filteredPayments = useMemo(() => {
    let filtered = payments || [];

    if (searchQuery) {
      filtered = filtered.filter((p: Payment) =>
        p.student?.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.student?.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.student?.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus) {
      filtered = filtered.filter((p: Payment) => p.status === filterStatus);
    }

    if (filterType) {
      filtered = filtered.filter((p: Payment) => p.paymentType === filterType);
    }

    if (filterDateRange) {
      const today = new Date();
      const filterDate = new Date();
      
      switch (filterDateRange) {
        case 'today':
          filtered = filtered.filter((p: Payment) => {
            const paymentDate = new Date(p.paymentDate);
            return paymentDate.toDateString() === today.toDateString();
          });
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter((p: Payment) => {
            const paymentDate = new Date(p.paymentDate);
            return paymentDate >= filterDate;
          });
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter((p: Payment) => {
            const paymentDate = new Date(p.paymentDate);
            return paymentDate >= filterDate;
          });
          break;
      }
    }

    return filtered.sort((a: Payment, b: Payment) => 
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  }, [payments, searchQuery, filterStatus, filterType, filterDateRange]);

  const handleSelectPayment = (paymentId: number) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === filteredPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(filteredPayments.map((p: Payment) => p.id));
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      await deletePayment(paymentToDelete.id, { reason: deleteReason });
      toast.show({
        description: 'Payment deleted successfully',
        placement: 'top',
      });
      setShowDeleteModal(false);
      setDeleteReason('');
      setPaymentToDelete(null);
    } catch (err: any) {
      toast.show({
        description: err.message || 'Failed to delete payment',
        placement: 'top',
      });
    }
  };

  const confirmDelete = (payment: Payment) => {
    setPaymentToDelete(payment);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'orange';
      case 'failed': return 'red';
      case 'cancelled': return 'gray';
      default: return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tuition': return 'blue';
      case 'exam': return 'purple';
      case 'library': return 'cyan';
      case 'transport': return 'orange';
      case 'other': return 'gray';
      default: return 'gray';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <Card p={4} mb={3} borderRadius="lg" shadow={1}>
      <VStack space={3}>
        <HStack space={3} alignItems="center" justifyContent="space-between">
          <HStack space={3} alignItems="center" flex={1}>
            {showBulkActions && (
              <Checkbox
                value={item.id.toString()}
                isChecked={selectedPayments.includes(item.id)}
                onChange={() => handleSelectPayment(item.id)}
                colorScheme="blue"
              />
            )}
            
            <Avatar
              size="sm"
              bg="blue.500"
              source={{ uri: item.student?.user?.profilePicture }}
            >
              {item.student?.user?.firstName?.[0]}{item.student?.user?.lastName?.[0]}
            </Avatar>
            
            <VStack flex={1}>
              <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                {item.student?.user?.firstName} {item.student?.user?.lastName}
              </Text>
              <Text fontSize="xs" color="coolGray.500">
                {item.student?.user?.email}
              </Text>
            </VStack>
          </HStack>
          
          <VStack alignItems="flex-end" space={1}>
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {formatCurrency(item.amount)}
            </Text>
            <Badge colorScheme={getStatusColor(item.status)} variant="subtle">
              {item.status}
            </Badge>
          </VStack>
        </HStack>
        
        <Divider />
        
        <HStack space={4} alignItems="center" justifyContent="space-between">
          <VStack space={1} flex={1}>
            <HStack space={2} alignItems="center">
              <Badge colorScheme={getTypeColor(item.paymentType)} variant="subtle">
                {item.paymentType}
              </Badge>
              <Text fontSize="xs" color="coolGray.500">
                Ref: {item.referenceNumber}
              </Text>
            </HStack>
            
            <Text fontSize="xs" color="coolGray.500">
              {formatDate(item.paymentDate)}
            </Text>
            
            {item.paymentMethod && (
              <Text fontSize="xs" color="coolGray.500">
                Method: {item.paymentMethod}
              </Text>
            )}
          </VStack>
          
          <VStack space={1}>
            {onViewPayment && (
              <IconButton
                icon={<Icon as={MaterialIcons} name="visibility" size="sm" />}
                variant="ghost"
                colorScheme="blue"
                onPress={() => onViewPayment(item)}
                size="sm"
              />
            )}
            
            {onEditPayment && (
              <IconButton
                icon={<Icon as={MaterialIcons} name="edit" size="sm" />}
                variant="ghost"
                colorScheme="orange"
                onPress={() => onEditPayment(item)}
                size="sm"
              />
            )}
            
            {onDeletePayment && (
              <IconButton
                icon={<Icon as={MaterialIcons} name="delete" size="sm" />}
                variant="ghost"
                colorScheme="red"
                onPress={() => confirmDelete(item)}
                size="sm"
              />
            )}
          </VStack>
        </HStack>
        
        {item.notes && (
          <>
            <Divider />
            <Text fontSize="xs" color="coolGray.600" fontStyle="italic">
              {item.notes}
            </Text>
          </>
        )}
      </VStack>
    </Card>
  );

  const renderHeader = () => (
    <VStack space={4} mb={4}>
      <HStack space={3} alignItems="center">
        <Input
          placeholder="Search payments..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          flex={1}
          borderRadius="md"
          InputLeftElement={
            <Icon as={MaterialIcons} name="search" size="sm" color="coolGray.400" ml={2} />
          }
        />
        
        <Select
          selectedValue={filterStatus}
          onValueChange={setFilterStatus}
          placeholder="Status"
          minW="100"
          borderRadius="md"
        >
          <Select.Item label="All Status" value="" />
          <Select.Item label="Completed" value="completed" />
          <Select.Item label="Pending" value="pending" />
          <Select.Item label="Failed" value="failed" />
          <Select.Item label="Cancelled" value="cancelled" />
        </Select>
      </HStack>
      
      <HStack space={3} alignItems="center">
        <Select
          selectedValue={filterType}
          onValueChange={setFilterType}
          placeholder="Type"
          minW="100"
          borderRadius="md"
        >
          <Select.Item label="All Types" value="" />
          {paymentTypes.map((type: string) => (
            <Select.Item key={type} label={type} value={type} />
          ))}
        </Select>
        
        <Select
          selectedValue={filterDateRange}
          onValueChange={setFilterDateRange}
          placeholder="Date Range"
          minW="120"
          borderRadius="md"
        >
          <Select.Item label="All Time" value="" />
          <Select.Item label="Today" value="today" />
          <Select.Item label="This Week" value="week" />
          <Select.Item label="This Month" value="month" />
        </Select>
      </HStack>
      
      {showBulkActions && selectedPayments.length > 0 && (
        <Card p={3} bg="blue.50" borderColor="blue.200">
          <HStack space={3} alignItems="center" justifyContent="space-between">
            <Text fontSize="sm" color="blue.700">
              {selectedPayments.length} payment(s) selected
            </Text>
            <Button
              size="sm"
              variant="outline"
              colorScheme="blue"
              onPress={() => setSelectedPayments([])}
            >
              Clear Selection
            </Button>
          </HStack>
        </Card>
      )}
    </VStack>
  );

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={2} color="coolGray.600">Loading payments...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" p={4}>
        <Icon as={MaterialIcons} name="error" size="xl" color="red.500" />
        <Text mt={2} color="red.600" textAlign="center">
          Error loading payments: {error}
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1}>
      {renderHeader()}
      
      <FlatList
        data={filteredPayments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Box p={4} alignItems="center">
            <Icon as={MaterialIcons} name="payment" size="xl" color="coolGray.400" />
            <Text mt={2} color="coolGray.600" textAlign="center">
              No payments found
            </Text>
          </Box>
        }
      />
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md">
        <Modal.Content>
          <Modal.Header>Confirm Delete</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <Text>
                Are you sure you want to delete payment{' '}
                <Text fontWeight="bold">
                  {paymentToDelete?.referenceNumber}
                </Text>?
              </Text>
              <Text fontSize="sm" color="coolGray.600">
                This action cannot be undone.
              </Text>
              <FormControl>
                <FormControl.Label>Reason for deletion</FormControl.Label>
                <Input
                  placeholder="Enter reason for deletion..."
                  value={deleteReason}
                  onChangeText={setDeleteReason}
                  multiline
                  numberOfLines={3}
                />
              </FormControl>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onPress={handleDeletePayment}>
                Delete
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default PaymentList; 
