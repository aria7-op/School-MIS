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
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions, Animated, RefreshControl } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ExamsTabProps {
  selectedClass: any;
  onClassSelect: (classItem: any) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const ExamsTab: React.FC<ExamsTabProps> = ({
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
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('examDate');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'timeline'>('list');
  const [animationValue] = useState(new Animated.Value(0));
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [examDifficulty, setExamDifficulty] = useState('medium');

  // Hooks
  const toast = useToast();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclose();

  // Enhanced dummy data with comprehensive exams
  const mockExams = useMemo(() => [
    {
      id: '1',
      title: 'Mid-Term Mathematics Examination',
      subject: 'Mathematics',
      description: 'Comprehensive exam covering algebra, geometry, and trigonometry',
      examDate: '2024-02-20',
      examTime: '09:00',
      duration: 120,
      createdDate: '2024-02-01',
      status: 'scheduled',
      type: 'midterm',
      totalMarks: 100,
      passingMarks: 40,
      venue: 'Room A-101',
      invigilator: 'Dr. Smith',
      studentsEnrolled: 28,
      studentsAppeared: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      difficultyLevel: 'medium',
      instructions: ['Bring calculator', 'Show all working', 'No mobile phones'],
      topics: ['Quadratic Equations', 'Coordinate Geometry', 'Trigonometric Ratios'],
      analytics: {
        preparationTime: 14,
        estimatedCompletion: 95,
        confidenceLevel: 4.2,
        expectedAverage: 75
      }
    },
    {
      id: '2',
      title: 'Science Practical Examination',
      subject: 'Science',
      description: 'Hands-on lab exam covering chemical reactions and physics experiments',
      examDate: '2024-02-18',
      examTime: '14:00',
      duration: 180,
      createdDate: '2024-01-28',
      status: 'completed',
      type: 'practical',
      totalMarks: 75,
      passingMarks: 30,
      venue: 'Science Lab B',
      invigilator: 'Prof. Johnson',
      studentsEnrolled: 28,
      studentsAppeared: 27,
      averageScore: 68.5,
      highestScore: 89,
      lowestScore: 42,
      difficultyLevel: 'hard',
      instructions: ['Wear lab coat', 'Follow safety protocols', 'Record observations'],
      topics: ['Chemical Reactions', 'Light Experiments', 'Electrical Circuits'],
      analytics: {
        preparationTime: 21,
        estimatedCompletion: 100,
        confidenceLevel: 3.8,
        expectedAverage: 65
      }
    },
    {
      id: '3',
      title: 'English Literature Quiz',
      subject: 'English',
      description: 'Quick assessment on Shakespeare and modern poetry',
      examDate: '2024-02-15',
      examTime: '11:00',
      duration: 45,
      createdDate: '2024-02-05',
      status: 'completed',
      type: 'quiz',
      totalMarks: 25,
      passingMarks: 10,
      venue: 'Room B-205',
      invigilator: 'Ms. Williams',
      studentsEnrolled: 28,
      studentsAppeared: 28,
      averageScore: 21.3,
      highestScore: 25,
      lowestScore: 15,
      difficultyLevel: 'easy',
      instructions: ['Multiple choice format', '30 minutes duration', 'No reference books'],
      topics: ['Romeo and Juliet', 'Modern Poetry', 'Literary Devices'],
      analytics: {
        preparationTime: 7,
        estimatedCompletion: 100,
        confidenceLevel: 4.5,
        expectedAverage: 80
      }
    },
    {
      id: '4',
      title: 'History Final Examination',
      subject: 'History',
      description: 'Comprehensive final exam on World Wars and modern history',
      examDate: '2024-02-28',
      examTime: '10:00',
      duration: 150,
      createdDate: '2024-02-10',
      status: 'draft',
      type: 'final',
      totalMarks: 150,
      passingMarks: 60,
      venue: 'Main Hall',
      invigilator: 'Dr. Brown',
      studentsEnrolled: 28,
      studentsAppeared: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      difficultyLevel: 'hard',
      instructions: ['Bring additional answer sheets', 'Write legibly', 'Attempt all sections'],
      topics: ['World War I', 'World War II', 'Cold War', 'Modern Conflicts'],
      analytics: {
        preparationTime: 30,
        estimatedCompletion: 85,
        confidenceLevel: 3.5,
        expectedAverage: 70
      }
    },
    {
      id: '5',
      title: 'Geography Map Test',
      subject: 'Geography',
      description: 'Practical map reading and geographical features identification',
      examDate: '2024-02-22',
      examTime: '13:00',
      duration: 90,
      createdDate: '2024-02-08',
      status: 'scheduled',
      type: 'test',
      totalMarks: 50,
      passingMarks: 20,
      venue: 'Geography Lab',
      invigilator: 'Mr. Davis',
      studentsEnrolled: 28,
      studentsAppeared: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      difficultyLevel: 'medium',
      instructions: ['Bring colored pencils', 'Use scale ruler', 'Label clearly'],
      topics: ['Physical Features', 'Political Boundaries', 'Climate Zones'],
      analytics: {
        preparationTime: 10,
        estimatedCompletion: 90,
        confidenceLevel: 4.0,
        expectedAverage: 72
      }
    }
  ], []);

  // Effects
  useEffect(() => {
    loadExams();
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
        loadExams();
        toast.show({
          description: 'Exams refreshed automatically',
          duration: 2000,
        });
      }, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, toast]);

  const loadExams = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExams(mockExams);
    } catch (error) {
      
      toast.show({
        description: 'Failed to load exams data',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort exams
  const filteredExams = useMemo(() => {
    let filtered = mockExams.filter(exam => {
      const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           exam.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
      const matchesSubject = filterSubject === 'all' || exam.subject === filterSubject;
      const matchesType = filterType === 'all' || exam.type === filterType;
      
      return matchesSearch && matchesStatus && matchesSubject && matchesType;
    });

    // Sort exams
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'examDate':
          return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'subject':
          return a.subject.localeCompare(b.subject);
        case 'totalMarks':
          return b.totalMarks - a.totalMarks;
        case 'duration':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });

    return filtered;
  }, [mockExams, searchQuery, filterStatus, filterSubject, filterType, sortBy]);

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'completed': return 'green';
      case 'draft': return 'orange';
      case 'cancelled': return 'red';
      case 'ongoing': return 'purple';
      default: return 'gray';
    }
  };

  // Difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'gray';
    }
  };

  // Enhanced header with controls
  const renderHeader = () => (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Heading size="lg" color={textColor}>
            Examinations Center
          </Heading>
          <HStack alignItems="center" space={2}>
            <Text color={mutedColor} fontSize="sm">
              {selectedClass?.name || 'All Classes'} • {filteredExams.length} exams
            </Text>
            <Badge colorScheme="green" variant="subtle" borderRadius="full">
              Live Monitoring
            </Badge>
          </HStack>
        </VStack>
        <HStack space={2}>
          <Switch
            size="sm"
            isChecked={autoRefresh}
            onToggle={setAutoRefresh}
            colorScheme="green"
          />
          <Text fontSize="xs" color={mutedColor}>Auto</Text>
          <Button
            size="sm"
            colorScheme="purple"
            onPress={() => setShowAnalyticsModal(true)}
            leftIcon={<Icon as={MaterialIcons} name="analytics" size="sm" />}
          >
            Analytics
          </Button>
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
            placeholder="Search exams..."
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
                bg: 'green.500',
                endIcon: <CheckIcon size="4" />
              }}
            >
              <Select.Item label="All Status" value="all" />
              <Select.Item label="Scheduled" value="scheduled" />
              <Select.Item label="Completed" value="completed" />
              <Select.Item label="Draft" value="draft" />
              <Select.Item label="Ongoing" value="ongoing" />
              <Select.Item label="Cancelled" value="cancelled" />
            </Select>

            <Select
              selectedValue={filterSubject}
              onValueChange={setFilterSubject}
              placeholder="Subject"
              minW="120"
              size="sm"
              bg={cardBg}
              _selectedItem={{
                bg: 'green.500',
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
                bg: 'green.500',
                endIcon: <CheckIcon size="4" />
              }}
            >
              <Select.Item label="Exam Date" value="examDate" />
              <Select.Item label="Title" value="title" />
              <Select.Item label="Subject" value="subject" />
              <Select.Item label="Total Marks" value="totalMarks" />
              <Select.Item label="Duration" value="duration" />
            </Select>

            <HStack space={2}>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'solid' : 'outline'}
                colorScheme="green"
                onPress={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'calendar' ? 'solid' : 'outline'}
                colorScheme="green"
                onPress={() => setViewMode('calendar')}
              >
                Calendar
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'timeline' ? 'solid' : 'outline'}
                colorScheme="green"
                onPress={() => setViewMode('timeline')}
              >
                Timeline
              </Button>
            </HStack>
          </HStack>

          {showAdvancedFilters && (
            <VStack space={3}>
              <Divider />
              <HStack space={3} alignItems="center">
                <Text fontSize="sm" fontWeight="medium" color={textColor}>Exam Type:</Text>
                <Select
                  selectedValue={filterType}
                  onValueChange={setFilterType}
                  placeholder="Type"
                  minW="120"
                  size="sm"
                  bg={cardBg}
                  _selectedItem={{
                    bg: 'green.500',
                    endIcon: <CheckIcon size="4" />
                  }}
                >
                  <Select.Item label="All Types" value="all" />
                  <Select.Item label="Quiz" value="quiz" />
                  <Select.Item label="Test" value="test" />
                  <Select.Item label="Midterm" value="midterm" />
                  <Select.Item label="Final" value="final" />
                  <Select.Item label="Practical" value="practical" />
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
                    colorScheme="green"
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
      {selectedExams.length > 0 && (
        <Card bg={useColorModeValue('green.50', 'green.900')} borderRadius="xl" p={4}>
          <HStack justifyContent="space-between" alignItems="center">
            <HStack alignItems="center" space={2}>
              <Icon as={MaterialIcons} name="checklist" color="green.500" size="sm" />
              <Text fontWeight="bold" color="green.500">
                {selectedExams.length} selected
              </Text>
            </HStack>
            <HStack space={2}>
              <Button size="sm" variant="outline" colorScheme="green" onPress={() => setSelectedExams([])}>
                Clear
              </Button>
              <Button size="sm" colorScheme="green" onPress={() => setShowBulkModal(true)}>
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
          <Card bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="lg" p={3}>
            <VStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="schedule" size="lg" color="blue.500" />
              <Text fontSize="xl" fontWeight="bold" color="blue.500">
                {mockExams.filter(e => e.status === 'scheduled').length}
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Scheduled
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
          <Card bg={useColorModeValue('green.50', 'green.900')} borderRadius="lg" p={3}>
            <VStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="check_circle" size="lg" color="green.500" />
              <Text fontSize="xl" fontWeight="bold" color="green.500">
                {mockExams.filter(e => e.status === 'completed').length}
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
          <Card bg={useColorModeValue('orange.50', 'orange.900')} borderRadius="lg" p={3}>
            <VStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="edit" size="lg" color="orange.500" />
              <Text fontSize="xl" fontWeight="bold" color="orange.500">
                {mockExams.filter(e => e.status === 'draft').length}
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
          <Card bg={useColorModeValue('purple.50', 'purple.900')} borderRadius="lg" p={3}>
            <VStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="assessment" size="lg" color="purple.500" />
              <Text fontSize="xl" fontWeight="bold" color="purple.500">
                {Math.round(mockExams.filter(e => e.averageScore > 0).reduce((sum, e) => sum + e.averageScore, 0) / mockExams.filter(e => e.averageScore > 0).length) || 0}%
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Avg Score
              </Text>
            </VStack>
          </Card>
        </Animated.View>
      </SimpleGrid>
    </VStack>
  );

  // Enhanced exam cards
  const renderExamCard = (exam: any, index: number) => (
    <Animated.View
      key={exam.id}
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
            description: `Viewing ${exam.title}`,
            duration: 2000,
          });
        }}
        onLongPress={() => {
          const newSelected = selectedExams.includes(exam.id)
            ? selectedExams.filter(id => id !== exam.id)
            : [...selectedExams, exam.id];
          setSelectedExams(newSelected);
        }}
      >
        {({ isPressed }) => (
          <Card
            bg={selectedExams.includes(exam.id) ? useColorModeValue('green.50', 'green.900') : cardBg}
            borderRadius="xl"
            borderWidth={selectedExams.includes(exam.id) ? 2 : 1}
            borderColor={selectedExams.includes(exam.id) ? 'green.500' : borderColor}
            shadow={selectedExams.includes(exam.id) ? 3 : 1}
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
                    {exam.subject.charAt(0)}
                  </Avatar>
                  <VStack flex={1}>
                    <Text fontWeight="bold" fontSize="md" color={textColor} numberOfLines={2}>
                      {exam.title}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>
                      {exam.subject} • {exam.type}
                    </Text>
                  </VStack>
                </HStack>
                <VStack alignItems="flex-end" space={1}>
                  <Badge
                    colorScheme={getStatusColor(exam.status)}
                    variant="solid"
                    borderRadius="full"
                  >
                    {exam.status}
                  </Badge>
                  <Badge
                    colorScheme={getDifficultyColor(exam.difficultyLevel)}
                    variant="outline"
                    borderRadius="full"
                    size="sm"
                  >
                    {exam.difficultyLevel}
                  </Badge>
                </VStack>
              </HStack>

              {/* Description */}
              <Text fontSize="sm" color={mutedColor} numberOfLines={2}>
                {exam.description}
              </Text>

              {/* Exam Details */}
              <SimpleGrid columns={2} space={3}>
                <VStack space={2}>
                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="calendar_today" size="sm" color={mutedColor} />
                    <Text fontSize="sm" color={textColor}>
                      {new Date(exam.examDate).toLocaleDateString()}
                    </Text>
                  </HStack>
                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="access_time" size="sm" color={mutedColor} />
                    <Text fontSize="sm" color={textColor}>
                      {exam.examTime} ({exam.duration}min)
                    </Text>
                  </HStack>
                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="location_on" size="sm" color={mutedColor} />
                    <Text fontSize="sm" color={textColor}>
                      {exam.venue}
                    </Text>
                  </HStack>
                </VStack>
                
                <VStack space={2}>
                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="grade" size="sm" color={mutedColor} />
                    <Text fontSize="sm" color={textColor}>
                      {exam.totalMarks} marks
                    </Text>
                  </HStack>
                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="person" size="sm" color={mutedColor} />
                    <Text fontSize="sm" color={textColor}>
                      {exam.invigilator}
                    </Text>
                  </HStack>
                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="group" size="sm" color={mutedColor} />
                    <Text fontSize="sm" color={textColor}>
                      {exam.studentsEnrolled} students
                    </Text>
                  </HStack>
                </VStack>
              </SimpleGrid>

              {/* Performance Stats (if completed) */}
              {exam.status === 'completed' && (
                <VStack space={2}>
                  <Divider />
                  <SimpleGrid columns={3} space={2}>
                    <VStack alignItems="center" space={1}>
                      <Text fontSize="lg" fontWeight="bold" color="green.500">
                        {exam.averageScore}%
                      </Text>
                      <Text fontSize="xs" color={mutedColor} textAlign="center">
                        Average
                      </Text>
                    </VStack>
                    <VStack alignItems="center" space={1}>
                      <Text fontSize="lg" fontWeight="bold" color="blue.500">
                        {exam.highestScore}%
                      </Text>
                      <Text fontSize="xs" color={mutedColor} textAlign="center">
                        Highest
                      </Text>
                    </VStack>
                    <VStack alignItems="center" space={1}>
                      <Text fontSize="lg" fontWeight="bold" color="orange.500">
                        {exam.studentsAppeared}/{exam.studentsEnrolled}
                      </Text>
                      <Text fontSize="xs" color={mutedColor} textAlign="center">
                        Appeared
                      </Text>
                    </VStack>
                  </SimpleGrid>
                </VStack>
              )}

              {/* Analytics Preview */}
              <VStack space={2}>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color={mutedColor}>Preparation Progress</Text>
                  <Text fontSize="sm" color={textColor} fontWeight="medium">
                    {exam.analytics.estimatedCompletion}%
                  </Text>
                </HStack>
                <Progress
                  value={exam.analytics.estimatedCompletion}
                  size="md"
                  colorScheme={getStatusColor(exam.status)}
                />
              </VStack>

              {/* Action Buttons */}
              <HStack justifyContent="space-between" alignItems="center">
                <HStack alignItems="center" space={2}>
                  <Icon as={MaterialIcons} name="topic" size="sm" color={mutedColor} />
                  <Text fontSize="xs" color={mutedColor}>
                    {exam.topics.length} topics
                  </Text>
                </HStack>
                <HStack space={1}>
                  <Button size="xs" variant="outline" colorScheme="green">
                    Edit
                  </Button>
                  <Button size="xs" variant="outline" colorScheme="purple">
                    View
                  </Button>
                  {exam.status === 'completed' && (
                    <Button size="xs" variant="outline" colorScheme="blue">
                      Results
                    </Button>
                  )}
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
            <Skeleton key={item} h="64" borderRadius="xl" />
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
        
        {filteredExams.length === 0 ? (
          <Card bg={cardBg} borderRadius="xl" p={8}>
            <VStack alignItems="center" space={4}>
              <Icon as={MaterialIcons} name="quiz" size="6xl" color={mutedColor} />
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                No exams found
              </Text>
              <Text fontSize="sm" color={mutedColor} textAlign="center">
                {searchQuery || filterStatus !== 'all' || filterSubject !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Create your first exam to get started'
                }
              </Text>
              <Button
                colorScheme="green"
                onPress={() => setShowCreateModal(true)}
                leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
              >
                Create Exam
              </Button>
            </VStack>
          </Card>
        ) : (
          <VStack space={4}>
            {filteredExams.map((exam, index) => 
              renderExamCard(exam, index)
            )}
          </VStack>
        )}
        
        {/* Floating Action Button */}
        <Fab
          renderInPortal={false}
          shadow={2}
          size="sm"
          icon={<Icon color="white" as={MaterialIcons} name="add" size="sm" />}
          colorScheme="green"
          onPress={() => setShowCreateModal(true)}
        />
      </VStack>

      {/* Create Exam Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} size="lg">
        <Modal.Content maxWidth="500px">
          <Modal.CloseButton />
          <Modal.Header>Create New Exam</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <FormControl>
                <FormControl.Label>Exam Title</FormControl.Label>
                <Input placeholder="Enter exam title" />
              </FormControl>
              
              <HStack space={3}>
                <FormControl flex={1}>
                  <FormControl.Label>Subject</FormControl.Label>
                  <Select placeholder="Select subject">
                    <Select.Item label="Mathematics" value="mathematics" />
                    <Select.Item label="Science" value="science" />
                    <Select.Item label="English" value="english" />
                    <Select.Item label="History" value="history" />
                    <Select.Item label="Geography" value="geography" />
                  </Select>
                </FormControl>
                
                <FormControl flex={1}>
                  <FormControl.Label>Exam Type</FormControl.Label>
                  <Select placeholder="Select type">
                    <Select.Item label="Quiz" value="quiz" />
                    <Select.Item label="Test" value="test" />
                    <Select.Item label="Midterm" value="midterm" />
                    <Select.Item label="Final" value="final" />
                    <Select.Item label="Practical" value="practical" />
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormControl.Label>Description</FormControl.Label>
                <TextArea placeholder="Exam description" />
              </FormControl>

              <HStack space={3}>
                <FormControl flex={1}>
                  <FormControl.Label>Exam Date</FormControl.Label>
                  <Input placeholder="YYYY-MM-DD" />
                </FormControl>
                
                <FormControl flex={1}>
                  <FormControl.Label>Time</FormControl.Label>
                  <Input placeholder="HH:MM" />
                </FormControl>
              </HStack>

              <HStack space={3}>
                <FormControl flex={1}>
                  <FormControl.Label>Duration (min)</FormControl.Label>
                  <Input placeholder="120" keyboardType="numeric" />
                </FormControl>
                
                <FormControl flex={1}>
                  <FormControl.Label>Total Marks</FormControl.Label>
                  <Input placeholder="100" keyboardType="numeric" />
                </FormControl>
              </HStack>

              <HStack space={3}>
                <FormControl flex={1}>
                  <FormControl.Label>Venue</FormControl.Label>
                  <Input placeholder="Room/Hall" />
                </FormControl>
                
                <FormControl flex={1}>
                  <FormControl.Label>Invigilator</FormControl.Label>
                  <Input placeholder="Teacher name" />
                </FormControl>
              </HStack>

              <FormControl>
                <FormControl.Label>Difficulty Level</FormControl.Label>
                <Radio.Group 
                  value={examDifficulty} 
                  onChange={setExamDifficulty}
                >
                  <HStack space={4}>
                    <Radio value="easy" colorScheme="green">Easy</Radio>
                    <Radio value="medium" colorScheme="orange">Medium</Radio>
                    <Radio value="hard" colorScheme="red">Hard</Radio>
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
                colorScheme="green"
                onPress={() => {
                  toast.show({ description: 'Exam created successfully!' });
                  setShowCreateModal(false);
                }}
              >
                Create Exam
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Analytics Modal */}
      <Modal isOpen={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)} size="lg">
        <Modal.Content maxWidth="600px">
          <Modal.CloseButton />
          <Modal.Header>Exam Analytics</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <SimpleGrid columns={2} space={4}>
                <Card bg={useColorModeValue('blue.50', 'blue.900')} p={4}>
                  <VStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="quiz" size="2xl" color="blue.500" />
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      {mockExams.length}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>Total Exams</Text>
                  </VStack>
                </Card>
                
                <Card bg={useColorModeValue('green.50', 'green.900')} p={4}>
                  <VStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="trending_up" size="2xl" color="green.500" />
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {Math.round(mockExams.filter(e => e.averageScore > 0).reduce((sum, e) => sum + e.averageScore, 0) / mockExams.filter(e => e.averageScore > 0).length) || 0}%
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>Average Score</Text>
                  </VStack>
                </Card>
              </SimpleGrid>

              <VStack space={3}>
                <Text fontWeight="bold" color={textColor}>Exam Performance</Text>
                {mockExams.filter(e => e.status === 'completed').map((exam, index) => (
                  <HStack key={exam.id} justifyContent="space-between" alignItems="center">
                    <VStack flex={1}>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        {exam.title}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>
                        {exam.subject} • {new Date(exam.examDate).toLocaleDateString()}
                      </Text>
                    </VStack>
                    <VStack alignItems="flex-end">
                      <Text fontSize="sm" fontWeight="bold" color="green.500">
                        {exam.averageScore}%
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>
                        {exam.studentsAppeared}/{exam.studentsEnrolled} appeared
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button colorScheme="green" onPress={() => setShowAnalyticsModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Exam Settings</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <VStack space={2}>
                <Text fontWeight="medium">Default View:</Text>
                <Select
                  selectedValue={viewMode}
                  onValueChange={setViewMode}
                  _selectedItem={{
                    bg: 'green.500',
                    endIcon: <CheckIcon size="5" />
                  }}
                >
                  <Select.Item label="List View" value="list" />
                  <Select.Item label="Calendar View" value="calendar" />
                  <Select.Item label="Timeline View" value="timeline" />
                </Select>
              </VStack>

              <VStack space={2}>
                <Text fontWeight="medium">Default Sort:</Text>
                <Select
                  selectedValue={sortBy}
                  onValueChange={setSortBy}
                  _selectedItem={{
                    bg: 'green.500',
                    endIcon: <CheckIcon size="5" />
                  }}
                >
                  <Select.Item label="Exam Date" value="examDate" />
                  <Select.Item label="Title" value="title" />
                  <Select.Item label="Subject" value="subject" />
                  <Select.Item label="Total Marks" value="totalMarks" />
                </Select>
              </VStack>

              <HStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="medium">Auto Refresh:</Text>
                <Switch
                  isChecked={autoRefresh}
                  onToggle={setAutoRefresh}
                  colorScheme="green"
                />
              </HStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={onSettingsClose}>
                Cancel
              </Button>
              <Button colorScheme="green" onPress={onSettingsClose}>
                Save Settings
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
};

export default ExamsTab; 
