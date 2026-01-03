import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Icon,
  useToast,
  Spinner,
  Badge,
  Input,
  TextArea,
} from 'native-base';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import useCustomerSegments from '../../hooks/useCustomerSegments';

interface SegmentsManagerProps {
  customers: any[];
  getSegments: (filters?: any) => Promise<any>;
  onCustomerSelect: (customer: any) => void;
  loading?: boolean;
}

const SegmentsManager: React.FC<SegmentsManagerProps> = ({
  customers,
  getSegments,
  onCustomerSelect,
  loading = false,
}) => {
  const [segments, setSegments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
    criteria: '',
    color: 'blue',
  });
  const toast = useToast();
  const { loading: customerSegmentsLoading, error: customerSegmentsError, segments: customerSegments } = useCustomerSegments('demo-customer-id');

  const segmentColors = [
    { key: 'blue', label: 'Blue' },
    { key: 'green', label: 'Green' },
    { key: 'purple', label: 'Purple' },
    { key: 'orange', label: 'Orange' },
    { key: 'red', label: 'Red' },
    { key: 'pink', label: 'Pink' },
  ];

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    try {
      setIsLoading(true);
      const data = await getSegments();
      setSegments(data || []);
    } catch (error: any) {
      
      toast.show({
        description: error.message || 'Failed to load segments',
        variant: 'solid',
        placement: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSegment = async () => {
    try {
      // This would call the backend API to create a segment
      const segment = {
        id: Date.now(),
        ...newSegment,
        customerCount: 0,
        createdAt: new Date().toISOString(),
      };
      
      setSegments([...segments, segment]);
      setNewSegment({ name: '', description: '', criteria: '', color: 'blue' });
      setShowCreateForm(false);
      
      toast.show({
        description: 'Segment created successfully',
        variant: 'solid',
        placement: 'top',
      });
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to create segment',
        variant: 'solid',
        placement: 'top',
      });
    }
  };

  const renderSegmentCard = (segment: any) => {
    const segmentCustomers = customers.filter(customer => {
      // Simple filtering logic - in real app, this would be more sophisticated
      if (segment.criteria) {
        return customer.name?.toLowerCase().includes(segment.criteria.toLowerCase()) ||
               customer.email?.toLowerCase().includes(segment.criteria.toLowerCase());
      }
      return false;
    });

    return (
      <Card p={4} borderRadius="lg" shadow={2} mb={4}>
        <VStack space={3}>
          <HStack space={3} alignItems="center" justifyContent="space-between">
            <HStack space={2} alignItems="center">
              <Box
                w={4}
                h={4}
                borderRadius="full"
                bg={`${segment.color}.500`}
              />
              <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
                {segment.name}
              </Text>
              <Badge colorScheme={segment.color} variant="subtle" size="sm">
                {segmentCustomers.length} customers
              </Badge>
            </HStack>
            <HStack space={2}>
              <Button
                size="sm"
                variant="outline"
                colorScheme="blue"
                onPress={() => onCustomerSelect(segmentCustomers[0])}
              >
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorScheme="red"
              >
                Delete
              </Button>
            </HStack>
          </HStack>
          
          <Text fontSize="sm" color="coolGray.600">
            {segment.description}
          </Text>
          
          <VStack space={2}>
            <Text fontSize="xs" fontWeight="medium" color="coolGray.700">
              Criteria: {segment.criteria}
            </Text>
            <Text fontSize="xs" color="coolGray.500">
              Created: {new Date(segment.createdAt).toLocaleDateString()}
            </Text>
          </VStack>

          {/* Sample customers in segment */}
          {segmentCustomers.length > 0 && (
            <VStack space={2}>
              <Text fontSize="sm" fontWeight="medium" color="coolGray.700">
                Sample Customers:
              </Text>
              {segmentCustomers.slice(0, 3).map((customer: any) => (
                <HStack key={customer.id} space={2} alignItems="center">
                  <Box
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg={`${segment.color}.300`}
                  />
                  <Text fontSize="xs" color="coolGray.600" flex={1}>
                    {customer.name}
                  </Text>
                  <Text fontSize="xs" color="coolGray.500">
                    {customer.email}
                  </Text>
                </HStack>
              ))}
              {segmentCustomers.length > 3 && (
                <Text fontSize="xs" color="coolGray.500">
                  +{segmentCustomers.length - 3} more customers
                </Text>
              )}
            </VStack>
          )}
        </VStack>
      </Card>
    );
  };

  if (loading || isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} color="coolGray.600">
          Loading segments...
        </Text>
      </Box>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Box p={4}>
        {/* Header */}
        <Card p={4} mb={4} borderRadius="lg" shadow={2}>
          <VStack space={3}>
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="category" size="md" color="blue.500" />
              <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
                Customer Segments
              </Text>
            </HStack>
            <Text fontSize="sm" color="coolGray.600">
              Organize your customers into meaningful segments for better targeting
            </Text>
            <HStack space={2}>
              <Button
                size="sm"
                variant="outline"
                colorScheme="blue"
                leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
                onPress={loadSegments}
              >
                Refresh
              </Button>
              <Button
                size="sm"
                colorScheme="green"
                leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
                onPress={() => setShowCreateForm(true)}
              >
                Create Segment
              </Button>
            </HStack>
          </VStack>
        </Card>

        {/* Create Segment Form */}
        {showCreateForm && (
          <Card p={4} mb={4} borderRadius="lg" shadow={2}>
            <VStack space={4}>
              <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                Create New Segment
              </Text>
              
              <VStack space={3}>
                <Input
                  placeholder="Segment Name"
                  value={newSegment.name}
                  onChangeText={(text) => setNewSegment({ ...newSegment, name: text })}
                />
                
                <TextArea
                  placeholder="Description"
                  value={newSegment.description}
                  onChangeText={(text) => setNewSegment({ ...newSegment, description: text })}
                  autoCompleteType={undefined}
                />
                
                <Input
                  placeholder="Search Criteria (e.g., 'premium', 'active')"
                  value={newSegment.criteria}
                  onChangeText={(text) => setNewSegment({ ...newSegment, criteria: text })}
                />
                
                <VStack space={2}>
                  <Text fontSize="sm" fontWeight="medium" color="coolGray.700">
                    Segment Color:
                  </Text>
                  <HStack space={2} flexWrap="wrap">
                    {segmentColors.map((color) => (
                      <Button
                        key={color.key}
                        size="sm"
                        variant={newSegment.color === color.key ? 'solid' : 'outline'}
                        colorScheme={color.key}
                        onPress={() => setNewSegment({ ...newSegment, color: color.key })}
                      >
                        {color.label}
                      </Button>
                    ))}
                  </HStack>
                </VStack>
              </VStack>
              
              <HStack space={2}>
                <Button
                  flex={1}
                  variant="outline"
                  onPress={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  flex={1}
                  colorScheme="green"
                  onPress={handleCreateSegment}
                  isDisabled={!newSegment.name || !newSegment.criteria}
                >
                  Create Segment
                </Button>
              </HStack>
            </VStack>
          </Card>
        )}

        {/* Segments List */}
        <VStack space={4}>
          {segments.length > 0 ? (
            segments.map((segment) => renderSegmentCard(segment))
          ) : (
            <Card p={8} borderRadius="lg" shadow={2}>
              <VStack space={4} alignItems="center">
                <Icon as={MaterialIcons} name="category" size="4xl" color="coolGray.300" />
                <Text fontSize="lg" color="coolGray.500" textAlign="center">
                  No segments created yet
                </Text>
                <Text fontSize="sm" color="coolGray.400" textAlign="center">
                  Create your first segment to organize your customers
                </Text>
                <Button
                  colorScheme="green"
                  leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
                  onPress={() => setShowCreateForm(true)}
                >
                  Create First Segment
                </Button>
              </VStack>
            </Card>
          )}
        </VStack>
      </Box>
    </ScrollView>
  );
};

export default SegmentsManager; 
