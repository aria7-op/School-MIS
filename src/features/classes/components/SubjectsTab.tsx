import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Text, VStack, HStack, Card, Button, Badge, Icon, useColorModeValue,
  Skeleton, Progress, Avatar, Divider, ScrollView, Pressable, Center, Heading,
  SimpleGrid, Input, Select, CheckIcon, Modal, useToast, Switch, Slider,
  Fab, useDisclose, FormControl, TextArea, Radio, Checkbox,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions, Animated, RefreshControl } from 'react-native';

interface SubjectsTabProps {
  selectedClass: any;
  onClassSelect: (classItem: any) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const SubjectsTab: React.FC<SubjectsTabProps> = ({
  selectedClass, onClassSelect, onRefresh, refreshing,
}) => {
  // Theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // State
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [animationValue] = useState(new Animated.Value(0));
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');

  // Hooks
  const toast = useToast();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclose();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclose();

  // Enhanced dummy data
  const mockSubjects = useMemo(() => [
    {
      id: '1',
      name: 'Mathematics',
      code: 'MATH101',
      category: 'core',
      teacher: 'Dr. Smith',
      students: 28,
      credits: 4,
      hours: 5,
      status: 'active',
      progress: 85,
      difficulty: 'high',
      description: 'Advanced mathematical concepts including algebra, geometry, and calculus',
      curriculum: {
        totalTopics: 12,
        completedTopics: 10,
        currentTopic: 'Quadratic Equations',
        nextTopic: 'Coordinate Geometry'
      },
      resources: {
        textbooks: 3,
        digitalContent: 15,
        practiceTests: 8,
        videos: 25
      },
      performance: {
        classAverage: 87.5,
        highestScore: 98,
        lowestScore: 65,
        passRate: 96
      },
      schedule: [
        { day: 'Monday', time: '08:00-08:45' },
        { day: 'Wednesday', time: '08:45-09:30' },
        { day: 'Friday', time: '10:15-11:00' }
      ],
      assessments: {
        assignments: 12,
        tests: 4,
        projects: 2,
        exams: 1
      }
    },
    {
      id: '2',
      name: 'Science',
      code: 'SCI101',
      category: 'core',
      teacher: 'Prof. Johnson',
      students: 28,
      credits: 4,
      hours: 6,
      status: 'active',
      progress: 78,
      difficulty: 'medium',
      description: 'Comprehensive science covering physics, chemistry, and biology',
      curriculum: {
        totalTopics: 15,
        completedTopics: 12,
        currentTopic: 'Chemical Reactions',
        nextTopic: 'Atomic Structure'
      },
      resources: {
        textbooks: 2,
        digitalContent: 20,
        practiceTests: 10,
        videos: 30
      },
      performance: {
        classAverage: 82.3,
        highestScore: 95,
        lowestScore: 58,
        passRate: 92
      },
      schedule: [
        { day: 'Tuesday', time: '08:00-08:45' },
        { day: 'Thursday', time: '09:30-10:15' },
        { day: 'Friday', time: '14:00-14:45' }
      ],
      assessments: {
        assignments: 10,
        tests: 5,
        projects: 3,
        exams: 1
      }
    },
    {
      id: '3',
      name: 'English Literature',
      code: 'ENG101',
      category: 'core',
      teacher: 'Ms. Williams',
      students: 28,
      credits: 3,
      hours: 4,
      status: 'active',
      progress: 92,
      difficulty: 'medium',
      description: 'Study of classic and modern literature, poetry, and writing skills',
      curriculum: {
        totalTopics: 10,
        completedTopics: 9,
        currentTopic: 'Shakespeare Analysis',
        nextTopic: 'Modern Poetry'
      },
      resources: {
        textbooks: 5,
        digitalContent: 12,
        practiceTests: 6,
        videos: 18
      },
      performance: {
        classAverage: 91.2,
        highestScore: 98,
        lowestScore: 78,
        passRate: 100
      },
      schedule: [
        { day: 'Monday', time: '10:15-11:00' },
        { day: 'Wednesday', time: '08:00-08:45' },
        { day: 'Friday', time: '08:45-09:30' }
      ],
      assessments: {
        assignments: 8,
        tests: 3,
        projects: 4,
        exams: 1
      }
    },
    {
      id: '4',
      name: 'History',
      code: 'HIST101',
      category: 'social',
      teacher: 'Dr. Brown',
      students: 28,
      credits: 3,
      hours: 3,
      status: 'active',
      progress: 70,
      difficulty: 'medium',
      description: 'World history from ancient civilizations to modern times',
      curriculum: {
        totalTopics: 14,
        completedTopics: 10,
        currentTopic: 'World War II',
        nextTopic: 'Cold War Era'
      },
      resources: {
        textbooks: 4,
        digitalContent: 18,
        practiceTests: 7,
        videos: 22
      },
      performance: {
        classAverage: 83.8,
        highestScore: 94,
        lowestScore: 62,
        passRate: 89
      },
      schedule: [
        { day: 'Tuesday', time: '11:45-12:30' },
        { day: 'Thursday', time: '08:00-08:45' }
      ],
      assessments: {
        assignments: 9,
        tests: 4,
        projects: 2,
        exams: 1
      }
    },
    {
      id: '5',
      name: 'Physical Education',
      code: 'PE101',
      category: 'practical',
      teacher: 'Coach Davis',
      students: 28,
      credits: 2,
      hours: 3,
      status: 'active',
      progress: 88,
      difficulty: 'low',
      description: 'Physical fitness, sports, and health education',
      curriculum: {
        totalTopics: 8,
        completedTopics: 7,
        currentTopic: 'Team Sports',
        nextTopic: 'Athletics'
      },
      resources: {
        textbooks: 1,
        digitalContent: 8,
        practiceTests: 2,
        videos: 15
      },
      performance: {
        classAverage: 94.5,
        highestScore: 100,
        lowestScore: 85,
        passRate: 100
      },
      schedule: [
        { day: 'Monday', time: '14:00-14:45' },
        { day: 'Wednesday', time: '14:00-14:45' },
        { day: 'Friday', time: '14:00-15:30' }
      ],
      assessments: {
        assignments: 4,
        tests: 2,
        projects: 1,
        exams: 0
      }
    },
    {
      id: '6',
      name: 'Computer Science',
      code: 'CS101',
      category: 'elective',
      teacher: 'Dr. Lee',
      students: 24,
      credits: 3,
      hours: 4,
      status: 'active',
      progress: 65,
      difficulty: 'high',
      description: 'Introduction to programming, algorithms, and computer systems',
      curriculum: {
        totalTopics: 16,
        completedTopics: 10,
        currentTopic: 'Object-Oriented Programming',
        nextTopic: 'Data Structures'
      },
      resources: {
        textbooks: 2,
        digitalContent: 25,
        practiceTests: 12,
        videos: 40
      },
      performance: {
        classAverage: 79.2,
        highestScore: 96,
        lowestScore: 54,
        passRate: 87
      },
      schedule: [
        { day: 'Tuesday', time: '10:15-11:45' },
        { day: 'Thursday', time: '13:15-14:00' }
      ],
      assessments: {
        assignments: 15,
        tests: 3,
        projects: 5,
        exams: 1
      }
    }
  ], []);

  // Effects
  useEffect(() => {
    loadSubjects();
  }, [selectedClass]);

  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubjects(mockSubjects);
    } catch (error) {
      toast.show({ description: 'Failed to load subjects data', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort subjects
  const filteredSubjects = useMemo(() => {
    let filtered = mockSubjects.filter(subject => {
      const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           subject.teacher.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || subject.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'progress': return b.progress - a.progress;
        case 'students': return b.students - a.students;
        case 'performance': return b.performance.classAverage - a.performance.classAverage;
        default: return 0;
      }
    });

    return filtered;
  }, [mockSubjects, searchQuery, filterCategory, sortBy]);

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'blue';
      case 'social': return 'purple';
      case 'practical': return 'green';
      case 'elective': return 'orange';
      default: return 'gray';
    }
  };

