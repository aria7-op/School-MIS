import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Select,
  CheckIcon,
  useToast,
  Spinner,
  Center,
  Text,
  Badge,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import StudentList from '../components/StudentList/StudentList';
import { removeStudentFromCourse } from '../../services/enrollmentService';

interface Student {
  id: number;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    gender: string;
    address: string;
  };
  admissionNo: string;
  rollNo: string;
  admissionDate: string;
  class?: {
    id: number;
    name: string;
  };
  section?: {
    name: string;
  };
  bloodGroup: string;
  nationality: string;
  religion: string;
  aadharNo: string;
  previousSchool: string;
}

interface Course {
  id: number;
  name: string;
}

interface AcademicSession {
  id: number;
  name: string;
  isCurrent: boolean;
}

const StudentManagementWithCourseSelection: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedSession) {
      loadStudentsForCourse();
    }
  }, [selectedCourse, selectedSession]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load courses (classes)
      const coursesResponse = await fetch('/api/classes');
      const coursesData = await coursesResponse.json();
      if (coursesData.success) {
        setCourses(coursesData.data);
      }

      // Load academic sessions
      const sessionsResponse = await fetch('/api/enrollments/academic-year/sessions');
      const sessionsData = await sessionsResponse.json();
      if (sessionsData.success) {
        setAcademicSessions(sessionsData.data);
        const currentSession = sessionsData.data.find((session: AcademicSession) => session.isCurrent);
        if (currentSession) {
          setSelectedSession(currentSession.id.toString());
        }
      }

      // Load all students
      await loadStudents();
    } catch (err) {
      setError('Failed to load data');
      toast.show({
        description: 'Failed to load data',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (err) {
      setError('Failed to load students');
    }
  };

  const loadStudentsForCourse = async () => {
    if (!selectedCourse || !selectedSession) return;
    
    try {
      const response = await fetch(`/api/enrollments/session/${selectedSession}?classId=${selectedCourse}`);
      const data = await response.json();
      if (data.success) {
        const enrolledStudents = data.data.map((enrollment: any) => enrollment.student);
        setStudents(enrolledStudents);
      }
    } catch (err) {
      setError('Failed to load students for course');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleEdit = (student: Student) => {
    // Handle student edit
    console.log('Edit student:', student);
  };

  const handleStudentSelect = (student: Student) => {
    // Handle student selection
    console.log('Selected student:', student);
  };

  const handleStudentDelete = (studentId: number) => {
    // Handle student deletion
    console.log('Delete student:', studentId);
  };

  const handleRemoveFromCourse = async (studentId: number) => {
    if (!selectedCourse || !selectedSession) {
      toast.show({
        description: 'Please select a course and academic session',
        status: 'error',
      });
      return;
    }

    try {
      await removeStudentFromCourse({
        studentId,
        courseId: parseInt(selectedCourse),
        academicSessionId: parseInt(selectedSession),
        remarks: 'Removed by administrator',
      });

      // Refresh the student list
      await loadStudentsForCourse();
      
      toast.show({
        description: 'Student removed from course successfully',
        status: 'success',
      });
    } catch (err: any) {
      toast.show({
        description: err.message || 'Failed to remove student from course',
        status: 'error',
      });
    }
  };

  return (
    <Box flex={1} bg="coolGray.50">
      <VStack space={4} p={4}>
        <Heading size="xl" color="coolGray.800">
          Student Management
        </Heading>

        {/* Course Selection Header */}
        <Box bg="white" p={4} borderRadius="lg" shadow={2}>
          <VStack space={3}>
            <Heading size="md" color="coolGray.800">
              Course Selection
            </Heading>
            
            <HStack space={3}>
              <Box flex={1}>
                <Text fontSize="sm" color="coolGray.600" mb={1}>
                  Select Course:
                </Text>
                <Select
                  selectedValue={selectedCourse || ''}
                  onValueChange={(value) => setSelectedCourse(value)}
                  placeholder="Choose a course"
                  _selectedItem={{
                    bg: 'blue.100',
                    endIcon: <CheckIcon size="4" />,
                  }}
                >
                  {courses.map((course) => (
                    <Select.Item
                      key={course.id}
                      label={course.name}
                      value={course.id.toString()}
                    />
                  ))}
                </Select>
              </Box>

              <Box flex={1}>
                <Text fontSize="sm" color="coolGray.600" mb={1}>
                  Academic Session:
                </Text>
                <Select
                  selectedValue={selectedSession || ''}
                  onValueChange={(value) => setSelectedSession(value)}
                  placeholder="Choose session"
                  _selectedItem={{
                    bg: 'blue.100',
                    endIcon: <CheckIcon size="4" />,
                  }}
                >
                  {academicSessions.map((session) => (
                    <Select.Item
                      key={session.id}
                      label={`${session.name} ${session.isCurrent ? '(Current)' : ''}`}
                      value={session.id.toString()}
                    />
                  ))}
                </Select>
              </Box>
            </HStack>

            {selectedCourse && (
              <HStack space={2} alignItems="center">
                <MaterialIcons name="info" size="sm" color="blue.500" />
                <Text fontSize="sm" color="blue.600">
                  Showing students enrolled in selected course. Use the menu to remove students from this course.
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>

        {/* Student List */}
        {loading ? (
          <Center flex={1}>
            <Spinner size="lg" color="blue.500" />
            <Text mt={4} color="coolGray.600">Loading students...</Text>
          </Center>
        ) : (
          <StudentList
            students={students}
            loading={loading}
            refreshing={refreshing}
            error={error}
            onRefresh={handleRefresh}
            onEdit={handleEdit}
            onStudentSelect={handleStudentSelect}
            onStudentDelete={handleStudentDelete}
            selectedCourse={selectedCourse}
            onRemoveFromCourse={handleRemoveFromCourse}
          />
        )}
      </VStack>
    </Box>
  );
};

export default StudentManagementWithCourseSelection;
