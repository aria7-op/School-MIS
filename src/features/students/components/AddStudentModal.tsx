import React, { useState, useEffect } from 'react';
import { ScrollView, Platform } from 'react-native';
import {
  Modal,
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  FormControl,
  Select,
  CheckIcon,
  TextArea,
  Divider,
  Heading,
  Icon,
  Avatar,
  Pressable,
  useToast,
  Badge,
  Progress,
  IconButton,
  useColorModeValue,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: any) => Promise<void>;
  loading?: boolean;
  classes?: any[];
  sections?: any[];
  parents?: any[];
}

interface StudentFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  gender: string;
  birthDate: Date | null;
  avatar: string;
  bio: string;
  displayName: string;
  rollNo: string;
  classId: string;
  sectionId: string;
  parentId: string;
  admissionDate: Date | null;
  bloodGroup: string;
  nationality: string;
  religion: string;
  caste: string;
  aadharNo: string;
  bankAccountNo: string;
  bankName: string;
  ifscCode: string;
  previousSchool: string;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  loading = false,
  classes = [],
  sections = [],
  parents = [],
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.750');

  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showAdmissionDatePicker, setShowAdmissionDatePicker] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: '',
    birthDate: null,
    avatar: '',
    bio: '',
    displayName: '',
    rollNo: '',
    classId: '',
    sectionId: '',
    parentId: '',
    admissionDate: null,
    bloodGroup: '',
    nationality: 'USA',
    religion: '',
    caste: '',
    aadharNo: '',
    bankAccountNo: '',
    bankName: '',
    ifscCode: '',
    previousSchool: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (formData.firstName && formData.lastName) {
      const username = `${formData.firstName.toLowerCase()}${formData.lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
      setFormData(prev => ({ ...prev, username }));
    }
  }, [formData.firstName, formData.lastName]);

  useEffect(() => {
    if (formData.firstName && formData.lastName) {
      const displayName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`;
      setFormData(prev => ({ ...prev, displayName }));
    }
  }, [formData.firstName, formData.middleName, formData.lastName]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.username.trim()) newErrors.username = 'Username is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.password.trim()) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        break;

      case 2:
        if (!formData.classId) newErrors.classId = 'Class is required';
        break;

      case 3:
        if (formData.aadharNo && !/^\d{12}$/.test(formData.aadharNo.replace(/\s/g, ''))) {
          newErrors.aadharNo = 'Aadhar number must be 12 digits';
        }
        if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
          newErrors.ifscCode = 'Invalid IFSC code format';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.show({
        description: 'Please fix the errors before proceeding',
      });
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    try {
      const studentData = {
        user: {
          firstName: formData.firstName.trim(),
          middleName: formData.middleName.trim() || undefined,
          lastName: formData.lastName.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          gender: formData.gender || undefined,
          birthDate: formData.birthDate ? formData.birthDate.toISOString() : undefined,
          avatar: formData.avatar || undefined,
          bio: formData.bio.trim() || undefined,
          displayName: formData.displayName.trim(),
          role: 'STUDENT',
        },
        
        rollNo: formData.rollNo.trim() || undefined,
        classId: formData.classId ? parseInt(formData.classId) : undefined,
        sectionId: formData.sectionId ? parseInt(formData.sectionId) : undefined,
        parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
        admissionDate: formData.admissionDate ? formData.admissionDate.toISOString() : undefined,
        bloodGroup: formData.bloodGroup || undefined,
        nationality: formData.nationality.trim() || undefined,
        religion: formData.religion.trim() || undefined,
        caste: formData.caste.trim() || undefined,
        aadharNo: formData.aadharNo.trim() || undefined,
        bankAccountNo: formData.bankAccountNo.trim() || undefined,
        bankName: formData.bankName.trim() || undefined,
        ifscCode: formData.ifscCode.trim() || undefined,
        previousSchool: formData.previousSchool.trim() || undefined,
      };

      await onSave(studentData);
      
      resetForm();
      onClose();
      
      toast.show({
        description: 'Student created successfully!',
      });
    } catch (error) {
      toast.show({
        description: 'Failed to create student. Please try again.',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      gender: '',
      birthDate: null,
      avatar: '',
      bio: '',
      displayName: '',
      rollNo: '',
      classId: '',
      sectionId: '',
      parentId: '',
      admissionDate: null,
      bloodGroup: '',
      nationality: 'USA',
      religion: '',
      caste: '',
      aadharNo: '',
      bankAccountNo: '',
      bankName: '',
      ifscCode: '',
      previousSchool: '',
    });
    setCurrentStep(1);
    setErrors({});
  };

  const updateField = (field: keyof StudentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderPersonalInformation = () => (
    <VStack space={4}>
      <Box alignItems="center" mb={4}>
        <Avatar
          size="xl"
          source={formData.avatar ? { uri: formData.avatar } : undefined}
          bg="blue.500"
        >
          {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
        </Avatar>
        
        <Text fontSize="sm" color={mutedColor} mt={2}>
          Student Avatar
        </Text>
      </Box>

      <HStack space={3}>
        <FormControl flex={1} isInvalid={!!errors.firstName}>
          <FormControl.Label>First Name *</FormControl.Label>
          <Input
            value={formData.firstName}
            onChangeText={(value) => updateField('firstName', value)}
            placeholder="Enter first name"
            bg={cardBg}
          />
          {errors.firstName && <FormControl.ErrorMessage>{errors.firstName}</FormControl.ErrorMessage>}
        </FormControl>

        <FormControl flex={1}>
          <FormControl.Label>Middle Name</FormControl.Label>
          <Input
            value={formData.middleName}
            onChangeText={(value) => updateField('middleName', value)}
            placeholder="Enter middle name"
            bg={cardBg}
          />
        </FormControl>
      </HStack>

      <FormControl isInvalid={!!errors.lastName}>
        <FormControl.Label>Last Name *</FormControl.Label>
        <Input
          value={formData.lastName}
          onChangeText={(value) => updateField('lastName', value)}
          placeholder="Enter last name"
          bg={cardBg}
        />
        {errors.lastName && <FormControl.ErrorMessage>{errors.lastName}</FormControl.ErrorMessage>}
      </FormControl>

      <FormControl isInvalid={!!errors.username}>
        <FormControl.Label>Username *</FormControl.Label>
        <Input
          value={formData.username}
          onChangeText={(value) => updateField('username', value)}
          placeholder="Auto-generated from name"
          bg={cardBg}
        />
        {errors.username && <FormControl.ErrorMessage>{errors.username}</FormControl.ErrorMessage>}
      </FormControl>

      <HStack space={3}>
        <FormControl flex={1} isInvalid={!!errors.email}>
          <FormControl.Label>Email *</FormControl.Label>
          <Input
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            placeholder="student@school.com"
            keyboardType="email-address"
            bg={cardBg}
          />
          {errors.email && <FormControl.ErrorMessage>{errors.email}</FormControl.ErrorMessage>}
        </FormControl>

        <FormControl flex={1} isInvalid={!!errors.phone}>
          <FormControl.Label>Phone *</FormControl.Label>
          <Input
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            placeholder="+1234567890"
            keyboardType="phone-pad"
            bg={cardBg}
          />
          {errors.phone && <FormControl.ErrorMessage>{errors.phone}</FormControl.ErrorMessage>}
        </FormControl>
      </HStack>

      <FormControl isInvalid={!!errors.gender}>
        <FormControl.Label>Gender *</FormControl.Label>
        <Select
          selectedValue={formData.gender}
          onValueChange={(value) => updateField('gender', value)}
          placeholder="Select gender"
          bg={cardBg}
          _selectedItem={{
            bg: "blue.500",
            endIcon: <CheckIcon size="5" />
          }}
        >
          <Select.Item label="Male" value="MALE" />
          <Select.Item label="Female" value="FEMALE" />
          <Select.Item label="Other" value="OTHER" />
          <Select.Item label="Prefer not to say" value="PREFER_NOT_TO_SAY" />
        </Select>
        {errors.gender && <FormControl.ErrorMessage>{errors.gender}</FormControl.ErrorMessage>}
      </FormControl>

      <FormControl>
        <FormControl.Label>Birth Date</FormControl.Label>
        <Pressable onPress={() => setShowBirthDatePicker(true)}>
          <Input
            value={formData.birthDate ? formData.birthDate.toDateString() : ''}
            placeholder="Select birth date"
            isReadOnly
            bg={cardBg}
            InputRightElement={
              <Icon as={MaterialIcons} name="calendar-today" size="sm" mr={3} color={mutedColor} />
            }
          />
        </Pressable>
      </FormControl>

      <HStack space={3}>
        <FormControl flex={1} isInvalid={!!errors.password}>
          <FormControl.Label>Password *</FormControl.Label>
          <Input
            type="password"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            placeholder="Enter password"
            bg={cardBg}
          />
          {errors.password && <FormControl.ErrorMessage>{errors.password}</FormControl.ErrorMessage>}
        </FormControl>

        <FormControl flex={1} isInvalid={!!errors.confirmPassword}>
          <FormControl.Label>Confirm Password *</FormControl.Label>
          <Input
            type="password"
            value={formData.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            placeholder="Confirm password"
            bg={cardBg}
          />
          {errors.confirmPassword && <FormControl.ErrorMessage>{errors.confirmPassword}</FormControl.ErrorMessage>}
        </FormControl>
      </HStack>

      <FormControl>
        <FormControl.Label>Bio</FormControl.Label>
        <TextArea
          value={formData.bio}
          onChangeText={(value) => updateField('bio', value)}
          placeholder="Tell us about yourself..."
          bg={cardBg}
          h={20}
        />
      </FormControl>

      {showBirthDatePicker && (
        <DateTimePicker
          value={formData.birthDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowBirthDatePicker(false);
            if (selectedDate) {
              updateField('birthDate', selectedDate);
            }
          }}
        />
      )}
    </VStack>
  );

  const renderAcademicInformation = () => (
    <VStack space={4}>
      <FormControl>
        <FormControl.Label>Roll Number</FormControl.Label>
        <Input
          value={formData.rollNo}
          onChangeText={(value) => updateField('rollNo', value)}
          placeholder="Enter roll number"
          bg={cardBg}
        />
      </FormControl>

      <FormControl isInvalid={!!errors.classId}>
        <FormControl.Label>Class *</FormControl.Label>
        <Select
          selectedValue={formData.classId}
          onValueChange={(value) => updateField('classId', value)}
          placeholder="Select class"
          bg={cardBg}
          _selectedItem={{
            bg: "blue.500",
            endIcon: <CheckIcon size="5" />
          }}
        >
          {classes.map((cls) => (
            <Select.Item key={cls.id} label={cls.name} value={cls.id.toString()} />
          ))}
        </Select>
        {errors.classId && <FormControl.ErrorMessage>{errors.classId}</FormControl.ErrorMessage>}
      </FormControl>

      <FormControl>
        <FormControl.Label>Section</FormControl.Label>
        <Select
          selectedValue={formData.sectionId}
          onValueChange={(value) => updateField('sectionId', value)}
          placeholder="Select section"
          bg={cardBg}
          _selectedItem={{
            bg: "blue.500",
            endIcon: <CheckIcon size="5" />
          }}
        >
          {sections
            .filter(section => !formData.classId || section.classId.toString() === formData.classId)
            .map((section) => (
              <Select.Item key={section.id} label={section.name} value={section.id.toString()} />
            ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormControl.Label>Parent/Guardian</FormControl.Label>
        <Select
          selectedValue={formData.parentId}
          onValueChange={(value) => updateField('parentId', value)}
          placeholder="Select parent/guardian"
          bg={cardBg}
          _selectedItem={{
            bg: "blue.500",
            endIcon: <CheckIcon size="5" />
          }}
        >
          {parents.map((parent) => (
            <Select.Item 
              key={parent.id} 
              label={`${parent.user?.firstName} ${parent.user?.lastName}`} 
              value={parent.id.toString()} 
            />
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormControl.Label>Admission Date</FormControl.Label>
        <Pressable onPress={() => setShowAdmissionDatePicker(true)}>
          <Input
            value={formData.admissionDate ? formData.admissionDate.toDateString() : ''}
            placeholder="Select admission date"
            isReadOnly
            bg={cardBg}
            InputRightElement={
              <Icon as={MaterialIcons} name="calendar-today" size="sm" mr={3} color={mutedColor} />
            }
          />
        </Pressable>
      </FormControl>

      <FormControl>
        <FormControl.Label>Previous School</FormControl.Label>
        <Input
          value={formData.previousSchool}
          onChangeText={(value) => updateField('previousSchool', value)}
          placeholder="Enter previous school name"
          bg={cardBg}
        />
      </FormControl>

      {showAdmissionDatePicker && (
        <DateTimePicker
          value={formData.admissionDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowAdmissionDatePicker(false);
            if (selectedDate) {
              updateField('admissionDate', selectedDate);
            }
          }}
        />
      )}
    </VStack>
  );

  const renderAdditionalInformation = () => (
    <VStack space={4}>
      <HStack space={3}>
        <FormControl flex={1}>
          <FormControl.Label>Blood Group</FormControl.Label>
          <Select
            selectedValue={formData.bloodGroup}
            onValueChange={(value) => updateField('bloodGroup', value)}
            placeholder="Select blood group"
            bg={cardBg}
            _selectedItem={{
              bg: "blue.500",
              endIcon: <CheckIcon size="5" />
            }}
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
          <FormControl.Label>Nationality</FormControl.Label>
          <Input
            value={formData.nationality}
            onChangeText={(value) => updateField('nationality', value)}
            placeholder="Enter nationality"
            bg={cardBg}
          />
        </FormControl>
      </HStack>

      <HStack space={3}>
        <FormControl flex={1}>
          <FormControl.Label>Religion</FormControl.Label>
          <Input
            value={formData.religion}
            onChangeText={(value) => updateField('religion', value)}
            placeholder="Enter religion"
            bg={cardBg}
          />
        </FormControl>

        <FormControl flex={1}>
          <FormControl.Label>Caste</FormControl.Label>
          <Input
            value={formData.caste}
            onChangeText={(value) => updateField('caste', value)}
            placeholder="Enter caste"
            bg={cardBg}
          />
        </FormControl>
      </HStack>

      <FormControl isInvalid={!!errors.aadharNo}>
        <FormControl.Label>Aadhar Number</FormControl.Label>
        <Input
          value={formData.aadharNo}
          onChangeText={(value) => updateField('aadharNo', value)}
          placeholder="Enter 12-digit Aadhar number"
          keyboardType="numeric"
          bg={cardBg}
        />
        {errors.aadharNo && <FormControl.ErrorMessage>{errors.aadharNo}</FormControl.ErrorMessage>}
      </FormControl>

      <Divider my={2} />
      <Heading size="sm" color={textColor}>Banking Details (Optional)</Heading>

      <FormControl>
        <FormControl.Label>Bank Account Number</FormControl.Label>
        <Input
          value={formData.bankAccountNo}
          onChangeText={(value) => updateField('bankAccountNo', value)}
          placeholder="Enter bank account number"
          bg={cardBg}
        />
      </FormControl>

      <HStack space={3}>
        <FormControl flex={1}>
          <FormControl.Label>Bank Name</FormControl.Label>
          <Input
            value={formData.bankName}
            onChangeText={(value) => updateField('bankName', value)}
            placeholder="Enter bank name"
            bg={cardBg}
          />
        </FormControl>

        <FormControl flex={1} isInvalid={!!errors.ifscCode}>
          <FormControl.Label>IFSC Code</FormControl.Label>
          <Input
            value={formData.ifscCode}
            onChangeText={(value) => updateField('ifscCode', value.toUpperCase())}
            placeholder="Enter IFSC code"
            bg={cardBg}
          />
          {errors.ifscCode && <FormControl.ErrorMessage>{errors.ifscCode}</FormControl.ErrorMessage>}
        </FormControl>
      </HStack>
    </VStack>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInformation();
      case 2:
        return renderAcademicInformation();
      case 3:
        return renderAdditionalInformation();
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <Modal.Content maxWidth="500px" maxHeight="90%">
        <Modal.Header>
          <HStack justifyContent="space-between" alignItems="center" flex={1}>
            <VStack>
              <Heading size="lg">Add New Student</Heading>
              <Text fontSize="sm" color={mutedColor}>
                Step {currentStep} of 3
              </Text>
            </VStack>
            <IconButton
              icon={<Icon as={MaterialIcons} name="close" />}
              onPress={onClose}
              variant="ghost"
            />
          </HStack>
        </Modal.Header>

        <Modal.Body>
          <Progress 
            value={(currentStep / 3) * 100} 
            size="sm" 
            colorScheme="blue" 
            mb={6}
          />

          <HStack justifyContent="space-between" mb={6}>
            {[1, 2, 3].map((step) => (
              <HStack key={step} alignItems="center" flex={1}>
                <Box
                  w={8}
                  h={8}
                  borderRadius="full"
                  bg={step <= currentStep ? 'blue.500' : 'gray.300'}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    color={step <= currentStep ? 'white' : 'gray.600'}
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {step}
                  </Text>
                </Box>
                <Text
                  fontSize="xs"
                  color={step <= currentStep ? textColor : mutedColor}
                  ml={2}
                >
                  {step === 1 ? 'Personal' : step === 2 ? 'Academic' : 'Additional'}
                </Text>
              </HStack>
            ))}
          </HStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            {renderStepContent()}
          </ScrollView>
        </Modal.Body>

        <Modal.Footer>
          <HStack space={3} justifyContent="space-between" width="100%">
            <Button
              variant="ghost"
              onPress={currentStep === 1 ? onClose : () => setCurrentStep(currentStep - 1)}
              isDisabled={loading}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            <Button
              onPress={handleSubmit}
              isLoading={loading}
              loadingText={currentStep === 3 ? 'Creating...' : 'Processing...'}
              colorScheme="blue"
              _text={{ fontWeight: 'bold' }}
            >
              {currentStep === 3 ? 'Create Student' : 'Next'}
            </Button>
          </HStack>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
};

export default AddStudentModal; 
