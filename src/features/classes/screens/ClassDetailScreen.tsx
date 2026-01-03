import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl, StatusBar, Alert, Dimensions } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Badge,
  Icon,
  useToast,
  Spinner,
  Heading,
  Divider,
  Center,
  Pressable,
  Avatar,
  Progress,
  useColorModeValue,
  Skeleton,
  SimpleGrid,
  Tab,
  Tabs,
  TabView,
  Modal,
  FormControl,
  Input,
  TextArea,
  Select,
  CheckIcon,
  IconButton,
  ActionSheet,
  useDisclose,
  Fab,
  Stack,
  Flex,
  Wrap,
  Tag,
  TagLabel,
  Image,
  AspectRatio,
} from 'native-base';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';

// Import the enhanced hook
import { useEnhancedClasses } from '../hooks/useEnhancedClasses';

// Import types
import { Class } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface RouteParams {
  classId: number;
  class?: Class;
}

const ClassDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { classId, class: initialClass } = route.params as RouteParams;

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
    selectedClass,
    students,
    subjects,
    timetables,
    exams,
    assignments,
    attendances,
    performance,
    loading,
    studentsLoading,
    subjectsLoading,
    timetablesLoading,
    examsLoading,
    assignmentsLoading,
    attendancesLoading,
    performanceLoading,
    refreshing,
    fetchClassById,
    fetchClassStudents,
    fetchClassSubjects,
    fetchClassTimetables,
    fetchClassExams,
    fetchClassAssignments,
    fetchClassAttendances,
    fetchClassPerformance,
    updateClass,
    deleteClass,
    batchTransferStudents,
    refreshClassData,
  } = useEnhancedClasses();

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState<any>({});

  // Action sheet
  const { isOpen: isActionOpen, onOpen: onActionOpen, onClose: onActionClose } = useDisclose();

  const toast = useToast();

  // Effects
  useEffect(() => {
    if (classId) {
      loadClassData();
    }
  }, [classId]);

  useEffect(() => {
    if (initialClass) {
      setEditFormData(initialClass);
    }
  }, [initialClass]);

  // Data loading
  const loadClassData = useCallback(async () => {
    if (classId) {
      await fetchClassById(classId);
      await Promise.all([
        fetchClassStudents(classId),
        fetchClassSubjects(classId),
        fetchClassTimetables(classId),
        fetchClassExams(classId),
        fetchClassAssignments(classId),
        fetchClassAttendances(classId),
        fetchClassPerformance(classId),
      ]);
    }
  }, [classId]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (classId) {
      await refreshClassData(classId);
    }
  }, [classId, refreshClassData]);

  // Edit class handler
  const handleEditClass = useCallback(async () => {
    if (!selectedClass) return;

    try {
      await updateClass(selectedClass.id, editFormData);
      setShowEditModal(false);
      toast.show({
        description: 'Class updated successfully',
        status: 'success',
      });
    } catch (error) {
      toast.show({
        description: 'Failed to update class',
        status: 'error',
      });
    }
  }, [selectedClass, editFormData, updateClass, toast]);

  // Delete class handler
  const handleDeleteClass = useCallback(() => {
    if (!selectedClass) return;

    Alert.alert(
      'Delete Class',
      `Are you sure you want to delete "${selectedClass.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClass(selectedClass.id);
              navigation.goBack();
              toast.show({
                description: 'Class deleted successfully',
                status: 'success',
              });
            } catch (error) {
              toast.show({
                description: 'Failed to delete class',
                status: 'error',
              });
            }
          },
        },
      ]
    );
  }, [selectedClass, deleteClass, navigation, toast]);

  // Student selection handler
  const handleStudentSelect = useCallback((student: any) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  }, []);

  // Transfer students handler
  const handleTransferStudents = useCallback(async (toClassId: number) => {
    if (!selectedClass || selectedStudents.length === 0) return;

    try {
      const studentIds = selectedStudents.map(s => s.id);
      await batchTransferStudents(selectedClass.id, toClassId, studentIds);
      setSelectedStudents([]);
      setShowTransferModal(false);
      await fetchClassStudents(selectedClass.id);
      toast.show({
        description: `${selectedStudents.length} students transferred successfully`,
        status: 'success',
      });
    } catch (error) {
      toast.show({
        description: 'Failed to transfer students',
        status: 'error',
      });
    }
  }, [selectedClass, selectedStudents, batchTransferStudents, fetchClassStudents, toast]);

  // Render methods
  const renderHeader = () => (
    <Box bg={cardBg} px={4} py={3} borderBottomWidth={1} borderColor={borderColor}>
      <HStack justifyContent="space-between" alignItems="center">
        <HStack space={3} alignItems="center" flex={1}>
          <IconButton
            icon={<Icon as={MaterialIcons} name="arrow-back" size="sm" />}
            onPress={() => navigation.goBack()}
            variant="ghost"
          />
          <VStack flex={1}>
            <Heading size="lg" color={textColor} numberOfLines={1}>
              {selectedClass?.name || 'Loading...'}
            </Heading>
            {selectedClass && (
              <Text fontSize="sm" color={mutedColor}>
                {selectedClass.code} • Level {selectedClass.level} • Section {selectedClass.section}
              </Text>
            )}
          </VStack>
        </HStack>
        <HStack space={2}>
          <IconButton
            icon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
            onPress={handleRefresh}
            isLoading={refreshing}
            variant="ghost"
          />
          <IconButton
            icon={<Icon as={MaterialIcons} name="more-vert" size="sm" />}
            onPress={onActionOpen}
            variant="ghost"
          />
        </HStack>
      </HStack>
    </Box>
  );

  const renderClassInfo = () => {
    if (loading || !selectedClass) {
      return (
        <VStack space={3} p={4}>
          <Skeleton h="20" rounded="lg" />
          <Skeleton h="16" rounded="lg" />
        </VStack>
      );
    }

    return (
      <Box p={4}>
        <Card bg={cardBg} shadow={2} rounded="lg">
          <Box p={4}>
            <VStack space={4}>
              <HStack justifyContent="space-between" alignItems="flex-start">
                <VStack flex={1} space={2}>
                  <Heading size="md" color={textColor}>
                    Class Overview
                  </Heading>
                  <VStack space={1}>
                    <Text fontSize="sm" color={mutedColor}>
                      <Text fontWeight="medium">Capacity:</Text> {students.length}/{selectedClass.capacity}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>
                      <Text fontWeight="medium">Teacher:</Text> {selectedClass.teacherName || 'Not assigned'}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>
                      <Text fontWeight="medium">Status:</Text> {selectedClass.status}
                    </Text>
                  </VStack>
                </VStack>
                <Badge
                  colorScheme={selectedClass.status === 'active' ? 'green' : 'gray'}
                  variant="solid"
                  rounded="full"
                >
                  {selectedClass.status}
                </Badge>
              </HStack>

              {selectedClass.description && (
                <VStack space={2}>
                  <Text fontSize="sm" fontWeight="medium" color={textColor}>
                    Description
                  </Text>
                  <Text fontSize="sm" color={mutedColor}>
                    {selectedClass.description}
                  </Text>
                </VStack>
              )}

              <SimpleGrid columns={2} spacing={4}>
                <VStack alignItems="center" space={1}>
                  <Text fontSize="2xl" fontWeight="bold" color={primaryColor}>
                    {students.length}
                  </Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">
                    Students
                  </Text>
                </VStack>
                <VStack alignItems="center" space={1}>
                  <Text fontSize="2xl" fontWeight="bold" color={successColor}>
                    {subjects.length}
                  </Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">
                    Subjects
                  </Text>
                </VStack>
                <VStack alignItems="center" space={1}>
                  <Text fontSize="2xl" fontWeight="bold" color={warningColor}>
                    {assignments.length}
                  </Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">
                    Assignments
                  </Text>
                </VStack>
                <VStack alignItems="center" space={1}>
                  <Text fontSize="2xl" fontWeight="bold" color={errorColor}>
                    {exams.length}
                  </Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">
                    Exams
                  </Text>
                </VStack>
              </SimpleGrid>
            </VStack>
          </Box>
        </Card>
      </Box>
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
              No students enrolled
            </Text>
            <Text fontSize="sm" color={mutedColor} textAlign="center">
              Add students to this class to see them here
            </Text>
            <Button size="sm">Add Students</Button>
          </VStack>
        </Center>
      );
    }

    return (
      <ScrollView flex={1} p={4}>
        <VStack space={3}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="md" fontWeight="medium" color={textColor}>
              Students ({students.length})
            </Text>
            <HStack space={2}>
              {selectedStudents.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => setShowTransferModal(true)}
                >
                  Transfer ({selectedStudents.length})
                </Button>
              )}
              <Button size="sm">Add Student</Button>
            </HStack>
          </HStack>

          {students.map((student) => (
            <Card key={student.id} bg={cardBg} shadow={1}>
              <Pressable onPress={() => handleStudentSelect(student)}>
                <Box p={4}>
                  <HStack space={3} alignItems="center">
                    <Checkbox
                      isChecked={selectedStudents.some(s => s.id === student.id)}
                      onChange={(isSelected) => {
                        if (isSelected) {
                          setSelectedStudents(prev => [...prev, student]);
                        } else {
                          setSelectedStudents(prev => prev.filter(s => s.id !== student.id));
                        }
                      }}
                    />
                    <Avatar
                      size="md"
                      source={{ uri: student.avatar }}
                      bg={primaryColor}
                    >
                      {student.firstName?.[0]}{student.lastName?.[0]}
                    </Avatar>
                    <VStack flex={1} space={1}>
                      <Text fontSize="md" fontWeight="medium" color={textColor}>
                        {student.firstName} {student.lastName}
                      </Text>
                      <Text fontSize="sm" color={mutedColor}>
                        ID: {student.studentId} | Grade: {student.grade}
                      </Text>
                      <HStack space={4}>
                        <HStack space={1} alignItems="center">
                          <Icon as={MaterialIcons} name="check-circle" size="xs" color={successColor} />
                          <Text fontSize="xs" color={mutedColor}>
                            {student.attendance}% attendance
                          </Text>
                        </HStack>
                        <Badge
                          size="sm"
                          colorScheme={student.status === 'active' ? 'green' : 'gray'}
                          variant="subtle"
                        >
                          {student.status}
                        </Badge>
                      </HStack>
                    </VStack>
                    <IconButton
                      icon={<Icon as={MaterialIcons} name="chevron-right" size="sm" />}
                      variant="ghost"
                      size="sm"
                    />
                  </HStack>
                </Box>
              </Pressable>
            </Card>
          ))}
        </VStack>
      </ScrollView>
    );
  };

  const renderSubjectsList = () => {
    if (subjectsLoading) {
      return (
        <VStack space={3} p={4}>
          {[1,2,3].map(i => (
            <Skeleton key={i} h="12" rounded="lg" />
          ))}
        </VStack>
      );
    }

    return (
      <ScrollView flex={1} p={4}>
        <VStack space={3}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="md" fontWeight="medium" color={textColor}>
              Subjects ({subjects.length})
            </Text>
            <Button size="sm">Add Subject</Button>
          </HStack>

          {subjects.length === 0 ? (
            <Center flex={1} p={8}>
              <VStack space={4} alignItems="center">
                <Icon as={MaterialIcons} name="book" size="6xl" color={mutedColor} />
                <Text fontSize="lg" color={mutedColor} textAlign="center">
                  No subjects assigned
                </Text>
                <Button size="sm">Add Subject</Button>
              </VStack>
            </Center>
          ) : (
            subjects.map((subject, index) => (
              <Card key={index} bg={cardBg} shadow={1}>
                <Box p={4}>
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack space={3} alignItems="center">
                      <Icon as={MaterialIcons} name="book" size="md" color={primaryColor} />
                      <VStack>
                        <Text fontSize="md" fontWeight="medium" color={textColor}>
                          {subject.name || `Subject ${index + 1}`}
                        </Text>
                        <Text fontSize="sm" color={mutedColor}>
                          {subject.code || `SUB${index + 1}`} • {subject.credits || 3} credits
                        </Text>
                      </VStack>
                    </HStack>
                    <IconButton
                      icon={<Icon as={MaterialIcons} name="more-vert" size="sm" />}
                      variant="ghost"
                      size="sm"
                    />
                  </HStack>
                </Box>
              </Card>
            ))
          )}
        </VStack>
      </ScrollView>
    );
  };

  const renderTimetable = () => {
    if (timetablesLoading) {
      return (
        <VStack space={3} p={4}>
          <Skeleton h="40" rounded="lg" />
        </VStack>
      );
    }

    return (
      <ScrollView flex={1} p={4}>
        <VStack space={3}>
          <Text fontSize="md" fontWeight="medium" color={textColor}>
            Class Timetable
          </Text>
          <Center flex={1} p={8}>
            <VStack space={4} alignItems="center">
              <Icon as={MaterialIcons} name="schedule" size="6xl" color={mutedColor} />
              <Text fontSize="lg" color={mutedColor} textAlign="center">
                Timetable coming soon
              </Text>
              <Text fontSize="sm" color={mutedColor} textAlign="center">
                Class schedule will be displayed here
              </Text>
            </VStack>
          </Center>
        </VStack>
      </ScrollView>
    );
  };

  const renderPerformance = () => {
    if (performanceLoading) {
      return (
        <VStack space={3} p={4}>
          <Skeleton h="32" rounded="lg" />
        </VStack>
      );
    }

    return (
      <ScrollView flex={1} p={4}>
        <VStack space={4}>
          <Text fontSize="md" fontWeight="medium" color={textColor}>
            Class Performance
          </Text>
          
          <SimpleGrid columns={2} spacing={4}>
            <Card bg={cardBg} shadow={1}>
              <Box p={4} alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color={primaryColor}>
                  85%
                </Text>
                <Text fontSize="sm" color={mutedColor} textAlign="center">
                  Average Attendance
                </Text>
              </Box>
            </Card>
            
            <Card bg={cardBg} shadow={1}>
              <Box p={4} alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color={successColor}>
                  B+
                </Text>
                <Text fontSize="sm" color={mutedColor} textAlign="center">
                  Average Grade
                </Text>
              </Box>
            </Card>
          </SimpleGrid>

          <Card bg={cardBg} shadow={1}>
            <Box p={4}>
              <VStack space={3}>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  Performance Trends
                </Text>
                <Center p={8}>
                  <VStack space={2} alignItems="center">
                    <Icon as={MaterialIcons} name="trending-up" size="4xl" color={successColor} />
                    <Text fontSize="sm" color={mutedColor} textAlign="center">
                      Performance analytics coming soon
                    </Text>
                  </VStack>
                </Center>
              </VStack>
            </Box>
          </Card>
        </VStack>
      </ScrollView>
    );
  };

  const tabs = [
    { title: 'Overview', content: renderClassInfo },
    { title: 'Students', content: renderStudentsList },
    { title: 'Subjects', content: renderSubjectsList },
    { title: 'Timetable', content: renderTimetable },
    { title: 'Performance', content: renderPerformance },
  ];

  return (
    <Box flex={1} bg={bgColor}>
      <StatusBar barStyle="dark-content" backgroundColor={bgColor} />
      
      {renderHeader()}

      <Tabs
        index={activeTab}
        onChange={setActiveTab}
        variant="line"
        colorScheme="blue"
      >
        <Tab.Bar>
          {tabs.map((tab, index) => (
            <Tab key={index} _text={{ fontSize: 'sm' }}>
              {tab.title}
            </Tab>
          ))}
        </Tab.Bar>
        <Tab.Views>
          {tabs.map((tab, index) => (
            <Tab.View key={index}>
              <ScrollView
                flex={1}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
              >
                {tab.content()}
              </ScrollView>
            </Tab.View>
          ))}
        </Tab.Views>
      </Tabs>

      {/* Action Sheet */}
      <ActionSheet isOpen={isActionOpen} onClose={onActionClose}>
        <ActionSheet.Content>
          <ActionSheet.Item
            onPress={() => {
              setShowEditModal(true);
              onActionClose();
            }}
          >
            Edit Class
          </ActionSheet.Item>
          <ActionSheet.Item
            onPress={() => {
              onActionClose();
              // Handle duplicate class
            }}
          >
            Duplicate Class
          </ActionSheet.Item>
          <ActionSheet.Item
            onPress={() => {
              onActionClose();
              // Handle export class data
            }}
          >
            Export Data
          </ActionSheet.Item>
          <ActionSheet.Item
            onPress={() => {
              onActionClose();
              handleDeleteClass();
            }}
          >
            Delete Class
          </ActionSheet.Item>
        </ActionSheet.Content>
      </ActionSheet>

      {/* Edit Class Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="lg">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Edit Class</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <FormControl>
                <FormControl.Label>Class Name</FormControl.Label>
                <Input
                  value={editFormData.name || ''}
                  onChangeText={(text) => setEditFormData({...editFormData, name: text})}
                />
              </FormControl>
              <FormControl>
                <FormControl.Label>Class Code</FormControl.Label>
                <Input
                  value={editFormData.code || ''}
                  onChangeText={(text) => setEditFormData({...editFormData, code: text})}
                />
              </FormControl>
              <HStack space={2}>
                <FormControl flex={1}>
                  <FormControl.Label>Level</FormControl.Label>
                  <Select
                    selectedValue={editFormData.level?.toString()}
                    onValueChange={(value) => setEditFormData({...editFormData, level: parseInt(value)})}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(level => (
                      <Select.Item key={level} label={`Grade ${level}`} value={level.toString()} />
                    ))}
                  </Select>
                </FormControl>
                <FormControl flex={1}>
                  <FormControl.Label>Section</FormControl.Label>
                  <Input
                    value={editFormData.section || ''}
                    onChangeText={(text) => setEditFormData({...editFormData, section: text})}
                  />
                </FormControl>
              </HStack>
              <FormControl>
                <FormControl.Label>Capacity</FormControl.Label>
                <Input
                  value={editFormData.capacity?.toString() || ''}
                  onChangeText={(text) => setEditFormData({...editFormData, capacity: parseInt(text) || 0})}
                  keyboardType="numeric"
                />
              </FormControl>
              <FormControl>
                <FormControl.Label>Description</FormControl.Label>
                <TextArea
                  value={editFormData.description || ''}
                  onChangeText={(text) => setEditFormData({...editFormData, description: text})}
                />
              </FormControl>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onPress={handleEditClass}>
                Save Changes
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Student Details Modal */}
      <Modal isOpen={showStudentModal} onClose={() => setShowStudentModal(false)} size="lg">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Student Details</Modal.Header>
          <Modal.Body>
            {selectedStudent && (
              <VStack space={4}>
                <HStack space={4} alignItems="center">
                  <Avatar
                    size="lg"
                    source={{ uri: selectedStudent.avatar }}
                    bg={primaryColor}
                  >
                    {selectedStudent.firstName?.[0]}{selectedStudent.lastName?.[0]}
                  </Avatar>
                  <VStack flex={1} space={1}>
                    <Text fontSize="lg" fontWeight="bold">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>
                      Student ID: {selectedStudent.studentId}
                    </Text>
                    <Badge
                      colorScheme={selectedStudent.status === 'active' ? 'green' : 'gray'}
                      variant="solid"
                      alignSelf="flex-start"
                    >
                      {selectedStudent.status}
                    </Badge>
                  </VStack>
                </HStack>

                <VStack space={2}>
                  <Text fontSize="md" fontWeight="medium">Contact Information</Text>
                  <Text fontSize="sm">Email: {selectedStudent.email}</Text>
                  <Text fontSize="sm">Phone: {selectedStudent.phone}</Text>
                  <Text fontSize="sm">Address: {selectedStudent.address}</Text>
                </VStack>

                <VStack space={2}>
                  <Text fontSize="md" fontWeight="medium">Academic Information</Text>
                  <Text fontSize="sm">Grade: {selectedStudent.grade}</Text>
                  <Text fontSize="sm">Attendance: {selectedStudent.attendance}%</Text>
                  <Text fontSize="sm">Enrollment Date: {selectedStudent.enrollmentDate}</Text>
                </VStack>

                <VStack space={2}>
                  <Text fontSize="md" fontWeight="medium">Guardian Information</Text>
                  <Text fontSize="sm">Guardian: {selectedStudent.guardianName}</Text>
                  <Text fontSize="sm">Guardian Phone: {selectedStudent.guardianPhone}</Text>
                </VStack>
              </VStack>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowStudentModal(false)}>
                Close
              </Button>
              <Button onPress={() => {
                setShowStudentModal(false);
                // Handle edit student
              }}>
                Edit Student
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Transfer Students Modal */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)}>
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Transfer Students</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <Text fontSize="sm" color={mutedColor}>
                Transfer {selectedStudents.length} selected students to another class:
              </Text>
              <FormControl>
                <FormControl.Label>Select Target Class</FormControl.Label>
                <Select placeholder="Choose a class">
                  <Select.Item label="Grade 9A" value="1" />
                  <Select.Item label="Grade 9B" value="2" />
                  <Select.Item label="Grade 10A" value="3" />
                </Select>
              </FormControl>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowTransferModal(false)}>
                Cancel
              </Button>
              <Button onPress={() => handleTransferStudents(1)}>
                Transfer
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default ClassDetailScreen;
