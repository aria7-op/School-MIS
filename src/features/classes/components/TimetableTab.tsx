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

interface TimetableTabProps {
  selectedClass: any;
  onClassSelect: (classItem: any) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const TimetableTab: React.FC<TimetableTabProps> = ({
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
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('current');
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'list'>('week');
  const [selectedDay, setSelectedDay] = useState('monday');
  const [animationValue] = useState(new Animated.Value(0));
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showConflicts, setShowConflicts] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [classType, setClassType] = useState('lecture');

  // Hooks
  const toast = useToast();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclose();

  // Time slots
  const timeSlots = [
    '08:00 - 08:45',
    '08:45 - 09:30',
    '09:30 - 10:15',
    '10:15 - 11:00',
    '11:00 - 11:45',
    '11:45 - 12:30',
    '12:30 - 13:15',
    '13:15 - 14:00',
    '14:00 - 14:45',
    '14:45 - 15:30'
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Thursday', short: 'Thu' },
    { key: 'friday', label: 'Friday', short: 'Fri' },
    { key: 'saturday', label: 'Saturday', short: 'Sat' }
  ];

  // Enhanced dummy data with comprehensive timetable
  const mockTimetable = useMemo(() => ({
    monday: [
      {
        id: '1',
        subject: 'Mathematics',
        teacher: 'Dr. Smith',
        room: 'A-101',
        timeSlot: '08:00 - 08:45',
        type: 'lecture',
        duration: 45,
        students: 28,
        resources: ['Whiteboard', 'Projector'],
        status: 'scheduled',
        color: '#3B82F6',
        notes: 'Algebra chapter 5',
        conflicts: []
      },
      {
        id: '2',
        subject: 'Science',
        teacher: 'Prof. Johnson',
        room: 'Lab-B',
        timeSlot: '08:45 - 09:30',
        type: 'practical',
        duration: 45,
        students: 28,
        resources: ['Lab Equipment', 'Safety Gear'],
        status: 'scheduled',
        color: '#10B981',
        notes: 'Chemical reactions experiment',
        conflicts: []
      },
      {
        id: '3',
        subject: 'English',
        teacher: 'Ms. Williams',
        room: 'B-205',
        timeSlot: '10:15 - 11:00',
        type: 'lecture',
        duration: 45,
        students: 28,
        resources: ['Audio System'],
        status: 'scheduled',
        color: '#F59E0B',
        notes: 'Shakespeare reading',
        conflicts: []
      },
      {
        id: '4',
        subject: 'History',
        teacher: 'Dr. Brown',
        room: 'C-301',
        timeSlot: '11:45 - 12:30',
        type: 'lecture',
        duration: 45,
        students: 28,
        resources: ['Maps', 'Timeline Charts'],
        status: 'scheduled',
        color: '#8B5CF6',
        notes: 'World War II discussion',
        conflicts: []
      },
      {
        id: '5',
        subject: 'Physical Education',
        teacher: 'Coach Davis',
        room: 'Gymnasium',
        timeSlot: '14:00 - 14:45',
        type: 'practical',
        duration: 45,
        students: 28,
        resources: ['Sports Equipment'],
        status: 'scheduled',
        color: '#EF4444',
        notes: 'Basketball practice',
        conflicts: []
      }
    ],
    tuesday: [
      {
        id: '6',
        subject: 'Science',
        teacher: 'Prof. Johnson',
        room: 'A-102',
        timeSlot: '08:00 - 08:45',
        type: 'lecture',
        duration: 45,
        students: 28,
        resources: ['Whiteboard', 'Models'],
        status: 'scheduled',
        color: '#10B981',
        notes: 'Physics - Motion',
        conflicts: []
      },
      {
        id: '7',
        subject: 'Mathematics',
        teacher: 'Dr. Smith',
        room: 'A-101',
        timeSlot: '09:30 - 10:15',
        type: 'lecture',
        duration: 45,
        students: 28,
        resources: ['Graphing Tools'],
        status: 'scheduled',
        color: '#3B82F6',
        notes: 'Geometry theorems',
        conflicts: []
      },
      {
        id: '8',
        subject: 'Geography',
        teacher: 'Mr. Wilson',
        room: 'D-401',
        timeSlot: '11:00 - 11:45',
        type: 'lecture',
        duration: 45,
        students: 28,
        resources: ['World Map', 'Atlas'],
        status: 'scheduled',
        color: '#06B6D4',
        notes: 'Climate zones',
        conflicts: []
      },
      {
        id: '9',
        subject: 'Art',
        teacher: 'Ms. Garcia',
        room: 'Art Studio',
        timeSlot: '13:15 - 14:00',
        type: 'practical',
        duration: 45,
        students: 28,
        resources: ['Art Supplies', 'Canvas'],
        status: 'scheduled',
        color: '#EC4899',
        notes: 'Watercolor techniques',
        conflicts: []
      }
    ],
    wednesday: [
      {
        id: '10',
        subject: 'English',
        teacher: 'Ms. Williams',
        room: 'B-205',
        timeSlot: '08:00 - 08:45',
        type: 'lecture',
        duration: 45,
        students: 28,
        resources: ['Books', 'Audio System'],
        status: 'scheduled',
        color: '#F59E0B',
        notes: 'Poetry analysis',
        conflicts: []
      },
      {
        id: '11',
        subject: 'Mathematics',
        teacher: 'Dr. Smith',
        room: 'A-101',
        timeSlot: '08:45 - 09:30',
        type: 'tutorial',
        duration: 45,
        students: 14,
        resources: ['Calculators'],
        status: 'scheduled',
        color: '#3B82F6',
        notes: 'Problem solving session',
        conflicts: []
      },
      {
        id: '12',
        subject: 'Computer Science',
        teacher: 'Dr. Lee',
        room: 'Computer Lab',
        timeSlot: '10:15 - 11:45',
        type: 'practical',
        duration: 90,
        students: 28,
        resources: ['Computers', 'Software'],
        status: 'scheduled',
        color: '#6366F1',
        notes: 'Programming basics',
        conflicts: []
      },
      {
        id: '13',
        subject: 'Music',
        teacher: 'Ms. Taylor',
        room: 'Music Room',
        timeSlot: '14:00 - 14:45',
        type: 'practical',
        duration: 45,
        students: 28,
        resources: ['Instruments', 'Sheet Music'],
        status: 'scheduled',
        color: '#F97316',
        notes: 'Choir practice',
        conflicts: []
      }
    ],
    thursday: [
      {
        id: '14',
        subject: 'History',
        teacher: 'Dr. Brown',
        room: 'C-301',
        timeSlot: '08:00 - 08:45',
        type: 'lecture',
        duration: 45,
        students: 28,
        resources: ['Historical Documents'],
        status: 'scheduled',
        color: '#8B5CF6',
        notes: 'Ancient civilizations',
        conflicts: []
      },
      {
        id: '15',
        subject: 'Science',
        teacher: 'Prof. Johnson',
        room: 'A-102',
        timeSlot: '09:30 - 10:15',
        type: 'lecture',
        duration: 45,
        students: 28,
        resources: ['Lab Models'],
        status: 'scheduled',
        color: '#10B981',
        notes: 'Biology - Cell structure',
        conflicts: []
      },
      {
        id: '16',
        subject: 'Mathematics',
        teacher: 'Dr. Smith',
        room: 'A-101',
        timeSlot: '11:00 - 11:45',
        type: 'test',
        duration: 45,
        students: 28,
        resources: ['Test Papers'],
        status: 'scheduled',
        color: '#3B82F6',
        notes: 'Weekly assessment',
        conflicts: []
      },
      {
        id: '17',
        subject: 'Library Period',
        teacher: 'Librarian',
        room: 'Library',
        timeSlot: '13:15 - 14:00',
        type: 'study',
        duration: 45,
        students: 28,
        resources: ['Books', 'Research Materials'],
        status: 'scheduled',
        color: '#64748B',
        notes: 'Silent study time',
        conflicts: []
      }
    ],
    friday: [
      {
        id: '18',
        subject: 'Geography',
        teacher: 'Mr. Wilson',
        room: 'D-401',
        timeSlot: '08:00 - 08:45',
        type: 'lecture',
        duration: 45,
        students: 28,
        resources: ['Maps', 'Globe'],
        status: 'scheduled',
        color: '#06B6D4',
        notes: 'Natural disasters',
        conflicts: []
      },
      {
        id: '19',
        subject: 'English',
        teacher: 'Ms. Williams',
        room: 'B-205',
        timeSlot: '08:45 - 09:30',
        type: 'presentation',
        duration: 45,
        students: 28,
        resources: ['Projector', 'Microphone'],
        status: 'scheduled',
        color: '#F59E0B',
        notes: 'Student presentations',
        conflicts: []
      },
      {
        id: '20',
        subject: 'Assembly',
        teacher: 'Principal',
        room: 'Main Hall',
        timeSlot: '10:15 - 11:00',
        type: 'assembly',
        duration: 45,
        students: 200,
        resources: ['Sound System', 'Stage'],
        status: 'scheduled',
        color: '#78716C',
        notes: 'Weekly assembly',
        conflicts: []
      },
      {
        id: '21',
        subject: 'Sports',
        teacher: 'Coach Davis',
        room: 'Sports Field',
        timeSlot: '14:00 - 15:30',
        type: 'practical',
        duration: 90,
        students: 28,
        resources: ['Sports Equipment'],
        status: 'scheduled',
        color: '#EF4444',
        notes: 'Inter-house competition',
        conflicts: []
      }
    ],
    saturday: [
      {
        id: '22',
        subject: 'Extra Curricular',
        teacher: 'Various',
        room: 'Multiple',
        timeSlot: '09:00 - 11:00',
        type: 'activity',
        duration: 120,
        students: 28,
        resources: ['Activity Materials'],
        status: 'scheduled',
        color: '#84CC16',
        notes: 'Club activities',
        conflicts: []
      },
      {
        id: '23',
        subject: 'Remedial Classes',
        teacher: 'Subject Teachers',
        room: 'Various',
        timeSlot: '11:00 - 12:00',
        type: 'tutorial',
        duration: 60,
        students: 10,
        resources: ['Study Materials'],
        status: 'optional',
        color: '#F97316',
        notes: 'Extra help session',
        conflicts: []
      }
    ]
  }), []);

  // Effects
  useEffect(() => {
    loadTimetable();
  }, [selectedClass, selectedWeek]);

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
        loadTimetable();
        toast.show({
          description: 'Timetable refreshed automatically',
          duration: 2000,
        });
      }, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, toast]);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTimetable(mockTimetable);
    } catch (error) {
      
      toast.show({
        description: 'Failed to load timetable data',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Get current day's schedule
  const getCurrentDaySchedule = () => {
    const today = new Date().getDay();
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayMap[today];
    return mockTimetable[currentDay] || [];
  };

  // Get statistics
  const getStatistics = () => {
    const allClasses = Object.values(mockTimetable).flat();
    const totalClasses = allClasses.length;
    const uniqueSubjects = [...new Set(allClasses.map(c => c.subject))].length;
    const uniqueTeachers = [...new Set(allClasses.map(c => c.teacher))].length;
    const practicalClasses = allClasses.filter(c => c.type === 'practical').length;
    
    return {
      totalClasses,
      uniqueSubjects,
      uniqueTeachers,
      practicalClasses,
      averageClassSize: Math.round(allClasses.reduce((sum, c) => sum + c.students, 0) / totalClasses),
      utilizationRate: Math.round((totalClasses / (timeSlots.length * daysOfWeek.length)) * 100)
    };
  };

  const stats = getStatistics();

  // Enhanced header with controls
  const renderHeader = () => (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Heading size="lg" color={textColor}>
            Smart Timetable
          </Heading>
          <HStack alignItems="center" space={2}>
            <Text color={mutedColor} fontSize="sm">
              {selectedClass?.name || 'All Classes'} • {selectedWeek} week
            </Text>
            <Badge colorScheme="cyan" variant="subtle" borderRadius="full">
              AI Optimized
            </Badge>
          </HStack>
        </VStack>
        <HStack space={2}>
          <Switch
            size="sm"
            isChecked={autoRefresh}
            onToggle={setAutoRefresh}
            colorScheme="cyan"
          />
          <Text fontSize="xs" color={mutedColor}>Auto</Text>
          <Button
            size="sm"
            colorScheme="green"
            onPress={() => setShowCreateModal(true)}
            leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
          >
            Add Class
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

      {/* Controls */}
      <Card bg={cardBg} borderRadius="xl" p={4}>
        <VStack space={3}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold" color={textColor}>View Controls</Text>
            <HStack alignItems="center" space={2}>
              <Text fontSize="sm" color={mutedColor}>Show Conflicts:</Text>
              <Switch
                isChecked={showConflicts}
                onToggle={setShowConflicts}
                colorScheme="red"
                size="sm"
              />
            </HStack>
          </HStack>

          <HStack space={3} flexWrap="wrap">
            <Select
              selectedValue={selectedWeek}
              onValueChange={setSelectedWeek}
              placeholder="Week"
              minW="120"
              size="sm"
              bg={cardBg}
              _selectedItem={{
                bg: 'cyan.500',
                endIcon: <CheckIcon size="4" />
              }}
            >
              <Select.Item label="Current Week" value="current" />
              <Select.Item label="Next Week" value="next" />
              <Select.Item label="Previous Week" value="previous" />
            </Select>

            <HStack space={2}>
              <Button
                size="sm"
                variant={viewMode === 'week' ? 'solid' : 'outline'}
                colorScheme="cyan"
                onPress={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'day' ? 'solid' : 'outline'}
                colorScheme="cyan"
                onPress={() => setViewMode('day')}
              >
                Day
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'solid' : 'outline'}
                colorScheme="cyan"
                onPress={() => setViewMode('list')}
              >
                List
              </Button>
            </HStack>

            {viewMode === 'day' && (
              <Select
                selectedValue={selectedDay}
                onValueChange={setSelectedDay}
                placeholder="Day"
                minW="120"
                size="sm"
                bg={cardBg}
                _selectedItem={{
                  bg: 'cyan.500',
                  endIcon: <CheckIcon size="4" />
                }}
              >
                {daysOfWeek.map(day => (
                  <Select.Item key={day.key} label={day.label} value={day.key} />
                ))}
              </Select>
            )}
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
                colorScheme="cyan"
              >
                <Slider.Track>
                  <Slider.FilledTrack />
                </Slider.Track>
                <Slider.Thumb />
              </Slider>
            </VStack>
          )}
        </VStack>
      </Card>

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
                {stats.totalClasses}
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Total Classes
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
              <Icon as={MaterialIcons} name="book" size="lg" color="green.500" />
              <Text fontSize="xl" fontWeight="bold" color="green.500">
                {stats.uniqueSubjects}
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Subjects
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
              <Icon as={MaterialIcons} name="person" size="lg" color="purple.500" />
              <Text fontSize="xl" fontWeight="bold" color="purple.500">
                {stats.uniqueTeachers}
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Teachers
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
              <Icon as={MaterialIcons} name="trending_up" size="lg" color="orange.500" />
              <Text fontSize="xl" fontWeight="bold" color="orange.500">
                {stats.utilizationRate}%
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Utilization
              </Text>
            </VStack>
          </Card>
        </Animated.View>
      </SimpleGrid>
    </VStack>
  );

  // Enhanced class slot component
  const renderClassSlot = (classItem: any, isCompact = false) => (
    <Pressable
      onPress={() => {
        setSelectedSlot(classItem);
        setShowEditModal(true);
      }}
      onLongPress={() => {
        setDraggedItem(classItem);
        toast.show({
          description: 'Drag to reschedule',
          duration: 2000,
        });
      }}
    >
      {({ isPressed }) => (
        <Card
          bg={classItem.color}
          borderRadius={isCompact ? "md" : "lg"}
          p={isCompact ? 2 : 3}
          shadow={2}
          style={{
            transform: [{ scale: isPressed ? 0.95 : 1 }],
            opacity: draggedItem?.id === classItem.id ? 0.5 : 1,
          }}
        >
          <VStack space={isCompact ? 1 : 2}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text
                fontSize={isCompact ? "xs" : "sm"}
                fontWeight="bold"
                color="white"
                numberOfLines={1}
              >
                {classItem.subject}
              </Text>
              <Badge
                colorScheme="white"
                variant="outline"
                size="xs"
                borderRadius="full"
              >
                {classItem.type}
              </Badge>
            </HStack>
            
            <VStack space={1}>
              <HStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name="person" size="xs" color="white" />
                <Text fontSize="xs" color="white" numberOfLines={1}>
                  {classItem.teacher}
                </Text>
              </HStack>
              
              <HStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name="room" size="xs" color="white" />
                <Text fontSize="xs" color="white" numberOfLines={1}>
                  {classItem.room}
                </Text>
              </HStack>
              
              {!isCompact && (
                <HStack alignItems="center" space={1}>
                  <Icon as={MaterialIcons} name="group" size="xs" color="white" />
                  <Text fontSize="xs" color="white">
                    {classItem.students} students
                  </Text>
                </HStack>
              )}
            </VStack>
            
            {classItem.conflicts && classItem.conflicts.length > 0 && showConflicts && (
              <Badge colorScheme="red" variant="solid" size="xs">
                Conflict!
              </Badge>
            )}
          </VStack>
        </Card>
      )}
    </Pressable>
  );

  // Week view
  const renderWeekView = () => (
    <Card bg={cardBg} borderRadius="xl" p={4}>
      <VStack space={4}>
        <Text fontWeight="bold" fontSize="lg" color={textColor}>
          Weekly Schedule
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <VStack space={2}>
            {/* Header row */}
            <HStack space={2}>
              <Box w="20" h="10" /> {/* Time column spacer */}
              {daysOfWeek.map(day => (
                <Box key={day.key} w="32" alignItems="center">
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>
                    {day.short}
                  </Text>
                </Box>
              ))}
            </HStack>
            
            {/* Time slots */}
            {timeSlots.map((slot, slotIndex) => (
              <HStack key={slot} space={2} alignItems="flex-start">
                <Box w="20" h="16" justifyContent="center">
                  <Text fontSize="xs" color={mutedColor} textAlign="center">
                    {slot}
                  </Text>
                </Box>
                
                {daysOfWeek.map(day => {
                  const dayClasses = mockTimetable[day.key] || [];
                  const classInSlot = dayClasses.find(c => c.timeSlot === slot);
                  
                  return (
                    <Box key={`${day.key}-${slot}`} w="32" h="16">
                      {classInSlot ? (
                        renderClassSlot(classInSlot, true)
                      ) : (
                        <Pressable
                          onPress={() => {
                            // Handle add class to empty slot
                            toast.show({
                              description: `Add class to ${day.label} ${slot}`,
                              duration: 2000,
                            });
                          }}
                        >
                          <Box
                            h="16"
                            borderWidth={1}
                            borderColor={borderColor}
                            borderRadius="md"
                            borderStyle="dashed"
                            justifyContent="center"
                            alignItems="center"
                          >
                            <Icon as={MaterialIcons} name="add" size="sm" color={mutedColor} />
                          </Box>
                        </Pressable>
                      )}
                    </Box>
                  );
                })}
              </HStack>
            ))}
          </VStack>
        </ScrollView>
      </VStack>
    </Card>
  );

  // Day view
  const renderDayView = () => {
    const dayClasses = mockTimetable[selectedDay] || [];
    
    return (
      <VStack space={4}>
        <Card bg={cardBg} borderRadius="xl" p={4}>
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="bold" fontSize="lg" color={textColor}>
                {daysOfWeek.find(d => d.key === selectedDay)?.label} Schedule
              </Text>
              <Text fontSize="sm" color={mutedColor}>
                {dayClasses.length} classes
              </Text>
            </HStack>
            
            {dayClasses.length === 0 ? (
              <Center py={8}>
                <Icon as={MaterialIcons} name="event_available" size="4xl" color={mutedColor} />
                <Text fontSize="lg" color={mutedColor} mt={2}>
                  No classes scheduled
                </Text>
                <Button
                  mt={4}
                  colorScheme="cyan"
                  onPress={() => setShowCreateModal(true)}
                  leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
                >
                  Add Class
                </Button>
              </Center>
            ) : (
              <VStack space={3}>
                {dayClasses.map((classItem, index) => (
                  <Animated.View
                    key={classItem.id}
                    style={{
                      opacity: animationValue,
                      transform: [{
                        translateY: animationValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      }],
                    }}
                  >
                    <Card bg={cardBg} borderRadius="lg" borderLeftWidth={4} borderLeftColor={classItem.color}>
                      <HStack space={4} p={4} alignItems="center">
                        <VStack alignItems="center" space={1}>
                          <Text fontSize="sm" fontWeight="bold" color={textColor}>
                            {classItem.timeSlot.split(' - ')[0]}
                          </Text>
                          <Text fontSize="xs" color={mutedColor}>
                            {classItem.duration}min
                          </Text>
                        </VStack>
                        
                        <Divider orientation="vertical" />
                        
                        <VStack flex={1} space={2}>
                          <HStack justifyContent="space-between" alignItems="center">
                            <Text fontSize="md" fontWeight="bold" color={textColor}>
                              {classItem.subject}
                            </Text>
                            <Badge colorScheme="gray" variant="outline" size="sm">
                              {classItem.type}
                            </Badge>
                          </HStack>
                          
                          <VStack space={1}>
                            <HStack alignItems="center" space={2}>
                              <Icon as={MaterialIcons} name="person" size="sm" color={mutedColor} />
                              <Text fontSize="sm" color={mutedColor}>
                                {classItem.teacher}
                              </Text>
                            </HStack>
                            
                            <HStack alignItems="center" space={2}>
                              <Icon as={MaterialIcons} name="room" size="sm" color={mutedColor} />
                              <Text fontSize="sm" color={mutedColor}>
                                {classItem.room}
                              </Text>
                            </HStack>
                            
                            <HStack alignItems="center" space={2}>
                              <Icon as={MaterialIcons} name="group" size="sm" color={mutedColor} />
                              <Text fontSize="sm" color={mutedColor}>
                                {classItem.students} students
                              </Text>
                            </HStack>
                          </VStack>
                          
                          {classItem.notes && (
                            <Text fontSize="sm" color={mutedColor} italic>
                              {classItem.notes}
                            </Text>
                          )}
                        </VStack>
                        
                        <VStack space={2}>
                          <Button size="xs" variant="outline" colorScheme="cyan">
                            Edit
                          </Button>
                          <Button size="xs" variant="outline" colorScheme="red">
                            Cancel
                          </Button>
                        </VStack>
                      </HStack>
                    </Card>
                  </Animated.View>
                ))}
              </VStack>
            )}
          </VStack>
        </Card>
      </VStack>
    );
  };

  // List view
  const renderListView = () => {
    const allClasses = Object.entries(mockTimetable).flatMap(([day, classes]) =>
      classes.map(classItem => ({ ...classItem, day }))
    );

    return (
      <VStack space={4}>
        <Card bg={cardBg} borderRadius="xl" p={4}>
          <VStack space={3}>
            <Text fontWeight="bold" fontSize="lg" color={textColor}>
              All Classes
            </Text>
            
            <VStack space={2}>
              {allClasses.map((classItem, index) => (
                <Card key={classItem.id} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
                  <HStack space={3} p={3} alignItems="center">
                    <Avatar bg={classItem.color} size="sm">
                      {classItem.subject.charAt(0)}
                    </Avatar>
                    
                    <VStack flex={1} space={1}>
                      <Text fontSize="sm" fontWeight="bold" color={textColor}>
                        {classItem.subject}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>
                        {daysOfWeek.find(d => d.key === classItem.day)?.label} • {classItem.timeSlot}
                      </Text>
                    </VStack>
                    
                    <VStack alignItems="flex-end" space={1}>
                      <Text fontSize="xs" color={mutedColor}>
                        {classItem.teacher}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>
                        {classItem.room}
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              ))}
            </VStack>
          </VStack>
        </Card>
      </VStack>
    );
  };

  if (loading && !refreshing) {
    return (
      <VStack space={4} p={4}>
        <Skeleton h="20" borderRadius="xl" />
        <SimpleGrid columns={4} space={2}>
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} h="20" borderRadius="lg" />
          ))}
        </SimpleGrid>
        <Skeleton h="96" borderRadius="xl" />
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
        
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'list' && renderListView()}
        
        {/* Floating Action Button */}
        <Fab
          renderInPortal={false}
          shadow={2}
          size="sm"
          icon={<Icon color="white" as={MaterialIcons} name="add" size="sm" />}
          colorScheme="cyan"
          onPress={() => setShowCreateModal(true)}
        />
      </VStack>

      {/* Create Class Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} size="lg">
        <Modal.Content maxWidth="500px">
          <Modal.CloseButton />
          <Modal.Header>Add New Class</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
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
                  <FormControl.Label>Teacher</FormControl.Label>
                  <Select placeholder="Select teacher">
                    <Select.Item label="Dr. Smith" value="dr_smith" />
                    <Select.Item label="Prof. Johnson" value="prof_johnson" />
                    <Select.Item label="Ms. Williams" value="ms_williams" />
                    <Select.Item label="Dr. Brown" value="dr_brown" />
                  </Select>
                </FormControl>
              </HStack>

              <HStack space={3}>
                <FormControl flex={1}>
                  <FormControl.Label>Day</FormControl.Label>
                  <Select placeholder="Select day">
                    {daysOfWeek.map(day => (
                      <Select.Item key={day.key} label={day.label} value={day.key} />
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl flex={1}>
                  <FormControl.Label>Time Slot</FormControl.Label>
                  <Select placeholder="Select time">
                    {timeSlots.map(slot => (
                      <Select.Item key={slot} label={slot} value={slot} />
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              <HStack space={3}>
                <FormControl flex={1}>
                  <FormControl.Label>Room</FormControl.Label>
                  <Input placeholder="Room number" />
                </FormControl>
                
                <FormControl flex={1}>
                  <FormControl.Label>Duration (min)</FormControl.Label>
                  <Input placeholder="45" keyboardType="numeric" />
                </FormControl>
              </HStack>

              <FormControl>
                <FormControl.Label>Class Type</FormControl.Label>
                <Radio.Group 
                  value={classType} 
                  onChange={setClassType}
                >
                  <HStack space={4}>
                    <Radio value="lecture" colorScheme="cyan">Lecture</Radio>
                    <Radio value="practical" colorScheme="cyan">Practical</Radio>
                    <Radio value="tutorial" colorScheme="cyan">Tutorial</Radio>
                    <Radio value="test" colorScheme="cyan">Test</Radio>
                  </HStack>
                </Radio.Group>
              </FormControl>

              <FormControl>
                <FormControl.Label>Notes</FormControl.Label>
                <TextArea placeholder="Additional notes..." />
              </FormControl>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                colorScheme="cyan"
                onPress={() => {
                  toast.show({ description: 'Class added successfully!' });
                  setShowCreateModal(false);
                }}
              >
                Add Class
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Timetable Settings</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <VStack space={2}>
                <Text fontWeight="medium">Default View:</Text>
                <Select
                  selectedValue={viewMode}
                  onValueChange={setViewMode}
                  _selectedItem={{
                    bg: 'cyan.500',
                    endIcon: <CheckIcon size="5" />
                  }}
                >
                  <Select.Item label="Week View" value="week" />
                  <Select.Item label="Day View" value="day" />
                  <Select.Item label="List View" value="list" />
                </Select>
              </VStack>

              <HStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="medium">Show Conflicts:</Text>
                <Switch
                  isChecked={showConflicts}
                  onToggle={setShowConflicts}
                  colorScheme="red"
                />
              </HStack>

              <HStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="medium">Auto Refresh:</Text>
                <Switch
                  isChecked={autoRefresh}
                  onToggle={setAutoRefresh}
                  colorScheme="cyan"
                />
              </HStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={onSettingsClose}>
                Cancel
              </Button>
              <Button colorScheme="cyan" onPress={onSettingsClose}>
                Save Settings
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
};

export default TimetableTab; 