  // Enhanced header
  const renderHeader = () => (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Heading size="lg" color={textColor}>Subjects Management</Heading>
          <HStack alignItems="center" space={2}>
            <Text color={mutedColor} fontSize="sm">
              {selectedClass?.name || 'All Classes'} • {filteredSubjects.length} subjects
            </Text>
            <Badge colorScheme="indigo" variant="subtle" borderRadius="full">Curriculum Tracking</Badge>
          </HStack>
        </VStack>
        <HStack space={2}>
          <Switch size="sm" isChecked={autoRefresh} onToggle={setAutoRefresh} colorScheme="indigo" />
          <Text fontSize="xs" color={mutedColor}>Auto</Text>
          <Button size="sm" colorScheme="green" onPress={() => setShowCreateModal(true)} leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}>
            Add Subject
          </Button>
          <Button size="sm" variant="outline" onPress={onSettingsOpen} leftIcon={<Icon as={MaterialIcons} name="settings" size="sm" />}>
            Settings
          </Button>
        </HStack>
      </HStack>

      {/* Search and Filters */}
      <Card bg={cardBg} borderRadius="xl" p={4}>
        <VStack space={3}>
          <Text fontWeight="bold" color={textColor}>Search & Filters</Text>
          <Input placeholder="Search subjects..." value={searchQuery} onChangeText={setSearchQuery} bg={cardBg} borderColor={borderColor} 
            leftElement={<Icon as={MaterialIcons} name="search" size="sm" ml={3} color={mutedColor} />}
            rightElement={searchQuery ? <Pressable onPress={() => setSearchQuery('')}><Icon as={MaterialIcons} name="clear" size="sm" mr={3} color={mutedColor} /></Pressable> : null} />
          
