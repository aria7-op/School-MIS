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
  Modal,
  useToast,
  Switch,
  FormControl,
  useDisclose,
  Alert,
  Spinner,
  Radio,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ImportExportTabProps {
  onImport: (data: any) => Promise<void>;
  onExport: (options: any) => Promise<void>;
  selectedClass: any;
  onClassSelect: (classItem: any) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const ImportExportTab: React.FC<ImportExportTabProps> = ({
  onImport,
  onExport,
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
  const [activeTab, setActiveTab] = useState('export');
  const [exportOptions, setExportOptions] = useState({
    format: 'excel',
    includeStudents: true,
    includeAttendance: true,
    includeGrades: true,
    dateRange: 'all',
  });
  const [importOptions, setImportOptions] = useState({
    format: 'excel',
    updateExisting: true,
    validateData: true,
    skipErrors: false,
  });
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importHistory, setImportHistory] = useState([]);
  const [exportHistory, setExportHistory] = useState([]);

  // Hooks
  const toast = useToast();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclose();

  // Mock history data
  const mockImportHistory = useMemo(() => [
    {
      id: 1,
      filename: 'classes_import_2024.xlsx',
      status: 'completed',
      recordsProcessed: 25,
      recordsSuccess: 23,
      recordsErrors: 2,
      timestamp: '2024-01-15T10:30:00Z',
    },
    {
      id: 2,
      filename: 'student_data.csv',
      status: 'completed',
      recordsProcessed: 150,
      recordsSuccess: 150,
      recordsErrors: 0,
      timestamp: '2024-01-14T15:45:00Z',
    },
  ], []);

  const mockExportHistory = useMemo(() => [
    {
      id: 1,
      filename: 'classes_export_2024.xlsx',
      status: 'completed',
      recordsExported: 50,
      fileSize: '2.3 MB',
      timestamp: '2024-01-15T11:00:00Z',
    },
    {
      id: 2,
      filename: 'attendance_report.pdf',
      status: 'completed',
      recordsExported: 1200,
      fileSize: '5.7 MB',
      timestamp: '2024-01-13T09:15:00Z',
    },
  ], []);

  useEffect(() => {
    setImportHistory(mockImportHistory);
    setExportHistory(mockExportHistory);
  }, []);

  const handleExport = async () => {
    setProcessing(true);
    try {
      await onExport(exportOptions);
      
      // Add to export history
      const newExportItem = {
        id: Date.now(),
        filename: `classes_export_${new Date().toISOString().split('T')[0]}.${exportOptions.format === 'excel' ? 'xlsx' : exportOptions.format}`,
        status: 'completed',
        recordsExported: 50, // Mock data
        fileSize: '2.5 MB',
        timestamp: new Date().toISOString(),
      };
      setExportHistory(prev => [newExportItem, ...prev]);

      toast.show({
        description: 'Export completed successfully',
        status: 'success'
      });
    } catch (error) {
      toast.show({
        description: 'Export failed',
        status: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleImport = async (file: any) => {
    setProcessing(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      await onImport({ file, options: importOptions });
      
      // Add to import history
      const newImportItem = {
        id: Date.now(),
        filename: file.name || 'uploaded_file.xlsx',
        status: 'completed',
        recordsProcessed: 25,
        recordsSuccess: 23,
        recordsErrors: 2,
        timestamp: new Date().toISOString(),
      };
      setImportHistory(prev => [newImportItem, ...prev]);

      toast.show({
        description: 'Import completed successfully',
        status: 'success'
      });
    } catch (error) {
      toast.show({
        description: 'Import failed',
        status: 'error'
      });
    } finally {
      setProcessing(false);
      setUploadProgress(0);
    }
  };

  // Render functions
  const renderHeader = () => (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Heading size="md" color={textColor}>
            Import & Export
          </Heading>
          <Text color={mutedColor} fontSize="sm">
            Manage data import and export operations
          </Text>
        </VStack>
        <Button
          size="sm"
          colorScheme="blue"
          onPress={onRefresh}
          leftIcon={<Icon as={MaterialIcons} name="refresh" size="sm" />}
          isLoading={refreshing}
        >
          Refresh
        </Button>
      </HStack>

      <HStack space={2}>
        {['export', 'import'].map((tab) => (
          <Button
            key={tab}
            size="sm"
            variant={activeTab === tab ? 'solid' : 'outline'}
            colorScheme="blue"
            onPress={() => setActiveTab(tab)}
            flex={1}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </HStack>
    </VStack>
  );

  const renderExportSection = () => (
    <VStack space={6}>
      {/* Export Options */}
      <VStack space={4}>
        <Heading size="sm" color={textColor}>Export Options</Heading>
        
        <Card bg={cardBg} borderRadius="xl" p={4}>
          <VStack space={4}>
            <FormControl>
              <FormControl.Label>Export Format</FormControl.Label>
              <Radio.Group
                value={exportOptions.format}
                onChange={(value) => setExportOptions({ ...exportOptions, format: value })}
              >
                <HStack space={4}>
                  <Radio value="excel" colorScheme="green">Excel (.xlsx)</Radio>
                  <Radio value="csv" colorScheme="blue">CSV (.csv)</Radio>
                  <Radio value="pdf" colorScheme="red">PDF (.pdf)</Radio>
                </HStack>
              </Radio.Group>
            </FormControl>

            <Divider />

            <VStack space={3}>
              <Text fontWeight="medium" color={textColor}>Include Data</Text>
              
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="sm" color={textColor}>Student Information</Text>
                <Switch
                  isChecked={exportOptions.includeStudents}
                  onToggle={(value) => setExportOptions({ ...exportOptions, includeStudents: value })}
                  colorScheme="blue"
                />
              </HStack>
              
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="sm" color={textColor}>Attendance Records</Text>
                <Switch
                  isChecked={exportOptions.includeAttendance}
                  onToggle={(value) => setExportOptions({ ...exportOptions, includeAttendance: value })}
                  colorScheme="blue"
                />
              </HStack>
              
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="sm" color={textColor}>Grade Information</Text>
                <Switch
                  isChecked={exportOptions.includeGrades}
                  onToggle={(value) => setExportOptions({ ...exportOptions, includeGrades: value })}
                  colorScheme="blue"
                />
              </HStack>
            </VStack>

            <Divider />

            <FormControl>
              <FormControl.Label>Date Range</FormControl.Label>
              <Select
                selectedValue={exportOptions.dateRange}
                onValueChange={(value) => setExportOptions({ ...exportOptions, dateRange: value })}
                _selectedItem={{
                  bg: 'blue.500',
                  endIcon: <CheckIcon size="5" />
                }}
              >
                <Select.Item label="All Time" value="all" />
                <Select.Item label="This Year" value="year" />
                <Select.Item label="This Month" value="month" />
                <Select.Item label="This Week" value="week" />
                <Select.Item label="Custom Range" value="custom" />
              </Select>
            </FormControl>
          </VStack>
        </Card>

        <Button
          colorScheme="green"
          size="lg"
          onPress={handleExport}
          leftIcon={<Icon as={MaterialIcons} name="download" size="sm" />}
          isLoading={processing}
          loadingText="Exporting..."
        >
          Export Data
        </Button>
      </VStack>

      {/* Export Templates */}
      <VStack space={4}>
        <Heading size="sm" color={textColor}>Quick Export Templates</Heading>
        
        <SimpleGrid columns={2} space={3}>
          {[
            { name: 'Class List', description: 'Basic class information', icon: 'list', color: 'blue' },
            { name: 'Student Roster', description: 'All students by class', icon: 'people', color: 'green' },
            { name: 'Attendance Report', description: 'Attendance summary', icon: 'event-available', color: 'purple' },
            { name: 'Grade Report', description: 'Student grades and performance', icon: 'grade', color: 'orange' },
          ].map((template, index) => (
            <Pressable
              key={index}
              onPress={() => {
                // Set template-specific options
                handleExport();
              }}
            >
              <Card bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
                <VStack space={2} p={4} alignItems="center">
                  <Avatar size="sm" bg={`${template.color}.500`}>
                    <Icon as={MaterialIcons} name={template.icon} color="white" size="sm" />
                  </Avatar>
                  <Text fontWeight="bold" fontSize="sm" color={textColor} textAlign="center">
                    {template.name}
                  </Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">
                    {template.description}
                  </Text>
                </VStack>
              </Card>
            </Pressable>
          ))}
        </SimpleGrid>
      </VStack>

      {/* Export History */}
      <VStack space={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="sm" color={textColor}>Recent Exports</Heading>
          <Button size="xs" variant="outline" colorScheme="blue">
            View All
          </Button>
        </HStack>
        
        <VStack space={3}>
          {exportHistory.slice(0, 3).map((item: any) => (
            <Card key={item.id} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
              <HStack space={3} alignItems="center" p={4}>
                <Avatar size="sm" bg="green.500">
                  <Icon as={MaterialIcons} name="download" color="white" size="sm" />
                </Avatar>
                <VStack flex={1} space={1}>
                  <Text fontWeight="medium" fontSize="sm" color={textColor}>
                    {item.filename}
                  </Text>
                  <Text fontSize="xs" color={mutedColor}>
                    {item.recordsExported} records • {item.fileSize}
                  </Text>
                  <Text fontSize="xs" color={mutedColor}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </VStack>
                <VStack alignItems="flex-end" space={1}>
                  <Badge colorScheme="green" variant="solid" size="sm">
                    {item.status}
                  </Badge>
                  <Button size="xs" variant="outline" colorScheme="blue">
                    Download
                  </Button>
                </VStack>
              </HStack>
            </Card>
          ))}
        </VStack>
      </VStack>
    </VStack>
  );

  const renderImportSection = () => (
    <VStack space={6}>
      {/* Import Options */}
      <VStack space={4}>
        <Heading size="sm" color={textColor}>Import Options</Heading>
        
        <Card bg={cardBg} borderRadius="xl" p={4}>
          <VStack space={4}>
            <FormControl>
              <FormControl.Label>Import Format</FormControl.Label>
              <Radio.Group
                value={importOptions.format}
                onChange={(value) => setImportOptions({ ...importOptions, format: value })}
              >
                <HStack space={4}>
                  <Radio value="excel" colorScheme="green">Excel (.xlsx)</Radio>
                  <Radio value="csv" colorScheme="blue">CSV (.csv)</Radio>
                </HStack>
              </Radio.Group>
            </FormControl>

            <Divider />

            <VStack space={3}>
              <Text fontWeight="medium" color={textColor}>Import Settings</Text>
              
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex={1}>
                  <Text fontSize="sm" color={textColor}>Update Existing Records</Text>
                  <Text fontSize="xs" color={mutedColor}>Overwrite existing data with imported data</Text>
                </VStack>
                <Switch
                  isChecked={importOptions.updateExisting}
                  onToggle={(value) => setImportOptions({ ...importOptions, updateExisting: value })}
                  colorScheme="blue"
                />
              </HStack>
              
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex={1}>
                  <Text fontSize="sm" color={textColor}>Validate Data</Text>
                  <Text fontSize="xs" color={mutedColor}>Check data integrity before importing</Text>
                </VStack>
                <Switch
                  isChecked={importOptions.validateData}
                  onToggle={(value) => setImportOptions({ ...importOptions, validateData: value })}
                  colorScheme="blue"
                />
              </HStack>
              
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex={1}>
                  <Text fontSize="sm" color={textColor}>Skip Errors</Text>
                  <Text fontSize="xs" color={mutedColor}>Continue import even if some records fail</Text>
                </VStack>
                <Switch
                  isChecked={importOptions.skipErrors}
                  onToggle={(value) => setImportOptions({ ...importOptions, skipErrors: value })}
                  colorScheme="blue"
                />
              </HStack>
            </VStack>
          </VStack>
        </Card>
      </VStack>

      {/* File Upload Area */}
      <VStack space={4}>
        <Heading size="sm" color={textColor}>Upload File</Heading>
        
        <Card bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="xl" borderWidth={2} borderStyle="dashed" borderColor={borderColor}>
          <Center p={8}>
            <VStack space={4} alignItems="center">
              <Avatar size="lg" bg="blue.500">
                <Icon as={MaterialIcons} name="cloud-upload" color="white" size="lg" />
              </Avatar>
              <VStack space={2} alignItems="center">
                <Text fontWeight="bold" color={textColor}>
                  Drop files here or click to browse
                </Text>
                <Text fontSize="sm" color={mutedColor} textAlign="center">
                  Supported formats: Excel (.xlsx), CSV (.csv)
                </Text>
                <Text fontSize="xs" color={mutedColor}>
                  Maximum file size: 10MB
                </Text>
              </VStack>
              <Button
                colorScheme="blue"
                variant="outline"
                leftIcon={<Icon as={MaterialIcons} name="folder-open" size="sm" />}
                onPress={() => {
                  // Simulate file selection
                  const mockFile = { name: 'sample_import.xlsx', size: 1024000 };
                  handleImport(mockFile);
                }}
              >
                Select File
              </Button>
            </VStack>
          </Center>
        </Card>

        {processing && (
          <Card bg={cardBg} borderRadius="lg" p={4}>
            <VStack space={3}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="medium" color={textColor}>Uploading...</Text>
                <Text fontSize="sm" color={textColor}>{uploadProgress}%</Text>
              </HStack>
              <Progress value={uploadProgress} size="sm" colorScheme="blue" />
            </VStack>
          </Card>
        )}
      </VStack>

      {/* Import Templates */}
      <VStack space={4}>
        <Heading size="sm" color={textColor}>Download Templates</Heading>
        
        <SimpleGrid columns={2} space={3}>
          {[
            { name: 'Class Template', description: 'Template for importing classes', icon: 'school', color: 'blue' },
            { name: 'Student Template', description: 'Template for importing students', icon: 'people', color: 'green' },
            { name: 'Attendance Template', description: 'Template for attendance data', icon: 'event-available', color: 'purple' },
            { name: 'Grade Template', description: 'Template for grade data', icon: 'grade', color: 'orange' },
          ].map((template, index) => (
            <Pressable key={index}>
              <Card bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
                <VStack space={2} p={4} alignItems="center">
                  <Avatar size="sm" bg={`${template.color}.500`}>
                    <Icon as={MaterialIcons} name={template.icon} color="white" size="sm" />
                  </Avatar>
                  <Text fontWeight="bold" fontSize="sm" color={textColor} textAlign="center">
                    {template.name}
                  </Text>
                  <Text fontSize="xs" color={mutedColor} textAlign="center">
                    {template.description}
                  </Text>
                  <Button size="xs" variant="outline" colorScheme={template.color}>
                    Download
                  </Button>
                </VStack>
              </Card>
            </Pressable>
          ))}
        </SimpleGrid>
      </VStack>

      {/* Import History */}
      <VStack space={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="sm" color={textColor}>Recent Imports</Heading>
          <Button size="xs" variant="outline" colorScheme="blue">
            View All
          </Button>
        </HStack>
        
        <VStack space={3}>
          {importHistory.slice(0, 3).map((item: any) => (
            <Card key={item.id} bg={cardBg} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
              <HStack space={3} alignItems="center" p={4}>
                <Avatar size="sm" bg="blue.500">
                  <Icon as={MaterialIcons} name="upload" color="white" size="sm" />
                </Avatar>
                <VStack flex={1} space={1}>
                  <Text fontWeight="medium" fontSize="sm" color={textColor}>
                    {item.filename}
                  </Text>
                  <Text fontSize="xs" color={mutedColor}>
                    {item.recordsProcessed} processed • {item.recordsSuccess} success • {item.recordsErrors} errors
                  </Text>
                  <Text fontSize="xs" color={mutedColor}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </VStack>
                <VStack alignItems="flex-end" space={1}>
                  <Badge
                    colorScheme={item.status === 'completed' ? 'green' : 'orange'}
                    variant="solid"
                    size="sm"
                  >
                    {item.status}
                  </Badge>
                  <Button size="xs" variant="outline" colorScheme="blue">
                    View Log
                  </Button>
                </VStack>
              </HStack>
            </Card>
          ))}
        </VStack>
      </VStack>
    </VStack>
  );

  return (
    <ScrollView flex={1} bg={bgColor} showsVerticalScrollIndicator={false}>
      <VStack space={6} p={4} pb={8}>
        {renderHeader()}
        {activeTab === 'export' ? renderExportSection() : renderImportSection()}
      </VStack>
    </ScrollView>
  );
};

export default ImportExportTab; 
