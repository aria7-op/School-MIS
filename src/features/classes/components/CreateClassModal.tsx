import React, { useState } from 'react';
import {
  Modal,
  Button,
  FormControl,
  Input,
  VStack,
  HStack,
  Text,
  useToast,
  Spinner,
  Alert,
} from 'native-base';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: () => void;
}

interface ClassFormData {
  name: string;
  code: string;
  level: number;
  section: string;
  roomNumber: string;
  capacity: number;
  classTeacherId?: number;
  schoolId: number;
  createdBy: number;
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  onClassCreated,
}) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    code: '',
    level: 1,
    section: '',
    roomNumber: '',
    capacity: 30,
    schoolId: 1, // Default school ID - should be dynamic based on user's school
    createdBy: 1, // Default user ID - should be dynamic based on authenticated user
  });

  const [errors, setErrors] = useState<Partial<ClassFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ClassFormData> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Class name must be less than 100 characters';
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(formData.name)) {
      newErrors.name = 'Class name can only contain letters, numbers, spaces, hyphens, and underscores';
    }

    // Code validation
    if (!formData.code.trim()) {
      newErrors.code = 'Class code is required';
    } else if (formData.code.length > 20) {
      newErrors.code = 'Class code must be less than 20 characters';
    } else if (!/^[A-Z0-9\-_]+$/.test(formData.code)) {
      newErrors.code = 'Class code can only contain uppercase letters, numbers, hyphens, and underscores';
    }

    // Level validation
    if (formData.level < 1 || formData.level > 20) {
      newErrors.level = 'Level must be between 1 and 20';
    }

    // Section validation (optional)
    if (formData.section && formData.section.length > 10) {
      newErrors.section = 'Section must be less than 10 characters';
    } else if (formData.section && !/^[A-Z0-9]+$/.test(formData.section)) {
      newErrors.section = 'Section can only contain uppercase letters and numbers';
    }

    // Room number validation (optional)
    if (formData.roomNumber && formData.roomNumber.length > 20) {
      newErrors.roomNumber = 'Room number must be less than 20 characters';
    } else if (formData.roomNumber && !/^[A-Z0-9\-_]+$/.test(formData.roomNumber)) {
      newErrors.roomNumber = 'Room number can only contain letters, numbers, hyphens, and underscores';
    }

    // Capacity validation
    if (formData.capacity < 1 || formData.capacity > 1000) {
      newErrors.capacity = 'Capacity must be between 1 and 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.show({
        description: 'Please fix the errors before submitting',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Import the class service dynamically to avoid circular dependencies
      const { default: classService } = await import('../services/classService');
      
      await classService.createClass(formData);
      
      toast.show({
        description: 'Class created successfully',
      });
      
      onClassCreated();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        code: '',
        level: 1,
        section: '',
        roomNumber: '',
        capacity: 30,
        schoolId: 1,
        createdBy: 1,
      });
      setErrors({});
      
    } catch (error: any) {
      
      toast.show({
        description: error.message || 'Failed to create class',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setErrors({});
    }
  };

  const generateClassCode = () => {
    const level = formData.level.toString().padStart(2, '0');
    const section = formData.section || 'A';
    const code = `C${level}${section}`;
    setFormData({ ...formData, code });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <Modal.Content>
        <Modal.CloseButton isDisabled={isLoading} />
        <Modal.Header>Create New Class</Modal.Header>
        
        <Modal.Body>
          <VStack space={4}>
            {/* Class Name */}
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormControl.Label>Class Name</FormControl.Label>
              <Input
                placeholder="e.g., Mathematics Class 10A"
                value={formData.name}
                onChangeText={(value) => setFormData({ ...formData, name: value })}
                isDisabled={isLoading}
              />
              {errors.name && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.name}
                </Text>
              )}
            </FormControl>

            {/* Class Code */}
            <FormControl isRequired isInvalid={!!errors.code}>
              <FormControl.Label>Class Code</FormControl.Label>
              <HStack space={2}>
                <Input
                  flex={1}
                  placeholder="e.g., C10A"
                  value={formData.code}
                  onChangeText={(value) => setFormData({ ...formData, code: value.toUpperCase() })}
                  isDisabled={isLoading}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onPress={generateClassCode}
                  isDisabled={isLoading}
                >
                  Generate
                </Button>
              </HStack>
              {errors.code && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.code}
                </Text>
              )}
            </FormControl>

            {/* Level and Section */}
            <HStack space={4}>
              <FormControl flex={1} isRequired isInvalid={!!errors.level}>
                <FormControl.Label>Level</FormControl.Label>
                <Input
                  keyboardType="numeric"
                  value={formData.level.toString()}
                  onChangeText={(value) => setFormData({ ...formData, level: parseInt(value) || 1 })}
                  isDisabled={isLoading}
                />
                {errors.level && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors.level}
                  </Text>
                )}
              </FormControl>

              <FormControl flex={1} isInvalid={!!errors.section}>
                <FormControl.Label>Section (Optional)</FormControl.Label>
                <Input
                  placeholder="e.g., A, B, C"
                  value={formData.section}
                  onChangeText={(value) => setFormData({ ...formData, section: value.toUpperCase() })}
                  isDisabled={isLoading}
                />
                {errors.section && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors.section}
                  </Text>
                )}
              </FormControl>
            </HStack>

            {/* Room Number */}
            <FormControl isInvalid={!!errors.roomNumber}>
              <FormControl.Label>Room Number (Optional)</FormControl.Label>
              <Input
                placeholder="e.g., R101, ROOM-A1"
                value={formData.roomNumber}
                onChangeText={(value) => setFormData({ ...formData, roomNumber: value.toUpperCase() })}
                isDisabled={isLoading}
              />
              {errors.roomNumber && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.roomNumber}
                </Text>
              )}
            </FormControl>

            {/* Capacity */}
            <FormControl isRequired isInvalid={!!errors.capacity}>
              <FormControl.Label>Capacity</FormControl.Label>
              <Input
                keyboardType="numeric"
                value={formData.capacity.toString()}
                onChangeText={(value) => setFormData({ ...formData, capacity: parseInt(value) || 30 })}
                isDisabled={isLoading}
              />
              {errors.capacity && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.capacity}
                </Text>
              )}
            </FormControl>

            {/* Info Alert */}
            <Alert status="info" borderRadius="md">
              <Alert.Icon />
              <VStack flex={1} space={1}>
                <Text fontSize="sm" fontWeight="medium">Class Creation Info</Text>
                <Text fontSize="xs">
                  The class will be created in your school. You can assign a class teacher later from the class details page.
                </Text>
              </VStack>
            </Alert>
          </VStack>
        </Modal.Body>

        <Modal.Footer>
          <HStack space={3}>
            <Button
              variant="ghost"
              onPress={handleClose}
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onPress={handleSubmit}
              isLoading={isLoading}
              loadingText="Creating..."
              leftIcon={isLoading ? <Spinner size="sm" /> : undefined}
            >
              Create Class
            </Button>
          </HStack>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
};

export default CreateClassModal; 
