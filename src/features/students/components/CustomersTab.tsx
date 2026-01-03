  import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  Button,
  Badge,
  Input,
  Icon,
  useToast,
  Spinner,
  Heading,
  Divider,
  Center,
  Pressable,
  Modal,
  Fab,
  Select,
  CheckIcon,
  Avatar,
  Progress,
  CloseIcon,
  IconButton,
  useColorModeValue,
  Skeleton,
  Actionsheet,
  useDisclose,
  Switch,
  Slider,
  Radio,
  Checkbox,
  Menu,
  Popover,
  Tooltip,
  FormControl,
  useColorMode,
  Alert,
  FlatList,
} from 'native-base';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStudentApi, Customer, Student } from '../hooks/useStudentApi';
import secureApiService from '../../../services/secureApiService';
import PaginationController from '../../../components/ui/PaginationController';
import StudentForm from './StudentForm';

interface CustomersTabProps {
  onCustomerSelect: (customer: Customer) => void;
  onConvertCustomer: (customer: Customer) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const CustomersTab: React.FC<CustomersTabProps> = ({
  onCustomerSelect,
  onConvertCustomer,
  onRefresh,
  refreshing,
}) => {
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const primaryColor = useColorModeValue('blue.500', 'blue.300');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const errorColor = useColorModeValue('red.500', 'red.300');

  // Debug token storage
  useEffect(() => {
    const checkToken = async () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const authToken = localStorage.getItem('authToken');
          const userToken = localStorage.getItem('userToken');
          if (authToken) {
            console.log('Auth token found in localStorage');
          }
          if (userToken) {
            console.log('User token found in localStorage');
          }
        }
        
        // Test a simple API call to check authentication
        try {
          const testResponse = await secureApiService.getCustomers();
          } catch (apiError: any) {
          }
      } catch (error) {
        }
    };
    
