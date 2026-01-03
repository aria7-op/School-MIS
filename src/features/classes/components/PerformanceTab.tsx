import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Text, VStack, HStack, Card, Button, Badge, Icon, useColorModeValue,
  Skeleton, Progress, Avatar, Divider, ScrollView, Pressable, Center, Heading,
  SimpleGrid, Input, Select, CheckIcon, Modal, useToast, Switch, Slider,
  Fab, useDisclose, FormControl, Radio, Checkbox,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Dimensions, Animated, RefreshControl } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

interface PerformanceTabProps {
  selectedClass: any;
  onClassSelect: (classItem: any) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({
  selectedClass, onClassSelect, onRefresh, refreshing,
}) => {
  // Theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  // State
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [viewMode, setViewMode] = useState<'charts' | 'students' | 'subjects'>('charts');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [animationValue] = useState(new Animated.Value(0));
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);

  // Hooks
  const toast = useToast();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclose();

  // Enhanced dummy data
  const mockData = useMemo(() => ({
    overview: {
      classAverage: 87.5,
      improvement: 12.3,
      topPerformers: 8,
      needsAttention: 3,
      attendanceImpact: 0.85,
      engagementScore: 4.2
    },
    students: [
      { id: '1', name: 'Alice Johnson', average: 94.5, trend: 'up', subjects: { math: 96, science: 93, english: 94 }, attendance: 98, rank: 1 },
      { id: '2', name: 'Bob Smith', average: 91.2, trend: 'up', subjects: { math: 89, science: 94, english: 90 }, attendance: 95, rank: 2 },
      { id: '3', name: 'Carol Davis', average: 88.7, trend: 'stable', subjects: { math: 87, science: 90, english: 89 }, attendance: 92, rank: 3 },
      { id: '4', name: 'David Wilson', average: 85.3, trend: 'up', subjects: { math: 83, science: 88, english: 85 }, attendance: 89, rank: 4 },
      { id: '5', name: 'Emma Brown', average: 82.1, trend: 'down', subjects: { math: 80, science: 85, english: 81 }, attendance: 87, rank: 5 },
    ],
    subjects: [
      { name: 'Mathematics', average: 87.2, students: 28, improvement: 5.3, difficulty: 'high' },
      { name: 'Science', average: 89.1, students: 28, improvement: 8.7, difficulty: 'medium' },
      { name: 'English', average: 91.3, students: 28, improvement: 3.2, difficulty: 'low' },
      { name: 'History', average: 83.8, students: 28, improvement: -2.1, difficulty: 'medium' },
    ],
    trends: {
      weekly: [82, 85, 87, 89, 88, 91, 87],
      monthly: [85, 87, 89, 88, 90, 87],
      performance: [78, 82, 85, 87, 89, 91, 87, 89, 92, 88, 90, 87]
    }
  }), []);

  // Chart configurations
  const chartLabelColor = useColorModeValue('rgba(55, 65, 81, 1)', 'rgba(229, 231, 235, 1)');
  const chartConfig = {
    backgroundColor: cardBg,
    backgroundGradientFrom: cardBg,
    backgroundGradientTo: cardBg,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => chartLabelColor.replace('1)', `${opacity})`),
    style: { borderRadius: 16 },
  };

