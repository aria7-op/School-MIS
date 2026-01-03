import React, { useState, useEffect, useMemo } from 'react';
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
  Checkbox,
  Switch,
  useToast,
  Modal,
  FormControl,
  Spinner,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions, useWindowDimensions } from 'react-native';
import classService from '../services/classService';

const { width: screenWidth } = Dimensions.get('window');

interface ClassListTabProps {
  classes: any[];
  selectedClasses: any[];
  onClassesSelect: (classes: any[]) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClassEdit: (classItem: any) => void;
  onClassDelete: (classId: number) => void;
  loading: boolean;
  selectedClass: any;
  onClassSelect: (classItem: any) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const ClassListTab: React.FC<ClassListTabProps> = ({
  classes,
  selectedClasses,
  onClassesSelect,
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSortChange,
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange,
  onClassEdit,
  onClassDelete,
  loading,
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
  const [selectAll, setSelectAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Assign Teacher Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignClass, setSelectedAssignClass] = useState<number | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // State for teachers and subjects
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  // Add state for assignments
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Hooks
  const toast = useToast();
  const window = useWindowDimensions();
  const isLargeScreen = window.width >= 900; // adjust as needed for your breakpoints
  const isTablet = window.width >= 600 && window.width < 900;

  // Handle select all
  useEffect(() => {
    if (selectedClasses.length === classes.length && classes.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedClasses, classes]);

  const handleSelectAll = () => {
    if (selectAll) {
      onClassesSelect([]);
    } else {
      onClassesSelect(classes);
    }
  };

  const handleClassSelect = (classItem: any, isSelected: boolean) => {
    if (isSelected) {
      onClassesSelect([...selectedClasses, classItem]);
    } else {
      onClassesSelect(selectedClasses.filter(c => c.id !== classItem.id));
    }
  };

  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
    setSelectedAssignClass(null);
    setSelectedTeacher(null);
    setSelectedSubject(null);
    setAssignError(null);
  };

  const handleAssignTeacher = async () => {
    if (!selectedAssignClass || !selectedTeacher || !selectedSubject) {
      setAssignError('Please select a class, teacher, and subject.');
      return;
    }
    setAssignLoading(true);
    setAssignError(null);
    try {
      await classService.assignTeacherToClassSubject({
        teacherId: selectedTeacher,
        classId: selectedAssignClass,
        subjectId: selectedSubject,
      });
      setShowAssignModal(false);
    } catch (err: any) {
      setAssignError(err?.message || 'Failed to assign teacher.');
    } finally {
      setAssignLoading(false);
    }
  };

  // Fetch teachers and subjects when modal opens
  useEffect(() => {
    if (showAssignModal) {
      setTeachersLoading(true);
      setTeachersError(null);
      classService.getAllTeachers()
        .then(data => {

          setTeachers(Array.isArray(data) ? data : []);
        })
        .catch(err => setTeachersError(err.message || 'Failed to load teachers'))
        .finally(() => setTeachersLoading(false));
      setSubjectsLoading(true);
      setSubjectsError(null);
      classService.getAllSubjects()
        .then(data => setSubjects(Array.isArray(data) ? data : []))
        .catch(err => setSubjectsError(err.message || 'Failed to load subjects'))
        .finally(() => setSubjectsLoading(false));
    }
  }, [showAssignModal]);

  // Fetch assignments when classes change
  useEffect(() => {
    setAssignmentsLoading(true);
    classService.getAllAssignments()
      .then(data => setAssignments(data))
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false));
  }, [classes]);

  // Helper to get assigned teachers for a class
  const getAssignedTeachers = (classId: number) => {
    return assignments
      .filter(a => a.classId === classId && a.teacher && a.teacher.user)
      .map(a => `${a.teacher.user.firstName} ${a.teacher.user.lastName}`)
      .join(', ');
  };

