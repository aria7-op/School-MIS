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
  Avatar,
  AvatarGroup,
  FlatList,
  Pressable,
  Modal,
  FormControl,
  Input,
  TextArea as NativeBaseTextArea,
  Select,
  Switch,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import useCustomerApi from '../hooks/useCustomerApi';

interface Collaboration {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  dueDate?: string;
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
  participants: Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    role: string;
  }>;
  messages: Array<{
    id: string;
    content: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
    createdAt: string;
  }>;
  _count: {
    messages: number;
    participants: number;
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

const CustomerCollaboration: React.FC<{ customerId: string }> = ({ customerId }) => {
  const { getCustomerCollaborations, createCollaboration, updateCollaboration, deleteCollaboration, getCollaborationFeed } = useCustomerApi();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [feed, setFeed] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCollaboration, setSelectedCollaboration] = useState<Collaboration | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'feed'>('my');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    priority: 'medium',
    dueDate: '',
    participants: [],
    isPublic: false
  });
  const toast = useToast();

  const collaborationTypes = [
    { label: 'Student Support', value: 'student_support' },
    { label: 'Parent Communication', value: 'parent_communication' },
    { label: 'Teacher Collaboration', value: 'teacher_collaboration' },
    { label: 'Academic Planning', value: 'academic_planning' },
    { label: 'Enrollment Process', value: 'enrollment_process' },
    { label: 'Financial Discussion', value: 'financial_discussion' },
    { label: 'Technical Support', value: 'technical_support' },
    { label: 'Event Planning', value: 'event_planning' },
    { label: 'General Discussion', value: 'general_discussion' }
  ];

  const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' }
  ];

  const loadCollaborations = async () => {
    try {
      setLoading(true);
      const response = await getCustomerCollaborations(customerId);
      setCollaborations(response.data || []);
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to load collaborations',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFeed = async () => {
    try {
      const response = await getCollaborationFeed();
      setFeed(response.data || []);
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to load collaboration feed',
        status: 'error'
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCollaborations(), loadFeed()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadCollaborations();
    loadFeed();
  }, [customerId]);

  const handleCreateCollaboration = async () => {
    try {
      setLoading(true);
      await createCollaboration(customerId, formData);
      toast.show({
        description: 'Collaboration created successfully',
        status: 'success'
      });
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        type: '',
        priority: 'medium',
        dueDate: '',
        participants: [],
        isPublic: false
      });
      loadCollaborations();
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to create collaboration',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewCollaboration = (collaboration: Collaboration) => {
    setSelectedCollaboration(collaboration);
    setShowDetailModal(true);
  };

  const handleDeleteCollaboration = async (collaborationId: string) => {
    try {
      await deleteCollaboration(customerId, collaborationId);
      toast.show({
        description: 'Collaboration deleted successfully',
        status: 'success'
      });
      loadCollaborations();
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to delete collaboration',
        status: 'error'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'archived': return 'gray';
      default: return 'info';
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

  const renderCollaborationCard = ({ item }: { item: Collaboration }) => (
    <Pressable onPress={() => handleViewCollaboration(item)}>
      <Card mb={3} borderRadius="lg" shadow={2}>
        <VStack space={3}>
          <HStack justifyContent="space-between" alignItems="flex-start">
            <VStack flex={1} space={1}>
              <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
                {item.title}
              </Text>
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
            </VStack>
          </HStack>

          <HStack space={2} alignItems="center">
            <Icon as={MaterialIcons} name="person" size="sm" color="coolGray.500" />
            <Text fontSize="xs" color="coolGray.500">
              {item.createdBy.firstName} {item.createdBy.lastName}
            </Text>
            {item.assignedTo && (
              <>
                <Icon as={MaterialIcons} name="assignment" size="sm" color="coolGray.500" />
                <Text fontSize="xs" color="coolGray.500">
                  {item.assignedTo.firstName} {item.assignedTo.lastName}
                </Text>
              </>
            )}
          </HStack>

          <HStack space={3} alignItems="center">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="group" size="sm" color="coolGray.500" />
              <Text fontSize="xs" color="coolGray.500">
                {item._count.participants}
              </Text>
            </HStack>
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="chat" size="sm" color="coolGray.500" />
              <Text fontSize="xs" color="coolGray.500">
                {item._count.messages}
              </Text>
            </HStack>
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="task" size="sm" color="coolGray.500" />
              <Text fontSize="xs" color="coolGray.500">
                {item._count.tasks}
              </Text>
            </HStack>
          </HStack>

          {item.participants.length > 0 && (
            <HStack space={2} alignItems="center">
              <Text fontSize="xs" color="coolGray.500">Participants:</Text>
              <AvatarGroup size="xs" max={3}>
                {item.participants.slice(0, 3).map((participant) => (
                  <Avatar
                    key={participant.id}
                    source={{ uri: `https://ui-avatars.com/api/?name=${participant.user.firstName}+${participant.user.lastName}` }}
                  >
                    {participant.user.firstName[0]}{participant.user.lastName[0]}
                  </Avatar>
                ))}
              </AvatarGroup>
              {item.participants.length > 3 && (
                <Text fontSize="xs" color="coolGray.500">
                  +{item.participants.length - 3} more
                </Text>
              )}
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
                onPress={() => handleDeleteCollaboration(item.id)}
              >
                Delete
              </Button>
            </HStack>
          </HStack>
        </VStack>
      </Card>
    </Pressable>
  );

  const renderMessage = ({ item }: { item: any }) => (
    <Box mb={3} p={3} bg="coolGray.50" borderRadius="md">
      <HStack space={2} alignItems="flex-start">
        <Avatar
          size="sm"
          source={{ uri: `https://ui-avatars.com/api/?name=${item.user.firstName}+${item.user.lastName}` }}
        >
          {item.user.firstName[0]}{item.user.lastName[0]}
        </Avatar>
        <VStack flex={1} space={1}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="sm" fontWeight="bold" color="coolGray.800">
              {item.user.firstName} {item.user.lastName}
            </Text>
            <Text fontSize="xs" color="coolGray.500">
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </HStack>
          <Text fontSize="sm" color="coolGray.700">
            {item.content}
          </Text>
        </VStack>
      </HStack>
    </Box>
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
                Team Collaboration
              </Text>
              <Text fontSize="sm" color="coolGray.600">
                Collaborate with team members on customer-related tasks
              </Text>
            </VStack>
            <Button
              colorScheme="blue"
              leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
              onPress={() => setShowCreateModal(true)}
              size="sm"
            >
              New
            </Button>
          </HStack>

          {/* Statistics */}
          <HStack space={3} mb={4}>
            <Card flex={1} p={3} borderRadius="lg" bg="blue.50">
              <VStack alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {collaborations.length}
                </Text>
                <Text fontSize="xs" color="blue.600">
                  My Collaborations
                </Text>
              </VStack>
            </Card>
            <Card flex={1} p={3} borderRadius="lg" bg="green.50">
              <VStack alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {collaborations.filter(c => c.status === 'active').length}
                </Text>
                <Text fontSize="xs" color="green.600">
                  Active
                </Text>
              </VStack>
            </Card>
            <Card flex={1} p={3} borderRadius="lg" bg="orange.50">
              <VStack alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                  {feed.length}
                </Text>
                <Text fontSize="xs" color="orange.600">
                  Feed Items
                </Text>
              </VStack>
            </Card>
          </HStack>

          {/* Tab Navigation */}
          <HStack space={2} mb={4} bg="white" p={2} borderRadius="lg" shadow={1}>
            <Button
              variant={activeTab === 'my' ? 'solid' : 'outline'}
              colorScheme="blue"
              flex={1}
              onPress={() => setActiveTab('my')}
              size="sm"
            >
              My Collaborations
            </Button>
            <Button
              variant={activeTab === 'feed' ? 'solid' : 'outline'}
              colorScheme="blue"
              flex={1}
              onPress={() => setActiveTab('feed')}
              size="sm"
            >
              Collaboration Feed
            </Button>
          </HStack>

          {/* Collaborations List */}
          {loading ? (
            <Box alignItems="center" py={8}>
              <Spinner size="lg" color="blue.500" />
              <Text mt={2} color="coolGray.600">Loading collaborations...</Text>
            </Box>
          ) : (activeTab === 'my' ? collaborations : feed).length === 0 ? (
            <Card p={8} borderRadius="lg" bg="white">
              <VStack alignItems="center" space={3}>
                <Icon as={MaterialIcons} name="group" size="lg" color="coolGray.400" />
                <Text fontSize="lg" fontWeight="bold" color="coolGray.600">
                  No Collaborations Yet
                </Text>
                <Text fontSize="sm" color="coolGray.500" textAlign="center">
                  {activeTab === 'my' 
                    ? 'Start collaborating with your team on customer-related tasks'
                    : 'No collaboration activities in the feed yet'
                  }
                </Text>
                {activeTab === 'my' && (
                  <Button
                    colorScheme="blue"
                    leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
                    onPress={() => setShowCreateModal(true)}
                  >
                    Create Collaboration
                  </Button>
                )}
              </VStack>
            </Card>
          ) : (
            <FlatList
              data={activeTab === 'my' ? collaborations : feed}
              renderItem={renderCollaborationCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Box>
      </ScrollView>

      {/* Create Collaboration Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} size="xl">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Create Collaboration</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <FormControl>
                <FormControl.Label>Title</FormControl.Label>
                <Input
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter collaboration title"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Description</FormControl.Label>
                <NativeBaseTextArea
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter collaboration description"
                  numberOfLines={3}
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Type</FormControl.Label>
                <Select
                  selectedValue={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  placeholder="Select collaboration type"
                >
                  {collaborationTypes.map((type) => (
                    <Select.Item key={type.value} label={type.label} value={type.value} />
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
                <FormControl.Label>Public</FormControl.Label>
                <Switch
                  isChecked={formData.isPublic}
                  onToggle={(value) => setFormData({ ...formData, isPublic: value })}
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
                onPress={handleCreateCollaboration}
                isLoading={loading}
              >
                Create
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Collaboration Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} size="xl">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>
            {selectedCollaboration?.title}
          </Modal.Header>
          <Modal.Body>
            {selectedCollaboration && (
              <VStack space={4}>
                <VStack space={2}>
                  <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
                    {selectedCollaboration.title}
                  </Text>
                  <Text fontSize="sm" color="coolGray.600">
                    {selectedCollaboration.description}
                  </Text>
                  <HStack space={2}>
                    <Badge colorScheme={getStatusColor(selectedCollaboration.status)}>
                      {selectedCollaboration.status}
                    </Badge>
                    <Badge colorScheme={getPriorityColor(selectedCollaboration.priority)}>
                      {selectedCollaboration.priority}
                    </Badge>
                  </HStack>
                </VStack>

                <Divider />

                <VStack space={2}>
                  <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                    Participants ({selectedCollaboration.participants.length})
                  </Text>
                  <HStack space={2} flexWrap="wrap">
                    {selectedCollaboration.participants.map((participant) => (
                      <HStack key={participant.id} space={1} alignItems="center" bg="coolGray.100" p={2} borderRadius="md">
                        <Avatar
                          size="xs"
                          source={{ uri: `https://ui-avatars.com/api/?name=${participant.user.firstName}+${participant.user.lastName}` }}
                        >
                          {participant.user.firstName[0]}{participant.user.lastName[0]}
                        </Avatar>
                        <Text fontSize="xs" color="coolGray.700">
                          {participant.user.firstName} {participant.user.lastName}
                        </Text>
                        <Badge size="xs" colorScheme="blue" variant="subtle">
                          {participant.role}
                        </Badge>
                      </HStack>
                    ))}
                  </HStack>
                </VStack>

                <Divider />

                <VStack space={2}>
                  <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                    Recent Messages ({selectedCollaboration.messages.length})
                  </Text>
                  <FlatList
                    data={selectedCollaboration.messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                  />
                </VStack>
              </VStack>
            )}
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default CustomerCollaboration; 
