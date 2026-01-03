import React from 'react';
import { Box, Text, VStack, Center, Spinner, Card, HStack, Progress, useColorModeValue } from 'native-base';
import { Class, ClassStats } from '../types';
import { MaterialIcons } from '@expo/vector-icons';

export interface AnalyticsTabProps {
  selectedClass: Class | null;
  onClassSelect: (classItem: Class) => void;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  stats?: ClassStats | null;
  trends?: any;
  comparisons?: any;
  loading?: boolean;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ 
  selectedClass, 
  stats, 
  trends, 
  comparisons, 
  loading 
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  if (loading) {
    return (
      <Center flex={1} py={8}>
        <Spinner size="lg" />
        <Text mt={4} color={mutedColor}>Loading analytics...</Text>
      </Center>
    );
  }

  return (
    <Box flex={1} p={4}>
      <VStack space={6}>
        <Text fontSize="2xl" fontWeight="bold" mb={2}>
          Analytics Dashboard
        </Text>
        
        {stats && (
          <VStack space={4}>
            <Text fontSize="lg" fontWeight="semibold">Class Statistics</Text>
            <VStack space={3}>
              <Card bg={cardBg} p={4}>
                <HStack justifyContent="space-between" alignItems="center">
                  <VStack>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      {stats.totalClasses}
                    </Text>
                    <Text color={mutedColor}>Total Classes</Text>
                  </VStack>
                  <VStack>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {stats.totalStudents}
                    </Text>
                    <Text color={mutedColor}>Total Students</Text>
                  </VStack>
                </HStack>
              </Card>
              <Card bg={cardBg} p={4}>
                <VStack space={3}>
                  <HStack justifyContent="space-between">
                    <Text fontWeight="semibold">Average Attendance</Text>
                    <Text color="purple.500">{stats.averageAttendance}%</Text>
                  </HStack>
                  <Progress 
                    value={stats.averageAttendance} 
                    colorScheme="purple" 
                    size="sm" 
                  />
                </VStack>
              </Card>
              <Card bg={cardBg} p={4}>
                <VStack space={3}>
                  <HStack justifyContent="space-between">
                    <Text fontWeight="semibold">Average Grade</Text>
                    <Text color="orange.500">{stats.averageGrade}</Text>
                  </HStack>
                  <Progress 
                    value={stats.averageGrade} 
                    colorScheme="orange" 
                    size="sm" 
                  />
                </VStack>
              </Card>
            </VStack>
          </VStack>
        )}

        {trends && (
          <VStack space={4}>
            <Text fontSize="lg" fontWeight="semibold">Growth Trends</Text>
            <HStack space={4} justifyContent="space-between" flexWrap="wrap">
              {trends.classGrowth && (
                <Card
                  bg={trends.classGrowth.value > 0 ? 'green.50' : 'red.50'}
                  minW="150"
                  flex={1}
                  shadow={3}
                  p={4}
                  alignItems="center"
                >
                  <MaterialIcons
                    name={trends.classGrowth.value > 0 ? 'trending-up' : 'trending-down'}
                    size={32}
                    color={trends.classGrowth.value > 0 ? '#22c55e' : '#ef4444'}
                    style={{ marginBottom: 4 }}
                  />
                  <Text fontWeight="medium" color={trends.classGrowth.value > 0 ? 'green.600' : 'red.600'}>
                    Class Growth
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color={trends.classGrowth.value > 0 ? 'green.500' : 'red.500'}>
                    {trends.classGrowth.value > 0 ? '+' : ''}{trends.classGrowth.value}%
                  </Text>
                </Card>
              )}
              {trends.studentGrowth && (
                <Card
                  bg={trends.studentGrowth.value > 0 ? 'blue.50' : 'red.50'}
                  minW="150"
                  flex={1}
                  shadow={3}
                  p={4}
                  alignItems="center"
                >
                  <MaterialIcons
                    name={trends.studentGrowth.value > 0 ? 'trending-up' : 'trending-down'}
                    size={32}
                    color={trends.studentGrowth.value > 0 ? '#3b82f6' : '#ef4444'}
                    style={{ marginBottom: 4 }}
                  />
                  <Text fontWeight="medium" color={trends.studentGrowth.value > 0 ? 'blue.600' : 'red.600'}>
                    Student Growth
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color={trends.studentGrowth.value > 0 ? 'blue.500' : 'red.500'}>
                    {trends.studentGrowth.value > 0 ? '+' : ''}{trends.studentGrowth.value}%
                  </Text>
                </Card>
              )}
              {trends.attendanceTrend && (
                <Card
                  bg={trends.attendanceTrend.value > 0 ? 'purple.50' : 'red.50'}
                  minW="150"
                  flex={1}
                  shadow={3}
                  p={4}
                  alignItems="center"
                >
                  <MaterialIcons
                    name={trends.attendanceTrend.value > 0 ? 'trending-up' : 'trending-down'}
                    size={32}
                    color={trends.attendanceTrend.value > 0 ? '#a21caf' : '#ef4444'}
                    style={{ marginBottom: 4 }}
                  />
                  <Text fontWeight="medium" color={trends.attendanceTrend.value > 0 ? 'purple.600' : 'red.600'}>
                    Attendance Trend
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color={trends.attendanceTrend.value > 0 ? 'purple.500' : 'red.500'}>
                    {trends.attendanceTrend.value > 0 ? '+' : ''}{trends.attendanceTrend.value}%
                      </Text>
                </Card>
              )}
            </HStack>
          </VStack>
        )}

        {stats?.levelDistribution && stats.levelDistribution.length > 0 && (
          <VStack space={4}>
            <Text fontSize="lg" fontWeight="semibold">Level Distribution</Text>
            <VStack space={2}>
              {stats.levelDistribution.map((level) => (
                <Card key={level.level} bg={cardBg} p={3}>
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text>Level {level.level}</Text>
                    <HStack space={3} alignItems="center">
                      <Text color={mutedColor}>{level.count} classes</Text>
                      <Text fontWeight="bold">{level.percentage}%</Text>
                    </HStack>
                  </HStack>
                  <Progress 
                    value={level.percentage} 
                    colorScheme="blue" 
                    size="xs" 
                    mt={2} 
                  />
                </Card>
              ))}
            </VStack>
          </VStack>
        )}

        {!stats && !loading && (
          <Center py={12}>
            <Text fontSize="lg" color={mutedColor}>
              No analytics data available
            </Text>
            <Text color={mutedColor} mt={2}>
              Select a class to view detailed analytics
            </Text>
          </Center>
        )}
      </VStack>
    </Box>
  );
};

export default AnalyticsTab; 
