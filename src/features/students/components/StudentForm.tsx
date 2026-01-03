import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Text,
  Input,
  Button,
  FormControl,
  Select,
  CheckIcon,
  useToast,
  Modal,
  Icon,
  useColorModeValue,
  Divider,
  Badge,
  Avatar,
  Box,
  ScrollView,
  Switch,
  TextArea,
  Radio,
  Checkbox,
  Progress,
  Alert,
  IconButton,
  CloseIcon,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useStudentApi, Student, Customer } from '../hooks/useStudentApi';

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentData: any) => void;
  student?: Student | null;
  customer?: Customer | null;
  mode: 'create' | 'edit' | 'convert';
}

const StudentForm: React.FC<StudentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  student,
  customer,
  mode,
}) => {
  const toast = useToast();
  const { createStudent, updateStudent, convertCustomerToStudent } = useStudentApi();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // Form state
  const [formData, setFormData] = useState({
    admissionNo: '',
    rollNo: '',
    user: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
    },
    grade: '',
    section: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    emergencyContact: '',
    medicalConditions: '',
    allergies: '',
    previousSchool: '',
    admissionDate: '',
    status: 'active',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data based on mode
  useEffect(() => {
    if (mode === 'convert' && customer) {
      // Pre-fill form with customer data for conversion
      setFormData({
        admissionNo: `STU-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        rollNo: '',
        user: {
          firstName: customer.name.split(' ')[0] || '',
          lastName: customer.name.split(' ').slice(1).join(' ') || '',
          email: customer.email,
          phone: customer.phone || '',
          password: '',
        },
        grade: '',
        section: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        bloodGroup: '',
        emergencyContact: '',
        medicalConditions: '',
        allergies: '',
        previousSchool: '',
        admissionDate: new Date().toISOString().split('T')[0],
        status: 'active',
      });
    } else if (mode === 'edit' && student) {
      // Pre-fill form with existing student data
      setFormData({
        admissionNo: student.admissionNo || '',
        rollNo: student.rollNo || '',
        user: {
          firstName: student.user?.firstName || '',
          lastName: student.user?.lastName || '',
          email: student.user?.email || '',
          phone: student.user?.phone || '',
          password: '',
        },
        grade: (student as any).grade || '',
        section: (student as any).section || '',
        parentName: (student as any).parentName || '',
        parentPhone: (student as any).parentPhone || '',
        parentEmail: (student as any).parentEmail || '',
        address: (student as any).address || '',
        dateOfBirth: (student as any).dateOfBirth || '',
        gender: (student as any).gender || '',
        bloodGroup: (student as any).bloodGroup || '',
        emergencyContact: (student as any).emergencyContact || '',
        medicalConditions: (student as any).medicalConditions || '',
        allergies: (student as any).allergies || '',
        previousSchool: (student as any).previousSchool || '',
        admissionDate: (student as any).admissionDate || '',
        status: (student as any).status || 'active',
      });
    } else {
      // Reset form for new student
      setFormData({
        admissionNo: `STU-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        rollNo: '',
        user: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
        },
        grade: '',
        section: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        bloodGroup: '',
        emergencyContact: '',
        medicalConditions: '',
        allergies: '',
        previousSchool: '',
        admissionDate: new Date().toISOString().split('T')[0],
        status: 'active',
      });
    }
  }, [mode, student, customer]);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.user.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.user.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.user.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.user.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.admissionNo.trim()) {
      newErrors.admissionNo = 'Admission number is required';
    }

    if (mode === 'create' && !formData.user.password.trim()) {
      newErrors.password = 'Password is required for new students';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.show({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        status: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      let result;

      if (mode === 'convert' && customer) {
        // Convert customer to student
        result = await convertCustomerToStudent(customer.id, {
          conversionReason: 'Enrolled in course',
          admissionNo: formData.admissionNo,
          user: {
            firstName: formData.user.firstName,
            lastName: formData.user.lastName,
            email: formData.user.email,
            phone: formData.user.phone,
          },
        });
      } else if (mode === 'edit' && student) {
        // Update existing student
        result = await updateStudent(student.id, formData);
      } else {
        // Create new student
        result = await createStudent(formData);
      }

      toast.show({
        title: 'Success',
        description: mode === 'convert' 
          ? 'Customer converted to student successfully' 
          : mode === 'edit' 
          ? 'Student updated successfully' 
          : 'Student created successfully',
        status: 'success',
      });

      onSubmit(result);
      onClose();

    } catch (error: any) {
      toast.show({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save student',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Render customer conversion info
  const renderCustomerInfo = () => {
    if (mode === 'convert' && customer) {
      return (
        <Alert status="info" mb={4}>
          <HStack space={2} alignItems="center">
            <Icon as={MaterialIcons} name="info" size="sm" color="blue.500" />
            <VStack flex={1}>
              <Text fontSize="sm" fontWeight="bold" color="blue.800">
                Converting Visitor to Student
              </Text>
              <Text fontSize="xs" color="blue.700">
                Visitor: {customer.name} ({customer.email})
              </Text>
            </VStack>
          </HStack>
        </Alert>
      );
    }
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <Modal.Content>
        <Modal.Header>
          <HStack space={2} alignItems="center">
            <Icon 
              as={MaterialIcons} 
              name={mode === 'convert' ? 'person-add' : mode === 'edit' ? 'edit' : 'add'} 
              size="sm" 
              color="blue.500" 
            />
            <Text fontSize="lg" fontWeight="bold">
              {mode === 'convert' ? 'Convert Visitor to Student' : mode === 'edit' ? 'Edit Student' : 'Add New Student'}
            </Text>
          </HStack>
        </Modal.Header>

        <Modal.Body>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space={4}>
              {renderCustomerInfo()}

              {/* Basic Information */}
              <VStack space={3}>
                <Text fontSize="md" fontWeight="bold" color={textColor}>
                  Basic Information
                </Text>

                <HStack space={3}>
                  <FormControl flex={1} isInvalid={!!errors.firstName}>
                    <FormControl.Label>First Name *</FormControl.Label>
                    <Input
                      value={formData.user.firstName}
                      onChangeText={(text) => setFormData(prev => ({
                        ...prev,
                        user: { ...prev.user, firstName: text }
                      }))}
                      placeholder="Enter first name"
                    />
                    <FormControl.ErrorMessage>{errors.firstName}</FormControl.ErrorMessage>
                  </FormControl>

                  <FormControl flex={1} isInvalid={!!errors.lastName}>
                    <FormControl.Label>Last Name *</FormControl.Label>
                    <Input
                      value={formData.user.lastName}
                      onChangeText={(text) => setFormData(prev => ({
                        ...prev,
                        user: { ...prev.user, lastName: text }
                      }))}
                      placeholder="Enter last name"
                    />
                    <FormControl.ErrorMessage>{errors.lastName}</FormControl.ErrorMessage>
                  </FormControl>
                </HStack>

                <HStack space={3}>
                  <FormControl flex={1} isInvalid={!!errors.admissionNo}>
                    <FormControl.Label>Admission Number *</FormControl.Label>
                    <Input
                      value={formData.admissionNo}
                      onChangeText={(text) => setFormData(prev => ({
                        ...prev,
                        admissionNo: text
                      }))}
                      placeholder="Enter admission number"
                    />
                    <FormControl.ErrorMessage>{errors.admissionNo}</FormControl.ErrorMessage>
                  </FormControl>

                  <FormControl flex={1}>
                    <FormControl.Label>Roll Number</FormControl.Label>
                    <Input
                      value={formData.rollNo}
                      onChangeText={(text) => setFormData(prev => ({
                        ...prev,
                        rollNo: text
                      }))}
                      placeholder="Enter roll number"
                    />
                  </FormControl>
                </HStack>

                <HStack space={3}>
                  <FormControl flex={1} isInvalid={!!errors.email}>
                    <FormControl.Label>Email *</FormControl.Label>
                    <Input
                      value={formData.user.email}
                      onChangeText={(text) => setFormData(prev => ({
                        ...prev,
                        user: { ...prev.user, email: text }
                      }))}
                      placeholder="Enter email address"
                      keyboardType="email-address"
                    />
                    <FormControl.ErrorMessage>{errors.email}</FormControl.ErrorMessage>
                  </FormControl>

                  <FormControl flex={1}>
                    <FormControl.Label>Phone</FormControl.Label>
                    <Input
                      value={formData.user.phone}
                      onChangeText={(text) => setFormData(prev => ({
                        ...prev,
                        user: { ...prev.user, phone: text }
                      }))}
                      placeholder="Enter phone number"
                      keyboardType="phone-pad"
                    />
                  </FormControl>
                </HStack>

                {mode === 'create' && (
                  <FormControl isInvalid={!!errors.password}>
                    <FormControl.Label>Password *</FormControl.Label>
                    <Input
                      value={formData.user.password}
                      onChangeText={(text) => setFormData(prev => ({
                        ...prev,
                        user: { ...prev.user, password: text }
                      }))}
                      placeholder="Enter password"
                      type="password"
                    />
                    <FormControl.ErrorMessage>{errors.password}</FormControl.ErrorMessage>
                  </FormControl>
                )}
              </VStack>

              <Divider />

              {/* Academic Information */}
              <VStack space={3}>
                <Text fontSize="md" fontWeight="bold" color={textColor}>
                  Academic Information
                </Text>

                <HStack space={3}>
                  <FormControl flex={1}>
                    <FormControl.Label>Grade</FormControl.Label>
                    <Select
                      selectedValue={formData.grade}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        grade: value
                      }))}
                      placeholder="Select grade"
                    >
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
                    <FormControl.Label>Section</FormControl.Label>
                    <Select
                      selectedValue={formData.section}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        section: value
                      }))}
                      placeholder="Select section"
                    >
                      <Select.Item label="Section A" value="A" />
                      <Select.Item label="Section B" value="B" />
                      <Select.Item label="Section C" value="C" />
                      <Select.Item label="Section D" value="D" />
                    </Select>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormControl.Label>Previous School</FormControl.Label>
                  <Input
                    value={formData.previousSchool}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      previousSchool: text
                    }))}
                    placeholder="Enter previous school name"
                  />
                </FormControl>

                <FormControl>
                  <FormControl.Label>Admission Date</FormControl.Label>
                  <Input
                    value={formData.admissionDate}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      admissionDate: text
                    }))}
                    placeholder="YYYY-MM-DD"
                  />
                </FormControl>
              </VStack>

              <Divider />

              {/* Personal Information */}
              <VStack space={3}>
                <Text fontSize="md" fontWeight="bold" color={textColor}>
                  Personal Information
                </Text>

                <HStack space={3}>
                  <FormControl flex={1}>
                    <FormControl.Label>Date of Birth</FormControl.Label>
                    <Input
                      value={formData.dateOfBirth}
                      onChangeText={(text) => setFormData(prev => ({
                        ...prev,
                        dateOfBirth: text
                      }))}
                      placeholder="YYYY-MM-DD"
                    />
                  </FormControl>

                  <FormControl flex={1}>
                    <FormControl.Label>Gender</FormControl.Label>
                    <Select
                      selectedValue={formData.gender}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        gender: value
                      }))}
                      placeholder="Select gender"
                    >
                      <Select.Item label="Male" value="male" />
                      <Select.Item label="Female" value="female" />
                      <Select.Item label="Other" value="other" />
                    </Select>
                  </FormControl>
                </HStack>

                <HStack space={3}>
                  <FormControl flex={1}>
                    <FormControl.Label>Blood Group</FormControl.Label>
                    <Select
                      selectedValue={formData.bloodGroup}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        bloodGroup: value
                      }))}
                      placeholder="Select blood group"
                    >
                      <Select.Item label="A+" value="A+" />
                      <Select.Item label="A-" value="A-" />
                      <Select.Item label="B+" value="B+" />
                      <Select.Item label="B-" value="B-" />
                      <Select.Item label="AB+" value="AB+" />
                      <Select.Item label="AB-" value="AB-" />
                      <Select.Item label="O+" value="O+" />
                      <Select.Item label="O-" value="O-" />
                    </Select>
                  </FormControl>

                  <FormControl flex={1}>
                    <FormControl.Label>Status</FormControl.Label>
                    <Select
                      selectedValue={formData.status}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        status: value
                      }))}
                    >
                      <Select.Item label="Active" value="active" />
                      <Select.Item label="Inactive" value="inactive" />
                      <Select.Item label="Suspended" value="suspended" />
                    </Select>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormControl.Label>Address</FormControl.Label>
                  <TextArea
                    value={formData.address}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      address: text
                    }))}
                    placeholder="Enter address"
                    autoCompleteType="off"
                  />
                </FormControl>
              </VStack>

              <Divider />

              {/* Parent/Guardian Information */}
              <VStack space={3}>
                <Text fontSize="md" fontWeight="bold" color={textColor}>
                  Parent/Guardian Information
                </Text>

                <FormControl>
                  <FormControl.Label>Parent Name</FormControl.Label>
                  <Input
                    value={formData.parentName}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      parentName: text
                    }))}
                    placeholder="Enter parent/guardian name"
                  />
                </FormControl>

                <HStack space={3}>
                  <FormControl flex={1}>
                    <FormControl.Label>Parent Phone</FormControl.Label>
                    <Input
                      value={formData.parentPhone}
                      onChangeText={(text) => setFormData(prev => ({
                        ...prev,
                        parentPhone: text
                      }))}
                      placeholder="Enter parent phone"
                      keyboardType="phone-pad"
                    />
                  </FormControl>

                  <FormControl flex={1}>
                    <FormControl.Label>Parent Email</FormControl.Label>
                    <Input
                      value={formData.parentEmail}
                      onChangeText={(text) => setFormData(prev => ({
                        ...prev,
                        parentEmail: text
                      }))}
                      placeholder="Enter parent email"
                      keyboardType="email-address"
                    />
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormControl.Label>Emergency Contact</FormControl.Label>
                  <Input
                    value={formData.emergencyContact}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      emergencyContact: text
                    }))}
                    placeholder="Enter emergency contact"
                  />
                </FormControl>
              </VStack>

              <Divider />

              {/* Medical Information */}
              <VStack space={3}>
                <Text fontSize="md" fontWeight="bold" color={textColor}>
                  Medical Information
                </Text>

                <FormControl>
                  <FormControl.Label>Medical Conditions</FormControl.Label>
                  <TextArea
                    value={formData.medicalConditions}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      medicalConditions: text
                    }))}
                    placeholder="Enter any medical conditions"
                    autoCompleteType="off"
                  />
                </FormControl>

                <FormControl>
                  <FormControl.Label>Allergies</FormControl.Label>
                  <TextArea
                    value={formData.allergies}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      allergies: text
                    }))}
                    placeholder="Enter any allergies"
                    autoCompleteType="off"
                  />
                </FormControl>
              </VStack>
            </VStack>
          </ScrollView>
        </Modal.Body>

        <Modal.Footer>
          <Button.Group space={2}>
            <Button variant="ghost" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              onPress={handleSubmit} 
              isLoading={loading}
              leftIcon={<Icon as={MaterialIcons} name="save" size="sm" />}
            >
              {mode === 'convert' ? 'Convert' : mode === 'edit' ? 'Update' : 'Create'}
            </Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
};

export default StudentForm; 