import React, { useMemo } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  ScrollView,
  Badge,
  Divider,
  Progress,
  useColorModeValue,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import usePaymentsApi from '../hooks/usePaymentsApi';
import { SimpleBarChart, SimplePieChart, SimpleLineChart, SimpleProgressChart } from '../../components/charts/SimpleCharts';

const PaymentAnalytics: React.FC = () => {
  const { payments, loading } = usePaymentsApi();

  const analytics = useMemo(() => {
    if (!payments) return null;

    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const failedPayments = payments.filter(p => p.status === 'failed');

    // Payment type distribution
    const typeDistribution = payments.reduce((acc, p) => {
      const type = p.paymentType || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Status distribution
    const statusDistribution = payments.reduce((acc, p) => {
      const status = p.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Daily payment trend
    const dailyTrend = new Array(30).fill(0).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - index));
      const dayPayments = payments.filter(p => {
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
    const methodDistribution = payments.reduce((acc, p) => {
      const method = p.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top students by payment amount
    const studentPayments = payments.reduce((acc, p) => {
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
  }, [payments]);

  const cardBg = useColorModeValue('white', 'coolGray.800');
  const textColor = useColorModeValue('coolGray.800', 'white');
  const subtitleColor = useColorModeValue('coolGray.600', 'coolGray.400');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading || !analytics) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text color={subtitleColor}>Loading analytics...</Text>
      </Box>
    );
  }

  const typeData = Object.entries(analytics.typeDistribution).map(([type, count]) => ({
    x: type,
    y: count,
  }));

  const statusData = Object.entries(analytics.statusDistribution).map(([status, count]) => ({
    x: status,
    y: count,
  }));

  const dailyData = analytics.dailyTrend.map((item, index) => ({
    x: `Day ${index + 1}`,
    y: item.amount,
  }));

  const methodData = Object.entries(analytics.methodDistribution).map(([method, count]) => ({
    x: method,
    y: count,
  }));

  const progressData = [
    { label: 'Completed Payments', value: analytics.completedPayments, total: analytics.totalPayments, color: '#10B981' },
    { label: 'Pending Payments', value: analytics.pendingPayments, total: analytics.totalPayments, color: '#F59E0B' },
    { label: 'Failed Payments', value: analytics.failedPayments, total: analytics.totalPayments, color: '#EF4444' },
  ];

  return (
    <ScrollView flex={1} bg="coolGray.50">
      <Box p={4}>
        {/* Summary Cards */}
        <VStack space={4} mb={6}>
          <Text fontSize="xl" fontWeight="bold" color={textColor}>
            Payment Analytics Overview
          </Text>
          
          <HStack space={4} flexWrap="wrap">
            <Card flex={1} minW="150" p={4} bg={cardBg} shadow={2}>
              <VStack space={2}>
                <HStack space={2} alignItems="center">
                  <Icon as={MaterialIcons} name="payment" size="md" color="blue.500" />
                  <Text fontSize="lg" fontWeight="bold" color={textColor}>
                    {analytics.totalPayments}
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
                    {formatCurrency(analytics.totalAmount)}
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
                    {analytics.completedPayments}
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
                    {analytics.pendingPayments}
                  </Text>
                </HStack>
                <Text fontSize="sm" color={subtitleColor}>Pending</Text>
              </VStack>
            </Card>
          </HStack>
        </VStack>

        {/* Charts */}
        <VStack space={6}>
          {/* Payment Status Distribution */}
          <SimplePieChart
            data={statusData}
            title="Payment Status Distribution"
            size={250}
            colors={['#10B981', '#F59E0B', '#EF4444', '#6B7280']}
          />

          {/* Payment Type Distribution */}
          <SimpleBarChart
            data={typeData}
            title="Payment Type Distribution"
            height={300}
            color="#3B82F6"
          />

          {/* Daily Payment Trend */}
          <SimpleLineChart
            data={dailyData}
            title="Daily Payment Trend (Last 30 Days)"
            height={300}
            color="#3B82F6"
          />

          {/* Payment Method Distribution */}
          <SimpleBarChart
            data={methodData}
            title="Payment Method Distribution"
            height={300}
            color="#8B5CF6"
          />

          {/* Progress Chart */}
          <SimpleProgressChart
            data={progressData}
            title="Payment Status Overview"
          />

          {/* Completion Rate */}
          <Card p={4} bg={cardBg} shadow={2}>
            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
              Payment Completion Rate
            </Text>
            <VStack space={3}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="sm" color={subtitleColor}>Success Rate</Text>
                <Text fontSize="lg" fontWeight="bold" color="green.600">
                  {analytics.completionRate.toFixed(1)}%
                </Text>
              </HStack>
              <Progress
                value={analytics.completionRate}
                colorScheme="green"
                size="lg"
              />
            </VStack>
          </Card>
        </VStack>
      </Box>
    </ScrollView>
  );
};

export default PaymentAnalytics; 
