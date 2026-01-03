import React, { useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Checkbox,
  Icon,
  useToast,
  Spinner,
  Divider,
  Badge,
  Progress,
  Heading,
  AlertDialog,
  Modal,
  FormControl,
  Input,
  Select,
  CheckIcon,
  TextArea,
  Switch,
  Center,
  FlatList,
  Pressable,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import useStudentApi from '../../hooks/useStudentApi';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const BulkOperations: React.FC = () => {
  const { loading, error, bulkCreateStudents, bulkUpdateStudents, bulkDeleteStudents } = useStudentApi();
  const [activeTab, setActiveTab] = useState('create');
  const [createData, setCreateData] = useState('');
  const [updateData, setUpdateData] = useState('');
  const [deleteData, setDeleteData] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(false);
  const [validateData, setValidateData] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [operationProgress, setOperationProgress] = useState(0);
  const [operationStatus, setOperationStatus] = useState('');
  const toast = useToast();

  const handleFilePick = async (setData: (data: string) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });
      
      if (!result.canceled && result.assets[0]) {
        const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
        setData(content);
        toast.show({
          description: 'File uploaded successfully',
          status: 'success'
        });
      }
    } catch (err) {
      toast.show({
        description: 'Failed to pick file',
        status: 'error'
      });
    }
  };

  const validateJsonData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (activeTab === 'create' && !Array.isArray(parsed.students)) {
        throw new Error('Data must contain a "students" array');
      }
      if (activeTab === 'update' && !Array.isArray(parsed.updates)) {
        throw new Error('Data must contain an "updates" array');
      }
      if (activeTab === 'delete' && !Array.isArray(parsed)) {
        throw new Error('Data must be an array of student IDs');
      }
      return true;
    } catch (err: any) {
      toast.show({
        description: `Invalid JSON: ${err.message}`,
        status: 'error'
      });
      return false;
    }
  };

  const handlePreview = () => {
    if (!validateJsonData(activeTab === 'create' ? createData : activeTab === 'update' ? updateData : deleteData)) {
      return;
    }

    try {
      const parsed = JSON.parse(activeTab === 'create' ? createData : activeTab === 'update' ? updateData : deleteData);
      let preview: any[] = [];
      
      if (activeTab === 'create') {
        preview = parsed.students?.slice(0, 5) || [];
      } else if (activeTab === 'update') {
        preview = parsed.updates?.slice(0, 5) || [];
      } else {
        preview = parsed.slice(0, 5).map((id: number) => ({ id }));
      }
      
      setPreviewData(preview);
      setShowPreview(true);
    } catch (err) {
      toast.show({
        description: 'Failed to parse data for preview',
        status: 'error'
      });
    }
  };

  const handleBulkCreate = async () => {
    if (!validateJsonData(createData)) return;

    try {
      setOperationProgress(0);
      setOperationStatus('Creating students...');
      
      const parsedData = JSON.parse(createData);
      const response = await bulkCreateStudents({
        students: parsedData.students,
        skipDuplicates,
        validateData,
      });
      
      const count = (response as any)?.created || (response as any)?.data?.created || 0;
      toast.show({
        description: `${count} students created successfully`,
        status: 'success'
      });
      setCreateData('');
      setOperationProgress(100);
      setOperationStatus('Operation completed');
    } catch (err: any) {
      toast.show({
        description: err.message || 'Failed to create students',
        status: 'error'
      });
      setOperationStatus('Operation failed');
    }
  };

  const handleBulkUpdate = async () => {
    if (!validateJsonData(updateData)) return;

    try {
      setOperationProgress(0);
      setOperationStatus('Updating students...');
      
      const parsedData = JSON.parse(updateData);
      const response = await bulkUpdateStudents({
        updates: parsedData.updates,
      });
      
      const count = (response as any)?.updated || (response as any)?.data?.updated || 0;
      toast.show({
        description: `${count} students updated successfully`,
        status: 'success'
      });
      setUpdateData('');
      setOperationProgress(100);
      setOperationStatus('Operation completed');
    } catch (err: any) {
      toast.show({
        description: err.message || 'Failed to update students',
        status: 'error'
      });
      setOperationStatus('Operation failed');
    }
  };

  const handleBulkDelete = async () => {
    if (!validateJsonData(deleteData)) return;

    try {
      setOperationProgress(0);
      setOperationStatus('Deleting students...');
      
      const parsedData = JSON.parse(deleteData);
      const response = await bulkDeleteStudents({
        studentIds: parsedData,
      });
      
      const count = (response as any)?.deleted || (response as any)?.data?.deleted || 0;
      toast.show({
        description: `${count} students deleted successfully`,
        status: 'success'
      });
      setDeleteData('');
      setOperationProgress(100);
      setOperationStatus('Operation completed');
    } catch (err: any) {
      toast.show({
        description: err.message || 'Failed to delete students',
        status: 'error'
      });
      setOperationStatus('Operation failed');
    }
  };

  const clearData = (type: string) => {
    switch (type) {
      case 'create':
        setCreateData('');
        break;
      case 'update':
        setUpdateData('');
        break;
      case 'delete':
        setDeleteData('');
        break;
    }
    toast.show({
      description: 'Data cleared',
      status: 'success'
    });
  };

  const renderCreateTab = () => (
    <Card p={4} mb={4} borderRadius="lg" shadow={2}>
      <VStack space={4}>
        <Box>
          <Heading size="md" color="coolGray.800">Bulk Create Students</Heading>
          <Text fontSize="sm" color="coolGray.600" mt={1}>
            Upload a JSON file or paste JSON data to create multiple students at once
          </Text>
        </Box>
        
        <Box
          borderWidth={1}
          borderColor="coolGray.300"
          borderRadius="md"
          p={3}
          bg="white"
        >
          <TextInput
            placeholder="Paste JSON data here"
            value={createData}
            onChangeText={setCreateData}
            multiline
            numberOfLines={10}
            style={{
              textAlignVertical: 'top',
              fontSize: 14,
              fontFamily: 'monospace',
            }}
          />
        </Box>
        
        <HStack space={3} justifyContent="space-between">
          <Button
            variant="outline"
            leftIcon={<Icon as={MaterialIcons} name="upload-file" size="sm" />}
            onPress={() => handleFilePick(setCreateData)}
            flex={1}
            borderRadius="md"
          >
            Upload JSON
          </Button>
          <Button
            variant="outline"
            leftIcon={<Icon as={MaterialIcons} name="visibility" size="sm" />}
            onPress={handlePreview}
            flex={1}
            borderRadius="md"
          >
            Preview
          </Button>
          <Button
            variant="outline"
            leftIcon={<Icon as={MaterialIcons} name="clear" size="sm" />}
            onPress={() => clearData('create')}
            flex={1}
            borderRadius="md"
          >
            Clear
          </Button>
        </HStack>
        
        <VStack space={3}>
          <Checkbox
            value="skipDuplicates"
            isChecked={skipDuplicates}
            onChange={(isChecked) => setSkipDuplicates(isChecked)}
            colorScheme="blue"
          >
            <Text fontSize="sm" color="coolGray.700" ml={2}>
              Skip duplicates
            </Text>
          </Checkbox>
          
          <Checkbox
            value="validateData"
            isChecked={validateData}
            onChange={(isChecked) => setValidateData(isChecked)}
            colorScheme="blue"
          >
            <Text fontSize="sm" color="coolGray.700" ml={2}>
              Validate data before import
            </Text>
          </Checkbox>
        </VStack>
        
        <Button
          colorScheme="blue"
          leftIcon={loading ? <Spinner size="sm" color="white" /> : <Icon as={MaterialIcons} name="add" size="sm" />}
          onPress={handleBulkCreate}
          isDisabled={!createData || loading}
          borderRadius="md"
          size="lg"
        >
          Create Students
        </Button>
        
        <Divider />
        
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="coolGray.800" mb={2}>
            Example JSON:
          </Text>
          <Box bg="coolGray.100" p={3} borderRadius="md">
            <Text fontSize="xs" fontFamily="monospace" color="coolGray.700">
              {JSON.stringify({
                students: [
                  {
                    firstName: "John",
                    lastName: "Doe",
                    email: "john.doe@school.com",
                    phone: "+1234567890",
                    admissionNo: "STU001",
                    classId: 1,
                    sectionId: 1,
                    status: "ACTIVE",
                    enrollmentDate: "2024-01-15"
                  }
                ],
                skipDuplicates: false,
                validateData: true
              }, null, 2)}
            </Text>
          </Box>
        </Box>
      </VStack>
    </Card>
  );

  const renderUpdateTab = () => (
    <Card p={4} mb={4} borderRadius="lg" shadow={2}>
      <VStack space={4}>
        <Box>
          <Heading size="md" color="coolGray.800">Bulk Update Students</Heading>
          <Text fontSize="sm" color="coolGray.600" mt={1}>
            Upload a JSON file or paste JSON data to update multiple students at once
          </Text>
        </Box>
        
        <Box
          borderWidth={1}
          borderColor="coolGray.300"
          borderRadius="md"
          p={3}
          bg="white"
        >
          <TextInput
            placeholder="Paste JSON data here"
            value={updateData}
            onChangeText={setUpdateData}
            multiline
            numberOfLines={10}
            style={{
              textAlignVertical: 'top',
              fontSize: 14,
              fontFamily: 'monospace',
            }}
          />
        </Box>
        
        <HStack space={3} justifyContent="space-between">
          <Button
            variant="outline"
            leftIcon={<Icon as={MaterialIcons} name="upload-file" size="sm" />}
            onPress={() => handleFilePick(setUpdateData)}
            flex={1}
            borderRadius="md"
          >
            Upload JSON
          </Button>
          <Button
            variant="outline"
            leftIcon={<Icon as={MaterialIcons} name="visibility" size="sm" />}
            onPress={handlePreview}
            flex={1}
            borderRadius="md"
          >
            Preview
          </Button>
          <Button
            variant="outline"
            leftIcon={<Icon as={MaterialIcons} name="clear" size="sm" />}
            onPress={() => clearData('update')}
            flex={1}
            borderRadius="md"
          >
            Clear
          </Button>
        </HStack>
        
        <Button
          colorScheme="orange"
          leftIcon={loading ? <Spinner size="sm" color="white" /> : <Icon as={MaterialIcons} name="edit" size="sm" />}
          onPress={handleBulkUpdate}
          isDisabled={!updateData || loading}
          borderRadius="md"
          size="lg"
        >
          Update Students
        </Button>
        
        <Divider />
        
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="coolGray.800" mb={2}>
            Example JSON:
          </Text>
          <Box bg="coolGray.100" p={3} borderRadius="md">
            <Text fontSize="xs" fontFamily="monospace" color="coolGray.700">
              {JSON.stringify({
                updates: [
                  {
                    id: 1,
                    data: {
                      status: "ACTIVE",
                      classId: 2
                    }
                  }
                ]
              }, null, 2)}
            </Text>
          </Box>
        </Box>
      </VStack>
    </Card>
  );

  const renderDeleteTab = () => (
    <Card p={4} mb={4} borderRadius="lg" shadow={2}>
      <VStack space={4}>
        <Box>
          <Heading size="md" color="coolGray.800">Bulk Delete Students</Heading>
          <Text fontSize="sm" color="coolGray.600" mt={1}>
            Upload a JSON file or paste JSON data to delete multiple students at once
          </Text>
          <Badge colorScheme="red" variant="subtle" mt={2} alignSelf="flex-start">
            ⚠️ This action cannot be undone
          </Badge>
        </Box>
        
        <Box
          borderWidth={1}
          borderColor="coolGray.300"
          borderRadius="md"
          p={3}
          bg="white"
        >
          <TextInput
            placeholder="Paste JSON array of student IDs here"
            value={deleteData}
            onChangeText={setDeleteData}
            multiline
            numberOfLines={10}
            style={{
              textAlignVertical: 'top',
              fontSize: 14,
              fontFamily: 'monospace',
            }}
          />
        </Box>
        
        <HStack space={3} justifyContent="space-between">
          <Button
            variant="outline"
            leftIcon={<Icon as={MaterialIcons} name="upload-file" size="sm" />}
            onPress={() => handleFilePick(setDeleteData)}
            flex={1}
            borderRadius="md"
          >
            Upload JSON
          </Button>
          <Button
            variant="outline"
            leftIcon={<Icon as={MaterialIcons} name="visibility" size="sm" />}
            onPress={handlePreview}
            flex={1}
            borderRadius="md"
          >
            Preview
          </Button>
          <Button
            variant="outline"
            leftIcon={<Icon as={MaterialIcons} name="clear" size="sm" />}
            onPress={() => clearData('delete')}
            flex={1}
            borderRadius="md"
          >
            Clear
          </Button>
        </HStack>
        
        <Button
          colorScheme="red"
          leftIcon={loading ? <Spinner size="sm" color="white" /> : <Icon as={MaterialIcons} name="delete" size="sm" />}
          onPress={handleBulkDelete}
          isDisabled={!deleteData || loading}
          borderRadius="md"
          size="lg"
        >
          Delete Students
        </Button>
        
        <Divider />
        
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="coolGray.800" mb={2}>
            Example JSON:
          </Text>
          <Box bg="coolGray.100" p={3} borderRadius="md">
            <Text fontSize="xs" fontFamily="monospace" color="coolGray.700">
              {JSON.stringify([1, 2, 3], null, 2)}
            </Text>
          </Box>
        </Box>
      </VStack>
    </Card>
  );

  return (
    <Box flex={1} bg="coolGray.50">
      <ScrollView>
        <Box p={4}>
          {/* Progress Bar */}
          {operationProgress > 0 && operationProgress < 100 && (
            <Card p={4} mb={4} borderRadius="lg" shadow={2}>
              <VStack space={3}>
                <Text fontSize="sm" fontWeight="semibold" color="coolGray.800">
                  {operationStatus}
                </Text>
                <Progress value={operationProgress} colorScheme="blue" size="lg" />
                <Text fontSize="xs" color="coolGray.600">
                  {operationProgress}% complete
                </Text>
              </VStack>
            </Card>
          )}

          {/* Custom Tab Navigation */}
          <HStack space={2} mb={4} bg="white" p={2} borderRadius="lg" shadow={1}>
            <Button
              variant={activeTab === 'create' ? 'solid' : 'outline'}
              colorScheme="blue"
              flex={1}
              onPress={() => setActiveTab('create')}
              size="sm"
            >
              <HStack space={1} alignItems="center">
                <Icon as={MaterialIcons} name="add" size="sm" />
                <Text>Bulk Create</Text>
              </HStack>
            </Button>
            <Button
              variant={activeTab === 'update' ? 'solid' : 'outline'}
              colorScheme="orange"
              flex={1}
              onPress={() => setActiveTab('update')}
              size="sm"
            >
              <HStack space={1} alignItems="center">
                <Icon as={MaterialIcons} name="edit" size="sm" />
                <Text>Bulk Update</Text>
              </HStack>
            </Button>
            <Button
              variant={activeTab === 'delete' ? 'solid' : 'outline'}
              colorScheme="red"
              flex={1}
              onPress={() => setActiveTab('delete')}
              size="sm"
            >
              <HStack space={1} alignItems="center">
                <Icon as={MaterialIcons} name="delete" size="sm" />
                <Text>Bulk Delete</Text>
              </HStack>
            </Button>
          </HStack>

          <Box>
            {activeTab === 'create' && renderCreateTab()}
            {activeTab === 'update' && renderUpdateTab()}
            {activeTab === 'delete' && renderDeleteTab()}
          </Box>

          {error && (
            <Card p={4} mb={4} borderRadius="lg" bg="red.50" borderColor="red.200">
              <HStack space={2} alignItems="center">
                <Icon as={MaterialIcons} name="error" size="sm" color="red.500" />
                <Text color="red.700" fontSize="sm">
                  Error: {error}
                </Text>
              </HStack>
            </Card>
          )}
        </Box>
      </ScrollView>

      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} size="xl">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Data Preview</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <Text fontSize="sm" color="coolGray.600">
                Showing first 5 items from your data:
              </Text>
              <Box bg="coolGray.100" p={3} borderRadius="md">
                <Text fontSize="xs" fontFamily="monospace" color="coolGray.700">
                  {JSON.stringify(previewData, null, 2)}
                </Text>
              </Box>
            </VStack>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default BulkOperations; 
