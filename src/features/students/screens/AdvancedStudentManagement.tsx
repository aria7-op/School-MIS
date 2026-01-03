import React, { useState, useEffect } from 'react';
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
  Heading,
  Divider,
  Badge,
  Center,
  ScrollView,
  Select,
  CheckIcon,
  FlatList,
  Pressable,
  Modal,
  FormControl,
  Input,
  TextArea,
  Switch,
  Avatar,
  AlertDialog,
  Tabs,
  TabBar,
  Tab,
  TabPanels,
  TabPanel,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import useStudentApi from '../hooks/useStudentApi';
import StudentPerformanceTracker from '../components/StudentPerformanceTracker';
import StudentAttendanceTracker from '../components/StudentAttendanceTracker';
import StudentBehaviorTracker from '../components/StudentBehaviorTracker';
import StudentAcademicProgress from '../components/StudentAcademicProgress';
import StudentHealthWellness from '../components/StudentHealthWellness';
import StudentExtracurricular from '../components/StudentExtracurricular';
import StudentFinancialManagement from '../components/StudentFinancialManagement';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  grade: string;
  section: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  address: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  emergencyContact: string;
  medicalInfo: string;
  academicLevel: string;
  specialNeeds: string[];
  interests: string[];
  achievements: string[];
  photo?: string;
}

