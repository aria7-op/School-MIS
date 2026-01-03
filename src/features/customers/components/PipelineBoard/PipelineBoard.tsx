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
  Divider,
} from 'native-base';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

interface PipelineBoardProps {
  customers: any[];
  onCustomerSelect: (customer: any) => void;
  getPipelineData: (filters?: any) => Promise<any>;
  loading?: boolean;
}

const PipelineBoard: React.FC<PipelineBoardProps> = ({
  customers,
  onCustomerSelect,
  getPipelineData,
  loading = false,
}) => {
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const pipelineStages = [
    { key: 'lead', label: 'Lead', color: 'blue', icon: 'person-add' },
    { key: 'qualified', label: 'Qualified', color: 'yellow', icon: 'star' },
    { key: 'proposal', label: 'Proposal', color: 'orange', icon: 'description' },
    { key: 'negotiation', label: 'Negotiation', color: 'purple', icon: 'chat' },
    { key: 'closed', label: 'Closed', color: 'green', icon: 'check-circle' },
  ];

  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    try {
      setIsLoading(true);
      const data = await getPipelineData();
      setPipelineData(data);
    } catch (error: any) {
      
      toast.show({
        description: error.message || 'Failed to load pipeline data',
        variant: 'solid',
        placement: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPipelineColumn = (stage: any) => {
    const stageCustomers = customers.filter(customer => 
      customer.status?.toLowerCase() === stage.key || 
      customer.pipeline_stage === stage.key
    );

    return (
      <Card p={4} borderRadius="lg" shadow={2} flex={1} minW="200px" mx={2}>
        <VStack space={4}>
          <HStack space={2} alignItems="center">
            <Icon as={MaterialIcons} name={stage.icon} size="md" color={`${stage.color}.500`} />
            <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
              {stage.label}
            </Text>
            <Badge colorScheme={stage.color} variant="solid" size="sm">
              {stageCustomers.length}
            </Badge>
          </HStack>
          
          <VStack space={3} flex={1}>
            {stageCustomers.map((customer: any) => (
              <Card
                key={customer.id}
                p={3}
                borderRadius="md"
                bg="coolGray.50"
                borderWidth={1}
                borderColor="coolGray.200"
                onPress={() => onCustomerSelect(customer)}
              >
                <VStack space={2}>
                  <Text fontSize="sm" fontWeight="medium" color="coolGray.800">
                    {customer.name}
                  </Text>
                  <Text fontSize="xs" color="coolGray.600">
                    {customer.email || customer.mobile}
                  </Text>
                  <HStack space={2} alignItems="center">
                    <Icon as={MaterialIcons} name="attach-money" size="xs" color="green.500" />
                    <Text fontSize="xs" color="coolGray.600">
                      ${customer.total_value?.toLocaleString() || '0'}
                    </Text>
                  </HStack>
                  {customer.priority && (
                    <Badge
                      colorScheme={
                        customer.priority === 'high' ? 'red' :
                        customer.priority === 'medium' ? 'orange' : 'green'
                      }
                      variant="subtle"
                      size="xs"
                      alignSelf="flex-start"
                    >
                      {customer.priority}
                    </Badge>
                  )}
                </VStack>
              </Card>
            ))}
            
            {stageCustomers.length === 0 && (
              <Box
                p={4}
                borderRadius="md"
                bg="coolGray.100"
                borderWidth={1}
                borderColor="coolGray.200"
                borderStyle="dashed"
              >
                <Text fontSize="sm" color="coolGray.500" textAlign="center">
                  No customers in this stage
                </Text>
              </Box>
            )}
          </VStack>
        </VStack>
      </Card>
    );
  };

  if (loading || isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} color="coolGray.600">
          Loading pipeline...
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Box p={4}>
          <VStack space={4}>
            {/* Header */}
            <Card p={4} borderRadius="lg" shadow={2}>
              <VStack space={3}>
                <HStack space={2} alignItems="center">
                  <Icon as={MaterialIcons} name="trending-up" size="md" color="blue.500" />
                  <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
                    Customer Pipeline
                  </Text>
                </HStack>
                <Text fontSize="sm" color="coolGray.600">
                  Track your customers through the sales pipeline
                </Text>
                <HStack space={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
                    onPress={loadPipelineData}
                  >
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="green"
                    leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
                  >
                    Add Customer
                  </Button>
                </HStack>
              </VStack>
            </Card>

            {/* Pipeline Stats */}
            {pipelineData && (
              <Card p={4} borderRadius="lg" shadow={2}>
                <VStack space={3}>
                  <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                    Pipeline Overview
                  </Text>
                  <HStack space={4} flexWrap="wrap">
                    {pipelineStages.map((stage) => {
                      const stageCount = customers.filter(customer => 
                        customer.status?.toLowerCase() === stage.key || 
                        customer.pipeline_stage === stage.key
                      ).length;
                      
                      return (
                        <VStack key={stage.key} space={1} alignItems="center">
                          <Badge colorScheme={stage.color} variant="solid" size="lg">
                            {stageCount}
                          </Badge>
                          <Text fontSize="xs" color="coolGray.600">
                            {stage.label}
                          </Text>
                        </VStack>
                      );
                    })}
                  </HStack>
                </VStack>
              </Card>
            )}

            {/* Pipeline Columns */}
            <HStack space={2} alignItems="flex-start">
              {pipelineStages.map((stage) => renderPipelineColumn(stage))}
            </HStack>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
};

export default PipelineBoard; 
