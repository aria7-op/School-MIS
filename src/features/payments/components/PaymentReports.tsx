import React, { useState, useMemo } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  ScrollView,
  Select,
  Button,
  useColorModeValue,
  Badge,
  Divider,
  Progress,
  Table,
  Row,
  Col,
} from 'native-base';
import {
  VictoryChart,
  VictoryBar,
  VictoryPie,
  VictoryLine,
  VictoryAxis,
  VictoryTheme,
  VictoryLabel,
  VictoryTooltip,
  VictoryArea,
} from 'victory-native';
import { MaterialIcons } from '@expo/vector-icons';
import usePaymentsApi from '../hooks/usePaymentsApi';

const PaymentReports: React.FC = () => {
  const { payments, loading } = usePaymentsApi();
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [paymentType, setPaymentType] = useState('all');

  const reports = useMemo(() => {
    if (!payments) return null;

    const now = new Date();
    const filterDate = new Date();
    
    switch (dateRange) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        filterDate.setMonth(now.getMonth() - 1);
    }

    let filteredPayments = payments.filter(p => new Date(p.paymentDate) >= filterDate);
    
    if (paymentType !== 'all') {
      filteredPayments = filteredPayments.filter(p => p.paymentType === paymentType);
    }

    const totalPayments = filteredPayments.length;
    const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const completedPayments = filteredPayments.filter(p => p.status === 'completed');
    const pendingPayments = filteredPayments.filter(p => p.status === 'pending');
    const failedPayments = filteredPayments.filter(p => p.status === 'failed');

    // Payment type distribution
    const typeDistribution = filteredPayments.reduce((acc, p) => {
      const type = p.paymentType || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Status distribution
    const statusDistribution = filteredPayments.reduce((acc, p) => {
      const status = p.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Daily payment trend
    const dailyTrend = new Array(30).fill(0).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - index));
      const dayPayments = filteredPayments.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        return paymentDate.toDateString() === date.toDateString();
      });
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        count: dayPayments.length,
      };
    });

    // Payment method distribution
    const methodDistribution = filteredPayments.reduce((acc, p) => {
      const method = p.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top students by payment amount
    const studentPayments = filteredPayments.reduce((acc, p) => {
      const studentId = p.student?.id;
      if (studentId) {
        if (!acc[studentId]) {
          acc[studentId] = {
            student: p.student,
            totalAmount: 0,
            paymentCount: 0,
          };
        }
        acc[studentId].totalAmount += p.amount || 0;
        acc[studentId].paymentCount += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    const topStudents = Object.values(studentPayments)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    return {
      totalPayments,
      totalAmount,
      completedPayments: completedPayments.length,
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      typeDistribution,
      statusDistribution,
      dailyTrend,
      methodDistribution,
      topStudents,
      completionRate: totalPayments > 0 ? (completedPayments.length / totalPayments) * 100 : 0,
    };
  }, [payments, dateRange, paymentType]);

  const cardBg = useColorModeValue('white', 'coolGray.800');
  const textColor = useColorModeValue('coolGray.800', 'white');
  const subtitleColor = useColorModeValue('coolGray.600', 'coolGray.400');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderOverviewReport = () => (
    <VStack space={6}>
      {/* Summary Cards */}
      <HStack space={4} flexWrap="wrap">
        <Card flex={1} minW="150" p={4} bg={cardBg} shadow={2}>
          <VStack space={2}>
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="payment" size="md" color="blue.500" />
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {reports?.totalPayments || 0}
              </Text>
            </HStack>
            <Text fontSize="sm" color={subtitleColor}>Total Payments</Text>
          </VStack>
        </Card>
        
        <Card flex={1} minW="150" p={4} bg={cardBg} shadow={2}>
          <VStack space={2}>
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="attach-money" size="md" color="green.500" />
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {formatCurrency(reports?.totalAmount || 0)}
              </Text>
            </HStack>
            <Text fontSize="sm" color={subtitleColor}>Total Amount</Text>
          </VStack>
        </Card>
        
        <Card flex={1} minW="150" p={4} bg={cardBg} shadow={2}>
          <VStack space={2}>
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="check-circle" size="md" color="green.500" />
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {reports?.completedPayments || 0}
              </Text>
            </HStack>
            <Text fontSize="sm" color={subtitleColor}>Completed</Text>
          </VStack>
        </Card>
        
        <Card flex={1} minW="150" p={4} bg={cardBg} shadow={2}>
          <VStack space={2}>
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="schedule" size="md" color="orange.500" />
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {reports?.pendingPayments || 0}
              </Text>
            </HStack>
            <Text fontSize="sm" color={subtitleColor}>Pending</Text>
          </VStack>
        </Card>
      </HStack>

      {/* Completion Rate */}
      <Card p={4} bg={cardBg} shadow={2}>
        <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
          Payment Completion Rate
        </Text>
        <VStack space={3}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="sm" color={subtitleColor}>Success Rate</Text>
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {reports?.completionRate.toFixed(1)}%
            </Text>
          </HStack>
          <Progress
            value={reports?.completionRate || 0}
            colorScheme="green"
            size="lg"
          />
        </VStack>
      </Card>

      {/* Daily Trend */}
      <Card p={4} bg={cardBg} shadow={2}>
        <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
          Daily Payment Trend
        </Text>
        <Box h={300}>
          <VictoryChart theme={VictoryTheme.material}>
            <VictoryAxis />
            <VictoryAxis dependentAxis />
            <VictoryArea
              data={reports?.dailyTrend || []}
              x="date"
              y="amount"
              style={{
                data: {
                  fill: 'rgba(59, 130, 246, 0.3)',
                  stroke: '#3B82F6',
                  strokeWidth: 2,
                },
              }}
              animate={{
                duration: 2000,
                onLoad: { duration: 1000 },
              }}
            />
          </VictoryChart>
        </Box>
      </Card>
    </VStack>
  );

  const renderTypeAnalysisReport = () => (
    <VStack space={6}>
      {/* Payment Type Distribution */}
      <Card p={4} bg={cardBg} shadow={2}>
        <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
          Payment Type Distribution
        </Text>
        <Box h={300}>
          <VictoryChart theme={VictoryTheme.material}>
            <VictoryPie
              data={Object.entries(reports?.typeDistribution || {}).map(([type, count]) => ({
                x: type,
                y: count,
              }))}
              colorScale="qualitative"
              animate={{
                duration: 2000,
              }}
              labelComponent={
                <VictoryTooltip
                  style={{ fontSize: 12 }}
                  flyoutStyle={{
                    stroke: 'black',
                    strokeWidth: 1,
                    fill: 'white',
                  }}
                />
              }
            />
          </VictoryChart>
        </Box>
      </Card>

      {/* Payment Method Distribution */}
      <Card p={4} bg={cardBg} shadow={2}>
        <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
          Payment Method Distribution
        </Text>
        <Box h={300}>
          <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
            <VictoryAxis />
            <VictoryAxis dependentAxis />
            <VictoryBar
              data={Object.entries(reports?.methodDistribution || {}).map(([method, count]) => ({
                x: method,
                y: count,
              }))}
              style={{
                data: {
                  fill: '#8B5CF6',
                },
              }}
              animate={{
                duration: 2000,
                onLoad: { duration: 1000 },
              }}
            />
          </VictoryChart>
        </Box>
      </Card>
    </VStack>
  );

  const renderStatusAnalysisReport = () => (
    <VStack space={6}>
      {/* Status Distribution */}
      <Card p={4} bg={cardBg} shadow={2}>
        <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
          Payment Status Distribution
        </Text>
        <Box h={300}>
          <VictoryChart theme={VictoryTheme.material}>
            <VictoryPie
              data={Object.entries(reports?.statusDistribution || {}).map(([status, count]) => ({
                x: status,
                y: count,
              }))}
              colorScale={['#10B981', '#F59E0B', '#EF4444', '#6B7280']}
              animate={{
                duration: 2000,
              }}
              labelComponent={
                <VictoryTooltip
                  style={{ fontSize: 12 }}
                  flyoutStyle={{
                    stroke: 'black',
                    strokeWidth: 1,
                    fill: 'white',
                  }}
                />
              }
            />
          </VictoryChart>
        </Box>
      </Card>

      {/* Status Breakdown */}
      <Card p={4} bg={cardBg} shadow={2}>
        <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
          Status Breakdown
        </Text>
        <VStack space={3}>
          {Object.entries(reports?.statusDistribution || {}).map(([status, count]) => (
            <VStack key={status} space={2}>
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={2} alignItems="center">
                  <Badge
                    colorScheme={
                      status === 'completed' ? 'green' :
                      status === 'pending' ? 'orange' :
                      status === 'failed' ? 'red' : 'gray'
                    }
                    variant="subtle"
                  >
                    {status}
                  </Badge>
                  <Text fontSize="sm" color={subtitleColor}>
                    {count} payments
                  </Text>
                </HStack>
                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  {((count / (reports?.totalPayments || 1)) * 100).toFixed(1)}%
                </Text>
              </HStack>
              <Progress
                value={(count / (reports?.totalPayments || 1)) * 100}
                colorScheme={
                  status === 'completed' ? 'green' :
                  status === 'pending' ? 'orange' :
                  status === 'failed' ? 'red' : 'gray'
                }
              />
            </VStack>
          ))}
        </VStack>
      </Card>
    </VStack>
  );

  const renderTopStudentsReport = () => (
    <VStack space={6}>
      <Card p={4} bg={cardBg} shadow={2}>
        <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
          Top Students by Payment Amount
        </Text>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Student</Table.HeaderCell>
              <Table.HeaderCell>Payments</Table.HeaderCell>
              <Table.HeaderCell>Total Amount</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {reports?.topStudents.map((student: any, index: number) => (
              <Table.Row key={student.student.id}>
                <Table.Cell>
                  <VStack>
                    <Text fontWeight="bold" color={textColor}>
                      {student.student.user.firstName} {student.student.user.lastName}
                    </Text>
                    <Text fontSize="xs" color={subtitleColor}>
                      {student.student.user.email}
                    </Text>
                  </VStack>
                </Table.Cell>
                <Table.Cell>
                  <Text color={textColor}>{student.paymentCount}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text fontWeight="bold" color="green.600">
                    {formatCurrency(student.totalAmount)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
    </VStack>
  );

  if (loading || !reports) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text color={subtitleColor}>Loading reports...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="coolGray.50">
      <ScrollView>
        <Box p={4}>
          <VStack space={6}>
            {/* Header */}
            <Box>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                Payment Reports & Analytics
              </Text>
              <Text fontSize="sm" color={subtitleColor} mt={1}>
                Comprehensive analysis of payment data
              </Text>
            </Box>

            {/* Filters */}
            <Card p={4} bg={cardBg} shadow={1}>
              <HStack space={4} alignItems="center">
                <Select
                  selectedValue={reportType}
                  onValueChange={setReportType}
                  placeholder="Report Type"
                  minW="150"
                >
                  <Select.Item label="Overview" value="overview" />
                  <Select.Item label="Type Analysis" value="type" />
                  <Select.Item label="Status Analysis" value="status" />
                  <Select.Item label="Top Students" value="students" />
                </Select>
                
                <Select
                  selectedValue={dateRange}
                  onValueChange={setDateRange}
                  placeholder="Date Range"
                  minW="120"
                >
                  <Select.Item label="Last Week" value="week" />
                  <Select.Item label="Last Month" value="month" />
                  <Select.Item label="Last Quarter" value="quarter" />
                  <Select.Item label="Last Year" value="year" />
                </Select>
                
                <Select
                  selectedValue={paymentType}
                  onValueChange={setPaymentType}
                  placeholder="Payment Type"
                  minW="120"
                >
                  <Select.Item label="All Types" value="all" />
                  <Select.Item label="Tuition Fee" value="TUITION_FEE" />
                  <Select.Item label="Transport Fee" value="TRANSPORT_FEE" />
                  <Select.Item label="Library Fee" value="LIBRARY_FEE" />
                  <Select.Item label="Laboratory Fee" value="LABORATORY_FEE" />
                  <Select.Item label="Sports Fee" value="SPORTS_FEE" />
                  <Select.Item label="Exam Fee" value="EXAM_FEE" />
                  <Select.Item label="Uniform Fee" value="UNIFORM_FEE" />
                  <Select.Item label="Meal Fee" value="MEAL_FEE" />
                  <Select.Item label="Hostel Fee" value="HOSTEL_FEE" />
                  <Select.Item label="Other" value="OTHER" />
                </Select>
              </HStack>
            </Card>

            {/* Report Content */}
            {reportType === 'overview' && renderOverviewReport()}
            {reportType === 'type' && renderTypeAnalysisReport()}
            {reportType === 'status' && renderStatusAnalysisReport()}
            {reportType === 'students' && renderTopStudentsReport()}
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
};

export default PaymentReports; 
