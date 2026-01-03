import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Spinner,
  Alert,
  Checkbox,
  Radio,
  Switch,
  Slider,
  Fab,
  AlertDialog,
  useDisclose,
  FormControl,
  TextArea,
  Calendar,
  Actionsheet,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions, Animated, RefreshControl } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import SMSStatusIndicator from '../../../components/attendance/SMSStatusIndicator';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

interface AttendanceTabProps {
  selectedClass: any;
  onClassSelect: (classItem: any) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({
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
  
  // Additional color values for render functions
  const greenCardBg = useColorModeValue('green.50', 'green.900');
  const orangeCardBg = useColorModeValue('orange.50', 'orange.900');
  const redCardBg = useColorModeValue('red.50', 'red.900');
  const blueCardBg = useColorModeValue('blue.50', 'blue.900');

  // State
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMode, setAttendanceMode] = useState<'manual' | 'qr' | 'bulk'>('manual');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today');
  const [animationValue] = useState(new Animated.Value(0));
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMarking, setIsMarking] = useState(false);

  // Hooks
  const toast = useToast();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclose();

  // Enhanced dummy data with comprehensive attendance records
  const mockStudents = useMemo(() => [
    {
      id: 1,
      name: 'John Smith',
      rollNumber: '2024001',
      avatar: null,
      status: 'present',
      checkInTime: '08:45 AM',
      checkOutTime: null,
      totalClasses: 120,
      presentDays: 114,
      absentDays: 6,
      lateDays: 3,
      attendancePercentage: 95.0,
      lastAttendance: '2024-01-20',
      streak: 15,
      monthlyAttendance: [95, 92, 97, 94],
      weeklyPattern: ['P', 'P', 'P', 'P', 'P'],
      notes: '',
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      rollNumber: '2024002',
      avatar: null,
      status: 'present',
      checkInTime: '08:50 AM',
      checkOutTime: null,
      totalClasses: 120,
      presentDays: 106,
      absentDays: 14,
      lateDays: 8,
      attendancePercentage: 88.3,
      lastAttendance: '2024-01-20',
      streak: 8,
      monthlyAttendance: [90, 85, 88, 92],
      weeklyPattern: ['P', 'P', 'A', 'P', 'P'],
      notes: 'Medical leave on Wednesday',
    },
    {
      id: 3,
      name: 'Michael Brown',
      rollNumber: '2024003',
      avatar: null,
      status: 'late',
      checkInTime: '09:15 AM',
      checkOutTime: null,
      totalClasses: 120,
      presentDays: 110,
      absentDays: 10,
      lateDays: 12,
      attendancePercentage: 91.7,
      lastAttendance: '2024-01-20',
      streak: 5,
      monthlyAttendance: [88, 94, 92, 91],
      weeklyPattern: ['P', 'L', 'P', 'P', 'P'],
      notes: 'Frequent late arrivals',
    },
    {
      id: 4,
      name: 'Emily Davis',
      rollNumber: '2024004',
      avatar: null,
      status: 'absent',
      checkInTime: null,
      checkOutTime: null,
      totalClasses: 120,
      presentDays: 102,
      absentDays: 18,
      lateDays: 5,
      attendancePercentage: 85.0,
      lastAttendance: '2024-01-19',
      streak: 0,
      monthlyAttendance: [82, 87, 85, 86],
      weeklyPattern: ['P', 'P', 'P', 'A', 'P'],
      notes: 'Sick leave',
    },
    {
      id: 5,
      name: 'David Wilson',
      rollNumber: '2024005',
      avatar: null,
      status: 'excused',
      checkInTime: null,
      checkOutTime: null,
      totalClasses: 120,
      presentDays: 95,
      absentDays: 25,
      lateDays: 2,
      attendancePercentage: 79.2,
      lastAttendance: '2024-01-18',
      streak: 0,
      monthlyAttendance: [75, 80, 78, 84],
      weeklyPattern: ['P', 'E', 'P', 'P', 'A'],
      notes: 'Family emergency',
    },
  ], []);

