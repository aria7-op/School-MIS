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
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import useStaffApi from '../hooks/useStaffApi';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const BulkOperations: React.FC = () => {
  const { loading, error, bulkCreateStaff, bulkUpdateStaff, bulkDeleteStaff } = useStaffApi();
  const [activeTab, setActiveTab] = useState('create');
  const [createData, setCreateData] = useState('');
  const [updateData, setUpdateData] = useState('');
  const [deleteData, setDeleteData] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(false);
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
          variant: 'solid',
          placement: 'top',
        });
      }
    } catch (err) {
      toast.show({
        description: 'Failed to pick file',
        variant: 'solid',
        placement: 'top',
      });
    }
  };

  const handleBulkCreate = async () => {
    try {
      const parsedData = JSON.parse(createData);
      const response = await bulkCreateStaff({
        staff: parsedData,
        skipDuplicates,
      });
      
      const count = (response as any)?.created || (response as any)?.data?.created || 0;
      toast.show({
        description: `${count} staff members created successfully`,
        variant: 'solid',
        placement: 'top',
      });
      setCreateData('');
    } catch (err: any) {
      toast.show({
        description: err.message || 'Failed to create staff',
        variant: 'solid',
        placement: 'top',
      });
    }
  };

  const handleBulkUpdate = async () => {
    try {
      const parsedData = JSON.parse(updateData);
      const response = await bulkUpdateStaff({
        updates: parsedData,
      });
      
      const count = (response as any)?.updated || (response as any)?.data?.updated || 0;
      toast.show({
        description: `${count} staff members updated successfully`,
        variant: 'solid',
        placement: 'top',
      });
      setUpdateData('');
    } catch (err: any) {
      toast.show({
        description: err.message || 'Failed to update staff',
        variant: 'solid',
        placement: 'top',
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const parsedData = JSON.parse(deleteData);
      const response = await bulkDeleteStaff({
        staffIds: parsedData,
      });
      
      const count = (response as any)?.deleted || (response as any)?.data?.deleted || 0;
      toast.show({
        description: `${count} staff members deleted successfully`,
        variant: 'solid',
        placement: 'top',
      });
      setDeleteData('');
    } catch (err: any) {
      toast.show({
        description: err.message || 'Failed to delete staff',
        variant: 'solid',
        placement: 'top',
      });
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
      variant: 'solid',
      placement: 'top',
    });
  };

  const renderCreateTab = () => (
    <Card p={4} mb={4} borderRadius="lg" shadow={2}>
      <VStack space={4}>
        <Box>
          <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
            Bulk Create Staff
          </Text>
          <Text fontSize="sm" color="coolGray.600" mt={1}>
            Upload a JSON file or paste JSON data to create multiple staff members at once
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
            leftIcon={<Icon as={MaterialIcons} name="clear" size="sm" />}
            onPress={() => clearData('create')}
            flex={1}
            borderRadius="md"
          >
            Clear
          </Button>
        </HStack>
        
        <Button
          colorScheme="blue"
          leftIcon={loading ? <Spinner size="sm" color="white" /> : <Icon as={MaterialIcons} name="add" size="sm" />}
          onPress={handleBulkCreate}
          isDisabled={!createData || loading}
          borderRadius="md"
          size="lg"
        >
          Create Staff
        </Button>
        
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
        
        <Divider />
        
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="coolGray.800" mb={2}>
            Example JSON:
          </Text>
          <Box bg="coolGray.100" p={3} borderRadius="md">
            <Text fontSize="xs" fontFamily="monospace" color="coolGray.700">
              {JSON.stringify({
                staff: [
                  {
                    user: {
                      username: "new.staff1",
                      email: "new.staff1@school.com",
                      firstName: "John",
                      lastName: "Doe",
                      phone: "+1234567890"
                    },
                    employeeId: "EMP001",
                    designation: "Teacher",
                    departmentId: 1,
                    joiningDate: "2024-01-15"
                  }
                ],
                skipDuplicates: false
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
          <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
            Bulk Update Staff
          </Text>
          <Text fontSize="sm" color="coolGray.600" mt={1}>
            Upload a JSON file or paste JSON data to update multiple staff members at once
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
          Update Staff
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
                      designation: "Senior Teacher",
                      salary: 52000
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
          <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
            Bulk Delete Staff
          </Text>
          <Text fontSize="sm" color="coolGray.600" mt={1}>
            Upload a JSON file or paste JSON data to delete multiple staff members at once
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
            placeholder="Paste JSON array of staff IDs here"
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
          Delete Staff
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
    </Box>
  );
};

export default BulkOperations;