  const performanceData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: mockData.trends.monthly,
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 3
    }]
  }), [mockData]);

  const subjectData = useMemo(() => ({
    labels: mockData.subjects.map(s => s.name.substring(0, 4)),
    datasets: [{ data: mockData.subjects.map(s => s.average) }]
  }), [mockData]);

  const gradeDistribution = useMemo(() => [
    { name: 'A+', population: 8, color: '#10B981', legendFontColor: textColor, legendFontSize: 12 },
    { name: 'A', population: 10, color: '#3B82F6', legendFontColor: textColor, legendFontSize: 12 },
    { name: 'B+', population: 6, color: '#F59E0B', legendFontColor: textColor, legendFontSize: 12 },
    { name: 'B', population: 3, color: '#EF4444', legendFontColor: textColor, legendFontSize: 12 },
    { name: 'C', population: 1, color: '#6B7280', legendFontColor: textColor, legendFontSize: 12 },
  ], [textColor]);

  // Effects
  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Enhanced header
  const renderHeader = () => (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Heading size="lg" color={textColor}>Performance Analytics</Heading>
          <HStack alignItems="center" space={2}>
            <Text color={mutedColor} fontSize="sm">
              {selectedClass?.name || 'All Classes'} • {selectedPeriod} view
            </Text>
            <Badge colorScheme="blue" variant="subtle" borderRadius="full">Real-time</Badge>
          </HStack>
        </VStack>
        <HStack space={2}>
          <Switch size="sm" isChecked={autoRefresh} onToggle={setAutoRefresh} colorScheme="blue" />
          <Text fontSize="xs" color={mutedColor}>Auto</Text>
          <Button size="sm" variant="outline" onPress={onSettingsOpen} leftIcon={<Icon as={MaterialIcons} name="settings" size="sm" />}>
            Settings
          </Button>
        </HStack>
      </HStack>

      {/* Controls */}
      <Card bg={cardBg} borderRadius="xl" p={4}>
        <VStack space={3}>
          <Text fontWeight="bold" color={textColor}>Analytics Controls</Text>
          <HStack space={3} flexWrap="wrap">
            <Select selectedValue={selectedPeriod} onValueChange={setSelectedPeriod} placeholder="Period" minW="120" size="sm" bg={cardBg}>
              <Select.Item label="This Week" value="week" />
              <Select.Item label="This Month" value="month" />
              <Select.Item label="This Quarter" value="quarter" />
            </Select>
            <Select selectedValue={selectedMetric} onValueChange={setSelectedMetric} placeholder="Metric" minW="120" size="sm" bg={cardBg}>
              <Select.Item label="Overall" value="overall" />
              <Select.Item label="By Subject" value="subject" />
              <Select.Item label="By Student" value="student" />
            </Select>
            <HStack space={2}>
              {['charts', 'students', 'subjects'].map((mode) => (
                <Button key={mode} size="sm" variant={viewMode === mode ? 'solid' : 'outline'} colorScheme="blue" onPress={() => setViewMode(mode as any)}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </HStack>
          </HStack>
        </VStack>
      </Card>

      {/* KPI Cards */}
      <SimpleGrid columns={4} space={2}>
        {[
          { label: 'Class Average', value: `${mockData.overview.classAverage}%`, color: 'blue', icon: 'trending_up' },
          { label: 'Improvement', value: `+${mockData.overview.improvement}%`, color: 'green', icon: 'arrow_upward' },
          { label: 'Top Performers', value: mockData.overview.topPerformers, color: 'purple', icon: 'star' },
          { label: 'Needs Attention', value: mockData.overview.needsAttention, color: 'orange', icon: 'warning' },
        ].map((kpi, index) => (
          <Animated.View key={kpi.label} style={{ opacity: animationValue, transform: [{ translateY: animationValue.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            <Card bg={useColorModeValue(`${kpi.color}.50`, `${kpi.color}.900`)} borderRadius="lg" p={3}>
              <VStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name={kpi.icon} size="lg" color={`${kpi.color}.500`} />
                <Text fontSize="xl" fontWeight="bold" color={`${kpi.color}.500`}>{kpi.value}</Text>
                <Text fontSize="xs" color={mutedColor} textAlign="center">{kpi.label}</Text>
              </VStack>
            </Card>
          </Animated.View>
        ))}
      </SimpleGrid>
    </VStack>
  );

  // Charts view
  const renderCharts = () => (
    <VStack space={4}>
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontSize="lg" fontWeight="bold" color={textColor}>Performance Trends</Text>
        <HStack space={2}>
          {['line', 'bar', 'pie'].map((type) => (
            <Button key={type} size="xs" variant={chartType === type ? 'solid' : 'outline'} colorScheme="blue" onPress={() => setChartType(type as any)}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </HStack>
      </HStack>

      <Card bg={cardBg} borderRadius="xl" p={4} shadow={2}>
        <VStack space={3}>
          <Text fontWeight="bold" color={textColor}>Monthly Performance</Text>
          {chartType === 'line' && (
            <LineChart data={performanceData} width={chartWidth - 32} height={220} chartConfig={chartConfig} bezier style={{ marginVertical: 8, borderRadius: 16 }} withDots={true} withShadow={true} />
          )}
          {chartType === 'bar' && (
            <BarChart data={subjectData} width={chartWidth - 32} height={220} chartConfig={chartConfig} style={{ marginVertical: 8, borderRadius: 16 }} showValuesOnTopOfBars={true} />
          )}
          {chartType === 'pie' && (
            <PieChart data={gradeDistribution} width={chartWidth - 32} height={220} chartConfig={chartConfig} accessor="population" backgroundColor="transparent" paddingLeft="15" style={{ marginVertical: 8, borderRadius: 16 }} />
          )}
        </VStack>
      </Card>
    </VStack>
  );

  // Students view
  const renderStudents = () => (
    <VStack space={4}>
      <Text fontSize="lg" fontWeight="bold" color={textColor}>Student Performance</Text>
      <VStack space={3}>
        {mockData.students.map((student, index) => (
          <Animated.View key={student.id} style={{ opacity: animationValue, transform: [{ translateX: animationValue.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }}>
            <Card bg={cardBg} borderRadius="xl" borderWidth={1} borderColor={borderColor} shadow={1}>
              <VStack space={3} p={4}>
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Avatar size="md" bg={`${['blue', 'green', 'purple', 'orange', 'red'][index]}.500`}>{student.name.charAt(0)}</Avatar>
                    <VStack>
                      <Text fontWeight="bold" fontSize="md" color={textColor}>{student.name}</Text>
                      <Text fontSize="sm" color={mutedColor}>Rank #{student.rank} • {student.attendance}% attendance</Text>
                    </VStack>
                  </HStack>
                  <VStack alignItems="flex-end" space={1}>
                    <HStack alignItems="center" space={1}>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>{student.average}%</Text>
                      <Icon as={MaterialIcons} name={student.trend === 'up' ? 'trending_up' : student.trend === 'down' ? 'trending_down' : 'trending_flat'} color={student.trend === 'up' ? 'green.500' : student.trend === 'down' ? 'red.500' : 'gray.500'} size="sm" />
                    </HStack>
                    <Badge colorScheme={student.average >= 90 ? 'green' : student.average >= 80 ? 'blue' : 'orange'} variant="solid" borderRadius="full">
                      {student.average >= 90 ? 'Excellent' : student.average >= 80 ? 'Good' : 'Average'}
                    </Badge>
                  </VStack>
                </HStack>
                <SimpleGrid columns={3} space={2}>
                  {Object.entries(student.subjects).map(([subject, score]) => (
                    <VStack key={subject} alignItems="center" space={1}>
                      <Text fontSize="sm" fontWeight="bold" color="blue.500">{score}%</Text>
                      <Text fontSize="xs" color={mutedColor}>{subject}</Text>
                    </VStack>
                  ))}
                </SimpleGrid>
                <Progress value={student.average} size="md" colorScheme={student.average >= 90 ? 'green' : student.average >= 80 ? 'blue' : 'orange'} />
              </VStack>
            </Card>
          </Animated.View>
        ))}
      </VStack>
    </VStack>
  );

  // Subjects view
  const renderSubjects = () => (
    <VStack space={4}>
      <Text fontSize="lg" fontWeight="bold" color={textColor}>Subject Performance</Text>
      <VStack space={3}>
        {mockData.subjects.map((subject, index) => (
          <Card key={subject.name} bg={cardBg} borderRadius="xl" borderWidth={1} borderColor={borderColor} shadow={1}>
            <VStack space={3} p={4}>
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={3} alignItems="center">
                  <Avatar size="md" bg={`${['blue', 'green', 'purple', 'orange'][index]}.500`}>{subject.name.charAt(0)}</Avatar>
                  <VStack>
                    <Text fontWeight="bold" fontSize="md" color={textColor}>{subject.name}</Text>
                    <Text fontSize="sm" color={mutedColor}>{subject.students} students • {subject.difficulty} difficulty</Text>
                  </VStack>
                </HStack>
                <VStack alignItems="flex-end" space={1}>
                  <Text fontSize="lg" fontWeight="bold" color={textColor}>{subject.average}%</Text>
                  <HStack alignItems="center" space={1}>
                    <Icon as={MaterialIcons} name={subject.improvement > 0 ? 'trending_up' : 'trending_down'} color={subject.improvement > 0 ? 'green.500' : 'red.500'} size="sm" />
                    <Text fontSize="sm" color={subject.improvement > 0 ? 'green.500' : 'red.500'}>{subject.improvement > 0 ? '+' : ''}{subject.improvement}%</Text>
                  </HStack>
                </VStack>
              </HStack>
              <Progress value={subject.average} size="md" colorScheme={subject.average >= 90 ? 'green' : subject.average >= 80 ? 'blue' : 'orange'} />
            </VStack>
          </Card>
        ))}
      </VStack>
    </VStack>
  );

  if (loading && !refreshing) {
    return (
      <VStack space={4} p={4}>
        <Skeleton h="20" borderRadius="xl" />
        <SimpleGrid columns={4} space={2}>
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} h="20" borderRadius="lg" />)}
        </SimpleGrid>
        <VStack space={3}>
          {[1, 2, 3].map((item) => <Skeleton key={item} h="48" borderRadius="xl" />)}
        </VStack>
      </VStack>
    );
  }

  return (
    <ScrollView bg={bgColor} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
      <VStack space={6} p={4} pb={8}>
        {renderHeader()}
        {viewMode === 'charts' && renderCharts()}
        {viewMode === 'students' && renderStudents()}
        {viewMode === 'subjects' && renderSubjects()}
        
        <Fab renderInPortal={false} shadow={2} size="sm" icon={<Icon color="white" as={MaterialIcons} name="analytics" size="sm" />} colorScheme="blue" onPress={() => toast.show({ description: 'Performance report generated!' })} />
      </VStack>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Performance Settings</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <VStack space={2}>
                <Text fontWeight="medium">Default View:</Text>
                <Select selectedValue={viewMode} onValueChange={setViewMode}>
                  <Select.Item label="Charts" value="charts" />
                  <Select.Item label="Students" value="students" />
                  <Select.Item label="Subjects" value="subjects" />
                </Select>
              </VStack>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="medium">Auto Refresh:</Text>
                <Switch isChecked={autoRefresh} onToggle={setAutoRefresh} colorScheme="blue" />
              </HStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={onSettingsClose}>Cancel</Button>
              <Button colorScheme="blue" onPress={onSettingsClose}>Save Settings</Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
};

export default PerformanceTab; 
