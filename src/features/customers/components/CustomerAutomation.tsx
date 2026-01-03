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
  Select,
  CheckIcon,
  TextArea,
  Switch,
  FlatList,
  Pressable,
  Modal,
  FormControl,
  Input,
  TextArea as NativeBaseTextArea,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import useCustomerApi from '../hooks/useCustomerApi';

interface Automation {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  isActive: boolean;
  priority: string;
  triggers: any[];
  actions: any[];
  createdAt: string;
  updatedAt: string;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  triggers: any[];
  actions: any[];
}

const CustomerAutomation: React.FC<{ customerId: string }> = ({ customerId }) => {

  const { getCustomerAutomations, createAutomation, updateAutomation, deleteAutomation, getAutomationTemplates } = useCustomerApi();

  const [automations, setAutomations] = useState<Automation[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    priority: 'medium',
    isActive: true,
    triggers: [],
    actions: []
  });
  const toast = useToast();

  const automationTypes = [
    { label: 'Enrollment Reminder', value: 'enrollment_reminder' },
    { label: 'Payment Reminder', value: 'payment_reminder' },
    { label: 'Class Schedule', value: 'class_schedule' },
    { label: 'Exam Reminder', value: 'exam_reminder' },
    { label: 'Birthday Wish', value: 'birthday_wish' },
    { label: 'Support Follow-up', value: 'support_follow_up' },
    { label: 'Document Expiry', value: 'document_expiry' },
    { label: 'Open House Invitation', value: 'open_house_invitation' }
  ];

  const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' }
  ];

  const loadAutomations = async () => {
    try {
      setLoading(true);
      const response = await getCustomerAutomations(customerId);
      setAutomations(response.data || []);
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to load automations',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await getAutomationTemplates();
      setTemplates(response.data || []);
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to load templates',
        status: 'error'
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAutomations(), loadTemplates()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAutomations();
    loadTemplates();
  }, [customerId]);

  const handleCreateAutomation = async () => {
    try {
      setLoading(true);
      await createAutomation(customerId, formData);
      toast.show({
        description: 'Automation created successfully',
        status: 'success'
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        type: '',
        priority: 'medium',
        isActive: true,
        triggers: [],
        actions: []
      });
      loadAutomations();
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to create automation',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template: AutomationTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      type: template.type,
      priority: 'medium',
      isActive: true,
      triggers: template.triggers,
      actions: template.actions
    });
    setShowTemplateModal(false);
    setShowCreateModal(true);
  };

  const handleToggleAutomation = async (automationId: string, isActive: boolean) => {
    try {
      await updateAutomation(customerId, automationId, { isActive });
      toast.show({
        description: `Automation ${isActive ? 'activated' : 'deactivated'} successfully`,
        status: 'success'
      });
      loadAutomations();
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to update automation',
        status: 'error'
      });
    }
  };

  const handleDeleteAutomation = async (automationId: string) => {
    try {
      await deleteAutomation(customerId, automationId);
      toast.show({
        description: 'Automation deleted successfully',
        status: 'success'
      });
      loadAutomations();
    } catch (error: any) {
      toast.show({
        description: error.message || 'Failed to delete automation',
        status: 'error'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'gray';
      case 'error': return 'error';
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

  const renderAutomationCard = ({ item }: { item: Automation }) => (
    <Card mb={3} borderRadius="lg" shadow={2}>
      <VStack space={3}>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack flex={1}>
            <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
              {item.name}
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
          <Icon as={MaterialIcons} name="schedule" size="sm" color="coolGray.500" />
          <Text fontSize="xs" color="coolGray.500">
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </HStack>

        <HStack space={2} alignItems="center">
          <Icon as={MaterialIcons} name="trigger" size="sm" color="coolGray.500" />
          <Text fontSize="xs" color="coolGray.500">
            {item.triggers?.length || 0} triggers
          </Text>
          <Icon as={MaterialIcons} name="play-arrow" size="sm" color="coolGray.500" />
          <Text fontSize="xs" color="coolGray.500">
            {item.actions?.length || 0} actions
          </Text>
        </HStack>

        <Divider />

        <HStack space={2} justifyContent="flex-end">
          <Switch
            isChecked={item.isActive}
            onToggle={(value) => handleToggleAutomation(item.id, value)}
            size="sm"
          />
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
            onPress={() => handleDeleteAutomation(item.id)}
          >
            Delete
          </Button>
        </HStack>
      </VStack>
    </Card>
  );

  const renderTemplateCard = ({ item }: { item: AutomationTemplate }) => (
    <Pressable onPress={() => handleUseTemplate(item)}>
      <Card mb={3} borderRadius="lg" shadow={1}>
        <VStack space={2}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="md" fontWeight="bold" color="coolGray.800">
              {item.name}
            </Text>
            <Badge colorScheme="blue" variant="subtle">
              {item.category}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="coolGray.600" numberOfLines={2}>
            {item.description}
          </Text>
          <HStack space={2} alignItems="center">
            <Icon as={MaterialIcons} name="trigger" size="sm" color="coolGray.500" />
            <Text fontSize="xs" color="coolGray.500">
              {item.triggers?.length || 0} triggers
            </Text>
            <Icon as={MaterialIcons} name="play-arrow" size="sm" color="coolGray.500" />
            <Text fontSize="xs" color="coolGray.500">
              {item.actions?.length || 0} actions
            </Text>
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
                Automation Workflows
              </Text>
              <Text fontSize="sm" color="coolGray.600">
                Manage automated workflows for customer interactions
              </Text>
            </VStack>
            <HStack space={2}>
              <Button
                variant="outline"
                leftIcon={<Icon as={MaterialIcons} name="template" size="sm" />}
                onPress={() => setShowTemplateModal(true)}
                size="sm"
              >
                Templates
              </Button>
              <Button
                colorScheme="blue"
                leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
                onPress={() => setShowCreateModal(true)}
                size="sm"
              >
                Create
              </Button>
            </HStack>
          </HStack>

          {/* Statistics */}
          <HStack space={3} mb={4}>
            <Card flex={1} p={3} borderRadius="lg" bg="blue.50">
              <VStack alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {automations.length}
                </Text>
                <Text fontSize="xs" color="blue.600">
                  Total Automations
                </Text>
              </VStack>
            </Card>
            <Card flex={1} p={3} borderRadius="lg" bg="green.50">
              <VStack alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {automations.filter(a => a.isActive).length}
                </Text>
                <Text fontSize="xs" color="green.600">
                  Active
                </Text>
              </VStack>
            </Card>
            <Card flex={1} p={3} borderRadius="lg" bg="orange.50">
              <VStack alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                  {templates.length}
                </Text>
                <Text fontSize="xs" color="orange.600">
                  Templates
                </Text>
              </VStack>
            </Card>
          </HStack>

          {/* Automations List */}
          {loading ? (
            <Box alignItems="center" py={8}>
              <Spinner size="lg" color="blue.500" />
              <Text mt={2} color="coolGray.600">Loading automations...</Text>
            </Box>
          ) : automations.length === 0 ? (
            <Card p={8} borderRadius="lg" bg="white">
              <VStack alignItems="center" space={3}>
                <Icon as={MaterialIcons} name="auto-awesome" size="lg" color="coolGray.400" />
                <Text fontSize="lg" fontWeight="bold" color="coolGray.600">
                  No Automations Yet
                </Text>
                <Text fontSize="sm" color="coolGray.500" textAlign="center">
                  Create your first automation workflow to streamline customer interactions
                </Text>
                <Button
                  colorScheme="blue"
                  leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
                  onPress={() => setShowCreateModal(true)}
                >
                  Create Automation
                </Button>
              </VStack>
            </Card>
          ) : (
            <FlatList
              data={automations}
              renderItem={renderAutomationCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Box>
      </ScrollView>

      {/* Create Automation Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} size="xl">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Create Automation</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <FormControl>
                <FormControl.Label>Name</FormControl.Label>
                <Input
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter automation name"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Description</FormControl.Label>
                <NativeBaseTextArea
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter automation description"
                  numberOfLines={3}
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Type</FormControl.Label>
                <Select
                  selectedValue={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  placeholder="Select automation type"
                >
                  {automationTypes.map((type) => (
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
                <FormControl.Label>Active</FormControl.Label>
                <Switch
                  isChecked={formData.isActive}
                  onToggle={(value) => setFormData({ ...formData, isActive: value })}
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
                onPress={handleCreateAutomation}
                isLoading={loading}
              >
                Create
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Templates Modal */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} size="xl">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Automation Templates</Modal.Header>
          <Modal.Body>
            <FlatList
              data={templates}
              renderItem={renderTemplateCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default CustomerAutomation; 