  // Render functions
  const renderHeader = () => (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Heading size="md" color={textColor}>
            All Classes
          </Heading>
          <Text color={mutedColor} fontSize="sm">
            {classes.length} classes • {selectedClasses.length} selected
          </Text>
        </VStack>
        <HStack space={2}>
          <Button
            size="sm"
            variant="outline"
            colorScheme="blue"
            onPress={() => setShowFilters(!showFilters)}
            leftIcon={<Icon as={MaterialIcons} name="filter-list" size="sm" />}
          >
            Filters
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'solid' : 'outline'}
            colorScheme="blue"
            onPress={() => onViewModeChange('grid')}
          >
            <Icon as={MaterialIcons} name="grid-view" size="sm" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'solid' : 'outline'}
            colorScheme="blue"
            onPress={() => onViewModeChange('list')}
          >
            <Icon as={MaterialIcons} name="list" size="sm" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            colorScheme="green"
            leftIcon={<Icon as={MaterialIcons} name="person-add" size="sm" />}
            onPress={handleOpenAssignModal}
          >
            Assign Teacher
          </Button>
        </HStack>
      </HStack>

      {/* Basic controls */}
      <VStack space={3}>
        <HStack space={3} alignItems="center">
          <Checkbox
            value="selectAll"
            isChecked={selectAll}
            onChange={handleSelectAll}
            colorScheme="blue"
          >
            <Text fontSize="sm" color={textColor}>Select All</Text>
          </Checkbox>
          <Select
            selectedValue={sortBy}
            onValueChange={(value) => onSortChange(value, sortOrder)}
            placeholder="Sort by"
            minW="120"
            bg={cardBg}
            _selectedItem={{
              bg: 'blue.500',
              endIcon: <CheckIcon size="5" />
            }}
          >
            <Select.Item label="Name" value="name" />
            <Select.Item label="Grade" value="grade" />
            <Select.Item label="Students" value="studentsCount" />
            <Select.Item label="Created" value="createdAt" />
          </Select>
          <Button
            size="sm"
            variant="outline"
            colorScheme="blue"
            onPress={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Icon
              as={MaterialIcons}
              name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'}
              size="sm"
            />
          </Button>
        </HStack>
      </VStack>

      {/* Advanced Filters */}
      {showFilters && (
        <Card bg={cardBg} borderRadius="lg" p={4}>
          <VStack space={3}>
            <Text fontWeight="bold" color={textColor}>Advanced Filters</Text>
            
            <HStack space={3} flexWrap="wrap">
              <Select
                selectedValue={filters.grade}
                onValueChange={(value) => onFiltersChange({ ...filters, grade: value })}
                placeholder="Grade"
                minW="120"
                bg={cardBg}
                _selectedItem={{
                  bg: 'blue.500',
                  endIcon: <CheckIcon size="5" />
                }}
              >
                <Select.Item label="All Grades" value="" />
                <Select.Item label="Grade 1" value="1" />
                <Select.Item label="Grade 2" value="2" />
                <Select.Item label="Grade 3" value="3" />
                <Select.Item label="Grade 4" value="4" />
                <Select.Item label="Grade 5" value="5" />
              </Select>

              <Select
                selectedValue={filters.status}
                onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
                placeholder="Status"
                minW="120"
                bg={cardBg}
                _selectedItem={{
                  bg: 'blue.500',
                  endIcon: <CheckIcon size="5" />
                }}
              >
                <Select.Item label="All Status" value="" />
                <Select.Item label="Active" value="active" />
                <Select.Item label="Inactive" value="inactive" />
                <Select.Item label="Archived" value="archived" />
              </Select>

              <Select
                selectedValue={filters.teacher}
                onValueChange={(value) => onFiltersChange({ ...filters, teacher: value })}
                placeholder="Teacher"
                minW="150"
                bg={cardBg}
                _selectedItem={{
                  bg: 'blue.500',
                  endIcon: <CheckIcon size="5" />
                }}
              >
                <Select.Item label="All Teachers" value="" />
                <Select.Item label="Mr. Smith" value="smith" />
                <Select.Item label="Ms. Johnson" value="johnson" />
                <Select.Item label="Dr. Brown" value="brown" />
              </Select>
            </HStack>

            <HStack justifyContent="flex-end" space={2}>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onPress={() => onFiltersChange({})}
              >
                Clear Filters
              </Button>
              <Button
                size="sm"
                colorScheme="blue"
                onPress={() => setShowFilters(false)}
              >
                Apply
              </Button>
            </HStack>
          </VStack>
        </Card>
      )}
    </VStack>
  );

  const renderClassCard = (classItem: any) => {
    const isSelected = selectedClasses.some(c => c.id === classItem.id);
    const isCurrentlySelected = selectedClass?.id === classItem.id;

    return (
      <Pressable
        key={classItem.id}
        onPress={() => onClassSelect(classItem)}
        onLongPress={() => handleClassSelect(classItem, !isSelected)}
      >
        <Card
          bg={isCurrentlySelected ? useColorModeValue('blue.50', 'blue.900') : cardBg}
          borderRadius="xl"
          borderWidth={isSelected ? 2 : 1}
          borderColor={isSelected ? 'blue.500' : isCurrentlySelected ? 'blue.300' : borderColor}
          shadow={isCurrentlySelected ? 3 : 1}
        >
          <VStack space={3} p={4}>
            <HStack justifyContent="space-between" alignItems="flex-start">
              <HStack space={3} alignItems="center" flex={1}>
                <Avatar
                  size="md"
                  bg="blue.500"
                  source={{ uri: classItem.avatar }}
                >
                  {classItem.name?.charAt(0) || 'C'}
                </Avatar>
                <VStack flex={1}>
                  <Text fontWeight="bold" fontSize="md" color={textColor}>
                    {classItem.name}
                  </Text>
                  <Text fontSize="sm" color={mutedColor}>
                    {classItem.grade} • {classItem.section || 'No section'}
                  </Text>
                  <Text fontSize="xs" color={mutedColor}>
                    {classItem.studentsCount || 0} students
                  </Text>
                </VStack>
              </HStack>
              <VStack alignItems="flex-end" space={1}>
                <Badge
                  colorScheme={
                    classItem.status === 'active' ? 'green' :
                    classItem.status === 'inactive' ? 'orange' : 'red'
                  }
                  variant="solid"
                  borderRadius="full"
                >
                  {classItem.status || 'active'}
                </Badge>
                {isSelected && (
                  <Icon as={MaterialIcons} name="check-circle" color="blue.500" size="sm" />
                )}
              </VStack>
            </HStack>

            <Divider />

            <VStack space={2}>
              <HStack justifyContent="space-between">
                <Text fontSize="sm" color={mutedColor}>Teacher</Text>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  {assignmentsLoading ? 'Loading...' : getAssignedTeachers(classItem.id) || 'Not assigned'}
                </Text>
              </HStack>
              
              <HStack justifyContent="space-between">
                <Text fontSize="sm" color={mutedColor}>Attendance</Text>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  {classItem.attendance || 0}%
                </Text>
              </HStack>
              <Progress
                value={classItem.attendance || 0}
                size="sm"
                colorScheme={
                  (classItem.attendance || 0) >= 90 ? 'green' :
                  (classItem.attendance || 0) >= 80 ? 'orange' : 'red'
                }
              />
            </VStack>

            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={1}>
                {classItem.subjects?.slice(0, 2).map((subject: string, index: number) => (
                  <Badge key={index} size="sm" colorScheme="gray" variant="outline">
                    {subject}
                  </Badge>
                )) || []}
                {(classItem.subjects?.length || 0) > 2 && (
                  <Badge size="sm" colorScheme="gray" variant="outline">
                    +{(classItem.subjects?.length || 0) - 2}
                  </Badge>
                )}
              </HStack>
              <HStack space={1}>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                  onPress={() => onClassEdit(classItem)}
                >
                  <Icon as={MaterialIcons} name="edit" size="sm" />
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onPress={() => onClassDelete(classItem.id)}
                >
                  <Icon as={MaterialIcons} name="delete" size="sm" />
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </Card>
      </Pressable>
    );
  };

  const renderClassList = () => {
    if (loading) {
      return (
        <VStack space={3}>
          {[1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} h="180" borderRadius="xl" />
          ))}
        </VStack>
      );
    }

    if (classes.length === 0) {
      return (
        <Center py={8}>
          <VStack space={4} alignItems="center">
            <Icon as={MaterialIcons} name="school" size="xl" color={mutedColor} />
            <Text color={mutedColor} textAlign="center">
              {searchQuery ? 'No classes found matching your search' : 'No classes created yet'}
            </Text>
            <Button
              colorScheme="blue"
              leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
            >
              Create First Class
            </Button>
          </VStack>
        </Center>
      );
    }

    if (viewMode === 'grid') {
      const columns = isLargeScreen ? 4 : isTablet ? 2 : 1;
      return (
        <SimpleGrid columns={columns} space={3}>
          {classes.map(renderClassCard)}
        </SimpleGrid>
      );
    }

    return (
      <VStack space={3}>
        {classes.map(renderClassCard)}
      </VStack>
    );
  };

  const renderBulkActions = () => {
    if (selectedClasses.length === 0) return null;

    return (
      <Card bg={useColorModeValue('orange.50', 'orange.900')} borderRadius="lg" p={3}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="sm" color={textColor}>
            {selectedClasses.length} classes selected
          </Text>
          <HStack space={2}>
            <Button size="xs" colorScheme="blue" variant="outline">
              Export
            </Button>
            <Button size="xs" colorScheme="green" variant="outline">
              Assign Teacher
            </Button>
            <Button size="xs" colorScheme="red" variant="outline">
              Delete
            </Button>
          </HStack>
        </HStack>
      </Card>
    );
  };

  return (
    <>
      <ScrollView flex={1} bg={bgColor} showsVerticalScrollIndicator={false}>
        <VStack space={6} p={4} pb={8}>
          {renderHeader()}
          {renderBulkActions()}
          {renderClassList()}
        </VStack>
      </ScrollView>
      {/* Assign Teacher Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} size="lg">
        <Modal.Content>
          <Modal.CloseButton isDisabled={assignLoading || teachersLoading || subjectsLoading} />
          <Modal.Header>Assign Teacher to Class</Modal.Header>
          <Modal.Body>
            {teachersLoading || subjectsLoading ? (
              <Center py={8}><Spinner size="lg" /></Center>
            ) : teachersError || subjectsError ? (
              <Text color="red.500">{teachersError || subjectsError}</Text>
            ) : (
            <VStack space={4}>
              <FormControl isRequired>
                <FormControl.Label>Class</FormControl.Label>
                <Select
                  selectedValue={selectedAssignClass?.toString() || ''}
                  onValueChange={val => setSelectedAssignClass(Number(val))}
                  placeholder="Select Class"
                  _selectedItem={{ bg: 'blue.500', endIcon: <CheckIcon size="5" /> }}
                  isDisabled={assignLoading}
                >
                  {classes.map(cls => (
                    <Select.Item key={cls.id} label={cls.name} value={cls.id.toString()} />
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired mb={3}>
                <FormControl.Label>Teacher</FormControl.Label>
                {}
                {teachersLoading ? (
                  <Spinner />
                ) : teachersError ? (
                  <Text color="red.500">{teachersError}</Text>
                ) : (
                  <Select
                    selectedValue={selectedTeacher !== null ? String(selectedTeacher) : ''}
                    minWidth="200"
                    placeholder="Select teacher"
                    onValueChange={val => setSelectedTeacher(val ? Number(val) : null)}
                    _selectedItem={{ bg: 'teal.600', endIcon: <CheckIcon size="5" /> }}
                  >
                    {Array.isArray(teachers) && teachers.map(teacher => (
                      <Select.Item
                        key={teacher.id}
                        label={
                          teacher.user && teacher.user.firstName && teacher.user.lastName
                            ? `${teacher.user.firstName} ${teacher.user.lastName}`
                            : teacher.name || 'Unknown'
                        }
                        value={String(teacher.id)}
                      />
                    ))}
                  </Select>
                )}
              </FormControl>
              <FormControl isRequired>
                <FormControl.Label>Subject</FormControl.Label>
                <Select
                  selectedValue={selectedSubject?.toString() || ''}
                  onValueChange={val => setSelectedSubject(Number(val))}
                  placeholder="Select Subject"
                  _selectedItem={{ bg: 'blue.500', endIcon: <CheckIcon size="5" /> }}
                  isDisabled={assignLoading}
                >
                  {subjects.map(subject => (
                    <Select.Item
                      key={subject.id}
                      label={subject.code ? `${subject.name} (${subject.code})` : subject.name}
                      value={subject.id.toString()}
                    />
                  ))}
                </Select>
              </FormControl>
              {assignError && <Text color="red.500">{assignError}</Text>}
            </VStack>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowAssignModal(false)} isDisabled={assignLoading || teachersLoading || subjectsLoading}>
                Cancel
              </Button>
              <Button colorScheme="green" onPress={handleAssignTeacher} isLoading={assignLoading} isDisabled={teachersLoading || subjectsLoading}>
                Assign
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  );
};

export default ClassListTab; 