          <HStack space={3} flexWrap="wrap">
            <Select selectedValue={filterCategory} onValueChange={setFilterCategory} placeholder="Category" minW="120" size="sm" bg={cardBg}>
              <Select.Item label="All Categories" value="all" />
              <Select.Item label="Core" value="core" />
              <Select.Item label="Social" value="social" />
              <Select.Item label="Practical" value="practical" />
              <Select.Item label="Elective" value="elective" />
            </Select>
            
            <Select selectedValue={sortBy} onValueChange={setSortBy} placeholder="Sort By" minW="120" size="sm" bg={cardBg}>
              <Select.Item label="Name" value="name" />
              <Select.Item label="Progress" value="progress" />
              <Select.Item label="Students" value="students" />
              <Select.Item label="Performance" value="performance" />
            </Select>
            
            <HStack space={2}>
              <Button size="sm" variant={viewMode === 'grid' ? 'solid' : 'outline'} colorScheme="indigo" onPress={() => setViewMode('grid')}>Grid</Button>
              <Button size="sm" variant={viewMode === 'list' ? 'solid' : 'outline'} colorScheme="indigo" onPress={() => setViewMode('list')}>List</Button>
            </HStack>
          </HStack>
        </VStack>
      </Card>

      {/* Quick Stats */}
      <SimpleGrid columns={4} space={2}>
        {[
          { label: 'Total Subjects', value: mockSubjects.length, color: 'blue', icon: 'book' },
          { label: 'Avg Progress', value: `${Math.round(mockSubjects.reduce((sum, s) => sum + s.progress, 0) / mockSubjects.length)}%`, color: 'green', icon: 'trending_up' },
          { label: 'Core Subjects', value: mockSubjects.filter(s => s.category === 'core').length, color: 'purple', icon: 'star' },
          { label: 'Active Teachers', value: [...new Set(mockSubjects.map(s => s.teacher))].length, color: 'orange', icon: 'person' },
        ].map((stat, index) => (
          <Animated.View key={stat.label} style={{ opacity: animationValue, transform: [{ translateY: animationValue.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            <Card bg={useColorModeValue(`${stat.color}.50`, `${stat.color}.900`)} borderRadius="lg" p={3}>
              <VStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name={stat.icon} size="lg" color={`${stat.color}.500`} />
                <Text fontSize="xl" fontWeight="bold" color={`${stat.color}.500`}>{stat.value}</Text>
                <Text fontSize="xs" color={mutedColor} textAlign="center">{stat.label}</Text>
              </VStack>
            </Card>
          </Animated.View>
        ))}
      </SimpleGrid>
    </VStack>
  );

  // Subject card component
  const renderSubjectCard = (subject: any, index: number) => (
    <Animated.View key={subject.id} style={{ opacity: animationValue, transform: [{ translateY: animationValue.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
      <Pressable onPress={() => { setSelectedSubject(subject); onDetailOpen(); }}>
        {({ isPressed }) => (
          <Card bg={cardBg} borderRadius="xl" borderWidth={1} borderColor={borderColor} shadow={2} style={{ transform: [{ scale: isPressed ? 0.98 : 1 }] }}>
            <VStack space={4} p={4}>
              {/* Header */}
              <HStack justifyContent="space-between" alignItems="flex-start">
                <HStack space={3} alignItems="center" flex={1}>
                  <Avatar size="md" bg={`${['blue', 'green', 'purple', 'orange', 'red', 'indigo'][index % 6]}.500`}>{subject.name.charAt(0)}</Avatar>
                  <VStack flex={1}>
                    <Text fontWeight="bold" fontSize="md" color={textColor} numberOfLines={1}>{subject.name}</Text>
                    <Text fontSize="sm" color={mutedColor}>{subject.code} • {subject.teacher}</Text>
                  </VStack>
                </HStack>
                <VStack alignItems="flex-end" space={1}>
                  <Badge colorScheme={getCategoryColor(subject.category)} variant="solid" borderRadius="full" size="sm">{subject.category}</Badge>
                  <Badge colorScheme={getDifficultyColor(subject.difficulty)} variant="outline" borderRadius="full" size="xs">{subject.difficulty}</Badge>
                </VStack>
              </HStack>

              {/* Progress */}
              <VStack space={2}>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color={mutedColor}>Curriculum Progress</Text>
                  <Text fontSize="sm" color={textColor} fontWeight="medium">{subject.progress}%</Text>
                </HStack>
                <Progress value={subject.progress} size="md" colorScheme={subject.progress >= 80 ? 'green' : subject.progress >= 60 ? 'blue' : 'orange'} />
                <Text fontSize="xs" color={mutedColor}>
                  {subject.curriculum.completedTopics}/{subject.curriculum.totalTopics} topics completed
                </Text>
              </VStack>

              {/* Stats */}
              <SimpleGrid columns={3} space={2}>
                <VStack alignItems="center" space={1}>
                  <Text fontSize="lg" fontWeight="bold" color="blue.500">{subject.students}</Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">Students</Text>
                </VStack>
                <VStack alignItems="center" space={1}>
                  <Text fontSize="lg" fontWeight="bold" color="green.500">{subject.performance.classAverage}%</Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">Avg Score</Text>
                </VStack>
                <VStack alignItems="center" space={1}>
                  <Text fontSize="lg" fontWeight="bold" color="purple.500">{subject.hours}h</Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">Per Week</Text>
                </VStack>
              </SimpleGrid>

              {/* Current Topic */}
              <VStack space={1}>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>Current Topic:</Text>
                <Text fontSize="sm" color={mutedColor} italic>{subject.curriculum.currentTopic}</Text>
              </VStack>

              {/* Actions */}
              <HStack space={2} justifyContent="flex-end">
                <Button size="xs" variant="outline" colorScheme="indigo">Edit</Button>
                <Button size="xs" variant="outline" colorScheme="blue">Resources</Button>
                <Button size="xs" variant="outline" colorScheme="green">Schedule</Button>
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
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} h="20" borderRadius="lg" />)}
        </SimpleGrid>
        <SimpleGrid columns={viewMode === 'grid' ? 2 : 1} space={3}>
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} h="48" borderRadius="xl" />)}
        </SimpleGrid>
      </VStack>
    );
  }

  return (
    <ScrollView bg={bgColor} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
      <VStack space={6} p={4} pb={8}>
        {renderHeader()}
        
        {filteredSubjects.length === 0 ? (
          <Card bg={cardBg} borderRadius="xl" p={8}>
            <VStack alignItems="center" space={4}>
              <Icon as={MaterialIcons} name="book" size="6xl" color={mutedColor} />
              <Text fontSize="lg" fontWeight="bold" color={textColor}>No subjects found</Text>
              <Text fontSize="sm" color={mutedColor} textAlign="center">
                {searchQuery || filterCategory !== 'all' ? 'Try adjusting your filters or search terms' : 'Add your first subject to get started'}
              </Text>
              <Button colorScheme="indigo" onPress={() => setShowCreateModal(true)} leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}>
                Add Subject
              </Button>
            </VStack>
          </Card>
        ) : (
          <VStack space={4}>
            {viewMode === 'grid' ? (
              <SimpleGrid columns={2} space={3}>
                {filteredSubjects.map((subject, index) => renderSubjectCard(subject, index))}
              </SimpleGrid>
            ) : (
              <VStack space={3}>
                {filteredSubjects.map((subject, index) => renderSubjectCard(subject, index))}
              </VStack>
            )}
          </VStack>
        )}
        
        <Fab renderInPortal={false} shadow={2} size="sm" icon={<Icon color="white" as={MaterialIcons} name="add" size="sm" />} colorScheme="indigo" onPress={() => setShowCreateModal(true)} />
      </VStack>

      {/* Subject Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
        <Modal.Content maxWidth="600px">
          <Modal.CloseButton />
          <Modal.Header>{selectedSubject?.name} Details</Modal.Header>
          <Modal.Body>
            {selectedSubject && (
              <VStack space={4}>
                <HStack space={4}>
                  <Avatar size="lg" bg="indigo.500">{selectedSubject.name.charAt(0)}</Avatar>
                  <VStack flex={1} space={1}>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>{selectedSubject.name}</Text>
                    <Text fontSize="sm" color={mutedColor}>{selectedSubject.code} • {selectedSubject.teacher}</Text>
                    <Text fontSize="sm" color={mutedColor}>{selectedSubject.description}</Text>
                  </VStack>
                </HStack>

                <SimpleGrid columns={2} space={4}>
                  <VStack space={2}>
                    <Text fontWeight="bold" color={textColor}>Curriculum Progress</Text>
                    <Progress value={selectedSubject.progress} colorScheme="indigo" />
                    <Text fontSize="sm" color={mutedColor}>
                      {selectedSubject.curriculum.completedTopics}/{selectedSubject.curriculum.totalTopics} topics completed
                    </Text>
                  </VStack>
                  
                  <VStack space={2}>
                    <Text fontWeight="bold" color={textColor}>Performance</Text>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color={mutedColor}>Class Average:</Text>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>{selectedSubject.performance.classAverage}%</Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color={mutedColor}>Pass Rate:</Text>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>{selectedSubject.performance.passRate}%</Text>
                    </HStack>
                  </VStack>
                </SimpleGrid>

                <VStack space={2}>
                  <Text fontWeight="bold" color={textColor}>Resources</Text>
                  <SimpleGrid columns={2} space={2}>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color={mutedColor}>Textbooks:</Text>
                      <Text fontSize="sm" color={textColor}>{selectedSubject.resources.textbooks}</Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color={mutedColor}>Digital Content:</Text>
                      <Text fontSize="sm" color={textColor}>{selectedSubject.resources.digitalContent}</Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color={mutedColor}>Practice Tests:</Text>
                      <Text fontSize="sm" color={textColor}>{selectedSubject.resources.practiceTests}</Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color={mutedColor}>Videos:</Text>
                      <Text fontSize="sm" color={textColor}>{selectedSubject.resources.videos}</Text>
                    </HStack>
                  </SimpleGrid>
                </VStack>

                <VStack space={2}>
                  <Text fontWeight="bold" color={textColor}>Schedule</Text>
                  <VStack space={1}>
                    {selectedSubject.schedule.map((slot, index) => (
                      <HStack key={index} justifyContent="space-between">
                        <Text fontSize="sm" color={mutedColor}>{slot.day}:</Text>
                        <Text fontSize="sm" color={textColor}>{slot.time}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </VStack>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={onDetailClose}>Close</Button>
              <Button colorScheme="indigo">Edit Subject</Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Create Subject Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} size="lg">
        <Modal.Content maxWidth="500px">
          <Modal.CloseButton />
          <Modal.Header>Add New Subject</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <HStack space={3}>
                <FormControl flex={1}>
                  <FormControl.Label>Subject Name</FormControl.Label>
                  <Input placeholder="Enter subject name" />
                </FormControl>
                <FormControl flex={1}>
                  <FormControl.Label>Subject Code</FormControl.Label>
                  <Input placeholder="e.g., MATH101" />
                </FormControl>
              </HStack>

              <FormControl>
                <FormControl.Label>Description</FormControl.Label>
                <TextArea placeholder="Subject description" />
              </FormControl>

              <HStack space={3}>
                <FormControl flex={1}>
                  <FormControl.Label>Category</FormControl.Label>
                  <Select placeholder="Select category">
                    <Select.Item label="Core" value="core" />
                    <Select.Item label="Social" value="social" />
                    <Select.Item label="Practical" value="practical" />
                    <Select.Item label="Elective" value="elective" />
                  </Select>
                </FormControl>
                <FormControl flex={1}>
                  <FormControl.Label>Teacher</FormControl.Label>
                  <Select placeholder="Select teacher">
                    <Select.Item label="Dr. Smith" value="dr_smith" />
                    <Select.Item label="Prof. Johnson" value="prof_johnson" />
                    <Select.Item label="Ms. Williams" value="ms_williams" />
                  </Select>
                </FormControl>
              </HStack>

              <HStack space={3}>
                <FormControl flex={1}>
                  <FormControl.Label>Credits</FormControl.Label>
                  <Input placeholder="3" keyboardType="numeric" />
                </FormControl>
                <FormControl flex={1}>
                  <FormControl.Label>Hours/Week</FormControl.Label>
                  <Input placeholder="4" keyboardType="numeric" />
                </FormControl>
              </HStack>

              <FormControl>
                <FormControl.Label>Difficulty Level</FormControl.Label>
                <Radio.Group 
                  value={difficulty} 
                  onChange={setDifficulty}
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
              <Button variant="ghost" colorScheme="blueGray" onPress={() => setShowCreateModal(false)}>Cancel</Button>
              <Button colorScheme="indigo" onPress={() => { toast.show({ description: 'Subject added successfully!' }); setShowCreateModal(false); }}>
                Add Subject
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Subject Settings</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <VStack space={2}>
                <Text fontWeight="medium">Default View:</Text>
                <Select selectedValue={viewMode} onValueChange={setViewMode}>
                  <Select.Item label="Grid View" value="grid" />
                  <Select.Item label="List View" value="list" />
                </Select>
              </VStack>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="medium">Auto Refresh:</Text>
                <Switch isChecked={autoRefresh} onToggle={setAutoRefresh} colorScheme="indigo" />
              </HStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={onSettingsClose}>Cancel</Button>
              <Button colorScheme="indigo" onPress={onSettingsClose}>Save Settings</Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
};

export default SubjectsTab; 
