import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Badge,
  Icon,
  useColorModeValue,
  Skeleton,
  Progress,
  Avatar,
  Divider,
  ScrollView,
  Pressable,
  Center,
  Heading,
  SimpleGrid,
  Input,
  Select,
  CheckIcon,
  Modal,
  useToast,
  Checkbox,
  Radio,
  Switch,
  TextArea,
  FormControl,
  useDisclose,
  Alert,
  Spinner,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface BulkOperationsTabProps {
  classes: any[];
  selectedClasses: any[];
  onBulkAction: (action: string, classIds: number[]) => Promise<void>;
  selectedClass: any;
  onClassSelect: (classItem: any) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const BulkOperationsTab: React.FC<BulkOperationsTabProps> = ({
  classes,
  selectedClasses,
  onBulkAction,
  selectedClass,
  onClassSelect,
  onRefresh,
  refreshing,
}) => {
  // Theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // State
  const [selectedOperation, setSelectedOperation] = useState('');
  const [operationData, setOperationData] = useState<any>({});
  const [processing, setProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [operationHistory, setOperationHistory] = useState([]);

  // Hooks
  const toast = useToast();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclose();

  // Mock operation history
  const mockHistory = useMemo(() => [
    {
      id: 1,
      operation: 'Assign Teacher',
      classesCount: 5,
      status: 'completed',
      timestamp: '2024-01-15T10:30:00Z',
      details: 'Assigned Mr. Smith to 5 classes',
    },
    {
      id: 2,
      operation: 'Update Status',
      classesCount: 3,
      status: 'completed',
      timestamp: '2024-01-14T15:45:00Z',
      details: 'Changed status to active for 3 classes',
    },
    {
      id: 3,
      operation: 'Export Data',
      classesCount: 12,
      status: 'completed',
      timestamp: '2024-01-13T09:15:00Z',
      details: 'Exported data for 12 classes',
    },
  ], []);

  useEffect(() => {
    setOperationHistory(mockHistory);
  }, []);

  const bulkOperations = useMemo(() => [
    {
      id: 'assign-teacher',
      name: 'Assign Teacher',
      description: 'Assign a teacher to multiple classes',
      icon: 'person-add',
      color: 'blue',
      requiresData: true,
      dataType: 'teacher',
    },
    {
      id: 'update-status',
      name: 'Update Status',
      description: 'Change status for multiple classes',
      icon: 'update',
      color: 'green',
      requiresData: true,
      dataType: 'status',
    },
    {
      id: 'update-grade',
      name: 'Update Grade',
      description: 'Change grade level for multiple classes',
      icon: 'school',
      color: 'purple',
      requiresData: true,
      dataType: 'grade',
    },
    {
      id: 'send-notification',
      name: 'Send Notification',
      description: 'Send notification to all students in selected classes',
      icon: 'notifications',
      color: 'orange',
      requiresData: true,
      dataType: 'notification',
    },
    {
      id: 'export-data',
      name: 'Export Data',
      description: 'Export class data to Excel or CSV',
      icon: 'download',
      color: 'teal',
      requiresData: true,
      dataType: 'export',
    },
    {
      id: 'archive-classes',
      name: 'Archive Classes',
      description: 'Archive multiple classes',
      icon: 'archive',
      color: 'gray',
      requiresData: false,
      dataType: null,
    },
    {
      id: 'delete-classes',
      name: 'Delete Classes',
      description: 'Permanently delete multiple classes',
      icon: 'delete',
      color: 'red',
      requiresData: false,
      dataType: null,
    },
    {
      id: 'duplicate-classes',
      name: 'Duplicate Classes',
      description: 'Create copies of selected classes',
      icon: 'content-copy',
      color: 'indigo',
      requiresData: false,
      dataType: null,
    },
  ], []);

  const handleOperationSelect = (operation: any) => {
    setSelectedOperation(operation.id);
    setOperationData({});
    if (operation.requiresData) {
      onModalOpen();
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleExecuteOperation = async () => {
    if (selectedClasses.length === 0) {
      toast.show({
        description: 'Please select classes first',
        status: 'warning'
      });
      return;
    }

    setProcessing(true);
    try {
      await onBulkAction(selectedOperation, selectedClasses.map(c => c.id));
      
      // Add to history
      const newHistoryItem = {
        id: Date.now(),
        operation: bulkOperations.find(op => op.id === selectedOperation)?.name || 'Unknown',
        classesCount: selectedClasses.length,
        status: 'completed',
        timestamp: new Date().toISOString(),
        details: `${bulkOperations.find(op => op.id === selectedOperation)?.name} applied to ${selectedClasses.length} classes`,
      };
      setOperationHistory(prev => [newHistoryItem, ...prev]);

      toast.show({
        description: 'Bulk operation completed successfully',
        status: 'success'
      });
    } catch (error) {
      toast.show({
        description: 'Bulk operation failed',
        status: 'error'
      });
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
      onModalClose();
      setSelectedOperation('');
      setOperationData({});
    }
  };

  // Render functions
  const renderHeader = () => (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Heading size="md" color={textColor}>
            Bulk Operations
          </Heading>
          <Text color={mutedColor} fontSize="sm">
            Perform actions on multiple classes at once
          </Text>
        </VStack>
        <Button
          size="sm"
          colorScheme="blue"
          onPress={onRefresh}
          leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
          isLoading={refreshing}
        >
          Refresh
        </Button>
      </HStack>

      {selectedClasses.length > 0 && (
        <Alert status="info" borderRadius="lg">
          <VStack space={2} flexShrink={1} w="100%">
            <HStack flexShrink={1} space={2} alignItems="center">
              <Alert.Icon />
              <Text fontSize="md" fontWeight="medium">
                {selectedClasses.length} classes selected
              </Text>
            </HStack>
            <Text fontSize="sm">
              Select an operation below to apply to all selected classes.
            </Text>
          </VStack>
        </Alert>
      )}
    </VStack>
  );

  const renderOperations = () => (
    <VStack space={4}>
      <Heading size="sm" color={textColor}>Available Operations</Heading>
      
      <SimpleGrid columns={2} space={3}>
        {bulkOperations.map((operation) => (
          <Pressable
            key={operation.id}
            onPress={() => handleOperationSelect(operation)}
            disabled={selectedClasses.length === 0}
          >
            <Card
              bg={selectedClasses.length === 0 ? useColorModeValue('gray.100', 'gray.700') : cardBg}
              borderRadius="xl"
              borderWidth={1}
              borderColor={borderColor}
              opacity={selectedClasses.length === 0 ? 0.5 : 1}
            >
              <VStack space={3} p={4} alignItems="center">
                <Avatar
                  size="md"
                  bg={`${operation.color}.500`}
                >
                  <Icon
                    as={MaterialIcons}
                    name={operation.icon}
                    color="white"
                    size="sm"
                  />
                </Avatar>
                <VStack space={1} alignItems="center">
                  <Text fontWeight="bold" fontSize="sm" color={textColor} textAlign="center">
                    {operation.name}
                  </Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">
                    {operation.description}
                  </Text>
                </VStack>
                {operation.requiresData && (
                  <Badge size="xs" colorScheme="gray" variant="outline">
                    Requires Input
                  </Badge>
                )}
              </VStack>
            </Card>
          </Pressable>
        ))}
      </SimpleGrid>
    </VStack>
  );

  const renderSelectedClasses = () => {
    if (selectedClasses.length === 0) {
      return (
        <Center py={8}>
          <VStack space={4} alignItems="center">
            <Icon as={MaterialIcons} name="checklist" size="xl" color={mutedColor} />
            <Text color={mutedColor} textAlign="center">
              No classes selected for bulk operations
            </Text>
            <Text fontSize="sm" color={mutedColor} textAlign="center">
              Go to the Classes tab to select classes first
            </Text>
          </VStack>
        </Center>
      );
    }

    return (
      <VStack space={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="sm" color={textColor}>
            Selected Classes ({selectedClasses.length})
          </Heading>
          <Button size="xs" variant="outline" colorScheme="blue">
            View All
          </Button>
        </HStack>
        
        <VStack space={2}>
          {selectedClasses.slice(0, 5).map((classItem) => (
            <Card key={classItem.id} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
              <HStack space={3} alignItems="center" p={3}>
                <Avatar
                  size="sm"
                  bg="blue.500"
                  source={{ uri: classItem.avatar }}
                >
                  {classItem.name?.charAt(0) || 'C'}
                </Avatar>
                <VStack flex={1}>
                  <Text fontWeight="medium" fontSize="sm" color={textColor}>
                    {classItem.name}
                  </Text>
                  <Text fontSize="xs" color={mutedColor}>
                    {classItem.grade} • {classItem.studentsCount || 0} students
                  </Text>
                </VStack>
                <Badge
                  colorScheme={classItem.status === 'active' ? 'green' : 'gray'}
                  variant="solid"
                  size="sm"
                >
                  {classItem.status || 'active'}
                </Badge>
              </HStack>
            </Card>
          ))}
          {selectedClasses.length > 5 && (
            <Card bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
              <Center p={3}>
                <Text fontSize="sm" color={mutedColor}>
                  +{selectedClasses.length - 5} more classes
                </Text>
              </Center>
            </Card>
          )}
        </VStack>
      </VStack>
    );
  };

  const renderOperationHistory = () => (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <Heading size="sm" color={textColor}>
          Recent Operations
        </Heading>
        <Button size="xs" variant="outline" colorScheme="blue">
          View All
        </Button>
      </HStack>
      
      <VStack space={3}>
        {operationHistory.slice(0, 5).map((item: any) => (
          <Card key={item.id} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
            <HStack space={3} alignItems="center" p={4}>
              <Avatar
                size="sm"
                bg={item.status === 'completed' ? 'green.500' : 'orange.500'}
              >
                <Icon
                  as={MaterialIcons}
                  name={item.status === 'completed' ? 'check' : 'schedule'}
                  color="white"
                  size="sm"
                />
              </Avatar>
              <VStack flex={1} space={1}>
                <Text fontWeight="medium" fontSize="sm" color={textColor}>
                  {item.operation}
                </Text>
                <Text fontSize="xs" color={mutedColor}>
                  {item.details}
                </Text>
                <Text fontSize="xs" color={mutedColor}>
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </VStack>
              <VStack alignItems="flex-end" space={1}>
                <Badge
                  colorScheme={item.status === 'completed' ? 'green' : 'orange'}
                  variant="solid"
                  size="sm"
                >
                  {item.status}
                </Badge>
                <Text fontSize="xs" color={mutedColor}>
                  {item.classesCount} classes
                </Text>
              </VStack>
            </HStack>
          </Card>
        ))}
      </VStack>
    </VStack>
  );

  const renderOperationModal = () => {
    const operation = bulkOperations.find(op => op.id === selectedOperation);
    if (!operation) return null;

    return (
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="lg">
        <Modal.Content maxWidth="500px">
          <Modal.CloseButton />
          <Modal.Header>{operation.name}</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <Text color={mutedColor}>
                {operation.description}
              </Text>
              
              <Alert status="info" borderRadius="lg">
                <VStack space={1} flexShrink={1} w="100%">
                  <Text fontSize="sm" fontWeight="medium">
                    This operation will be applied to {selectedClasses.length} selected classes
                  </Text>
                </VStack>
              </Alert>

              {operation.dataType === 'teacher' && (
                <FormControl>
                  <FormControl.Label>Select Teacher</FormControl.Label>
                  <Select
                    selectedValue={operationData.teacher}
                    onValueChange={(value) => setOperationData({ ...operationData, teacher: value })}
                    placeholder="Choose a teacher"
                    _selectedItem={{
                      bg: 'blue.500',
                      endIcon: <CheckIcon size="5" />
                    }}
                  >
                    <Select.Item label="Mr. Smith" value="smith" />
                    <Select.Item label="Ms. Johnson" value="johnson" />
                    <Select.Item label="Dr. Brown" value="brown" />
                    <Select.Item label="Prof. Davis" value="davis" />
                  </Select>
                </FormControl>
              )}

              {operation.dataType === 'status' && (
                <FormControl>
                  <FormControl.Label>New Status</FormControl.Label>
                  <Radio.Group
                    value={operationData.status}
                    onChange={(value) => setOperationData({ ...operationData, status: value })}
                  >
                    <VStack space={2}>
                      <Radio value="active" colorScheme="green">Active</Radio>
                      <Radio value="inactive" colorScheme="orange">Inactive</Radio>
                      <Radio value="archived" colorScheme="gray">Archived</Radio>
                    </VStack>
                  </Radio.Group>
                </FormControl>
              )}

              {operation.dataType === 'grade' && (
                <FormControl>
                  <FormControl.Label>New Grade</FormControl.Label>
                  <Select
                    selectedValue={operationData.grade}
                    onValueChange={(value) => setOperationData({ ...operationData, grade: value })}
                    placeholder="Choose a grade"
                    _selectedItem={{
                      bg: 'blue.500',
                      endIcon: <CheckIcon size="5" />
                    }}
                  >
                    <Select.Item label="Grade 1" value="1" />
                    <Select.Item label="Grade 2" value="2" />
                    <Select.Item label="Grade 3" value="3" />
                    <Select.Item label="Grade 4" value="4" />
                    <Select.Item label="Grade 5" value="5" />
                  </Select>
                </FormControl>
              )}

              {operation.dataType === 'notification' && (
                <VStack space={3}>
                  <FormControl>
                    <FormControl.Label>Notification Title</FormControl.Label>
                    <Input
                      value={operationData.title}
                      onChangeText={(value) => setOperationData({ ...operationData, title: value })}
                      placeholder="Enter notification title"
                    />
                  </FormControl>
                  <FormControl>
                    <FormControl.Label>Message</FormControl.Label>
                    <TextArea
                      value={operationData.message}
                      onChangeText={(value) => setOperationData({ ...operationData, message: value })}
                      placeholder="Enter notification message"
                      h={20}
                    />
                  </FormControl>
                </VStack>
              )}

              {operation.dataType === 'export' && (
                <FormControl>
                  <FormControl.Label>Export Format</FormControl.Label>
                  <Radio.Group
                    value={operationData.format}
                    onChange={(value) => setOperationData({ ...operationData, format: value })}
                  >
                    <VStack space={2}>
                      <Radio value="excel" colorScheme="green">Excel (.xlsx)</Radio>
                      <Radio value="csv" colorScheme="blue">CSV (.csv)</Radio>
                      <Radio value="pdf" colorScheme="red">PDF (.pdf)</Radio>
                    </VStack>
                  </Radio.Group>
                </FormControl>
              )}
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button
                variant="ghost"
                colorScheme="blueGray"
                onPress={onModalClose}
              >
                Cancel
              </Button>
              <Button
                colorScheme={operation.color}
                onPress={() => {
                  onModalClose();
                  setShowConfirmModal(true);
                }}
                isDisabled={
                  operation.requiresData && 
                  !Object.values(operationData).some(val => val)
                }
              >
                Continue
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    );
  };

  const renderConfirmModal = () => {
    const operation = bulkOperations.find(op => op.id === selectedOperation);
    if (!operation) return null;

    return (
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Confirm Operation</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <Alert status="warning" borderRadius="lg">
                <VStack space={2} flexShrink={1} w="100%">
                  <HStack flexShrink={1} space={2} alignItems="center">
                    <Alert.Icon />
                    <Text fontSize="md" fontWeight="medium">
                      Confirm Bulk Operation
                    </Text>
                  </HStack>
                  <Text fontSize="sm">
                    This action will affect {selectedClasses.length} classes and cannot be undone.
                  </Text>
                </VStack>
              </Alert>
              
              <Text>
                Are you sure you want to perform "{operation.name}" on {selectedClasses.length} selected classes?
              </Text>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button
                variant="ghost"
                colorScheme="blueGray"
                onPress={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                colorScheme={operation.color}
                onPress={handleExecuteOperation}
                isLoading={processing}
              >
                Execute
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    );
  };

  return (
    <ScrollView flex={1} bg={bgColor} showsVerticalScrollIndicator={false}>
      <VStack space={6} p={4} pb={8}>
        {renderHeader()}
        {renderSelectedClasses()}
        {renderOperations()}
        {renderOperationHistory()}
      </VStack>

      {renderOperationModal()}
      {renderConfirmModal()}
    </ScrollView>
  );
};

export default BulkOperationsTab; 
