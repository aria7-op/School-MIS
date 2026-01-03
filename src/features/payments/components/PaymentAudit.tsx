import React, { useState, useMemo } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  FlatList,
  Card,
  Badge,
  Input,
  Select,
  useToast,
  Spinner,
  Divider,
  Avatar,
  Icon,
  Timeline,
  TimelineItem,
  TimelineIcon,
  TimelineText,
  TimelineSeparator,
  TimelineTrack,
  TimelineContent,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import usePaymentsApi from '../hooks/usePaymentsApi';

interface PaymentAuditProps {
  paymentId?: number;
}

const PaymentAudit: React.FC<PaymentAuditProps> = ({ paymentId }) => {
  const { payments, loading } = usePaymentsApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('');
  const toast = useToast();

  // Mock audit data - in real app, this would come from the API
  const auditLogs = useMemo(() => {
    const mockLogs = [
      {
        id: 1,
        paymentId: 1,
        action: 'created',
        userId: 1,
        userName: 'John Admin',
        userEmail: 'admin@school.com',
        timestamp: '2024-01-15T10:30:00Z',
        details: {
          amount: 500,
          paymentType: 'tuition',
          status: 'pending',
        },
        changes: null,
      },
      {
        id: 2,
        paymentId: 1,
        action: 'updated',
        userId: 2,
        userName: 'Jane Teacher',
        userEmail: 'jane@school.com',
        timestamp: '2024-01-15T14:20:00Z',
        details: null,
        changes: {
          status: { from: 'pending', to: 'completed' },
          amount: { from: 500, to: 450 },
        },
      },
      {
        id: 3,
        paymentId: 1,
        action: 'deleted',
        userId: 1,
        userName: 'John Admin',
        userEmail: 'admin@school.com',
        timestamp: '2024-01-16T09:15:00Z',
        details: {
          reason: 'Duplicate payment',
        },
        changes: null,
      },
      {
        id: 4,
        paymentId: 2,
        action: 'created',
        userId: 3,
        userName: 'Bob Staff',
        userEmail: 'bob@school.com',
        timestamp: '2024-01-16T11:45:00Z',
        details: {
          amount: 300,
          paymentType: 'exam',
          status: 'completed',
        },
        changes: null,
      },
      {
        id: 5,
        paymentId: 3,
        action: 'updated',
        userId: 1,
        userName: 'John Admin',
        userEmail: 'admin@school.com',
        timestamp: '2024-01-17T16:30:00Z',
        details: null,
        changes: {
          paymentType: { from: 'library', to: 'tuition' },
          amount: { from: 200, to: 250 },
        },
      },
    ];

    let filtered = mockLogs;

    if (paymentId) {
      filtered = filtered.filter(log => log.paymentId === paymentId);
    }

    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterAction) {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    if (filterUser) {
      filtered = filtered.filter(log => log.userId.toString() === filterUser);
    }

    if (filterDateRange) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filterDateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(log => new Date(log.timestamp) >= filterDate);
    }

    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [paymentId, searchQuery, filterAction, filterUser, filterDateRange]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'green';
      case 'updated': return 'blue';
      case 'deleted': return 'red';
      case 'viewed': return 'gray';
      default: return 'gray';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return 'add';
      case 'updated': return 'edit';
      case 'deleted': return 'delete';
      case 'viewed': return 'visibility';
      default: return 'info';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderAuditItem = ({ item }: { item: any }) => (
    <Card p={4} mb={3} borderRadius="lg" shadow={1}>
      <VStack space={3}>
        <HStack space={3} alignItems="center" justifyContent="space-between">
          <HStack space={3} alignItems="center" flex={1}>
            <Avatar
              size="sm"
              bg="blue.500"
            >
              {item.userName.split(' ').map((n: string) => n[0]).join('')}
            </Avatar>
            
            <VStack flex={1}>
              <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                {item.userName}
              </Text>
              <Text fontSize="xs" color="coolGray.500">
                {item.userEmail}
              </Text>
            </VStack>
          </HStack>
          
          <VStack alignItems="flex-end" space={1}>
            <Badge colorScheme={getActionColor(item.action)} variant="subtle">
              {item.action.toUpperCase()}
            </Badge>
            <Text fontSize="xs" color="coolGray.500">
              {formatTimestamp(item.timestamp)}
            </Text>
          </VStack>
        </HStack>
        
        <Divider />
        
        <VStack space={2}>
          <HStack space={2} alignItems="center">
            <Icon as={MaterialIcons} name={getActionIcon(item.action)} size="sm" color="coolGray.500" />
            <Text fontSize="sm" color="coolGray.700">
              Payment ID: {item.paymentId}
            </Text>
          </HStack>
          
          {item.details && (
            <Box bg="coolGray.50" p={3} borderRadius="md">
              <Text fontSize="sm" fontWeight="semibold" color="coolGray.800" mb={2}>
                Details:
              </Text>
              {item.details.amount && (
                <Text fontSize="xs" color="coolGray.600">
                  Amount: {formatCurrency(item.details.amount)}
                </Text>
              )}
              {item.details.paymentType && (
                <Text fontSize="xs" color="coolGray.600">
                  Type: {item.details.paymentType}
                </Text>
              )}
              {item.details.status && (
                <Text fontSize="xs" color="coolGray.600">
                  Status: {item.details.status}
                </Text>
              )}
              {item.details.reason && (
                <Text fontSize="xs" color="coolGray.600">
                  Reason: {item.details.reason}
                </Text>
              )}
            </Box>
          )}
          
          {item.changes && (
            <Box bg="blue.50" p={3} borderRadius="md">
              <Text fontSize="sm" fontWeight="semibold" color="blue.800" mb={2}>
                Changes:
              </Text>
              {Object.entries(item.changes).map(([field, change]: [string, any]) => (
                <Text key={field} fontSize="xs" color="blue.700">
                  {field}: {change.from} → {change.to}
                </Text>
              ))}
            </Box>
          )}
        </VStack>
      </VStack>
    </Card>
  );

  const renderTimelineView = () => (
    <VStack space={4}>
      {auditLogs.map((log, index) => (
        <TimelineItem key={log.id}>
          <TimelineSeparator>
            <TimelineIcon
              bg={`${getActionColor(log.action)}.500`}
              icon={<Icon as={MaterialIcons} name={getActionIcon(log.action)} size="xs" color="white" />}
            />
            {index < auditLogs.length - 1 && <TimelineTrack />}
          </TimelineSeparator>
          <TimelineContent>
            <Card p={3} bg="white" shadow={1}>
              <VStack space={2}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="sm" fontWeight="bold" color="coolGray.800">
                    {log.userName}
                  </Text>
                  <Text fontSize="xs" color="coolGray.500">
                    {formatTimestamp(log.timestamp)}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="coolGray.600">
                  {log.action} payment #{log.paymentId}
                </Text>
                {log.details?.reason && (
                  <Text fontSize="xs" color="coolGray.600" fontStyle="italic">
                    Reason: {log.details.reason}
                  </Text>
                )}
              </VStack>
            </Card>
          </TimelineContent>
        </TimelineItem>
      ))}
    </VStack>
  );

  const renderHeader = () => (
    <VStack space={4} mb={4}>
      <Box>
        <Text fontSize="xl" fontWeight="bold" color="coolGray.800">
          Payment Audit Log
        </Text>
        <Text fontSize="sm" color="coolGray.600" mt={1}>
          Track all changes and activities related to payments
        </Text>
      </Box>
      
      <HStack space={3} alignItems="center">
        <Input
          placeholder="Search audit logs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          flex={1}
          borderRadius="md"
          InputLeftElement={
            <Icon as={MaterialIcons} name="search" size="sm" color="coolGray.400" ml={2} />
          }
        />
        
        <Select
          selectedValue={filterAction}
          onValueChange={setFilterAction}
          placeholder="Action"
          minW="100"
          borderRadius="md"
        >
          <Select.Item label="All Actions" value="" />
          <Select.Item label="Created" value="created" />
          <Select.Item label="Updated" value="updated" />
          <Select.Item label="Deleted" value="deleted" />
          <Select.Item label="Viewed" value="viewed" />
        </Select>
      </HStack>
      
      <HStack space={3} alignItems="center">
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
    </VStack>
  );

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={2} color="coolGray.600">Loading audit logs...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="coolGray.50">
      <Box p={4}>
        {renderHeader()}
        
        {auditLogs.length === 0 ? (
          <Box p={4} alignItems="center">
            <Icon as={MaterialIcons} name="history" size="xl" color="coolGray.400" />
            <Text mt={2} color="coolGray.600" textAlign="center">
              No audit logs found
            </Text>
          </Box>
        ) : (
          <FlatList
            data={auditLogs}
            renderItem={renderAuditItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Box>
    </Box>
  );
};

export default PaymentAudit; 
