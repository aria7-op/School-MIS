import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Card,
  Badge,
  Button,
  Icon,
  useToast,
  Spinner,
  Divider,
  Checkbox,
  Menu,
  Pressable,
} from 'native-base';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Collapsible from 'react-native-collapsible';
import { Student } from '../../types';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width >= 768;

type StudentListProps = {
  students: Student[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => void;
  onEdit: (student: Student) => void;
  onStudentSelect: (student: Student) => void;
  onStudentDelete: (studentId: number) => void;
};

const StudentList: React.FC<StudentListProps> = ({
  students,
  loading,
  refreshing,
  error,
  onRefresh,
  onEdit,
  onStudentSelect,
  onStudentDelete,
}) => {

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const toast = useToast();

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleStudentSelect = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${selectedStudents.length} students?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedStudents.forEach(id => onStudentDelete(id));
            setSelectedStudents([]);
            toast.show({
              description: `${selectedStudents.length} students deleted successfully`,
              variant: 'solid',
              placement: 'top',
            });
          },
        },
      ]
    );
  };

  const getStudentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'suspended':
        return 'warning';
      case 'graduated':
        return 'info';
      case 'transferred':
        return 'muted';
      default:
        return 'muted';
    }
  };

  const getStudentGenderColor = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return 'blue';
      case 'female':
        return 'pink';
      case 'other':
        return 'purple';
      default:
        return 'muted';
    }
  };

  const renderDetailRow = (icon: string, label: string, value: string) => (
    <HStack space={2} alignItems="center" mb={2}>
      <Icon as={Ionicons} name={icon} size="sm" color="coolGray.500" />
      <Text fontSize="sm" color="coolGray.600" flex={1}>
        {label}:
      </Text>
      <Text fontSize="sm" color="coolGray.800" flex={2}>
        {value || 'N/A'}
      </Text>
    </HStack>
  );

  const renderStudentItem = ({ item }: { item: Student }) => {
    const isSelected = selectedStudents.includes(item.id);
    const menuOpen = menuVisible === item.id;
    
    // Get student name from user object or fallback
    const studentName = item.user?.firstName && item.user?.lastName 
      ? `${item.user.firstName} ${item.user.lastName}`
      : item.admissionNo || 'Unknown Student';
    
    const studentEmail = item.user?.email || 'No email';
    const studentPhone = item.user?.phone || 'No phone';
    const studentGender = item.user?.gender || 'Unknown';

    return (
      <Card mb={3} borderRadius="lg" shadow={2}>
        <Card.Body>
          <VStack space={3}>
            <HStack space={3} alignItems="center" justifyContent="space-between">
              <HStack space={3} alignItems="center" flex={1}>
                <Checkbox
                  value={item.id.toString()}
                  isChecked={isSelected}
                  onChange={() => handleStudentSelect(item.id)}
                  colorScheme="blue"
                />
                <Pressable onPress={() => toggleExpand(item.id)} flex={1}>
                  <HStack space={3} alignItems="center">
                    <Box
                      w={12}
                      h={12}
                      borderRadius="full"
                      bg="blue.500"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text color="white" fontSize="lg" fontWeight="bold">
                        {studentName?.charAt(0)?.toUpperCase() || 'S'}
                      </Text>
                    </Box>
                    <VStack flex={1}>
                      <Text fontSize="md" fontWeight="bold" color="coolGray.800">
                        {studentName}
                      </Text>
                      <Text fontSize="sm" color="coolGray.600">
                        {studentEmail || studentPhone}
                      </Text>
                      <HStack space={2} mt={1}>
                        <Badge
                          colorScheme={getStudentStatusColor(item.user?.status)}
                          variant="subtle"
                          size="sm"
                        >
                          {t(item.user?.status?.toLowerCase() || 'unknown')}
                        </Badge>
                        {studentGender && (
                          <Badge
                            colorScheme={getStudentGenderColor(studentGender)}
                            variant="subtle"
                            size="sm"
                          >
                            {studentGender}
                          </Badge>
                        )}
                        {item.admissionNo && (
                          <Badge
                            colorScheme="purple"
                            variant="subtle"
                            size="sm"
                          >
                            {item.admissionNo}
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>
                </Pressable>
              </HStack>
              
              <Menu
                isOpen={menuOpen}
                onClose={() => setMenuVisible(null)}
                trigger={(triggerProps) => (
                  <Pressable
                    {...triggerProps}
                    onPress={() => setMenuVisible(item.id)}
                    p={2}
                  >
                    <Icon as={MaterialIcons} name="more-vert" size="sm" color="coolGray.500" />
                  </Pressable>
                )}
              >
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    onStudentSelect(item);
                  }}
                  leftIcon={<Icon as={MaterialIcons} name="visibility" size="sm" />}
                >
                  View Details
                </Menu.Item>
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    onEdit(item);
                  }}
                  leftIcon={<Icon as={MaterialIcons} name="edit" size="sm" />}
                >
                  Edit
                </Menu.Item>
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    onStudentDelete(item.id);
                  }}
                  leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" />}
                  _text={{ color: 'red.500' }}
                >
                  Delete
                </Menu.Item>
              </Menu>
            </HStack>

            <Collapsible collapsed={expandedId !== item.id}>
              <VStack space={3} mt={2}>
                <Divider />
                
                <VStack space={2}>
                  {renderDetailRow('person', 'full_name', studentName)}
                  {renderDetailRow('mail', 'email', studentEmail)}
                  {renderDetailRow('call', 'phone', studentPhone)}
                  {renderDetailRow('transgender', 'gender', studentGender)}
                  {renderDetailRow('school', 'admission_no', item.admissionNo || '')}
                  {renderDetailRow('id-card', 'roll_no', item.rollNo || '')}
                  {renderDetailRow('calendar', 'admission_date', item.admissionDate ? new Date(item.admissionDate).toLocaleDateString() : '')}
                  {renderDetailRow('business', 'class', item.class?.name || '')}
                  {renderDetailRow('people', 'section', item.section?.name || '')}
                  {renderDetailRow('home', 'blood_group', item.bloodGroup || '')}
                  {renderDetailRow('flag', 'nationality', item.nationality || '')}
                  {renderDetailRow('church', 'religion', item.religion || '')}
                  {renderDetailRow('card', 'aadhar_no', item.aadharNo || '')}
                  {renderDetailRow('school', 'previous_school', item.previousSchool || '')}
                </VStack>

                {item.user?.address && (
                  <VStack space={2}>
                    <Text fontSize="sm" fontWeight="bold" color="coolGray.700">
                      {t('address')}
                    </Text>
                    <Text fontSize="sm" color="coolGray.600">
                      {item.user.address}
                    </Text>
                  </VStack>
                )}

                <HStack space={2} flexWrap="wrap">
                  {item.bloodGroup && (
                    <Badge colorScheme="red" variant="outline" size="sm">
                      {item.bloodGroup}
                    </Badge>
                  )}
                  {item.nationality && (
                    <Badge colorScheme="blue" variant="outline" size="sm">
                      {item.nationality}
                    </Badge>
                  )}
                  {item.religion && (
                    <Badge colorScheme="purple" variant="outline" size="sm">
                      {item.religion}
                    </Badge>
                  )}
                  {item.class?.name && (
                    <Badge colorScheme="green" variant="outline" size="sm">
                      {item.class.name}
                    </Badge>
                  )}
                  {item.section?.name && (
                    <Badge colorScheme="orange" variant="outline" size="sm">
                      {item.section.name}
                    </Badge>
                  )}
                </HStack>

                <HStack space={4} justifyContent="space-between">
                  <HStack space={2} alignItems="center">
                    <Icon as={Ionicons} name="calendar" size="sm" color="green.500" />
                    <Text fontSize="sm" color="coolGray.700">
                      {item.admissionDate ? new Date(item.admissionDate).toLocaleDateString() : 'N/A'}
                    </Text>
                  </HStack>
                  <HStack space={2} alignItems="center">
                    <Icon as={MaterialIcons} name="school" size="sm" color="blue.500" />
                    <Text fontSize="sm" color="coolGray.700">
                      {item.class?.name || 'N/A'}
                    </Text>
                  </HStack>
                  <HStack space={2} alignItems="center">
                    <Icon as={MaterialIcons} name="people" size="sm" color="yellow.500" />
                    <Text fontSize="sm" color="coolGray.700">
                      {item.section?.name || 'N/A'}
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            </Collapsible>
          </VStack>
        </Card.Body>
      </Card>
    );
  };

  const renderHeader = () => (
    <Box mb={4}>
      <HStack space={3} alignItems="center" justifyContent="space-between">
        <VStack>
          <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
            {t('students')} ({students.length})
          </Text>
          <Text fontSize="sm" color="coolGray.600">
            {t('manage_student_records')}
          </Text>
        </VStack>
        
        {selectedStudents.length > 0 && (
          <Button
            colorScheme="red"
            size="sm"
            leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" />}
            onPress={handleBulkDelete}
          >
            Delete ({selectedStudents.length})
          </Button>
        )}
      </HStack>
    </Box>
  );

  const renderEmptyState = () => (
    <Box flex={1} justifyContent="center" alignItems="center" py={10}>
      <Icon as={Ionicons} name="school-outline" size="4xl" color="coolGray.300" mb={4} />
      <Text fontSize="lg" color="coolGray.500" textAlign="center" mb={2}>
        {t('no_students')}
      </Text>
      <Text fontSize="sm" color="coolGray.400" textAlign="center" mb={4}>
        {loading ? t('loading_students') : t('start_by_adding_first_student')}
      </Text>
      {!loading && (
        <Button
          colorScheme="blue"
          leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
          onPress={() => onEdit({} as Student)}
        >
          {t('add_student')}
        </Button>
      )}
    </Box>
  );

  if (loading && !refreshing && students.length === 0) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} color="coolGray.600">
          {t('loading_students')}
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" p={5}>
        <Icon as={MaterialIcons} name="error" size="4xl" color="red.500" mb={4} />
        <Text fontSize="lg" color="red.600" textAlign="center" mb={4}>
          {t('failed_to_load_students')}
        </Text>
        <Button
          colorScheme="blue"
          onPress={onRefresh}
          leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
        >
          {t('try_again')}
        </Button>
      </Box>
    );
  }

  return (
    <Box flex={1}>
      {renderHeader()}
      
      <FlatList
        data={students}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={students.length === 0 ? { flex: 1 } : undefined}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
      />
    </Box>
  );
};

export default StudentList; 