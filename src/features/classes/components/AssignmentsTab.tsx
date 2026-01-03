import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Spinner,
  Alert,
  Switch,
  Slider,
  Fab,
  useDisclose,
  FormControl,
  TextArea,
  Radio,
  Checkbox,
  ActionSheet,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions, Animated, RefreshControl } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface AssignmentsTabProps {
  selectedClass: any;
  onClassSelect: (classItem: any) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const AssignmentsTab: React.FC<AssignmentsTabProps> = ({
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
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('list');
  const [animationValue] = useState(new Animated.Value(0));
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [assignmentPriority, setAssignmentPriority] = useState('medium');

  // Hooks
  const toast = useToast();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclose();
  const { isOpen: isActionSheetOpen, onOpen: onActionSheetOpen, onClose: onActionSheetClose } = useDisclose();

  // Enhanced dummy data with comprehensive assignments
  const mockAssignments = useMemo(() => [
    {
      id: '1',
      title: 'Mathematical Functions Chapter Test',
      subject: 'Mathematics',
      description: 'Comprehensive test covering linear, quadratic, and exponential functions',
      dueDate: '2024-02-15',
      createdDate: '2024-02-01',
      status: 'active',
      priority: 'high',
      totalPoints: 100,
      submissions: 24,
      totalStudents: 28,
      averageScore: 87.5,
      type: 'test',
      estimatedTime: '90 minutes',
      attachments: ['functions_notes.pdf', 'practice_problems.docx'],
      rubric: {
        criteria: ['Understanding', 'Problem Solving', 'Accuracy', 'Presentation'],
        weights: [30, 40, 20, 10]
      },
      analytics: {
        completionRate: 85.7,
        averageTimeSpent: 75,
        difficultyRating: 4.2,
        studentFeedback: 4.1
      }
    },
    {
      id: '2',
      title: 'Science Lab Report - Chemical Reactions',
      subject: 'Science',
      description: 'Lab report on acid-base reactions and pH measurements',
      dueDate: '2024-02-20',
      createdDate: '2024-02-05',
      status: 'active',
      priority: 'medium',
      totalPoints: 75,
      submissions: 18,
      totalStudents: 28,
      averageScore: 82.3,
      type: 'project',
      estimatedTime: '3 hours',
      attachments: ['lab_instructions.pdf', 'data_sheet.xlsx'],
      rubric: {
        criteria: ['Methodology', 'Data Analysis', 'Conclusions', 'Format'],
        weights: [25, 35, 25, 15]
      },
      analytics: {
        completionRate: 64.3,
        averageTimeSpent: 180,
        difficultyRating: 3.8,
        studentFeedback: 4.3
      }
    },
    {
      id: '3',
      title: 'English Essay - Character Analysis',
      subject: 'English',
      description: 'Analyze the main character development in assigned novel',
      dueDate: '2024-02-10',
      createdDate: '2024-01-25',
      status: 'completed',
      priority: 'medium',
      totalPoints: 50,
      submissions: 28,
      totalStudents: 28,
      averageScore: 91.2,
      type: 'essay',
      estimatedTime: '2 hours',
      attachments: ['essay_guidelines.pdf', 'character_worksheet.docx'],
      rubric: {
        criteria: ['Thesis', 'Evidence', 'Analysis', 'Grammar'],
        weights: [25, 30, 30, 15]
      },
      analytics: {
        completionRate: 100,
        averageTimeSpent: 120,
        difficultyRating: 3.5,
        studentFeedback: 4.5
      }
    },
    {
      id: '4',
      title: 'History Research Project',
      subject: 'History',
      description: 'Research and presentation on World War II impact',
      dueDate: '2024-02-25',
      createdDate: '2024-02-08',
      status: 'draft',
      priority: 'high',
      totalPoints: 120,
      submissions: 5,
      totalStudents: 28,
      averageScore: 0,
      type: 'project',
      estimatedTime: '5 hours',
      attachments: ['research_guidelines.pdf', 'source_list.docx'],
      rubric: {
        criteria: ['Research Quality', 'Content', 'Presentation', 'Citations'],
        weights: [30, 30, 25, 15]
      },
      analytics: {
        completionRate: 17.9,
        averageTimeSpent: 45,
        difficultyRating: 4.5,
        studentFeedback: 3.8
      }
    },
    {
      id: '5',
      title: 'Geography Map Quiz',
      subject: 'Geography',
      description: 'Identify countries, capitals, and major geographical features',
      dueDate: '2024-02-12',
      createdDate: '2024-02-02',
      status: 'overdue',
      priority: 'low',
      totalPoints: 25,
      submissions: 22,
      totalStudents: 28,
      averageScore: 78.9,
      type: 'quiz',
      estimatedTime: '30 minutes',
      attachments: ['map_reference.pdf'],
      rubric: {
        criteria: ['Accuracy', 'Completeness'],
        weights: [70, 30]
      },
      analytics: {
        completionRate: 78.6,
        averageTimeSpent: 25,
        difficultyRating: 2.8,
        studentFeedback: 4.0
      }
    }
  ], []);

  // Effects
  useEffect(() => {
    loadAssignments();
  }, [selectedClass]);

  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [animationValue]);

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadAssignments();
        toast.show({
          description: 'Assignments refreshed automatically',
          duration: 2000,
        });
      }, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, toast]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAssignments(mockAssignments);
    } catch (error) {
      
      toast.show({
        description: 'Failed to load assignments data',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort assignments
  const filteredAssignments = useMemo(() => {
    let filtered = mockAssignments.filter(assignment => {
      const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           assignment.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           assignment.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
      const matchesSubject = filterSubject === 'all' || assignment.subject === filterSubject;
      const matchesPriority = filterPriority === 'all' || assignment.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesSubject && matchesPriority;
    });

    // Sort assignments
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'subject':
          return a.subject.localeCompare(b.subject);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'submissions':
          return b.submissions - a.submissions;
        default:
          return 0;
      }
    });

    return filtered;
  }, [mockAssignments, searchQuery, filterStatus, filterSubject, filterPriority, sortBy]);

  // Bulk operations
  const handleBulkOperation = useCallback((operation: string) => {
    if (selectedAssignments.length === 0) {
      toast.show({
        description: 'Please select assignments first',
        duration: 2000,
      });
      return;
    }

    switch (operation) {
      case 'delete':
        toast.show({
          description: `${selectedAssignments.length} assignments deleted`,
          duration: 2000,
        });
        break;
      case 'duplicate':
        toast.show({
          description: `${selectedAssignments.length} assignments duplicated`,
          duration: 2000,
        });
        break;
      case 'archive':
        toast.show({
          description: `${selectedAssignments.length} assignments archived`,
          duration: 2000,
        });
        break;
      case 'export':
        toast.show({
          description: `${selectedAssignments.length} assignments exported`,
          duration: 2000,
        });
        break;
    }
    
    setSelectedAssignments([]);
    setShowBulkModal(false);
  }, [selectedAssignments, toast]);

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'blue';
      case 'completed': return 'green';
      case 'draft': return 'orange';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  // Priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Enhanced header with controls
  const renderHeader = () => (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Heading size="lg" color={textColor}>
            Assignments Manager
          </Heading>
          <HStack alignItems="center" space={2}>
            <Text color={mutedColor} fontSize="sm">
              {selectedClass?.name || 'All Classes'} • {filteredAssignments.length} assignments
            </Text>
            <Badge colorScheme="purple" variant="subtle" borderRadius="full">
              Live Updates
            </Badge>
          </HStack>
        </VStack>
        <HStack space={2}>
          <Switch
            size="sm"
            isChecked={autoRefresh}
            onToggle={setAutoRefresh}
            colorScheme="purple"
          />
          <Text fontSize="xs" color={mutedColor}>Auto</Text>
          <Button
            size="sm"
            colorScheme="green"
            onPress={() => setShowCreateModal(true)}
            leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
          >
            Create
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={onSettingsOpen}
            leftIcon={<Icon as={MaterialIcons} name="settings" size="sm" />}
          >
            Settings
          </Button>
        </HStack>
      </HStack>

      {/* Search and Filters */}
      <Card bg={cardBg} borderRadius="xl" p={4}>
        <VStack space={3}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold" color={textColor}>Search & Filters</Text>
            <Button
              size="xs"
              variant="ghost"
              onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
              rightIcon={<Icon as={MaterialIcons} name={showAdvancedFilters ? "expand_less" : "expand_more"} size="sm" />}
            >
              {showAdvancedFilters ? 'Less' : 'More'}
            </Button>
          </HStack>

          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            bg={cardBg}
            borderColor={borderColor}
            leftElement={<Icon as={MaterialIcons} name="search" size="sm" ml={3} color={mutedColor} />}
            rightElement={
              searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Icon as={MaterialIcons} name="clear" size="sm" mr={3} color={mutedColor} />
                </Pressable>
              ) : null
            }
          />

          <HStack space={3} flexWrap="wrap">
            <Select
              selectedValue={filterStatus}
              onValueChange={setFilterStatus}
              placeholder="Status"
              minW="120"
              size="sm"
              bg={cardBg}
              _selectedItem={{
                bg: 'purple.500',
                endIcon: <CheckIcon size="4" />
              }}
            >
              <Select.Item label="All Status" value="all" />
              <Select.Item label="Active" value="active" />
              <Select.Item label="Completed" value="completed" />
              <Select.Item label="Draft" value="draft" />
              <Select.Item label="Overdue" value="overdue" />
            </Select>

            <Select
              selectedValue={filterSubject}
              onValueChange={setFilterSubject}
              placeholder="Subject"
              minW="120"
              size="sm"
              bg={cardBg}
              _selectedItem={{
                bg: 'purple.500',
                endIcon: <CheckIcon size="4" />
              }}
            >
              <Select.Item label="All Subjects" value="all" />
              <Select.Item label="Mathematics" value="Mathematics" />
              <Select.Item label="Science" value="Science" />
              <Select.Item label="English" value="English" />
              <Select.Item label="History" value="History" />
              <Select.Item label="Geography" value="Geography" />
            </Select>

            <Select
              selectedValue={sortBy}
              onValueChange={setSortBy}
              placeholder="Sort By"
              minW="120"
              size="sm"
              bg={cardBg}
              _selectedItem={{
                bg: 'purple.500',
                endIcon: <CheckIcon size="4" />
              }}
            >
              <Select.Item label="Due Date" value="dueDate" />
              <Select.Item label="Title" value="title" />
              <Select.Item label="Subject" value="subject" />
              <Select.Item label="Priority" value="priority" />
              <Select.Item label="Submissions" value="submissions" />
            </Select>

            <HStack space={2}>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'solid' : 'outline'}
                colorScheme="purple"
                onPress={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'solid' : 'outline'}
                colorScheme="purple"
                onPress={() => setViewMode('grid')}
              >
                Grid
              </Button>
            </HStack>
          </HStack>

          {showAdvancedFilters && (
            <VStack space={3}>
              <Divider />
              <HStack space={3} alignItems="center">
                <Text fontSize="sm" fontWeight="medium" color={textColor}>Priority Filter:</Text>
                <Select
                  selectedValue={filterPriority}
                  onValueChange={setFilterPriority}
                  placeholder="Priority"
                  minW="120"
                  size="sm"
                  bg={cardBg}
                  _selectedItem={{
                    bg: 'purple.500',
                    endIcon: <CheckIcon size="4" />
                  }}
                >
                  <Select.Item label="All Priorities" value="all" />
                  <Select.Item label="High" value="high" />
                  <Select.Item label="Medium" value="medium" />
                  <Select.Item label="Low" value="low" />
                </Select>
              </HStack>

              {autoRefresh && (
                <VStack space={2}>
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm" color={mutedColor}>Refresh Interval: {refreshInterval}s</Text>
                    <Text fontSize="xs" color={mutedColor}>10s - 300s</Text>
                  </HStack>
                  <Slider
                    value={refreshInterval}
                    onChange={setRefreshInterval}
                    minValue={10}
                    maxValue={300}
                    step={10}
                    colorScheme="purple"
                  >
                    <Slider.Track>
                      <Slider.FilledTrack />
                    </Slider.Track>
                    <Slider.Thumb />
                  </Slider>
                </VStack>
              )}
            </VStack>
          )}
        </VStack>
      </Card>

      {/* Bulk Operations */}
      {selectedAssignments.length > 0 && (
        <Card bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="xl" p={4}>
          <HStack justifyContent="space-between" alignItems="center">
            <HStack alignItems="center" space={2}>
              <Icon as={MaterialIcons} name="checklist" color="blue.500" size="sm" />
              <Text fontWeight="bold" color="blue.500">
                {selectedAssignments.length} selected
              </Text>
            </HStack>
            <HStack space={2}>
              <Button size="sm" variant="outline" colorScheme="blue" onPress={() => setSelectedAssignments([])}>
                Clear
              </Button>
              <Button size="sm" colorScheme="blue" onPress={() => setShowBulkModal(true)}>
                Actions
              </Button>
            </HStack>
          </HStack>
        </Card>
      )}

      {/* Quick Stats */}
      <SimpleGrid columns={4} space={2}>
        <Animated.View
          style={{
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <Card bg={useColorModeValue('green.50', 'green.900')} borderRadius="lg" p={3}>
            <VStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="assignment_turned_in" size="lg" color="green.500" />
              <Text fontSize="xl" fontWeight="bold" color="green.500">
                {mockAssignments.filter(a => a.status === 'completed').length}
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Completed
              </Text>
            </VStack>
          </Card>
        </Animated.View>

        <Animated.View
          style={{
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <Card bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="lg" p={3}>
            <VStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="assignment" size="lg" color="blue.500" />
              <Text fontSize="xl" fontWeight="bold" color="blue.500">
                {mockAssignments.filter(a => a.status === 'active').length}
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Active
              </Text>
            </VStack>
          </Card>
        </Animated.View>

        <Animated.View
          style={{
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <Card bg={useColorModeValue('orange.50', 'orange.900')} borderRadius="lg" p={3}>
            <VStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="edit" size="lg" color="orange.500" />
              <Text fontSize="xl" fontWeight="bold" color="orange.500">
                {mockAssignments.filter(a => a.status === 'draft').length}
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Drafts
              </Text>
            </VStack>
          </Card>
        </Animated.View>

        <Animated.View
          style={{
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <Card bg={useColorModeValue('red.50', 'red.900')} borderRadius="lg" p={3}>
            <VStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="schedule" size="lg" color="red.500" />
              <Text fontSize="xl" fontWeight="bold" color="red.500">
                {mockAssignments.filter(a => a.status === 'overdue').length}
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Overdue
              </Text>
            </VStack>
          </Card>
        </Animated.View>
      </SimpleGrid>
    </VStack>
  );

  // Enhanced assignment cards
  const renderAssignmentCard = (assignment: any, index: number) => (
    <Animated.View
      key={assignment.id}
      style={{
        opacity: animationValue,
        transform: [{
          translateX: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        }],
      }}
    >
      <Pressable
        onPress={() => {
          toast.show({
            description: `Viewing ${assignment.title}`,
            duration: 2000,
          });
        }}
        onLongPress={() => {
          const newSelected = selectedAssignments.includes(assignment.id)
            ? selectedAssignments.filter(id => id !== assignment.id)
            : [...selectedAssignments, assignment.id];
          setSelectedAssignments(newSelected);
        }}
      >
        {({ isPressed }) => (
          <Card
            bg={selectedAssignments.includes(assignment.id) ? useColorModeValue('blue.50', 'blue.900') : cardBg}
            borderRadius="xl"
            borderWidth={selectedAssignments.includes(assignment.id) ? 2 : 1}
            borderColor={selectedAssignments.includes(assignment.id) ? 'blue.500' : borderColor}
            shadow={selectedAssignments.includes(assignment.id) ? 3 : 1}
            style={{
              transform: [{ scale: isPressed ? 0.98 : 1 }],
            }}
          >
            <VStack space={4} p={4}>
              {/* Header */}
              <HStack justifyContent="space-between" alignItems="flex-start">
                <HStack space={3} alignItems="center" flex={1}>
                  <Avatar
                    size="md"
                    bg={`${['blue', 'green', 'purple', 'orange', 'red'][index % 5]}.500`}
                  >
                    {assignment.subject.charAt(0)}
                  </Avatar>
                  <VStack flex={1}>
                    <Text fontWeight="bold" fontSize="md" color={textColor} numberOfLines={2}>
                      {assignment.title}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>
                      {assignment.subject} • {assignment.type}
                    </Text>
                  </VStack>
                </HStack>
                <VStack alignItems="flex-end" space={1}>
                  <Badge
                    colorScheme={getStatusColor(assignment.status)}
                    variant="solid"
                    borderRadius="full"
                  >
                    {assignment.status}
                  </Badge>
                  <Badge
                    colorScheme={getPriorityColor(assignment.priority)}
                    variant="outline"
                    borderRadius="full"
                    size="sm"
                  >
                    {assignment.priority}
                  </Badge>
                </VStack>
              </HStack>

              {/* Description */}
              <Text fontSize="sm" color={mutedColor} numberOfLines={2}>
                {assignment.description}
              </Text>

              {/* Stats */}
              <SimpleGrid columns={3} space={2}>
                <VStack alignItems="center" space={1}>
                  <Text fontSize="lg" fontWeight="bold" color="blue.500">
                    {assignment.submissions}/{assignment.totalStudents}
                  </Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">
                    Submissions
                  </Text>
                </VStack>
                <VStack alignItems="center" space={1}>
                  <Text fontSize="lg" fontWeight="bold" color="green.500">
                    {assignment.averageScore > 0 ? `${assignment.averageScore}%` : 'N/A'}
                  </Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">
                    Avg Score
                  </Text>
                </VStack>
                <VStack alignItems="center" space={1}>
                  <Text fontSize="lg" fontWeight="bold" color="purple.500">
                    {assignment.totalPoints}
                  </Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">
                    Points
                  </Text>
                </VStack>
              </SimpleGrid>

              {/* Progress */}
              <VStack space={2}>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color={mutedColor}>Completion</Text>
                  <Text fontSize="sm" color={textColor} fontWeight="medium">
                    {assignment.analytics.completionRate.toFixed(1)}%
                  </Text>
                </HStack>
                <Progress
                  value={assignment.analytics.completionRate}
                  size="md"
                  colorScheme={getStatusColor(assignment.status)}
                />
              </VStack>

              {/* Due Date */}
              <HStack justifyContent="space-between" alignItems="center">
                <HStack alignItems="center" space={2}>
                  <Icon as={MaterialIcons} name="schedule" size="sm" color={mutedColor} />
                  <Text fontSize="sm" color={mutedColor}>
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </Text>
                </HStack>
                <HStack space={1}>
                  <Button size="xs" variant="outline" colorScheme="blue">
                    Edit
                  </Button>
                  <Button size="xs" variant="outline" colorScheme="purple">
                    View
                  </Button>
                </HStack>
              </HStack>

              {/* Additional Info */}
              <HStack justifyContent="space-between" alignItems="center">
                <HStack alignItems="center" space={2}>
                  <Icon as={MaterialIcons} name="access_time" size="sm" color={mutedColor} />
                  <Text fontSize="xs" color={mutedColor}>
                    {assignment.estimatedTime}
                  </Text>
                </HStack>
                <HStack alignItems="center" space={2}>
                  <Icon as={MaterialIcons} name="attach_file" size="sm" color={mutedColor} />
                  <Text fontSize="xs" color={mutedColor}>
                    {assignment.attachments.length} files
                  </Text>
                </HStack>
              </HStack>
            </VStack>
          </Card>
        )}
      </Pressable>
    </Animated.View>
  );

  if (loading && !refreshing) {
    return (
      <VStack space={4} p={4}>
        <Skeleton h="20" borderRadius="xl" />
        <SimpleGrid columns={4} space={2}>
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} h="20" borderRadius="lg" />
          ))}
        </SimpleGrid>
        <VStack space={3}>
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} h="48" borderRadius="xl" />
          ))}
        </VStack>
      </VStack>
    );
  }

  return (
    <ScrollView
      bg={bgColor}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <VStack space={6} p={4} pb={8}>
        {renderHeader()}
        
        {filteredAssignments.length === 0 ? (
          <Card bg={cardBg} borderRadius="xl" p={8}>
            <VStack alignItems="center" space={4}>
              <Icon as={MaterialIcons} name="assignment" size="6xl" color={mutedColor} />
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                No assignments found
              </Text>
              <Text fontSize="sm" color={mutedColor} textAlign="center">
                {searchQuery || filterStatus !== 'all' || filterSubject !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Create your first assignment to get started'
                }
              </Text>
              <Button
                colorScheme="purple"
                onPress={() => setShowCreateModal(true)}
                leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
              >
                Create Assignment
              </Button>
            </VStack>
          </Card>
        ) : (
          <VStack space={4}>
            {viewMode === 'list' && (
              <VStack space={3}>
                {filteredAssignments.map((assignment, index) => 
                  renderAssignmentCard(assignment, index)
                )}
              </VStack>
            )}
            
            {viewMode === 'grid' && (
              <SimpleGrid columns={2} space={3}>
                {filteredAssignments.map((assignment, index) => 
                  renderAssignmentCard(assignment, index)
                )}
              </SimpleGrid>
            )}
          </VStack>
        )}
        
        {/* Floating Action Button */}
        <Fab
          renderInPortal={false}
          shadow={2}
          size="sm"
          icon={<Icon color="white" as={MaterialIcons} name="add" size="sm" />}
          colorScheme="purple"
          onPress={() => setShowCreateModal(true)}
        />
      </VStack>

      {/* Create Assignment Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} size="lg">
        <Modal.Content maxWidth="500px">
          <Modal.CloseButton />
          <Modal.Header>Create New Assignment</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <FormControl>
                <FormControl.Label>Title</FormControl.Label>
                <Input placeholder="Assignment title" />
              </FormControl>
              
              <FormControl>
                <FormControl.Label>Subject</FormControl.Label>
                <Select placeholder="Select subject">
                  <Select.Item label="Mathematics" value="mathematics" />
                  <Select.Item label="Science" value="science" />
                  <Select.Item label="English" value="english" />
                  <Select.Item label="History" value="history" />
                  <Select.Item label="Geography" value="geography" />
                </Select>
              </FormControl>

              <FormControl>
                <FormControl.Label>Description</FormControl.Label>
                <TextArea placeholder="Assignment description" />
              </FormControl>

              <HStack space={3}>
                <FormControl flex={1}>
                  <FormControl.Label>Due Date</FormControl.Label>
                  <Input placeholder="YYYY-MM-DD" />
                </FormControl>
                
                <FormControl flex={1}>
                  <FormControl.Label>Points</FormControl.Label>
                  <Input placeholder="100" keyboardType="numeric" />
                </FormControl>
              </HStack>

              <FormControl>
                <FormControl.Label>Priority</FormControl.Label>
                <Radio.Group 
                  value={assignmentPriority} 
                  onChange={setAssignmentPriority}
                >
                  <HStack space={4}>
                    <Radio value="low" colorScheme="green">Low</Radio>
                    <Radio value="medium" colorScheme="orange">Medium</Radio>
                    <Radio value="high" colorScheme="red">High</Radio>
                  </HStack>
                </Radio.Group>
              </FormControl>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                colorScheme="purple"
                onPress={() => {
                  toast.show({ description: 'Assignment created successfully!' });
                  setShowCreateModal(false);
                }}
              >
                Create Assignment
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Bulk Actions</Modal.Header>
          <Modal.Body>
            <VStack space={3}>
              <Text>Select an action for {selectedAssignments.length} assignments:</Text>
              
              <VStack space={2}>
                <Button
                  variant="outline"
                  colorScheme="blue"
                  onPress={() => handleBulkOperation('duplicate')}
                  leftIcon={<Icon as={MaterialIcons} name="content_copy" size="sm" />}
                >
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  colorScheme="orange"
                  onPress={() => handleBulkOperation('archive')}
                  leftIcon={<Icon as={MaterialIcons} name="archive" size="sm" />}
                >
                  Archive
                </Button>
                <Button
                  variant="outline"
                  colorScheme="purple"
                  onPress={() => handleBulkOperation('export')}
                  leftIcon={<Icon as={MaterialIcons} name="file_download" size="sm" />}
                >
                  Export
                </Button>
                <Button
                  variant="outline"
                  colorScheme="red"
                  onPress={() => handleBulkOperation('delete')}
                  leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" />}
                >
                  Delete
                </Button>
              </VStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" colorScheme="blueGray" onPress={() => setShowBulkModal(false)}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Assignment Settings</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <VStack space={2}>
                <Text fontWeight="medium">Default View:</Text>
                <Select
                  selectedValue={viewMode}
                  onValueChange={setViewMode}
                  _selectedItem={{
                    bg: 'purple.500',
                    endIcon: <CheckIcon size="5" />
                  }}
                >
                  <Select.Item label="List View" value="list" />
                  <Select.Item label="Grid View" value="grid" />
                </Select>
              </VStack>

              <VStack space={2}>
                <Text fontWeight="medium">Default Sort:</Text>
                <Select
                  selectedValue={sortBy}
                  onValueChange={setSortBy}
                  _selectedItem={{
                    bg: 'purple.500',
                    endIcon: <CheckIcon size="5" />
                  }}
                >
                  <Select.Item label="Due Date" value="dueDate" />
                  <Select.Item label="Title" value="title" />
                  <Select.Item label="Subject" value="subject" />
                  <Select.Item label="Priority" value="priority" />
                </Select>
              </VStack>

              <HStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="medium">Auto Refresh:</Text>
                <Switch
                  isChecked={autoRefresh}
                  onToggle={setAutoRefresh}
                  colorScheme="purple"
                />
              </HStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={onSettingsClose}>
                Cancel
              </Button>
              <Button colorScheme="purple" onPress={onSettingsClose}>
                Save Settings
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
};

export default AssignmentsTab; 