    checkToken();
  }, []);

  // API hooks
  const {
    loading,
    error,
    getUnconvertedCustomers,
    getConvertedStudents,
    getCustomerConversionAnalytics,
    getCustomerConversionRates,
    getCustomerConversionHistory,
    convertCustomerToStudent,
  } = useStudentApi();

  // State management
  const [activeSection, setActiveSection] = useState<'unconverted' | 'converted' | 'analytics'>('unconverted');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<any>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState<'personal' | 'academic' | 'financial' | 'events' | 'raw'>('personal');

  // Data states
  const [unconvertedCustomers, setUnconvertedCustomers] = useState<Customer[]>([]);
  const [convertedStudents, setConvertedStudents] = useState<Student[]>([]);
  const [conversionAnalytics, setConversionAnalytics] = useState<any>(null);
  const [conversionRates, setConversionRates] = useState<any>(null);
  const [conversionHistory, setConversionHistory] = useState<any[]>([]);

  // Pagination
  const [unconvertedPage, setUnconvertedPage] = useState(1);
  const [convertedPage, setConvertedPage] = useState(1);
  const [unconvertedPageSize, setUnconvertedPageSize] = useState(20);
  const [convertedPageSize, setConvertedPageSize] = useState(20);
  const [unconvertedTotal, setUnconvertedTotal] = useState(0);
  const [convertedTotal, setConvertedTotal] = useState(0);
  const [unconvertedTotalPages, setUnconvertedTotalPages] = useState(1);
  const [convertedTotalPages, setConvertedTotalPages] = useState(1);
  const [hasMoreUnconverted, setHasMoreUnconverted] = useState(true);
  const [hasMoreConverted, setHasMoreConverted] = useState(true);

  // Load unconverted customers
  const loadUnconvertedCustomers = async (page = 1, append = false, pageSize = unconvertedPageSize) => {
    try {
      const response = await getUnconvertedCustomers(page, pageSize);
      
      console.log('Unconverted customers response:', {
        response: response,
        hasData: !!(response as any)?.data,
        hasCustomers: !!(response as any)?.customers,
        isArray: Array.isArray(response),
        firstItem: Array.isArray(response) ? response[0] : null,
        responseLength: Array.isArray(response) ? response.length : 'not array'
      });
      
      // Handle the actual API response structure
      // The response might be the array directly, or nested in data/customers
      const customers = Array.isArray(response) ? response : (response as any)?.data || response?.customers || [];
      
      console.log('Processed unconverted customers:', {
        count: customers.length,
        firstCustomer: customers[0]
      });
      
      if (append) {
        setUnconvertedCustomers(prev => {
          const newData = [...(prev || []), ...customers];
          return newData;
        });
      } else {
        setUnconvertedCustomers(customers);
      }
      
      // Handle pagination from the actual response structure
      const pagination = (response as any)?.pagination;
      const currentPage = pagination?.page || response?.page || page;
      
      // For direct array responses, we need to estimate total items and pages
      let totalItems, totalPages;
      if (Array.isArray(response)) {
        // If we got exactly the page size (20), assume there are more pages
        if (customers.length === pageSize) {
          // Since we know there are 20 items and the API is returning them directly,
          // let's assume there could be more pages. We'll set up pagination to test.
          totalItems = pageSize * 3; // Assume at least 3 pages worth of data
          totalPages = 3;
        } else if (customers.length > 0) {
          // We got some data but less than page size
          totalItems = customers.length + ((currentPage - 1) * pageSize);
          totalPages = Math.max(1, currentPage);
        } else {
          // No data
          totalItems = 0;
          totalPages = 1;
        }
      } else {
        // Use provided pagination info
        totalItems = pagination?.total || response?.total || customers.length;
        totalPages = pagination?.pages || response?.totalPages || Math.ceil(totalItems / pageSize);
      }
      
      // Ensure we always have at least 1 page
      totalPages = Math.max(1, totalPages);
      
      // If response is a direct array, estimate pagination info
      const hasMoreData = Array.isArray(response) 
        ? customers.length === pageSize  // If we got exactly the limit, there might be more
        : currentPage < totalPages;
      
      // Update pagination state
      setUnconvertedTotal(totalItems);
      setUnconvertedTotalPages(totalPages);
      setHasMoreUnconverted(hasMoreData);
      setUnconvertedPage(currentPage);
    } catch (error: any) {
      console.error('❌ Failed to load unconverted customers:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      // Set empty data to prevent crashes
      setUnconvertedCustomers([]);
      setHasMoreUnconverted(false);
    }
  };

  // Load converted students
  const loadConvertedStudents = async (page = 1, append = false, pageSize = convertedPageSize) => {
    try {
      const response = await getConvertedStudents(page, pageSize);
      
      console.log('Converted students response:', {
        response: response,
        hasData: !!(response as any)?.data,
        hasStudents: !!(response as any)?.students,
        isArray: Array.isArray(response),
        firstItem: Array.isArray(response) ? response[0] : null,
        responseLength: Array.isArray(response) ? response.length : 'not array'
      });
      
      // Handle the actual API response structure
      // The response might be the array directly, or nested in data/students
      const students = Array.isArray(response) ? response : (response as any)?.data || response?.students || [];
      
      console.log('Processed converted students:', {
        count: students.length,
        firstStudent: students[0]
      });
      
      if (append) {
        setConvertedStudents(prev => {
          const newData = [...(prev || []), ...students];
          return newData;
        });
      } else {
        setConvertedStudents(students);
      }
      
      // Handle pagination from the actual response structure
      const pagination = (response as any)?.pagination;
      const currentPage = pagination?.page || response?.page || page;
      
      // For direct array responses, we need to estimate total items and pages
      let totalItems, totalPages;
      if (Array.isArray(response)) {
        // If we got exactly the page size, assume there might be more data
        if (students.length === pageSize) {
          // Assume there could be more pages
          totalItems = pageSize * 3; // Assume at least 3 pages worth of data
          totalPages = 3;
        } else if (students.length > 0) {
          // We got some data but less than page size
          totalItems = students.length + ((currentPage - 1) * pageSize);
          totalPages = Math.max(1, currentPage);
        } else {
          // No data
          totalItems = 0;
          totalPages = 1;
        }
      } else {
        // Use provided pagination info
        totalItems = pagination?.total || response?.total || students.length;
        totalPages = pagination?.pages || response?.totalPages || Math.ceil(totalItems / pageSize);
      }
      
      // Ensure we always have at least 1 page
      totalPages = Math.max(1, totalPages);
      
      // If response is a direct array, estimate pagination info
      const hasMoreData = Array.isArray(response) 
        ? students.length === pageSize  // If we got exactly the limit, there might be more
        : currentPage < totalPages;
      
      // Update pagination state
      setConvertedTotal(totalItems);
      setConvertedTotalPages(totalPages);
      setHasMoreConverted(hasMoreData);
      setConvertedPage(currentPage);
    } catch (error: any) {
      console.error('❌ Failed to load converted students:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      // Set empty data to prevent crashes
      setConvertedStudents([]);
      setHasMoreConverted(false);
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    try {
      const [analytics, rates, history] = await Promise.allSettled([
        getCustomerConversionAnalytics('30d'),
        getCustomerConversionRates('monthly'),
        getCustomerConversionHistory(1, 10),
      ]);
      
      // Handle successful responses
      if (analytics.status === 'fulfilled') {
        setConversionAnalytics(analytics.value);
      } else {
        console.error('Failed to load analytics:', analytics.reason);
        setConversionAnalytics(null);
      }
      
      if (rates.status === 'fulfilled') {
        setConversionRates(rates.value);
      } else {
        console.error('Failed to load rates:', rates.reason);
        setConversionRates(null);
      }
      
      if (history.status === 'fulfilled') {
        setConversionHistory(history.value.conversions || []);
      } else {
        console.error('Failed to load history:', history.reason);
        setConversionHistory([]);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setConversionAnalytics(null);
      setConversionRates(null);
      setConversionHistory([]);
    }
  };

  // Pagination handlers
  const handleUnconvertedPageChange = (page: number) => {
    setUnconvertedPage(page);
    loadUnconvertedCustomers(page, false, unconvertedPageSize);
  };

  const handleUnconvertedPageSizeChange = (pageSize: number) => {
    setUnconvertedPageSize(pageSize);
    setUnconvertedPage(1);
    loadUnconvertedCustomers(1, false, pageSize);
  };

  const handleConvertedPageChange = (page: number) => {
    setConvertedPage(page);
    loadConvertedStudents(page, false, convertedPageSize);
  };

  const handleConvertedPageSizeChange = (pageSize: number) => {
    setConvertedPageSize(pageSize);
    setConvertedPage(1);
    loadConvertedStudents(1, false, pageSize);
  };

  // Load data based on active section
  useEffect(() => {
    if (activeSection === 'unconverted') {
      loadUnconvertedCustomers(1, false);
    } else if (activeSection === 'converted') {
      loadConvertedStudents(1, false);
    } else if (activeSection === 'analytics') {
      loadAnalytics();
    }
  }, [activeSection]);

  // Handle customer selection with dropdown management
  const handleCustomerSelect = (customer: Customer) => {
    // Close any other expanded card first
    if (expandedCustomerId && expandedCustomerId !== customer.id) {
      setExpandedCustomerId(null);
    }
    
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
    onCustomerSelect(customer);
  };

  // Handle customer card expansion
  const handleCustomerCardToggle = (customerId: string) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
    } else {
      // Close any other expanded card and open this one
      setExpandedCustomerId(customerId);
    }
  };

  // Handle conversion
  const handleConvertCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowStudentForm(true);
  };

  // Handle student form submission (conversion)
  const handleStudentFormSubmit = async (studentData: any) => {
    if (!selectedCustomer) {
      console.error('❌ No customer selected for conversion');
      return;
    }

    try {
      // Call the conversion API using the useStudentApi hook
      const conversionData = {
        conversionReason: studentData.conversionReason || 'Enrolled as student',
        admissionNo: studentData.admissionNo,
        user: {
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          email: studentData.email,
          phone: studentData.phone || '',
        }
      };

      // Use the convertCustomerToStudent method from useStudentApi
      const newStudent = await convertCustomerToStudent(selectedCustomer.id, conversionData);
      
      toast.show({
        title: 'Conversion Successful',
        description: `${selectedCustomer.name} has been converted to a student successfully!`,
        variant: 'solid',
        colorScheme: 'success',
      });

      // Close form and reset state
      setShowStudentForm(false);
      setSelectedCustomer(null);
      
      // Refresh data to show updated lists
      await Promise.all([
        loadUnconvertedCustomers(unconvertedPage, false, unconvertedPageSize),
        loadConvertedStudents(convertedPage, false, convertedPageSize),
        loadAnalytics()
      ]);

      } catch (error: any) {
      console.error('❌ Failed to convert customer:', error);
      toast.show({
        title: 'Conversion Failed',
        description: error.message || 'Failed to convert customer to student',
        variant: 'solid',
        colorScheme: 'error',
      });
    }
  };

  // Handle student form close
  const handleStudentFormClose = () => {
    setShowStudentForm(false);
    setSelectedCustomer(null);
  };

  // Render customer card with advanced dropdown
  const renderCustomerCard = (customer: Customer, isConverted = false) => {
    const isExpanded = expandedCustomerId === customer.id;
    
    return (
      <Card
        key={customer.id}
        bg={cardBg}
        borderRadius="xl"
        shadow={isExpanded ? 6 : 3}
        borderWidth={1}
        borderColor={isExpanded ? primaryColor : borderColor}
        mb={3}
        overflow="hidden"
        style={{
          transform: [{ scale: isExpanded ? 1.02 : 1 }]
        }}
      >
        {/* Main Card Content */}
        <Pressable
          onPress={() => handleCustomerCardToggle(customer.id)}
          _pressed={{ opacity: 0.8 }}
        >
          <HStack space={4} alignItems="center" p={4}>
            {/* Customer Avatar with Status Indicator */}
            <VStack alignItems="center" space={1}>
              <Avatar
                size="lg"
                bg={`${customer.name?.charAt(0) === 'A' ? 'blue' : customer.name?.charAt(0) === 'F' ? 'green' : customer.name?.charAt(0) === 'N' ? 'purple' : 'orange'}.500`}
              >
                {customer.name?.charAt(0)}
              </Avatar>
              {/* Status indicator dot */}
              <Box 
                w={3} 
                h={3} 
                bg={customer.status === 'active' ? successColor : customer.status === 'converted' ? primaryColor : mutedColor} 
                borderRadius="full" 
                borderWidth={2} 
                borderColor={cardBg}
              />
            </VStack>

            {/* Customer Info */}
            <VStack flex={1} space={1}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  {customer.name}
                </Text>
                <HStack space={2} alignItems="center">
                  <Badge
                    colorScheme={customer.status === 'active' ? 'green' : customer.status === 'converted' ? 'blue' : 'gray'}
                    variant="solid"
                    borderRadius="full"
                  >
                    {customer.status?.toUpperCase()}
                  </Badge>
                  <Icon
                    as={MaterialIcons}
                    name={isExpanded ? "expand-less" : "expand-more"}
                    size="sm"
                    color={primaryColor}
                  />
                </HStack>
              </HStack>
              
              <HStack space={4}>
                <Text fontSize="sm" color={mutedColor}>
                  📧 {customer.email}
                </Text>
                <Text fontSize="sm" color={mutedColor}>
                  📞 {customer.phone || 'N/A'}
                </Text>
              </HStack>

              <HStack space={4}>
                <Text fontSize="sm" color={mutedColor}>
                  Type: {customer.type}
                </Text>
                {customer.priority && (
                  <Text fontSize="sm" color={mutedColor}>
                    Priority: {customer.priority}
                  </Text>
                )}
              </HStack>

              {customer.conversionDate && (
                <Text fontSize="sm" color={successColor}>
                  ✅ Converted on {new Date(customer.conversionDate).toLocaleDateString()}
                </Text>
              )}
            </VStack>

            {/* Action Buttons */}
            <VStack space={2}>
              {!isConverted && (
                <IconButton
                  icon={<Icon as={MaterialIcons} name="person-add" size="sm" />}
                  colorScheme="blue"
                  variant="ghost"
                  onPress={() => handleConvertCustomer(customer)}
                  _pressed={{ bg: 'blue.100' }}
                />
              )}
              <IconButton
                icon={<Icon as={MaterialIcons} name="visibility" size="sm" />}
                colorScheme="gray"
                variant="ghost"
                onPress={() => handleCustomerSelect(customer)}
                _pressed={{ bg: 'gray.100' }}
              />
            </VStack>
          </HStack>
        </Pressable>

        {/* Concise Expanded Details Section */}
        {isExpanded && (
          <VStack
            bg={useColorModeValue('gray.50', 'gray.800')}
            borderTopWidth={1}
            borderTopColor={borderColor}
            space={0}
            overflow="hidden"
          >
            {/* Quick Actions Bar */}
            <HStack space={2} p={3} bg={useColorModeValue('blue.50', 'blue.900')}>
              <Button
                size="sm"
                variant="outline"
                colorScheme="blue"
                leftIcon={<Icon as={MaterialIcons} name="edit" size="xs" />}
                onPress={() => handleCustomerSelect(customer)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorScheme="green"
                leftIcon={<Icon as={MaterialIcons} name="message" size="xs" />}
              >
                Message
              </Button>
              <Button
                size="sm"
                variant="solid"
                colorScheme="purple"
                leftIcon={<Icon as={MaterialIcons} name="info" size="xs" />}
                onPress={() => {
                  setSelectedCustomerForDetails(customer);
                  setShowDetailsModal(true);
                }}
              >
                Details
              </Button>
              {!isConverted && (
                <Button
                  size="sm"
                  variant="solid"
                  colorScheme="blue"
                  leftIcon={<Icon as={MaterialIcons} name="person-add" size="xs" />}
                  onPress={() => handleConvertCustomer(customer)}
                >
                  Convert
                </Button>
              )}
            </HStack>

            {/* Concise Information Display */}
            <VStack space={3} p={4}>
              {/* Key Information Grid */}
              <HStack space={4} justifyContent="space-between">
                <VStack alignItems="center" flex={1}>
                  <Text fontSize="xs" color={mutedColor}>Admission No</Text>
                  <Text fontSize="sm" fontWeight="bold" color={primaryColor}>
                    {(customer as any).admissionNo || 'N/A'}
                  </Text>
                </VStack>
                <VStack alignItems="center" flex={1}>
                  <Text fontSize="xs" color={mutedColor}>Roll No</Text>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>
                    {(customer as any).rollNo || 'N/A'}
                  </Text>
                </VStack>
                <VStack alignItems="center" flex={1}>
                  <Text fontSize="xs" color={mutedColor}>Events</Text>
                  <Text fontSize="sm" fontWeight="bold" color={successColor}>
                    {(customer as any)._count?.events || 0}
                  </Text>
                </VStack>
              </HStack>

              {/* Quick Stats */}
              {(customer as any).user && (
                <VStack space={2} p={3} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" color={successColor}>
                    Student Information
                  </Text>
                  <HStack justifyContent="space-between">
                    <Text fontSize="xs" color={mutedColor}>Full Name:</Text>
                    <Text fontSize="xs" color={textColor}>
                      {`${(customer as any).user?.firstName || ''} ${(customer as any).user?.middleName || ''} ${(customer as any).user?.lastName || ''}`.trim()}
                    </Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Text fontSize="xs" color={mutedColor}>Student Email:</Text>
                    <Text fontSize="xs" color={textColor}>
                      {(customer as any).user?.email || 'N/A'}
                    </Text>
                  </HStack>
                </VStack>
              )}

              {/* Recent Activity */}
              {(customer as any).events && (customer as any).events.length > 0 && (
                <VStack space={2}>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>
                    Recent Activity
                  </Text>
                  <VStack space={1}>
                    {(customer as any).events.slice(0, 2).map((event: any, index: number) => (
                      <HStack key={event.id} space={2} alignItems="center" p={2} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="md">
                        <Box 
                          w={2} 
                          h={2} 
                          bg={
                            event.severity === 'SUCCESS' ? successColor : 
                            event.severity === 'WARNING' ? warningColor : 
                            event.severity === 'ERROR' ? errorColor : primaryColor
                          } 
                          borderRadius="full" 
                        />
                        <VStack flex={1}>
                          <Text fontSize="xs" color={textColor} fontWeight="bold">
                            {event.title}
                          </Text>
                          <Text fontSize="xs" color={mutedColor}>
                            {new Date(event.createdAt).toLocaleDateString()}
                          </Text>
                        </VStack>
                      </HStack>
                    ))}
                    {(customer as any).events.length > 2 && (
                      <Text fontSize="xs" color={primaryColor} textAlign="center">
                        +{(customer as any).events.length - 2} more events
                      </Text>
                    )}
                  </VStack>
                </VStack>
              )}
            </VStack>
          </VStack>
        )}
      </Card>
    );
  };

  // Render analytics section
  const renderAnalytics = () => (
    <VStack space={4}>
      {/* Conversion Overview */}
      <Card bg={cardBg} borderRadius="lg" shadow={2}>
        <VStack space={4} p={4}>
          <Heading size="md" color={textColor}>Conversion Overview</Heading>
          
          <HStack space={4} justifyContent="space-between">
            <VStack alignItems="center" flex={1}>
              <Text style={[styles.statValue, { color: primaryColor }]}>
                {conversionAnalytics?.totalCustomers || 0}
              </Text>
              <Text fontSize="sm" color={mutedColor}>Total Visitors</Text>
            </VStack>
            
            <VStack alignItems="center" flex={1}>
              <Text fontSize="2xl" fontWeight="bold" color={successColor}>
                {conversionAnalytics?.convertedCustomers || 0}
              </Text>
              <Text fontSize="sm" color={mutedColor}>Converted</Text>
            </VStack>
            
            <VStack alignItems="center" flex={1}>
              <Text fontSize="2xl" fontWeight="bold" color={warningColor}>
                {conversionAnalytics?.unconvertedCustomers || 0}
              </Text>
              <Text fontSize="sm" color={mutedColor}>Unconverted</Text>
            </VStack>
            
            <VStack alignItems="center" flex={1}>
              <Text fontSize="2xl" fontWeight="bold" color={primaryColor}>
                {conversionAnalytics?.conversionRate ? `${(conversionAnalytics.conversionRate * 100).toFixed(1)}%` : '0%'}
              </Text>
              <Text fontSize="sm" color={mutedColor}>Conversion Rate</Text>
            </VStack>
          </HStack>
        </VStack>
      </Card>

      {/* Recent Conversions */}
      <Card bg={cardBg} borderRadius="lg" shadow={2}>
        <VStack space={4} p={4}>
          <Heading size="md" color={textColor}>Recent Conversions</Heading>
          
          {conversionHistory.length > 0 ? (
            <VStack space={3}>
              {conversionHistory.map((conversion, index) => (
                <HStack key={index} space={3} alignItems="center">
                  <Avatar size="sm" bg="green.500">
                    <Icon as={MaterialIcons} name="check" size="xs" color="white" />
                  </Avatar>
                  <VStack flex={1}>
                    <Text fontSize="sm" fontWeight="bold" color={textColor}>
                      {conversion.customer?.name} → {conversion.student?.user?.firstName} {conversion.student?.user?.lastName}
                    </Text>
                    <Text fontSize="xs" color={mutedColor}>
                      {new Date(conversion.conversionDate).toLocaleDateString()} - {conversion.conversionReason}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          ) : (
            <Text fontSize="sm" color={mutedColor} textAlign="center">
              No recent conversions
            </Text>
          )}
        </VStack>
      </Card>
    </VStack>
  );

  // Render section content
  const renderSectionContent = () => {
    console.log('Rendering section content:', {
      unconvertedCustomersLength: (unconvertedCustomers || []).length,
      convertedStudentsLength: (convertedStudents || []).length,
      unconvertedCustomers: unconvertedCustomers,
      convertedStudents: convertedStudents
    });
    
    switch (activeSection) {
      case 'unconverted':
        console.log('Rendering unconverted customers section:', {
          hasCustomers: (unconvertedCustomers || []).length > 0,
          customers: unconvertedCustomers
        });
        return (
          <VStack space={4}>
            {loading ? (
              <VStack space={4} py={8}>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} h="100px" rounded="lg" />
                ))}
              </VStack>
            ) : (unconvertedCustomers || []).length > 0 ? (
              <>
                {(unconvertedCustomers || []).map((customer, index) => {
                  try {
                    return renderCustomerCard(customer, false);
                  } catch (cardError) {
                    console.error('❌ Error rendering customer card:', cardError, customer);
                    // Fallback simple card
                    return (
                      <Card key={customer.id || index} bg={cardBg} p={3} mb={2}>
                        <VStack space={1}>
                          <Text fontSize="sm" fontWeight="bold">
                            {customer.name || 'Unknown Customer'}
                          </Text>
                          <Text fontSize="xs" color={mutedColor}>
                            {customer.email || 'No email'}
                          </Text>
                          <Text fontSize="xs" color={mutedColor}>
                            Status: {customer.status || 'Unknown'}
                          </Text>
                          <Text fontSize="xs" color="red.500">
                            [Fallback render - check console for errors]
                          </Text>
                        </VStack>
                      </Card>
                    );
                  }
                })}
                
                {/* Pagination Controller for Unconverted Customers */}
                <PaginationController
                  currentPage={unconvertedPage}
                  totalPages={unconvertedTotalPages}
                  totalItems={unconvertedTotal}
                  itemsPerPage={unconvertedPageSize}
                  onPageChange={handleUnconvertedPageChange}
                  onPageSizeChange={handleUnconvertedPageSizeChange}
                  loading={loading}
                  showPageSizeSelector={true}
                  pageSizeOptions={[10, 20, 50, 100]}
                  showItemsInfo={true}
                  maxVisiblePages={5}
                />
              </>
            ) : (
              <Center py={8}>
                <Icon as={MaterialIcons} name="people" size="xl" color={mutedColor} mb={2} />
                <Text fontSize="lg" color={mutedColor}>No unconverted customers</Text>
                <Text fontSize="sm" color={mutedColor}>All customers have been converted to students</Text>
              </Center>
            )}
          </VStack>
        );

      case 'converted':
        console.log('Rendering converted students section:', {
          hasStudents: (convertedStudents || []).length > 0,
          students: convertedStudents
        });
        return (
          <VStack space={4}>
            {loading ? (
              <VStack space={4} py={8}>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} h="100px" rounded="lg" />
                ))}
              </VStack>
            ) : (convertedStudents || []).length > 0 ? (
              <>
                {(convertedStudents || []).map((student: any, index) => {
                  try {
                    // Handle different student data structures
                    const studentName = student.user?.firstName && student.user?.lastName 
                      ? `${student.user.firstName} ${student.user.lastName}`
                      : student.name || student.firstName || student.lastName || 'Unknown Student';
                    
                    const studentEmail = student.user?.email || student.email || 'No email';
                    const studentPhone = student.user?.phone || student.phone || 'No phone';
                    
                    const customerData = {
                      id: student.id,
                      name: studentName,
                      email: studentEmail,
                      phone: studentPhone,
                      type: 'individual',
                      status: 'converted',
                      convertedToStudentId: student.id,
                      conversionDate: student.conversionDate || student.createdAt,
                      conversionReason: student.conversionReason || 'Converted to student',
                      createdAt: student.createdAt,
                      updatedAt: student.updatedAt,
                    } as Customer;
                    
                    return renderCustomerCard(customerData, true);
                  } catch (cardError) {
                    console.error('❌ Error rendering student card:', cardError, student);
                    // Fallback simple card
                    return (
                      <Card key={student.id || index} bg={cardBg} p={3} mb={2}>
                        <VStack space={1}>
                          <Text fontSize="sm" fontWeight="bold">
                            {(student.user?.firstName && student.user?.lastName) 
                              ? `${student.user.firstName} ${student.user.lastName}` 
                              : student.name || 'Unknown Student'}
                          </Text>
                          <Text fontSize="xs" color={mutedColor}>
                            {student.user?.email || student.email || 'No email'}
                          </Text>
                          <Text fontSize="xs" color={mutedColor}>
                            Admission: {student.admissionNo || 'N/A'}
                          </Text>
                          <Text fontSize="xs" color="red.500">
                            [Fallback render - check console for errors]
                          </Text>
                        </VStack>
                      </Card>
                    );
                  }
                })}
                
                {/* Pagination Controller for Converted Students */}
                <PaginationController
                  currentPage={convertedPage}
                  totalPages={convertedTotalPages}
                  totalItems={convertedTotal}
                  itemsPerPage={convertedPageSize}
                  onPageChange={handleConvertedPageChange}
                  onPageSizeChange={handleConvertedPageSizeChange}
                  loading={loading}
                  showPageSizeSelector={true}
                  pageSizeOptions={[10, 20, 50, 100]}
                  showItemsInfo={true}
                  maxVisiblePages={5}
                />
              </>
            ) : (
              <Center py={8}>
                <Icon as={MaterialIcons} name="school" size="xl" color={mutedColor} mb={2} />
                <Text fontSize="lg" color={mutedColor}>No converted students</Text>
                <Text fontSize="sm" color={mutedColor}>No customers have been converted yet</Text>
              </Center>
            )}
          </VStack>
        );

      case 'analytics':
        return renderAnalytics();

      default:
        return null;
    }
  };

  return (
    <Box flex={1} bg={bgColor}>
      {/* DEBUG PANEL - Remove this after debugging */}
      <Card bg="yellow.100" p={2} m={2} borderRadius="md">
        <VStack space={1}>
          <Text fontSize="xs" fontWeight="bold">DEBUG INFO:</Text>
          <Text fontSize="xs">Active Section: {activeSection}</Text>
          <Text fontSize="xs">Loading: {loading ? 'true' : 'false'}</Text>
          <Text fontSize="xs">Unconverted: {(unconvertedCustomers || []).length} items, Page {unconvertedPage}/{unconvertedTotalPages}, Total: {unconvertedTotal}</Text>
          <Text fontSize="xs">Converted: {(convertedStudents || []).length} items, Page {convertedPage}/{convertedTotalPages}, Total: {convertedTotal}</Text>
          <Text fontSize="xs">Page Sizes: U:{unconvertedPageSize}, C:{convertedPageSize}</Text>
          <HStack space={2} flexWrap="wrap">
            <Button size="xs" onPress={() => loadUnconvertedCustomers(1, false, unconvertedPageSize)}>
              Reload Unconverted
            </Button>
            <Button size="xs" onPress={() => loadConvertedStudents(1, false, convertedPageSize)}>
              Reload Converted
            </Button>
            <Button 
              size="xs" 
              colorScheme="red" 
              onPress={() => {
                // Reset all data and pagination state
                setUnconvertedCustomers([]);
                setConvertedStudents([]);
                setUnconvertedPage(1);
                setConvertedPage(1);
                setUnconvertedTotal(0);
                setConvertedTotal(0);
                setUnconvertedTotalPages(1);
                setConvertedTotalPages(1);
                setHasMoreUnconverted(true);
                setHasMoreConverted(true);
                
                // Reload current section
                if (activeSection === 'unconverted') {
                  loadUnconvertedCustomers(1, false, unconvertedPageSize);
                } else if (activeSection === 'converted') {
                  loadConvertedStudents(1, false, convertedPageSize);
                }
              }}
            >
              Force Refresh
            </Button>
          </HStack>
        </VStack>
      </Card>
      
      {/* Header with Search */}
      <VStack space={4} p={4}>
        <HStack space={3} alignItems="center">
          <Input
            flex={1}
            placeholder="Search customers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            InputLeftElement={
              <Icon as={MaterialIcons} name="search" size="sm" ml={2} color={mutedColor} />
            }
            bg={cardBg}
            borderWidth={1}
            borderColor={borderColor}
          />
          <Button size="sm" variant="outline" colorScheme="blue">
            <Icon as={MaterialIcons} name="filter-list" size="sm" />
          </Button>
        </HStack>

        {/* Section Tabs */}
        <HStack space={2}>
          <Button
            size="sm"
            variant={activeSection === 'unconverted' ? 'solid' : 'outline'}
            colorScheme="blue"
            onPress={() => setActiveSection('unconverted')}
            flex={1}
          >
            Unconverted ({(unconvertedCustomers || []).length})
          </Button>
          <Button
            size="sm"
            variant={activeSection === 'converted' ? 'solid' : 'outline'}
            colorScheme="green"
            onPress={() => setActiveSection('converted')}
            flex={1}
          >
            Converted ({(convertedStudents || []).length})
          </Button>
          <Button
            size="sm"
            variant={activeSection === 'analytics' ? 'solid' : 'outline'}
            colorScheme="purple"
            onPress={() => setActiveSection('analytics')}
            flex={1}
          >
            Analytics
          </Button>
        </HStack>
      </VStack>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderSectionContent()}
      </ScrollView>

      {/* Student Form for Customer Conversion */}
      <StudentForm
        isOpen={showStudentForm}
        onClose={handleStudentFormClose}
        onSubmit={handleStudentFormSubmit}
        customer={selectedCustomer}
        mode="convert"
      />

      {/* Comprehensive Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} size="6xl">
        <Modal.Content maxH="90vh">
          <Modal.Header>
            <HStack space={3} alignItems="center">
              <Avatar
                size="md"
                bg={`${selectedCustomerForDetails?.name?.charAt(0) === 'A' ? 'blue' : selectedCustomerForDetails?.name?.charAt(0) === 'F' ? 'green' : selectedCustomerForDetails?.name?.charAt(0) === 'N' ? 'purple' : 'orange'}.500`}
              >
                {selectedCustomerForDetails?.name?.charAt(0)}
              </Avatar>
              <VStack alignItems="flex-start" space={0}>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  {selectedCustomerForDetails?.name}
                </Text>
                <Text fontSize="sm" color={mutedColor}>
                  Complete Details & Analytics
                </Text>
              </VStack>
            </HStack>
          </Modal.Header>
          <Modal.Body>
            {selectedCustomerForDetails && (
              <VStack space={6}>
                {/* Overview Cards */}
                <HStack space={4} justifyContent="space-between">
                  <Card flex={1} bg={useColorModeValue('blue.50', 'blue.900')} p={4}>
                    <VStack alignItems="center" space={1}>
                      <Icon as={MaterialIcons} name="person" size="lg" color={primaryColor} />
                      <Text fontSize="lg" fontWeight="bold" color={primaryColor}>
                        {selectedCustomerForDetails.id}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>Student ID</Text>
                    </VStack>
                  </Card>
                  <Card flex={1} bg={useColorModeValue('green.50', 'green.900')} p={4}>
                    <VStack alignItems="center" space={1}>
                      <Icon as={MaterialIcons} name="event" size="lg" color={successColor} />
                      <Text fontSize="lg" fontWeight="bold" color={successColor}>
                        {selectedCustomerForDetails._count?.events || 0}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>Total Events</Text>
                    </VStack>
                  </Card>
                  <Card flex={1} bg={useColorModeValue('purple.50', 'purple.900')} p={4}>
                    <VStack alignItems="center" space={1}>
                      <Icon as={MaterialIcons} name="school" size="lg" color={warningColor} />
                      <Text fontSize="lg" fontWeight="bold" color={warningColor}>
                        {selectedCustomerForDetails.admissionNo || 'N/A'}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>Admission No</Text>
                    </VStack>
                  </Card>
                  <Card flex={1} bg={useColorModeValue('orange.50', 'orange.900')} p={4}>
                    <VStack alignItems="center" space={1}>
                      <Icon as={MaterialIcons} name="schedule" size="lg" color={errorColor} />
                      <Text fontSize="lg" fontWeight="bold" color={errorColor}>
                        {new Date(selectedCustomerForDetails.createdAt).toLocaleDateString()}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>Created Date</Text>
                    </VStack>
                  </Card>
                </HStack>

                {/* Detailed Information Tabs */}
                <VStack space={4}>
                  <HStack space={2} borderBottomWidth={1} borderBottomColor={borderColor} pb={2}>
                    <Button
                      size="sm"
                      variant={activeDetailsTab === 'personal' ? 'solid' : 'outline'}
                      colorScheme="blue"
                      leftIcon={<Icon as={MaterialIcons} name="person" size="xs" />}
                      onPress={() => setActiveDetailsTab('personal')}
                    >
                      Personal Info
                    </Button>
                    <Button
                      size="sm"
                      variant={activeDetailsTab === 'academic' ? 'solid' : 'outline'}
                      colorScheme="blue"
                      leftIcon={<Icon as={MaterialIcons} name="school" size="xs" />}
                      onPress={() => setActiveDetailsTab('academic')}
                    >
                      Academic
                    </Button>
                    <Button
                      size="sm"
                      variant={activeDetailsTab === 'financial' ? 'solid' : 'outline'}
                      colorScheme="blue"
                      leftIcon={<Icon as={MaterialIcons} name="account-balance" size="xs" />}
                      onPress={() => setActiveDetailsTab('financial')}
                    >
                      Financial
                    </Button>
                    <Button
                      size="sm"
                      variant={activeDetailsTab === 'events' ? 'solid' : 'outline'}
                      colorScheme="blue"
                      leftIcon={<Icon as={MaterialIcons} name="timeline" size="xs" />}
                      onPress={() => setActiveDetailsTab('events')}
                    >
                      Events
                    </Button>
                    <Button
                      size="sm"
                      variant={activeDetailsTab === 'raw' ? 'solid' : 'outline'}
                      colorScheme="blue"
                      leftIcon={<Icon as={MaterialIcons} name="code" size="xs" />}
                      onPress={() => setActiveDetailsTab('raw')}
                    >
                      Raw Data
                    </Button>
                  </HStack>

                  {/* Tab Content */}
                  {activeDetailsTab === 'personal' && (
                    <VStack space={4} p={4} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg">
                      <HStack alignItems="center" space={2}>
                        <Icon as={MaterialIcons} name="person" size="sm" color={primaryColor} />
                        <Text fontSize="md" fontWeight="bold" color={textColor}>
                          Personal Information
                        </Text>
                      </HStack>
                      
                      <VStack space={3}>
                        {/* Basic Info Grid */}
                        <HStack space={4} justifyContent="space-between">
                          <VStack flex={1} space={2}>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Full Name:</Text>
                              <Text fontSize="sm" color={textColor} fontWeight="bold">
                                {selectedCustomerForDetails.name || `${selectedCustomerForDetails.user?.firstName || ''} ${selectedCustomerForDetails.user?.lastName || ''}`.trim()}
                              </Text>
                            </HStack>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Email:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.email || selectedCustomerForDetails.user?.email || 'N/A'}
                              </Text>
                            </HStack>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Phone:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.phone || selectedCustomerForDetails.user?.phone || 'N/A'}
                              </Text>
                            </HStack>
                          </VStack>
                          
                          <VStack flex={1} space={2}>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Type:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.type || 'Individual'}
                              </Text>
                            </HStack>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Status:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.status || 'Active'}
                              </Text>
                            </HStack>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Blood Group:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.bloodGroup || 'N/A'}
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>

                        {/* Additional Personal Info */}
                        <VStack space={2} p={3} bg={useColorModeValue('white', 'gray.700')} borderRadius="md">
                          <HStack justifyContent="space-between">
                            <Text fontSize="sm" color={mutedColor}>Nationality:</Text>
                            <Text fontSize="sm" color={textColor}>
                              {selectedCustomerForDetails.nationality || 'N/A'}
                            </Text>
                          </HStack>
                          <HStack justifyContent="space-between">
                            <Text fontSize="sm" color={mutedColor}>Religion:</Text>
                            <Text fontSize="sm" color={textColor}>
                              {selectedCustomerForDetails.religion || 'N/A'}
                            </Text>
                          </HStack>
                          <HStack justifyContent="space-between">
                            <Text fontSize="sm" color={mutedColor}>Caste:</Text>
                            <Text fontSize="sm" color={textColor}>
                              {selectedCustomerForDetails.caste || 'N/A'}
                            </Text>
                          </HStack>
                          <HStack justifyContent="space-between">
                            <Text fontSize="sm" color={mutedColor}>Previous School:</Text>
                            <Text fontSize="sm" color={textColor}>
                              {selectedCustomerForDetails.previousSchool || 'N/A'}
                            </Text>
                          </HStack>
                          <HStack justifyContent="space-between">
                            <Text fontSize="sm" color={mutedColor}>Aadhar No:</Text>
                            <Text fontSize="sm" color={textColor}>
                              {selectedCustomerForDetails.aadharNo || 'N/A'}
                            </Text>
                          </HStack>
                        </VStack>

                        {/* User Details if available */}
                        {selectedCustomerForDetails.user && (
                          <VStack space={2} p={3} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
                            <Text fontSize="sm" fontWeight="bold" color={primaryColor}>User Details</Text>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>First Name:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.user.firstName || 'N/A'}
                              </Text>
                            </HStack>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Last Name:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.user.lastName || 'N/A'}
                              </Text>
                            </HStack>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>User Email:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.user.email || 'N/A'}
                              </Text>
                            </HStack>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>User Phone:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.user.phone || 'N/A'}
                              </Text>
                            </HStack>
                          </VStack>
                        )}
                      </VStack>
                    </VStack>
                  )}

                  {activeDetailsTab === 'academic' && (
                    <VStack space={4} p={4} bg={useColorModeValue('green.50', 'green.900')} borderRadius="lg">
                      <HStack alignItems="center" space={2}>
                        <Icon as={MaterialIcons} name="school" size="sm" color={successColor} />
                        <Text fontSize="md" fontWeight="bold" color={textColor}>
                          Academic Information
                        </Text>
                      </HStack>
                      
                      <VStack space={3}>
                        <HStack space={4} justifyContent="space-between">
                          <VStack flex={1} space={2}>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Admission No:</Text>
                              <Text fontSize="sm" color={textColor} fontWeight="bold">
                                {selectedCustomerForDetails.admissionNo || 'N/A'}
                              </Text>
                            </HStack>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Roll No:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.rollNo || 'N/A'}
                              </Text>
                            </HStack>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Class:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.class || 'N/A'}
                              </Text>
                            </HStack>
                          </VStack>
                          
                          <VStack flex={1} space={2}>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Section:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.section || 'N/A'}
                              </Text>
                            </HStack>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Grade:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.grade || 'N/A'}
                              </Text>
                            </HStack>
                            <HStack justifyContent="space-between">
                              <Text fontSize="sm" color={mutedColor}>Academic Year:</Text>
                              <Text fontSize="sm" color={textColor}>
                                {selectedCustomerForDetails.academicYear || 'N/A'}
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>
                      </VStack>
                    </VStack>
                  )}

                  {activeDetailsTab === 'financial' && (
                    <VStack space={4} p={4} bg={useColorModeValue('orange.50', 'orange.900')} borderRadius="lg">
                      <HStack alignItems="center" space={2}>
                        <Icon as={MaterialIcons} name="account-balance" size="sm" color={warningColor} />
                        <Text fontSize="md" fontWeight="bold" color={textColor}>
                          Financial Information
                        </Text>
                      </HStack>
                      
                      <VStack space={3}>
                        <Text fontSize="sm" color={mutedColor}>Financial data not available for this customer.</Text>
                      </VStack>
                    </VStack>
                  )}

                  {activeDetailsTab === 'events' && (
                    <VStack space={4} p={4} bg={useColorModeValue('purple.50', 'purple.900')} borderRadius="lg">
                      <HStack alignItems="center" space={2}>
                        <Icon as={MaterialIcons} name="timeline" size="sm" color={primaryColor} />
                        <Text fontSize="md" fontWeight="bold" color={textColor}>
                          Events & Activities
                        </Text>
                      </HStack>
                      
                      <VStack space={3}>
                        {selectedCustomerForDetails.events && selectedCustomerForDetails.events.length > 0 ? (
                          <VStack space={2}>
                            {selectedCustomerForDetails.events.map((event: any, index: number) => (
                              <Card key={index} bg={useColorModeValue('white', 'gray.700')} p={3}>
                                <VStack space={2}>
                                  <HStack justifyContent="space-between">
                                    <Text fontSize="sm" fontWeight="bold" color={textColor}>
                                      {event.title || event.name || 'Event'}
                                    </Text>
                                    <Badge colorScheme="blue" size="sm">
                                      {event.type || 'Event'}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="xs" color={mutedColor}>
                                    {event.description || 'No description available'}
                                  </Text>
                                  <Text fontSize="xs" color={mutedColor}>
                                    Date: {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                                  </Text>
                                </VStack>
                              </Card>
                            ))}
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color={mutedColor}>No events found for this customer.</Text>
                        )}
                      </VStack>
                    </VStack>
                  )}

                  {activeDetailsTab === 'raw' && (
                    <VStack space={4} p={4} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg">
                      <HStack alignItems="center" space={2}>
                        <Icon as={MaterialIcons} name="code" size="sm" color={mutedColor} />
                        <Text fontSize="md" fontWeight="bold" color={textColor}>
                          Raw Data
                        </Text>
                      </HStack>
                      
                      <VStack space={2}>
                        <Text fontSize="xs" color={mutedColor}>Created At: {new Date(selectedCustomerForDetails.createdAt).toLocaleString()}</Text>
                        <Text fontSize="xs" color={mutedColor}>Updated At: {new Date(selectedCustomerForDetails.updatedAt).toLocaleString()}</Text>
                        <Text fontSize="xs" color={mutedColor}>ID: {selectedCustomerForDetails.id}</Text>
                        <Text fontSize="xs" color={mutedColor}>Type: {selectedCustomerForDetails.type}</Text>
                        <Text fontSize="xs" color={mutedColor}>Status: {selectedCustomerForDetails.status}</Text>
                        {selectedCustomerForDetails._count && (
                          <VStack space={1} mt={2}>
                            <Text fontSize="xs" color={mutedColor} fontWeight="bold">Counts:</Text>
                            <Text fontSize="xs" color={mutedColor}>Events: {selectedCustomerForDetails._count.events || 0}</Text>
                            <Text fontSize="xs" color={mutedColor}>Payments: {selectedCustomerForDetails._count.payments || 0}</Text>
                            <Text fontSize="xs" color={mutedColor}>Documents: {selectedCustomerForDetails._count.documents || 0}</Text>
                          </VStack>
                        )}
                      </VStack>
                    </VStack>
                  )}
                </VStack>
              </VStack>
            )}
          </Modal.Body>
          <Modal.Footer>
            <HStack space={3} justifyContent="flex-end">
              <Button
                variant="outline"
                onPress={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              <Button
                colorScheme="blue"
                leftIcon={<Icon as={MaterialIcons} name="edit" size="sm" />}
                onPress={() => {
                  setShowDetailsModal(false);
                  handleCustomerSelect(selectedCustomerForDetails);
                }}
              >
                Edit Customer
              </Button>
            </HStack>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default CustomersTab; 