const AdvancedStudentManagement: React.FC = () => {
  const { loading, error, getStudents, getStudentById } = useStudentApi();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const toast = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadSelectedStudent();
    }
  }, [selectedStudentId]);

  const loadStudents = async () => {
    try {
      const response = await getStudents();
      if (response && response.data) {
        setStudents(response.data);
      }
    } catch (err: any) {
      toast.show({
        description: err.message || 'Failed to load students',
        status: 'error'
      });
    }
  };

  const loadSelectedStudent = async () => {
    try {
      const response = await getStudentById(selectedStudentId!);
      if (response && response.data) {
        setSelectedStudent(response.data);
      }
    } catch (err: any) {
      toast.show({
        description: err.message || 'Failed to load student details',
        status: 'error'
      });
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = filterGrade === 'ALL' || student.grade === filterGrade;
    const matchesStatus = filterStatus === 'ALL' || student.status === filterStatus;
    
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        break;
      case 'grade':
        comparison = a.grade.localeCompare(b.grade);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'enrollmentDate':
        comparison = new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime();
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'error';
      case 'GRADUATED': return 'info';
      case 'TRANSFERRED': return 'warning';
      default: return 'gray';
    }
  };

  const getGradeColor = (grade: string) => {
    const gradeColors: Record<string, string> = {
      'K': 'purple',
      '1': 'blue',
      '2': 'green',
      '3': 'orange',
      '4': 'red',
      '5': 'pink',
      '6': 'indigo',
      '7': 'cyan',
      '8': 'teal',
      '9': 'amber',
      '10': 'lime',
      '11': 'emerald',
      '12': 'rose'
    };
    return gradeColors[grade] || 'gray';
  };

  const renderStudentSelector = () => (
    <Card p={4} mb={4} borderRadius="lg" shadow={2}>
      <VStack space={4}>
        <Heading size="md" color="coolGray.800">Student Selection</Heading>
        
        {selectedStudent ? (
          <HStack space={3} alignItems="center" p={3} bg="blue.50" borderRadius="md">
            <Avatar
              size="md"
              source={selectedStudent.photo ? { uri: selectedStudent.photo } : undefined}
            >
              {selectedStudent.firstName.charAt(0)}{selectedStudent.lastName.charAt(0)}
            </Avatar>
            <VStack flex={1}>
              <Text fontSize="lg" fontWeight="semibold" color="coolGray.800">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </Text>
              <Text fontSize="sm" color="coolGray.600">
                Grade {selectedStudent.grade} • {selectedStudent.email}
              </Text>
            </VStack>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                setSelectedStudent(null);
                setSelectedStudentId(null);
              }}
            >
              Change
            </Button>
          </HStack>
        ) : (
          <Center py={8}>
            <VStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="person" size="lg" color="coolGray.400" />
              <Text color="coolGray.500">No student selected</Text>
              <Button
                size="sm"
                onPress={() => setShowStudentSelector(true)}
              >
                Select Student
              </Button>
            </VStack>
          </Center>
        )}
      </VStack>
    </Card>
  );

  const renderFilters = () => (
    <Card p={4} mb={4} borderRadius="lg" shadow={2}>
      <VStack space={4}>
        <Heading size="md" color="coolGray.800">Filters & Search</Heading>
        
        <VStack space={3}>
          <FormControl>
            <FormControl.Label>Search Students</FormControl.Label>
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              InputLeftElement={
                <Icon as={MaterialIcons} name="search" size="sm" color="coolGray.400" ml={2} />
              }
            />
          </FormControl>
          
          <HStack space={3}>
            <FormControl flex={1}>
              <FormControl.Label>Grade</FormControl.Label>
              <Select
                selectedValue={filterGrade}
                onValueChange={setFilterGrade}
              >
                <Select.Item label="All Grades" value="ALL" />
                <Select.Item label="Kindergarten" value="K" />
                <Select.Item label="Grade 1" value="1" />
                <Select.Item label="Grade 2" value="2" />
                <Select.Item label="Grade 3" value="3" />
                <Select.Item label="Grade 4" value="4" />
                <Select.Item label="Grade 5" value="5" />
                <Select.Item label="Grade 6" value="6" />
                <Select.Item label="Grade 7" value="7" />
                <Select.Item label="Grade 8" value="8" />
                <Select.Item label="Grade 9" value="9" />
                <Select.Item label="Grade 10" value="10" />
                <Select.Item label="Grade 11" value="11" />
                <Select.Item label="Grade 12" value="12" />
              </Select>
            </FormControl>
            
            <FormControl flex={1}>
              <FormControl.Label>Status</FormControl.Label>
              <Select
                selectedValue={filterStatus}
                onValueChange={setFilterStatus}
              >
                <Select.Item label="All Status" value="ALL" />
                <Select.Item label="Active" value="ACTIVE" />
                <Select.Item label="Inactive" value="INACTIVE" />
                <Select.Item label="Graduated" value="GRADUATED" />
                <Select.Item label="Transferred" value="TRANSFERRED" />
              </Select>
            </FormControl>
          </HStack>
          
          <HStack space={3}>
            <FormControl flex={1}>
              <FormControl.Label>Sort By</FormControl.Label>
              <Select
                selectedValue={sortBy}
                onValueChange={setSortBy}
              >
                <Select.Item label="Name" value="name" />
                <Select.Item label="Grade" value="grade" />
                <Select.Item label="Status" value="status" />
                <Select.Item label="Enrollment Date" value="enrollmentDate" />
              </Select>
            </FormControl>
            
            <FormControl flex={1}>
              <FormControl.Label>Order</FormControl.Label>
              <Select
                selectedValue={sortOrder}
                onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}
              >
                <Select.Item label="Ascending" value="asc" />
                <Select.Item label="Descending" value="desc" />
              </Select>
            </FormControl>
          </HStack>
        </VStack>
      </VStack>
    </Card>
  );

  const renderStudentList = () => (
    <Card p={4} mb={4} borderRadius="lg" shadow={2}>
      <VStack space={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="md" color="coolGray.800">Students ({sortedStudents.length})</Heading>
          <Button
            size="sm"
            leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
            onPress={loadStudents}
          >
            Refresh
          </Button>
        </HStack>
        
        {loading ? (
          <Center py={8}>
            <Spinner size="lg" color="blue.500" />
          </Center>
        ) : sortedStudents.length > 0 ? (
          <FlatList
            data={sortedStudents}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setSelectedStudent(item);
                  setSelectedStudentId(item.id);
                  setShowStudentSelector(false);
                }}
              >
                <Card p={3} mb={2} borderRadius="md" bg="coolGray.50">
                  <HStack space={3} alignItems="center">
                    <Avatar
                      size="md"
                      source={item.photo ? { uri: item.photo } : undefined}
                    >
                      {item.firstName.charAt(0)}{item.lastName.charAt(0)}
                    </Avatar>
                    
                    <VStack flex={1}>
                      <HStack justifyContent="space-between" alignItems="center">
                        <Text fontSize="md" fontWeight="semibold" color="coolGray.800">
                          {item.firstName} {item.lastName}
                        </Text>
                        <HStack space={2}>
                          <Badge
                            colorScheme={getGradeColor(item.grade)}
                            variant="solid"
                            size="sm"
                          >
                            Grade {item.grade}
                          </Badge>
                          <Badge
                            colorScheme={getStatusColor(item.status)}
                            variant="solid"
                            size="sm"
                          >
                            {item.status}
                          </Badge>
                        </HStack>
                      </HStack>
                      
                      <Text fontSize="sm" color="coolGray.600">
                        {item.email}
                      </Text>
                      
                      <Text fontSize="xs" color="coolGray.500">
                        Enrolled: {new Date(item.enrollmentDate).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              </Pressable>
            )}
          />
        ) : (
          <Center py={8}>
            <VStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="people" size="lg" color="coolGray.400" />
              <Text color="coolGray.500">No students found</Text>
              <Text color="coolGray.400" fontSize="sm">
                Try adjusting your search criteria
              </Text>
            </VStack>
          </Center>
        )}
      </VStack>
    </Card>
  );

  const renderTabContent = () => {
    if (!selectedStudent) {
      return (
        <Center py={8}>
          <VStack space={2} alignItems="center">
            <Icon as={MaterialIcons} name="person" size="lg" color="coolGray.400" />
            <Text color="coolGray.500">Select a student to view details</Text>
          </VStack>
        </Center>
      );
    }

    return (
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabBar>
          <Tab value="overview">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="dashboard" size="sm" />
              <Text>Overview</Text>
            </HStack>
          </Tab>
          <Tab value="performance">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="trending-up" size="sm" />
              <Text>Performance</Text>
            </HStack>
          </Tab>
          <Tab value="attendance">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="event" size="sm" />
              <Text>Attendance</Text>
            </HStack>
          </Tab>
          <Tab value="behavior">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="psychology" size="sm" />
              <Text>Behavior</Text>
            </HStack>
          </Tab>
          <Tab value="academic">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="school" size="sm" />
              <Text>Academic</Text>
            </HStack>
          </Tab>
          <Tab value="health">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="favorite" size="sm" />
              <Text>Health</Text>
            </HStack>
          </Tab>
          <Tab value="extracurricular">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="sports-soccer" size="sm" />
              <Text>Activities</Text>
            </HStack>
          </Tab>
          <Tab value="financial">
            <HStack space={1} alignItems="center">
              <Icon as={MaterialIcons} name="account-balance-wallet" size="sm" />
              <Text>Financial</Text>
            </HStack>
          </Tab>
        </TabBar>

        <TabPanels>
          <TabPanel value="overview">
            <VStack space={4}>
              <Card p={4} borderRadius="lg" shadow={2}>
                <VStack space={4}>
                  <HStack space={3} alignItems="center">
                    <Avatar
                      size="xl"
                      source={selectedStudent.photo ? { uri: selectedStudent.photo } : undefined}
                    >
                      {selectedStudent.firstName.charAt(0)}{selectedStudent.lastName.charAt(0)}
                    </Avatar>
                    <VStack flex={1}>
                      <Heading size="lg" color="coolGray.800">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </Heading>
                      <Text fontSize="md" color="coolGray.600">
                        Grade {selectedStudent.grade} • {selectedStudent.section}
                      </Text>
                      <HStack space={2} mt={2}>
                        <Badge
                          colorScheme={getStatusColor(selectedStudent.status)}
                          variant="solid"
                        >
                          {selectedStudent.status}
                        </Badge>
                        <Badge
                          colorScheme={getGradeColor(selectedStudent.grade)}
                          variant="solid"
                        >
                          Grade {selectedStudent.grade}
                        </Badge>
                      </HStack>
                    </VStack>
                  </HStack>
                  
                  <Divider />
                  
                  <VStack space={3}>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color="coolGray.600">Email:</Text>
                      <Text fontSize="sm" color="coolGray.800">{selectedStudent.email}</Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color="coolGray.600">Phone:</Text>
                      <Text fontSize="sm" color="coolGray.800">{selectedStudent.phone}</Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color="coolGray.600">Date of Birth:</Text>
                      <Text fontSize="sm" color="coolGray.800">
                        {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}
                      </Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color="coolGray.600">Enrollment Date:</Text>
                      <Text fontSize="sm" color="coolGray.800">
                        {new Date(selectedStudent.enrollmentDate).toLocaleDateString()}
                      </Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color="coolGray.600">Parent:</Text>
                      <Text fontSize="sm" color="coolGray.800">{selectedStudent.parentName}</Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text fontSize="sm" color="coolGray.600">Parent Phone:</Text>
                      <Text fontSize="sm" color="coolGray.800">{selectedStudent.parentPhone}</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Card>
            </VStack>
          </TabPanel>

          <TabPanel value="performance">
            <StudentPerformanceTracker />
          </TabPanel>

          <TabPanel value="attendance">
            <StudentAttendanceTracker />
          </TabPanel>

          <TabPanel value="behavior">
            <StudentBehaviorTracker />
          </TabPanel>

          <TabPanel value="academic">
            <StudentAcademicProgress />
          </TabPanel>

          <TabPanel value="health">
            <StudentHealthWellness />
          </TabPanel>

          <TabPanel value="extracurricular">
            <StudentExtracurricular />
          </TabPanel>

          <TabPanel value="financial">
            <StudentFinancialManagement />
          </TabPanel>
        </TabPanels>
      </Tabs>
    );
  };

  return (
    <Box flex={1} bg="coolGray.50">
      <ScrollView>
        <Box p={4}>
          <VStack space={4}>
            <Heading size="xl" color="coolGray.800" mb={2}>
              Advanced Student Management
            </Heading>
            
            {renderStudentSelector()}
            
            {!selectedStudent && (
              <>
                {renderFilters()}
                {renderStudentList()}
              </>
            )}
            
            {selectedStudent && renderTabContent()}
          </VStack>
        </Box>
      </ScrollView>

      {/* Student Selector Modal */}
      <Modal isOpen={showStudentSelector} onClose={() => setShowStudentSelector(false)} size="xl">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Select Student</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              {renderFilters()}
              {renderStudentList()}
            </VStack>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default AdvancedStudentManagement; 
