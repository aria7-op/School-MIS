import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollView, RefreshControl, Dimensions, StatusBar, Alert } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Badge,
  Input,
  Icon,
  useToast,
  Spinner,
  Heading,
  Divider,
  Center,
  Pressable,
  Modal,
  Fab,
  Select,
  CheckIcon,
  Avatar,
  Progress,
  Alert as NBAlert,
  CloseIcon,
  IconButton,
  useColorModeValue,
  Skeleton,
  Actionsheet,
  useDisclose,
  FormControl,
  TextArea,
  Switch,
  Slider,
  Radio,
  Checkbox,
  Image,
  AspectRatio,
  Stack,
  Flex,
  Wrap,
  SimpleGrid,
  Tag,
  TagLabel,
  TagCloseButton,
  Tooltip,
  useBreakpointValue,
} from 'native-base';
import { MaterialIcons, Ionicons, FontAwesome5, Entypo, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import the enhanced hook
import { useEnhancedClasses } from '../hooks/useEnhancedClasses';

// Import components
import CreateClassModal from '../components/CreateClassModal';

// Import types
import { Class, ClassCreateRequest, ClassUpdateRequest } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SuperEnhancedClassesScreen: React.FC = () => {
  // Theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const primaryColor = useColorModeValue('blue.500', 'blue.300');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const errorColor = useColorModeValue('red.500', 'red.300');

  // Enhanced Classes Hook
  const {
    // State
    classes,
    selectedClass,
    students,
    subjects,
    timetables,
    exams,
    assignments,
    attendances,
    stats,
    analytics,
    performance,
    loading,
    studentsLoading,
    subjectsLoading,
    timetablesLoading,
    examsLoading,
    assignmentsLoading,
    attendancesLoading,
    statsLoading,
    analyticsLoading,
    performanceLoading,
    error,
    refreshing,
    
    // Actions
    fetchClasses,
    fetchClassById,
    createClass,
    updateClass,
    deleteClass,
    selectClass,
    clearSelectedClass,
    fetchClassStudents,
    fetchClassSubjects,
    fetchClassTimetables,
    fetchClassExams,
    fetchClassAssignments,
    fetchClassAttendances,
    fetchClassStats,
    fetchClassAnalytics,
    fetchClassPerformance,
    bulkCreateClasses,
    bulkUpdateClasses,
    bulkDeleteClasses,
    batchAssignTeacher,
    batchUpdateCapacity,
    batchTransferStudents,
    searchClasses,
    getClassesBySchool,
    getClassesByLevel,
    getClassesByTeacher,
    refreshAll,
    refreshClassData,
    clearCache,
  } = useEnhancedClasses();

  // Local State
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<Class[]>([]);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'cards'>('cards');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterSchool, setFilterSchool] = useState<number | null>(null);
  const [filterTeacher, setFilterTeacher] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'students' | 'attendance' | 'performance'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Action Sheet
  const { isOpen: isActionSheetOpen, onOpen: onActionSheetOpen, onClose: onActionSheetClose } = useDisclose();

  // Responsive
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardColumns = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 4 });

  // Toast
  const toast = useToast();

  // Effects
  useEffect(() => {
    handleSearch();
  }, [searchQuery, filterLevel, filterSchool, filterTeacher, sortBy, sortOrder]);

  // Search and Filter
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim()) {
      await searchClasses({ 
        query: searchQuery,
        level: filterLevel,
        schoolId: filterSchool,
        teacherId: filterTeacher,
        sortBy,
        sortOrder 
      });
    } else if (filterLevel) {
      await getClassesByLevel(filterLevel);
    } else if (filterSchool) {
      await getClassesBySchool(filterSchool);
    } else if (filterTeacher) {
      await getClassesByTeacher(filterTeacher);
    } else {
      await fetchClasses({ sortBy, sortOrder });
    }
  }, [searchQuery, filterLevel, filterSchool, filterTeacher, sortBy, sortOrder]);

  // Class Selection
  const handleClassSelect = useCallback((classItem: Class) => {
    selectClass(classItem);
    setActiveTab('students');
  }, [selectClass]);

  // Student Selection
  const handleStudentSelect = useCallback((student: any) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  }, []);

  // Bulk Actions
  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedClasses.length === 0) {
      toast.show({
        description: 'Please select classes first',
        status: 'warning',
      });
      return;
    }

    const classIds = selectedClasses.map(c => c.id);

    switch (action) {
      case 'delete':
        Alert.alert(
          'Delete Classes',
          `Are you sure you want to delete ${selectedClasses.length} classes?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: () => bulkDeleteClasses(classIds)
            }
          ]
        );
        break;
      case 'assign_teacher':
        // Open teacher selection modal
        break;
      case 'update_capacity':
        // Open capacity update modal
        break;
    }
    
    setSelectedClasses([]);
    setShowBulkActions(false);
  }, [selectedClasses, bulkDeleteClasses, toast]);

  // Handle Class Creation
  const handleCreateClass = useCallback(() => {
    // Refresh the classes list after creation
    fetchClasses();
    toast.show({
      title: 'Success',
      description: 'Classes refreshed',
      status: 'success',
    });
  }, [fetchClasses, toast]);

  // Render Methods
  const renderHeader = () => (
    <Box bg={cardBg} px={4} py={3} borderBottomWidth={1} borderColor={borderColor}>
      <VStack space={3}>
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="lg" color={textColor}>
            Classes Management
          </Heading>
          <HStack space={2}>
            <IconButton
              icon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
              onPress={refreshAll}
              isLoading={refreshing}
              variant="ghost"
            />
            <IconButton
              icon={<Icon as={MaterialIcons} name="filter-list" size="sm" />}
              onPress={() => setShowFilters(!showFilters)}
              variant="ghost"
            />
            <IconButton
              icon={<Icon as={MaterialIcons} name="analytics" size="sm" />}
              onPress={() => setShowAnalytics(!showAnalytics)}
              variant="ghost"
            />
          </HStack>
        </HStack>

        {/* Search Bar */}
        <Input
          placeholder="Search classes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          InputLeftElement={
            <Icon as={MaterialIcons} name="search" size="sm" ml={2} color={mutedColor} />
          }
          InputRightElement={
            searchQuery ? (
              <IconButton
                icon={<Icon as={MaterialIcons} name="clear" size="sm" />}
                onPress={() => setSearchQuery('')}
                variant="ghost"
                size="sm"
              />
            ) : undefined
          }
        />

        {/* Filters */}
        {showFilters && (
          <VStack space={2} bg={bgColor} p={3} rounded="md">
            <Text fontSize="sm" fontWeight="medium" color={textColor}>Filters</Text>
            <SimpleGrid columns={isMobile ? 1 : 3} spacing={2}>
              <Select
                placeholder="Filter by Level"
                selectedValue={filterLevel?.toString()}
                onValueChange={(value) => setFilterLevel(value ? parseInt(value) : null)}
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(level => (
                  <Select.Item key={level} label={`Grade ${level}`} value={level.toString()} />
                ))}
              </Select>
              <Select
                placeholder="Filter by School"
                selectedValue={filterSchool?.toString()}
                onValueChange={(value) => setFilterSchool(value ? parseInt(value) : null)}
              >
                <Select.Item label="School A" value="1" />
                <Select.Item label="School B" value="2" />
              </Select>
              <Select
                placeholder="Sort By"
                selectedValue={sortBy}
                onValueChange={(value) => setSortBy(value as any)}
              >
                <Select.Item label="Name" value="name" />
                <Select.Item label="Level" value="level" />
                <Select.Item label="Students" value="students" />
                <Select.Item label="Attendance" value="attendance" />
                <Select.Item label="Performance" value="performance" />
              </Select>
            </SimpleGrid>
            <HStack space={2} justifyContent="flex-end">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  setFilterLevel(null);
                  setFilterSchool(null);
                  setFilterTeacher(null);
                  setSortBy('name');
                  setSortOrder('asc');
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onPress={() => setShowFilters(false)}
              >
                Apply
              </Button>
            </HStack>
          </VStack>
        )}

        {/* Analytics Summary */}
        {showAnalytics && stats && (
          <Box bg={primaryColor} p={4} rounded="lg">
            <VStack space={2}>
              <Text color="white" fontSize="sm" fontWeight="medium">Quick Stats</Text>
              <SimpleGrid columns={isMobile ? 2 : 4} spacing={3}>
                <VStack alignItems="center">
                  <Text color="white" fontSize="2xl" fontWeight="bold">{stats.totalClasses}</Text>
                  <Text color="white" fontSize="xs">Total Classes</Text>
                </VStack>
                <VStack alignItems="center">
                  <Text color="white" fontSize="2xl" fontWeight="bold">{stats.totalStudents}</Text>
                  <Text color="white" fontSize="xs">Total Students</Text>
                </VStack>
                <VStack alignItems="center">
                  <Text color="white" fontSize="2xl" fontWeight="bold">{stats.averageAttendance}%</Text>
                  <Text color="white" fontSize="xs">Avg Attendance</Text>
                </VStack>
                <VStack alignItems="center">
                  <Text color="white" fontSize="2xl" fontWeight="bold">{stats.averageGrade}</Text>
                  <Text color="white" fontSize="xs">Avg Grade</Text>
                </VStack>
              </SimpleGrid>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );

  const renderClassCard = (classItem: Class) => (
    <Card key={classItem.id} bg={cardBg} shadow={2} rounded="lg" mb={3}>
      <Pressable onPress={() => handleClassSelect(classItem)}>
        <Box p={4}>
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="flex-start">
              <VStack flex={1} space={1}>
                <Heading size="md" color={textColor} numberOfLines={1}>
                  {classItem.name}
                </Heading>
                <Text fontSize="sm" color={mutedColor}>
                  Code: {classItem.code} | Level: {classItem.level}
                </Text>
              </VStack>
              <Badge
                colorScheme={classItem.status === 'active' ? 'green' : 'gray'}
                variant="solid"
                rounded="full"
              >
                {classItem.status}
              </Badge>
            </HStack>

            <HStack space={4} alignItems="center">
              <HStack space={1} alignItems="center">
                <Icon as={MaterialIcons} name="people" size="sm" color={mutedColor} />
                <Text fontSize="sm" color={mutedColor}>
                  {classItem.studentCount || 0}/{classItem.capacity}
                </Text>
              </HStack>
              <HStack space={1} alignItems="center">
                <Icon as={MaterialIcons} name="person" size="sm" color={mutedColor} />
                <Text fontSize="sm" color={mutedColor}>
                  {classItem.teacherName || 'No Teacher'}
                </Text>
              </HStack>
            </HStack>

            {classItem.description && (
              <Text fontSize="sm" color={mutedColor} numberOfLines={2}>
                {classItem.description}
              </Text>
            )}

            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={2}>
                <Button
                  size="xs"
                  variant="ghost"
                  onPress={() => fetchClassStudents(classItem.id)}
                  leftIcon={<Icon as={MaterialIcons} name="people" size="xs" />}
                >
                  Students
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onPress={() => fetchClassSubjects(classItem.id)}
                  leftIcon={<Icon as={MaterialIcons} name="book" size="xs" />}
                >
                  Subjects
                </Button>
              </HStack>
              <IconButton
                icon={<Icon as={MaterialIcons} name="more-vert" size="sm" />}
                onPress={() => {
                  selectClass(classItem);
                  onActionSheetOpen();
                }}
                variant="ghost"
                size="sm"
              />
            </HStack>
          </VStack>
        </Box>
      </Pressable>
    </Card>
  );

  const renderClassList = () => {
    if (loading && classes.length === 0) {
      return (
        <VStack space={3} p={4}>
          {[1,2,3,4,5].map(i => (
            <Skeleton key={i} h="20" rounded="lg" />
          ))}
        </VStack>
      );
    }

    if (classes.length === 0) {
      return (
        <Center flex={1} p={8}>
          <VStack space={4} alignItems="center">
            <Icon as={MaterialIcons} name="school" size="6xl" color={mutedColor} />
            <Text fontSize="lg" color={mutedColor} textAlign="center">
              No classes found
            </Text>
            <Text fontSize="sm" color={mutedColor} textAlign="center">
              Create your first class to get started
            </Text>
            <Button onPress={() => setShowCreateForm(true)}>
              Create Class
            </Button>
          </VStack>
        </Center>
      );
    }

    return (
      <ScrollView
        flex={1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
        }
      >
        <Box p={4}>
          <SimpleGrid columns={cardColumns} spacing={3}>
            {classes.map(renderClassCard)}
          </SimpleGrid>
        </Box>
      </ScrollView>
    );
  };

  const renderStudentsList = () => {
    if (studentsLoading) {
      return (
        <VStack space={3} p={4}>
          {[1,2,3].map(i => (
            <Skeleton key={i} h="16" rounded="lg" />
          ))}
        </VStack>
      );
    }

    if (students.length === 0) {
      return (
        <Center flex={1} p={8}>
          <VStack space={4} alignItems="center">
            <Icon as={MaterialIcons} name="people" size="6xl" color={mutedColor} />
            <Text fontSize="lg" color={mutedColor} textAlign="center">
              No students found
            </Text>
            <Text fontSize="sm" color={mutedColor} textAlign="center">
              Students will appear here when enrolled
            </Text>
          </VStack>
        </Center>
      );
    }

    return (
      <ScrollView flex={1} p={4}>
        <VStack space={3}>
          {students.map((student) => (
            <Card key={student.id} bg={cardBg} shadow={1} borderRadius="lg">
              <Pressable onPress={() => handleStudentSelect(student)} _pressed={{ opacity: 0.8 }}>
                <Box p={4}>
                  <HStack space={3} alignItems="center">
                    {/* Student Avatar */}
                    <Avatar
                      size="lg"
                      bg={`${student.user?.firstName?.charAt(0) === 'A' ? 'blue' : student.user?.firstName?.charAt(0) === 'F' ? 'green' : student.user?.firstName?.charAt(0) === 'N' ? 'purple' : 'orange'}.500`}
                      source={student.user?.avatar ? { uri: student.user.avatar } : undefined}
                    >
                      {student.user?.firstName?.charAt(0)}{student.user?.lastName?.charAt(0)}
                    </Avatar>
                    
                    {/* Student Info */}
                    <VStack flex={1} space={1}>
                      <HStack justifyContent="space-between" alignItems="center">
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>
                          {student.user?.firstName} {student.user?.lastName}
                        </Text>
                        <Badge 
                          colorScheme={student.user?.status === 'ACTIVE' ? 'green' : 'gray'}
                          variant="solid"
                          borderRadius="full"
                        >
                          {student.user?.status || 'ACTIVE'}
                        </Badge>
                      </HStack>
                      
                      <Text fontSize="sm" color={mutedColor}>
                        📧 {student.user?.email}
                      </Text>
                      
                      <HStack space={4}>
                        <Text fontSize="sm" color={mutedColor}>
                          🆔 {student.admissionNo}
                        </Text>
                        <Text fontSize="sm" color={mutedColor}>
                          📞 {student.user?.phone || 'N/A'}
                        </Text>
                      </HStack>

                      <HStack space={4} justifyContent="space-between">
                        <VStack alignItems="center" space={1}>
                          <Progress 
                            value={student._count?.attendances || 0} 
                            size="sm" 
                            colorScheme="blue" 
                            w="50px"
                          />
                          <Text fontSize="xs" color={mutedColor}>
                            Attendance: {student._count?.attendances || 0}
                          </Text>
                        </VStack>
                        
                        <VStack alignItems="center" space={1}>
                          <Progress 
                            value={student._count?.grades || 0} 
                            size="sm" 
                            colorScheme="green" 
                            w="50px"
                          />
                          <Text fontSize="xs" color={mutedColor}>
                            Grades: {student._count?.grades || 0}
                          </Text>
                        </VStack>
                        
                        <VStack alignItems="center" space={1}>
                          <Progress 
                            value={student._count?.payments || 0} 
                            size="sm" 
                            colorScheme="orange" 
                            w="50px"
                          />
                          <Text fontSize="xs" color={mutedColor}>
                            Payments: {student._count?.payments || 0}
                          </Text>
                        </VStack>
                      </HStack>

                      {/* Events Preview */}
                      {student.events && student.events.length > 0 && (
                        <VStack space={1} mt={2}>
                          <Text fontSize="xs" color={primaryColor} fontWeight="bold">
                            Recent Activity ({student.events.length} events)
                          </Text>
                          {student.events.slice(0, 2).map((event: any, index: number) => (
                            <HStack key={event.id} space={2} alignItems="center">
                              <Box 
                                w={2} 
                                h={2} 
                                bg={
                                  event.severity === 'SUCCESS' ? successColor : 
                                  event.severity === 'WARNING' ? warningColor : 
                                  event.severity === 'ERROR' ? errorColor : primaryColor
                                } 
                                borderRadius="full" 
                              />
                              <Text fontSize="xs" color={mutedColor} flex={1}>
                                {event.title}
                              </Text>
                              <Text fontSize="xs" color={mutedColor}>
                                {new Date(event.createdAt).toLocaleDateString()}
                              </Text>
                            </HStack>
                          ))}
                          {student.events.length > 2 && (
                            <Text fontSize="xs" color={primaryColor} textAlign="center">
                              +{student.events.length - 2} more events
                            </Text>
                          )}
                        </VStack>
                      )}
                    </VStack>

                    {/* Action Buttons */}
                    <VStack space={2}>
                      <IconButton
                        icon={<Icon as={MaterialIcons} name="visibility" size="sm" />}
                        colorScheme="blue"
                        variant="ghost"
                        onPress={() => handleStudentSelect(student)}
                        _pressed={{ bg: 'blue.100' }}
                      />
                      <IconButton
                        icon={<Icon as={MaterialIcons} name="edit" size="sm" />}
                        colorScheme="green"
                        variant="ghost"
                        onPress={() => {
                          // Handle edit student
                          }}
                        _pressed={{ bg: 'green.100' }}
                      />
                    </VStack>
                  </HStack>
                </Box>
              </Pressable>
            </Card>
          ))}
        </VStack>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderClassList();
      case 'students':
        return selectedClass ? renderStudentsList() : renderClassList();
      case 'subjects':
        return (
          <Center flex={1}>
            <Text>Subjects for {selectedClass?.name}</Text>
            <Text color={mutedColor}>Loading subjects...</Text>
          </Center>
        );
      case 'timetable':
        return (
          <Center flex={1}>
            <Text>Timetable for {selectedClass?.name}</Text>
            <Text color={mutedColor}>Loading timetable...</Text>
          </Center>
        );
      case 'analytics':
        return (
          <Center flex={1}>
            <Text>Analytics for {selectedClass?.name}</Text>
            <Text color={mutedColor}>Loading analytics...</Text>
          </Center>
        );
      default:
        return renderClassList();
    }
  };

  const renderTabs = () => (
    <HStack bg={cardBg} px={2} py={1} borderBottomWidth={1} borderColor={borderColor}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack space={1}>
          {[
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'students', label: 'Students', icon: 'people' },
            { id: 'subjects', label: 'Subjects', icon: 'book' },
            { id: 'timetable', label: 'Timetable', icon: 'schedule' },
            { id: 'analytics', label: 'Analytics', icon: 'analytics' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'solid' : 'ghost'}
              size="sm"
              onPress={() => setActiveTab(tab.id)}
              leftIcon={<Icon as={MaterialIcons} name={tab.icon} size="xs" />}
            >
              {tab.label}
            </Button>
          ))}
        </HStack>
      </ScrollView>
    </HStack>
  );

  return (
    <Box flex={1} bg={bgColor}>
      <StatusBar barStyle="dark-content" backgroundColor={bgColor} />
      
      {renderHeader()}
      {renderTabs()}
      {renderTabContent()}

      {/* Floating Action Button */}
      <Fab
        renderInPortal={false}
        shadow={2}
        size="sm"
        icon={<Icon color="white" as={MaterialIcons} name="add" size="sm" />}
        onPress={() => setShowCreateForm(true)}
      />

      {/* Action Sheet */}
      <Actionsheet isOpen={isActionSheetOpen} onClose={onActionSheetClose}>
        <Actionsheet.Content>
          <Actionsheet.Item
            onPress={() => {
              if (selectedClass) {
                fetchClassStudents(selectedClass.id);
                setActiveTab('students');
              }
              onActionSheetClose();
            }}
          >
            View Students
          </Actionsheet.Item>
          <Actionsheet.Item
            onPress={() => {
              if (selectedClass) {
                fetchClassSubjects(selectedClass.id);
                setActiveTab('subjects');
              }
              onActionSheetClose();
            }}
          >
            View Subjects
          </Actionsheet.Item>
          <Actionsheet.Item
            onPress={() => {
              if (selectedClass) {
                fetchClassTimetables(selectedClass.id);
                setActiveTab('timetable');
              }
              onActionSheetClose();
            }}
          >
            View Timetable
          </Actionsheet.Item>
          <Actionsheet.Item
            onPress={() => {
              if (selectedClass) {
                fetchClassAnalytics();
                setActiveTab('analytics');
              }
              onActionSheetClose();
            }}
          >
            View Analytics
          </Actionsheet.Item>
          <Actionsheet.Item
            onPress={() => {
              onActionSheetClose();
              // Open edit form
            }}
          >
            Edit Class
          </Actionsheet.Item>
          <Actionsheet.Item
            onPress={() => {
              onActionSheetClose();
              if (selectedClass) {
                Alert.alert(
                  'Delete Class',
                  `Are you sure you want to delete ${selectedClass.name}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => deleteClass(selectedClass.id)
                    }
                  ]
                );
              }
            }}
          >
            Delete Class
          </Actionsheet.Item>
        </Actionsheet.Content>
      </Actionsheet>

      {/* Student Details Modal */}
      <Modal isOpen={showStudentDetails} onClose={() => setShowStudentDetails(false)} size="lg">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Student Details</Modal.Header>
          <Modal.Body>
            {selectedStudent && (
              <VStack space={4}>
                <HStack space={4} alignItems="center">
                  <Avatar
                    size="lg"
                    bg={`${selectedStudent.user?.firstName?.charAt(0) === 'A' ? 'blue' : selectedStudent.user?.firstName?.charAt(0) === 'F' ? 'green' : selectedStudent.user?.firstName?.charAt(0) === 'N' ? 'purple' : 'orange'}.500`}
                    source={selectedStudent.user?.avatar ? { uri: selectedStudent.user.avatar } : undefined}
                  >
                    {selectedStudent.user?.firstName?.charAt(0)}{selectedStudent.user?.lastName?.charAt(0)}
                  </Avatar>
                  <VStack flex={1} space={1}>
                    <Text fontSize="lg" fontWeight="bold">
                      {selectedStudent.user?.firstName} {selectedStudent.user?.lastName}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>
                      Admission No: {selectedStudent.admissionNo}
                    </Text>
                    <Badge
                      colorScheme={selectedStudent.user?.status === 'ACTIVE' ? 'green' : 'gray'}
                      variant="solid"
                      alignSelf="flex-start"
                    >
                      {selectedStudent.user?.status || 'ACTIVE'}
                    </Badge>
                  </VStack>
                </HStack>

                <VStack space={2}>
                  <Text fontSize="md" fontWeight="medium">Contact Information</Text>
                  <Text fontSize="sm">Email: {selectedStudent.user?.email}</Text>
                  <Text fontSize="sm">Phone: {selectedStudent.user?.phone || 'N/A'}</Text>
                </VStack>

                <VStack space={2}>
                  <Text fontSize="md" fontWeight="medium">Academic Information</Text>
                  <Text fontSize="sm">Class: {selectedStudent.class?.name} ({selectedStudent.class?.code})</Text>
                  <Text fontSize="sm">Section: {selectedStudent.section?.name} ({selectedStudent.section?.code})</Text>
                  <Text fontSize="sm">Roll No: {selectedStudent.rollNo || 'N/A'}</Text>
                  <Text fontSize="sm">Enrollment Date: {new Date(selectedStudent.createdAt).toLocaleDateString()}</Text>
                </VStack>

                <VStack space={2}>
                  <Text fontSize="md" fontWeight="medium">Statistics</Text>
                  <HStack space={4} justifyContent="space-between">
                    <VStack alignItems="center">
                      <Text fontSize="lg" fontWeight="bold" color="blue.500">
                        {selectedStudent._count?.attendances || 0}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>Attendances</Text>
                    </VStack>
                    <VStack alignItems="center">
                      <Text fontSize="lg" fontWeight="bold" color="green.500">
                        {selectedStudent._count?.grades || 0}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>Grades</Text>
                    </VStack>
                    <VStack alignItems="center">
                      <Text fontSize="lg" fontWeight="bold" color="orange.500">
                        {selectedStudent._count?.payments || 0}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>Payments</Text>
                    </VStack>
                    <VStack alignItems="center">
                      <Text fontSize="lg" fontWeight="bold" color="purple.500">
                        {selectedStudent._count?.documents || 0}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>Documents</Text>
                    </VStack>
                  </HStack>
                </VStack>

                {/* Events Timeline */}
                {selectedStudent.events && selectedStudent.events.length > 0 && (
                  <VStack space={2}>
                    <Text fontSize="md" fontWeight="medium">Recent Events ({selectedStudent.events.length})</Text>
                    <VStack space={2}>
                      {selectedStudent.events.slice(0, 5).map((event: any) => (
                        <HStack key={event.id} space={3} p={2} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="md">
                          <Box 
                            w={3} 
                            h={3} 
                            bg={
                              event.severity === 'SUCCESS' ? successColor : 
                              event.severity === 'WARNING' ? warningColor : 
                              event.severity === 'ERROR' ? errorColor : primaryColor
                            } 
                            borderRadius="full" 
                          />
                          <VStack flex={1}>
                            <Text fontSize="sm" color={textColor} fontWeight="bold">
                              {event.title}
                            </Text>
                            <Text fontSize="xs" color={mutedColor}>
                              {event.description}
                            </Text>
                            <Text fontSize="xs" color={mutedColor}>
                              {new Date(event.createdAt).toLocaleString()}
                            </Text>
                          </VStack>
                        </HStack>
                      ))}
                      {selectedStudent.events.length > 5 && (
                        <Text fontSize="xs" color={primaryColor} textAlign="center">
                          +{selectedStudent.events.length - 5} more events
                        </Text>
                      )}
                    </VStack>
                  </VStack>
                )}
              </VStack>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowStudentDetails(false)}>
                Close
              </Button>
              <Button onPress={() => {
                // Handle edit student
                setShowStudentDetails(false);
              }}>
                Edit Student
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onClassCreated={handleCreateClass}
      />
    </Box>
  );
};

export default SuperEnhancedClassesScreen; 