  // Enhanced chart data
  const attendanceData = useMemo(() => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        data: [95, 88, 92, 85, 90],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 3,
        label: 'This Week'
      },
      {
        data: [92, 85, 89, 88, 87],
        color: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
        strokeWidth: 2,
        label: 'Last Week'
      }
    ]
  }), []);

  const statusDistribution = useMemo(() => [
    { name: 'Present', population: mockStudents.filter(s => s.status === 'present').length, color: '#10B981', legendFontColor: textColor, legendFontSize: 12 },
    { name: 'Late', population: mockStudents.filter(s => s.status === 'late').length, color: '#F59E0B', legendFontColor: textColor, legendFontSize: 12 },
    { name: 'Absent', population: mockStudents.filter(s => s.status === 'absent').length, color: '#EF4444', legendFontColor: textColor, legendFontSize: 12 },
    { name: 'Excused', population: mockStudents.filter(s => s.status === 'excused').length, color: '#3B82F6', legendFontColor: textColor, legendFontSize: 12 },
  ], [mockStudents, textColor]);

  // Chart config
  const chartLabelColor = useColorModeValue('rgba(55, 65, 81, 1)', 'rgba(229, 231, 235, 1)');
  const chartConfig = {
    backgroundColor: cardBg,
    backgroundGradientFrom: cardBg,
    backgroundGradientTo: cardBg,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
    labelColor: (opacity = 1) => chartLabelColor.replace('1)', `${opacity})`),
    style: {
      borderRadius: 16
    },
  };

  // Effects
  useEffect(() => {
    loadAttendance();
  }, [selectedClass, selectedDate, viewMode]);

  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [animationValue]);

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadAttendance();
        toast.show({
          description: 'Attendance data refreshed',
          duration: 2000,
        });
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, toast]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAttendance(mockStudents);
    } catch (error) {
      
      toast.show({
        description: 'Failed to load attendance data',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: number, status: string, notes?: string) => {
    setIsMarking(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAttendance(prev => prev.map(student => 
        student.id === studentId 
          ? { 
              ...student, 
              status, 
              checkInTime: status === 'present' || status === 'late' ? new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : null,
              notes: notes || student.notes
            }
          : student
      ));
      
      toast.show({
        description: `Attendance marked as ${status}`,
        duration: 2000,
      });
    } catch (error) {
      
      toast.show({
        description: 'Failed to mark attendance',
        duration: 3000,
      });
    } finally {
      setIsMarking(false);
    }
  };

  const bulkMarkAttendance = async (studentIds: number[], status: string) => {
    setIsMarking(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAttendance(prev => prev.map(student => 
        studentIds.includes(student.id)
          ? { 
              ...student, 
              status, 
              checkInTime: status === 'present' || status === 'late' ? new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : null
            }
          : student
      ));
      
      toast.show({
        description: `Bulk attendance marked for ${studentIds.length} students`,
        duration: 2000,
      });
      
      setSelectedStudents([]);
      setShowBulkModal(false);
    } catch (error) {
      
      toast.show({
        description: 'Failed to mark bulk attendance',
        duration: 3000,
      });
    } finally {
      setIsMarking(false);
    }
  };

  // Enhanced header with real-time stats
  const renderHeader = () => {
    const presentCount = mockStudents.filter(s => s.status === 'present').length;
    const lateCount = mockStudents.filter(s => s.status === 'late').length;
    const absentCount = mockStudents.filter(s => s.status === 'absent').length;
    const excusedCount = mockStudents.filter(s => s.status === 'excused').length;
    const totalCount = mockStudents.length;
    const attendanceRate = ((presentCount + lateCount) / totalCount * 100).toFixed(1);

    return (
      <VStack space={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Heading size="lg" color={textColor}>
              Attendance Tracking
            </Heading>
            <HStack alignItems="center" space={2}>
              <Text color={mutedColor} fontSize="sm">
                {selectedClass?.name || 'Select a class'} • {selectedDate}
              </Text>
              <Badge colorScheme="green" variant="subtle" borderRadius="full">
                {attendanceRate}% Present
              </Badge>
            </HStack>
          </VStack>
          <HStack space={2}>
            <Switch
              size="sm"
              isChecked={autoRefresh}
              onToggle={setAutoRefresh}
              colorScheme="blue"
            />
            <Text fontSize="xs" color={mutedColor}>Live</Text>
            <Button
              size="sm"
              colorScheme="blue"
              onPress={() => setShowQRModal(true)}
              leftIcon={<Icon as={MaterialIcons} name="qr_code_scanner" size="sm" />}
            >
              QR Scan
            </Button>
          </HStack>
        </HStack>

        {/* Real-time Stats Cards */}
        <SimpleGrid columns={4} space={2}>
          <Card bg={greenCardBg} borderRadius="lg" p={3}>
            <VStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="check_circle" size="lg" color="green.500" />
              <Text fontSize="xl" fontWeight="bold" color="green.500">
                {presentCount}
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Present
              </Text>
            </VStack>
          </Card>

          <Card bg={orangeCardBg} borderRadius="lg" p={3}>
            <VStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="schedule" size="lg" color="orange.500" />
              <Text fontSize="xl" fontWeight="bold" color="orange.500">
                {lateCount}
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Late
              </Text>
            </VStack>
          </Card>

          <Card bg={redCardBg} borderRadius="lg" p={3}>
            <VStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="cancel" size="lg" color="red.500" />
              <Text fontSize="xl" fontWeight="bold" color="red.500">
                {absentCount}
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Absent
              </Text>
            </VStack>
          </Card>

          <Card bg={blueCardBg} borderRadius="lg" p={3}>
            <VStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="event_available" size="lg" color="blue.500" />
              <Text fontSize="xl" fontWeight="bold" color="blue.500">
                {excusedCount}
              </Text>
              <Text fontSize="xs" color={mutedColor} textAlign="center">
                Excused
              </Text>
            </VStack>
          </Card>
        </SimpleGrid>

        {/* Controls and Filters */}
        <Card bg={cardBg} borderRadius="xl" p={4}>
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="bold" color={textColor}>Controls & Filters</Text>
              <Button
                size="xs"
                variant="ghost"
                onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
                rightIcon={<Icon as={MaterialIcons} name={showAdvancedFilters ? "expand_less" : "expand_more"} size="sm" />}
              >
                {showAdvancedFilters ? 'Less' : 'More'}
              </Button>
            </HStack>

            <HStack space={3} flexWrap="wrap">
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                InputLeftElement={<Icon as={MaterialIcons} name="search" size="sm" ml={2} />}
                size="sm"
                flex={1}
                minW="150"
              />

              <Select
                selectedValue={viewMode}
                onValueChange={setViewMode}
                placeholder="View"
                minW="100"
                size="sm"
                bg={cardBg}
                _selectedItem={{
                  bg: 'blue.500',
                  endIcon: <CheckIcon size="4" />
                }}
              >
                <Select.Item label="Today" value="today" />
                <Select.Item label="This Week" value="week" />
                <Select.Item label="This Month" value="month" />
              </Select>

              <Select
                selectedValue={filterStatus}
                onValueChange={setFilterStatus}
                placeholder="Status"
                minW="100"
                size="sm"
                bg={cardBg}
                _selectedItem={{
                  bg: 'blue.500',
                  endIcon: <CheckIcon size="4" />
                }}
              >
                <Select.Item label="All Status" value="all" />
                <Select.Item label="Present" value="present" />
                <Select.Item label="Late" value="late" />
                <Select.Item label="Absent" value="absent" />
                <Select.Item label="Excused" value="excused" />
              </Select>
            </HStack>

            {showAdvancedFilters && (
              <VStack space={3}>
                <Divider />
                <HStack space={3} flexWrap="wrap">
                  <Button
                    size="sm"
                    variant={attendanceMode === 'manual' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    onPress={() => setAttendanceMode('manual')}
                    leftIcon={<Icon as={MaterialIcons} name="touch_app" size="sm" />}
                  >
                    Manual
                  </Button>
                  <Button
                    size="sm"
                    variant={attendanceMode === 'qr' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    onPress={() => setAttendanceMode('qr')}
                    leftIcon={<Icon as={MaterialIcons} name="qr_code" size="sm" />}
                  >
                    QR Code
                  </Button>
                  <Button
                    size="sm"
                    variant={attendanceMode === 'bulk' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    onPress={() => setAttendanceMode('bulk')}
                    leftIcon={<Icon as={MaterialIcons} name="select_all" size="sm" />}
                  >
                    Bulk
                  </Button>
                </HStack>

                {selectedStudents.length > 0 && (
                  <HStack space={2}>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onPress={() => bulkMarkAttendance(selectedStudents, 'present')}
                      isLoading={isMarking}
                    >
                      Mark Present ({selectedStudents.length})
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onPress={() => bulkMarkAttendance(selectedStudents, 'absent')}
                      isLoading={isMarking}
                    >
                      Mark Absent ({selectedStudents.length})
                    </Button>
                  </HStack>
                )}
              </VStack>
            )}
          </VStack>
        </Card>
      </VStack>
    );
  };

  // Enhanced student attendance card
  const renderStudentCard = (student: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'present': return 'green';
        case 'late': return 'orange';
        case 'absent': return 'red';
        case 'excused': return 'blue';
        default: return 'gray';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'present': return 'check_circle';
        case 'late': return 'schedule';
        case 'absent': return 'cancel';
        case 'excused': return 'event_available';
        default: return 'help';
      }
    };

    return (
      <Pressable
        key={student.id}
        onLongPress={() => {
          if (selectedStudents.includes(student.id)) {
            setSelectedStudents(prev => prev.filter(id => id !== student.id));
          } else {
            setSelectedStudents(prev => [...prev, student.id]);
          }
        }}
      >
        {({ isPressed }) => (
          <Animated.View
            style={{
              opacity: animationValue,
              transform: [{
                scale: isPressed ? 0.98 : 1,
              }],
            }}
          >
            <Card
              bg={selectedStudents.includes(student.id) ? blueCardBg : cardBg}
              borderRadius="xl"
              borderWidth={selectedStudents.includes(student.id) ? 2 : 1}
              borderColor={selectedStudents.includes(student.id) ? 'blue.500' : borderColor}
              shadow={2}
            >
              <VStack space={3} p={4}>
                <HStack justifyContent="space-between" alignItems="flex-start">
                  <HStack space={3} alignItems="center" flex={1}>
                    <Avatar
                      size="md"
                      bg="blue.500"
                      source={{ uri: student.avatar }}
                    >
                      {student.name.charAt(0)}
                    </Avatar>
                    <VStack flex={1} space={1}>
                      <HStack alignItems="center" space={2}>
                        <Text fontWeight="bold" fontSize="md" color={textColor}>
                          {student.name}
                        </Text>
                        {selectedStudents.includes(student.id) && (
                          <Icon as={MaterialIcons} name="check_circle" color="blue.500" size="sm" />
                        )}
                      </HStack>
                      <Text fontSize="sm" color={mutedColor}>
                        {student.rollNumber}
                      </Text>
                      {student.checkInTime && (
                        <Text fontSize="xs" color="green.500">
                          Check-in: {student.checkInTime}
                        </Text>
                      )}
                      {student.notes && (
                        <Text fontSize="xs" color={mutedColor} italic>
                          {student.notes}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                  <VStack alignItems="flex-end" space={2}>
                    <Badge
                      colorScheme={getStatusColor(student.status)}
                      variant="solid"
                      borderRadius="full"
                      leftIcon={<Icon as={MaterialIcons} name={getStatusIcon(student.status)} size="xs" />}
                    >
                      {student.status.toUpperCase()}
                    </Badge>
                    <Text fontSize="xs" color={mutedColor}>
                      {student.attendancePercentage}%
                    </Text>
                  </VStack>
                </HStack>

                <Divider />

                <VStack space={2}>
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm" color={mutedColor}>Attendance Rate</Text>
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      {student.presentDays}/{student.totalClasses}
                    </Text>
                  </HStack>
                  <Progress
                    value={student.attendancePercentage}
                    size="sm"
                    colorScheme={student.attendancePercentage >= 90 ? 'green' : student.attendancePercentage >= 80 ? 'orange' : 'red'}
                  />

                  <HStack justifyContent="space-between" alignItems="center">
                    <VStack>
                      <Text fontSize="xs" color={mutedColor}>Streak</Text>
                      <HStack alignItems="center" space={1}>
                        <Icon as={MaterialIcons} name="local_fire_department" size="sm" color="orange.500" />
                        <Text fontSize="sm" fontWeight="bold" color={textColor}>
                          {student.streak} days
                        </Text>
                      </HStack>
                    </VStack>
                    
                    <VStack>
                      <Text fontSize="xs" color={mutedColor}>This Week</Text>
                      <HStack space={1}>
                        {student.weeklyPattern.map((day: string, idx: number) => (
                          <Badge
                            key={idx}
                            size="xs"
                            colorScheme={day === 'P' ? 'green' : day === 'L' ? 'orange' : day === 'A' ? 'red' : 'blue'}
                            variant="solid"
                          >
                            {day}
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  </HStack>
                </VStack>

                {/* Quick Actions */}
                <HStack space={2} justifyContent="space-between">
                  <Button
                    size="xs"
                    colorScheme="green"
                    variant={student.status === 'present' ? 'solid' : 'outline'}
                    onPress={() => markAttendance(student.id, 'present')}
                    isLoading={isMarking}
                    leftIcon={<Icon as={MaterialIcons} name="check" size="xs" />}
                  >
                    Present
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="orange"
                    variant={student.status === 'late' ? 'solid' : 'outline'}
                    onPress={() => markAttendance(student.id, 'late')}
                    isLoading={isMarking}
                    leftIcon={<Icon as={MaterialIcons} name="schedule" size="xs" />}
                  >
                    Late
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="red"
                    variant={student.status === 'absent' ? 'solid' : 'outline'}
                    onPress={() => markAttendance(student.id, 'absent')}
                    isLoading={isMarking}
                    leftIcon={<Icon as={MaterialIcons} name="close" size="xs" />}
                  >
                    Absent
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    variant={student.status === 'excused' ? 'solid' : 'outline'}
                    onPress={() => markAttendance(student.id, 'excused')}
                    isLoading={isMarking}
                    leftIcon={<Icon as={MaterialIcons} name="event_available" size="xs" />}
                  >
                    Excused
                  </Button>
                </HStack>

                {/* SMS Status Indicators */}
                {student.attendanceId && (
                  <VStack space={1} mt={2}>
                    <Divider />
                    <Text fontSize="xs" color={mutedColor} fontWeight="medium">SMS Notifications</Text>
                    <HStack space={2} flexWrap="wrap">
                      {student.checkInTime && (
                        <SMSStatusIndicator
                          attendanceId={student.attendanceId}
                          smsType="in"
                          status={student.smsInStatus || 'PENDING'}
                          error={student.smsInError}
                          sentAt={student.smsInSentAt}
                          attempts={student.smsInAttempts || 0}
                          onResendSuccess={() => {
                            // Reload attendance data after successful resend
                            fetchAttendanceData();
                          }}
                        />
                      )}
                      {student.checkOutTime && (
                        <SMSStatusIndicator
                          attendanceId={student.attendanceId}
                          smsType="out"
                          status={student.smsOutStatus || 'PENDING'}
                          error={student.smsOutError}
                          sentAt={student.smsOutSentAt}
                          attempts={student.smsOutAttempts || 0}
                          onResendSuccess={() => {
                            // Reload attendance data after successful resend
                            fetchAttendanceData();
                          }}
                        />
                      )}
                    </HStack>
                  </VStack>
                )}
              </VStack>
            </Card>
          </Animated.View>
        )}
      </Pressable>
    );
  };

  // Enhanced analytics section
  const renderAnalytics = () => (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Heading size="md" color={textColor}>Attendance Analytics</Heading>
          <Text fontSize="sm" color={mutedColor}>Trends and insights</Text>
        </VStack>
        <Button size="sm" variant="outline" colorScheme="blue">
          Export Report
        </Button>
      </HStack>
      
      <Card bg={cardBg} borderRadius="xl" p={4} shadow={2}>
        <VStack space={3}>
          <Text fontWeight="bold" color={textColor}>Weekly Attendance Trends</Text>
          <LineChart
            data={attendanceData}
            width={chartWidth - 32}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            withDots={true}
            withShadow={true}
          />
        </VStack>
      </Card>

      <Card bg={cardBg} borderRadius="xl" p={4} shadow={2}>
        <VStack space={3}>
          <Text fontWeight="bold" color={textColor}>Today's Status Distribution</Text>
          <PieChart
            data={statusDistribution}
            width={chartWidth - 32}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </VStack>
      </Card>
    </VStack>
  );

  if (loading && !refreshing) {
    return (
      <VStack space={4} p={4}>
        <Skeleton h="20" borderRadius="xl" />
        <SimpleGrid columns={4} space={2}>
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} h="20" borderRadius="lg" />
          ))}
        </SimpleGrid>
        <VStack space={3}>
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} h="40" borderRadius="xl" />
          ))}
        </VStack>
      </VStack>
    );
  }

  return (
    <ScrollView
      bg={bgColor}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <VStack space={6} p={4} pb={8}>
        {renderHeader()}
        
        {/* Students Attendance List */}
        <VStack space={4}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              Students ({mockStudents.length})
            </Text>
            <HStack space={2}>
              <Button
                size="xs"
                variant="outline"
                onPress={() => setSelectedStudents(mockStudents.map(s => s.id))}
              >
                Select All
              </Button>
              <Button
                size="xs"
                variant="outline"
                onPress={() => setSelectedStudents([])}
              >
                Clear
              </Button>
            </HStack>
          </HStack>
          
          <VStack space={3}>
            {mockStudents
              .filter(student => 
                (filterStatus === 'all' || student.status === filterStatus) &&
                (searchQuery === '' || 
                 student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 student.rollNumber.includes(searchQuery))
              )
              .map((student) => renderStudentCard(student))}
          </VStack>
        </VStack>

        {renderAnalytics()}

        {/* Floating Action Button */}
        <Fab
          renderInPortal={false}
          shadow={2}
          size="sm"
          icon={<Icon color="white" as={MaterialIcons} name="qr_code_scanner" size="sm" />}
          colorScheme="blue"
          onPress={() => setShowQRModal(true)}
        />
      </VStack>

      {/* QR Code Scanner Modal */}
      <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} size="xl">
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>QR Code Scanner</Modal.Header>
          <Modal.Body>
            <VStack space={4} alignItems="center">
              <Box w="200" h="200" bg="gray.100" borderRadius="lg" alignItems="center" justifyContent="center">
                <Icon as={MaterialIcons} name="qr_code_scanner" size="6xl" color="gray.400" />
                <Text mt={2} color="gray.500">Camera View</Text>
              </Box>
              
              <Text textAlign="center" color={mutedColor}>
                Position the QR code within the frame to automatically mark attendance
              </Text>
              
              <Alert status="info" borderRadius="lg">
                <Alert.Icon />
                <Text fontSize="sm">
                  Students can scan their unique QR codes to mark attendance automatically
                </Text>
              </Alert>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={() => setShowQRModal(false)}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue"
                onPress={() => {
                  toast.show({ description: 'QR code scanned successfully!' });
                  setShowQRModal(false);
                }}
              >
                Simulate Scan
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
};

export default AttendanceTab; 
