import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
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
  Divider,
  Badge,
  FlatList,
  Pressable,
  Modal,
  FormControl,
  Input,
  Select,
  Switch,
  Progress,
  Avatar,
  Checkbox,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import useCustomerApi from '../hooks/useCustomerApi';

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  status: string;
  priority: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  completedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  subtasks: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate?: string;
    assignedTo?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  _count: {
    subtasks: number;
    comments: number;
    attachments: number;
  };
  createdAt: string;
  updatedAt: string;
}

const CustomerTasks: React.FC<{ customerId: string }> = ({ customerId }) => {
  const { getCustomerTasks, createTask, updateTask, deleteTask, completeTask, getTaskDashboard, getTaskCalendar } = useCustomerApi();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    category: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
    assignedTo: '',
    tags: '',
    subtasks: []
  });
  const toast = useToast();

  const taskTypes = [
    { label: 'Academic Support', value: 'academic_support', category: 'academic' },
    { label: 'Tutoring', value: 'tutoring', category: 'academic' },
    { label: 'Homework Help', value: 'homework_help', category: 'academic' },
    { label: 'Exam Preparation', value: 'exam_preparation', category: 'academic' },
    { label: 'Enrollment Process', value: 'enrollment_process', category: 'administrative' },
    { label: 'Document Collection', value: 'document_collection', category: 'administrative' },
    { label: 'Fee Collection', value: 'fee_collection', category: 'financial' },
    { label: 'Payment Processing', value: 'payment_processing', category: 'financial' },
    { label: 'Technical Support', value: 'technical_support', category: 'support' },
    { label: 'Counseling', value: 'counseling', category: 'support' },
    { label: 'Parent Meeting', value: 'parent_meeting', category: 'communication' },
    { label: 'Event Planning', value: 'event_planning', category: 'event' },
    { label: 'General Task', value: 'general_task', category: 'other' }
  ];

  const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' }
  ];

  const categoryOptions = [
    { label: 'Academic', value: 'academic' },
    { label: 'Administrative', value: 'administrative' },
    { label: 'Financial', value: 'financial' },
    { label: 'Support', value: 'support' },
    { label: 'Communication', value: 'communication' },
    { label: 'Event', value: 'event' },
    { label: 'Other', value: 'other' }
  ];

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await getCustomerTasks(customerId);
      setTasks(response.data || []);
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to load tasks',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await getTaskDashboard();
      setDashboard(response.data);
    } catch (error: any) {
      
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTasks(), loadDashboard()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadTasks();
    loadDashboard();
  }, [customerId]);

  const handleCreateTask = async () => {
    if (!formData.title || !formData.type) {
      toast.show({
        description: 'Title and type are required',
        status: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      const taskData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        assignedTo: formData.assignedTo || undefined
      };

      await createTask(customerId, taskData);
      toast.show({
        description: 'Task created successfully',
        status: 'success'
      });

      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        type: '',
        category: '',
        priority: 'medium',
        dueDate: '',
        estimatedHours: '',
        assignedTo: '',
        tags: '',
        subtasks: []
      });

      loadTasks();
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to create task',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(customerId, taskId);
      toast.show({
        description: 'Task completed successfully',
        status: 'success'
      });
      loadTasks();
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to complete task',
        status: 'error'
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(customerId, taskId);
      toast.show({
        description: 'Task deleted successfully',
        status: 'success'
      });
      loadTasks();
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to delete task',
        status: 'error'
      });
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'gray';
      default: return 'info';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getFilteredTasks = () => {
    if (activeFilter === 'all') return tasks;
    return tasks.filter(task => task.status === activeFilter);
  };

  const renderTaskCard = ({ item }: { item: Task }) => (
    <Pressable onPress={() => handleViewTask(item)}>
      <Card mb={3} borderRadius="lg" shadow={2}>
        <VStack space={3}>
          <HStack justifyContent="space-between" alignItems="flex-start">
            <VStack flex={1} space={1}>
              <HStack space={2} alignItems="center">
                <Checkbox
                  isChecked={item.status === 'completed'}
                  onChange={() => item.status !== 'completed' && handleCompleteTask(item.id)}
                  colorScheme="green"
                />
                <Text fontSize="lg" fontWeight="bold" color="coolGray.800" flex={1}>
                  {item.title}
                </Text>
              </HStack>
              <Text fontSize="sm" color="coolGray.600" numberOfLines={2}>
                {item.description}
              </Text>
            </VStack>
            <VStack alignItems="flex-end" space={1}>
              <Badge colorScheme={getStatusColor(item.status)} variant="subtle">
                {item.status}
              </Badge>
              <Badge colorScheme={getPriorityColor(item.priority)} variant="subtle">
                {item.priority}
              </Badge>
              {isOverdue(item.dueDate) && (
                <Badge colorScheme="error" variant="solid">
                  Overdue
                </Badge>
              )}
            </VStack>
          </HStack>

          <HStack space={2} alignItems="center">
            <Icon as={MaterialIcons} name="category" size="sm" color="coolGray.500" />
            <Text fontSize="xs" color="coolGray.500">
              {item.type.replace('_', ' ')}
            </Text>
            {item.dueDate && (
              <>
                <Icon as={MaterialIcons} name="schedule" size="sm" color="coolGray.500" />
                <Text fontSize="xs" color="coolGray.500">
                  {new Date(item.dueDate).toLocaleDateString()}
                </Text>
              </>
            )}
          </HStack>

          <HStack space={3} alignItems="center">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="assignment" size="sm" color="coolGray.500" />
              <Text fontSize="xs" color="coolGray.500">
                {item._count.subtasks}
              </Text>
            </HStack>
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="comment" size="sm" color="coolGray.500" />
              <Text fontSize="xs" color="coolGray.500">
                {item._count.comments}
              </Text>
            </HStack>
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="attach-file" size="sm" color="coolGray.500" />
              <Text fontSize="xs" color="coolGray.500">
                {item._count.attachments}
              </Text>
            </HStack>
          </HStack>

          {item.tags.length > 0 && (
            <HStack space={1} flexWrap="wrap">
              {item.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} size="xs" colorScheme="blue" variant="subtle">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Text fontSize="xs" color="coolGray.500">
                  +{item.tags.length - 3} more
                </Text>
              )}
            </HStack>
          )}

          {item.assignedTo && (
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="person" size="sm" color="coolGray.500" />
              <Avatar
                size="xs"
                source={{ uri: `https://ui-avatars.com/api/?name=${item.assignedTo.firstName}+${item.assignedTo.lastName}` }}
              >
                {item.assignedTo.firstName[0]}{item.assignedTo.lastName[0]}
              </Avatar>
              <Text fontSize="xs" color="coolGray.500">
                {item.assignedTo.firstName} {item.assignedTo.lastName}
              </Text>
            </HStack>
          )}

          <Divider />

          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="xs" color="coolGray.500">
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
            <HStack space={2}>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Icon as={MaterialIcons} name="edit" size="sm" />}
                onPress={() => {/* Handle edit */}}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                colorScheme="red"
                leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" />}
                onPress={() => handleDeleteTask(item.id)}
              >
                Delete
              </Button>
            </HStack>
          </HStack>
        </VStack>
      </Card>
    </Pressable>
  );

  return (
    <Box flex={1} bg="coolGray.50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Box p={4}>
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <VStack>
              <Text fontSize="xl" fontWeight="bold" color="coolGray.800">
                Tasks
              </Text>
              <Text fontSize="sm" color="coolGray.600">
                Manage customer-related tasks and assignments
              </Text>
            </VStack>
            <Button
              colorScheme="blue"
              leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
              onPress={() => setShowCreateModal(true)}
              size="sm"
            >
              New Task
            </Button>
          </HStack>

          {/* Statistics */}
          {dashboard && (
            <HStack space={3} mb={4}>
              <Card flex={1} p={3} borderRadius="lg" bg="blue.50">
                <VStack alignItems="center">
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                    {dashboard.overview?.total || 0}
                  </Text>
                  <Text fontSize="xs" color="blue.600">
                    Total Tasks
                  </Text>
                </VStack>
              </Card>
              <Card flex={1} p={3} borderRadius="lg" bg="green.50">
                <VStack alignItems="center">
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">
                    {dashboard.overview?.completed || 0}
                  </Text>
                  <Text fontSize="xs" color="green.600">
                    Completed
                  </Text>
                </VStack>
              </Card>
              <Card flex={1} p={3} borderRadius="lg" bg="orange.50">
                <VStack alignItems="center">
                  <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                    {dashboard.overview?.pending || 0}
                  </Text>
                  <Text fontSize="xs" color="orange.600">
                    Pending
                  </Text>
                </VStack>
              </Card>
            </HStack>
          )}

          {/* Filter Tabs */}
          <HStack space={2} mb={4} bg="white" p={2} borderRadius="lg" shadow={1}>
            {[
              { key: 'all', label: 'All', count: tasks.length },
              { key: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
              { key: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
              { key: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length }
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? 'solid' : 'outline'}
                colorScheme="blue"
                flex={1}
                onPress={() => setActiveFilter(filter.key as any)}
                size="sm"
              >
                <VStack alignItems="center">
                  <Text fontSize="xs">{filter.label}</Text>
                  <Text fontSize="xs" fontWeight="bold">{filter.count}</Text>
                </VStack>
              </Button>
            ))}
          </HStack>

          {/* Tasks List */}
          {loading ? (
            <Box alignItems="center" py={8}>
              <Spinner size="lg" color="blue.500" />
              <Text mt={2} color="coolGray.600">Loading tasks...</Text>
            </Box>
          ) : getFilteredTasks().length === 0 ? (
            <Card p={8} borderRadius="lg" bg="white">
              <VStack alignItems="center" space={3}>
                <Icon as={MaterialIcons} name="assignment" size="lg" color="coolGray.400" />
                <Text fontSize="lg" fontWeight="bold" color="coolGray.600">
                  No Tasks Yet
                </Text>
                <Text fontSize="sm" color="coolGray.500" textAlign="center">
                  Create tasks to track customer-related activities and assignments
                </Text>
                <Button
                  colorScheme="blue"
                  leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
                  onPress={() => setShowCreateModal(true)}
                >
                  Create Task
                </Button>
              </VStack>
            </Card>
          ) : (
            <FlatList
              data={getFilteredTasks()}
              renderItem={renderTaskCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Box>
      </ScrollView>

      {/* Create Task Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} size="xl">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Create Task</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <FormControl>
                <FormControl.Label>Title</FormControl.Label>
                <Input
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter task title"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Description</FormControl.Label>
                <Input
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter task description"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Type</FormControl.Label>
                <Select
                  selectedValue={formData.type}
                  onValueChange={(value) => {
                    const selectedType = taskTypes.find(type => type.value === value);
                    setFormData({ 
                      ...formData, 
                      type: value,
                      category: selectedType?.category || formData.category
                    });
                  }}
                  placeholder="Select task type"
                >
                  {taskTypes.map((type) => (
                    <Select.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormControl.Label>Category</FormControl.Label>
                <Select
                  selectedValue={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  {categoryOptions.map((category) => (
                    <Select.Item key={category.value} label={category.label} value={category.value} />
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormControl.Label>Priority</FormControl.Label>
                <Select
                  selectedValue={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  {priorityOptions.map((priority) => (
                    <Select.Item key={priority.value} label={priority.label} value={priority.value} />
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormControl.Label>Due Date</FormControl.Label>
                <Input
                  value={formData.dueDate}
                  onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                  placeholder="YYYY-MM-DD"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Estimated Hours</FormControl.Label>
                <Input
                  value={formData.estimatedHours}
                  onChangeText={(text) => setFormData({ ...formData, estimatedHours: text })}
                  placeholder="Enter estimated hours"
                  keyboardType="numeric"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Tags</FormControl.Label>
                <Input
                  value={formData.tags}
                  onChangeText={(text) => setFormData({ ...formData, tags: text })}
                  placeholder="Enter tags separated by commas"
                />
              </FormControl>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onPress={handleCreateTask}
                isLoading={loading}
              >
                Create
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Task Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} size="xl">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>
            {selectedTask?.title}
          </Modal.Header>
          <Modal.Body>
            {selectedTask && (
              <VStack space={4}>
                <VStack space={2}>
                  <HStack space={2} alignItems="center">
                    <Checkbox
                      isChecked={selectedTask.status === 'completed'}
                      onChange={() => selectedTask.status !== 'completed' && handleCompleteTask(selectedTask.id)}
                      colorScheme="green"
                    />
                    <Text fontSize="lg" fontWeight="bold" color="coolGray.800" flex={1}>
                      {selectedTask.title}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="coolGray.600">
                    {selectedTask.description}
                  </Text>
                  <HStack space={2}>
                    <Badge colorScheme={getStatusColor(selectedTask.status)}>
                      {selectedTask.status}
                    </Badge>
                    <Badge colorScheme={getPriorityColor(selectedTask.priority)}>
                      {selectedTask.priority}
                    </Badge>
                    {isOverdue(selectedTask.dueDate) && (
                      <Badge colorScheme="error">
                        Overdue
                      </Badge>
                    )}
                  </HStack>
                </VStack>

                <Divider />

                <VStack space={2}>
                  <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                    Task Information
                  </Text>
                  <HStack space={4}>
                    <VStack>
                      <Text fontSize="xs" color="coolGray.500">Type</Text>
                      <Text fontSize="sm" color="coolGray.800">
                        {selectedTask.type.replace('_', ' ')}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text fontSize="xs" color="coolGray.500">Category</Text>
                      <Text fontSize="sm" color="coolGray.800">
                        {selectedTask.category}
                      </Text>
                    </VStack>
                    {selectedTask.dueDate && (
                      <VStack>
                        <Text fontSize="xs" color="coolGray.500">Due Date</Text>
                        <Text fontSize="sm" color="coolGray.800">
                          {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </Text>
                      </VStack>
                    )}
                  </HStack>
                </VStack>

                <Divider />

                <VStack space={2}>
                  <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                    Subtasks ({selectedTask.subtasks.length})
                  </Text>
                  {selectedTask.subtasks.map((subtask) => (
                    <HStack key={subtask.id} space={2} alignItems="center" bg="coolGray.50" p={2} borderRadius="md">
                      <Checkbox
                        isChecked={subtask.status === 'completed'}
                        colorScheme="green"
                      />
                      <VStack flex={1}>
                        <Text fontSize="sm" fontWeight="bold" color="coolGray.800">
                          {subtask.title}
                        </Text>
                        <Text fontSize="xs" color="coolGray.500">
                          {subtask.description}
                        </Text>
                      </VStack>
                      <Badge size="xs" colorScheme={getPriorityColor(subtask.priority)}>
                        {subtask.priority}
                      </Badge>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            )}
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default CustomerTasks; 
